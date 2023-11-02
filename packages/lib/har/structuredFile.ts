import { EventEmitter } from 'events';
import { FileHandler } from '../fs';
import { FileFormat } from './formats';

export abstract class StructuredFile<T> extends EventEmitter {
  protected _fileContent: T | null;
  private _modified = false;
  private _readingPromise: Promise<void> | null = null;
  private _writingPromise: Promise<void> | null = null;
  private _nextWritingPromise: Promise<void> | null = null;
  private _lastReadModifiedTime = 0;
  private _lastReadSize = 0;
  private _busyState = false;

  constructor(
    private _fileHandler: FileHandler,
    private _fileFormat: FileFormat,
  ) {
    super();
  }

  private _markBusy() {
    if (!this._busyState) {
      this._busyState = true;
      this.emit('busy');
    }
  }

  private async _markNonBusy() {
    await Promise.resolve();
    const busy = !!(this._modified || this._readingPromise || this._writingPromise);
    if (!busy && this._busyState) {
      this._busyState = false;
      this.emit('nonBusy');
    }
  }

  protected _markModified() {
    this._modified = true;
    this._markBusy();
  }

  protected _afterRead(): void {}

  private async _doRead(): Promise<void> {
    try {
      this._markBusy();
      const stat = await this._fileHandler.stat();
      if (stat) {
        if (this._lastReadModifiedTime !== stat.mtime || this._lastReadSize !== stat.size) {
          const content = await this._fileHandler.read();
          this._lastReadModifiedTime = stat.mtime;
          this._lastReadSize = content?.length ?? 0;
          this._fileContent = content ? this._fileFormat.parse(content) : null;
          this._afterRead();
        }
      } else {
        this._fileContent = null;
        this._lastReadSize = 0;
        this._lastReadModifiedTime = 0;
        this._afterRead();
      }
    } finally {
      this._readingPromise = null;
      this._markNonBusy();
    }
  }

  protected async _read(): Promise<void> {
    if (this._writingPromise || this._modified) {
      return;
    }
    if (!this._readingPromise) {
      this._readingPromise = this._doRead();
    }
    return this._readingPromise;
  }

  private async _doWrite() {
    try {
      this._markBusy();
      this._nextWritingPromise = null;
      const content = this._fileFormat.stringify(this._fileContent);
      this._modified = false;
      await this._fileHandler.write(content);
      // after the file is written, let's read back the modification time
      // unfortunately, there could be a race condition here if the file is modified by another process between the previous write
      // and the following stat if the size does not change
      const newStat = await this._fileHandler.stat();
      this._lastReadSize = content.length;
      this._lastReadModifiedTime = newStat?.mtime ?? 0;
    } finally {
      this._writingPromise = null;
      this._markNonBusy();
    }
  }

  private async _waitAndWriteAgain() {
    try {
      await this._writingPromise;
    } catch {
      /* ignore previous error */
    }
    this._writingPromise = this._doWrite();
    return this._writingPromise;
  }

  protected async _write() {
    if (this._writingPromise) {
      if (!this._nextWritingPromise) {
        this._nextWritingPromise = this._waitAndWriteAgain();
      }
      return this._nextWritingPromise;
    }
    this._writingPromise = this._doWrite();
    return this._writingPromise;
  }

  public get path(): string {
    return this._fileHandler.path;
  }
}
