// ------------------------------------------------------------------------- std

import * as nodePath from 'path';

import { promises as fs, constants as fsConstants } from 'fs';

// -------------------------------------------------------------------- internal

import { CachedProperty } from './oop';

////////////////////////////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////////////////////////////

/** tells if file system node at given `path` exists */
export async function exists(path: string): Promise<boolean> {
  try {
    await fs.access(path, fsConstants.W_OK | fsConstants.R_OK);
    return true;
  } catch (exception) {
    if (exception.code === 'ENOENT') {
      return false;
    }
    throw exception;
  }
}

/** creates the hierarchy of folders given by `path` */
export async function ensurePath(path: string) {
  await fs.mkdir(nodePath.parse(nodePath.resolve(path)).dir, { recursive: true });
}

/** writes `content` into the file at given `path` */
export async function writeFile(path: string, content: string | Buffer) {
  await ensurePath(path);
  return fs.writeFile(path, content);
}

////////////////////////////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////////////////////////////

export interface FileHandlerSpec {
  /** the path of the folder containing the file */
  readonly root: string;

  /** the file name */
  readonly name: string;
}

export interface IFileHandler {
  /** the full path of the file */
  readonly path: string;

  /** the file name */
  readonly name: string;

  /** tells whether the file exists or not */
  exists(): Promise<boolean>;

  /** reads and returns the content of the file or returns `null` if it doesn't exist */
  read(): Promise<Buffer | null>;

  /** writes the given content into the file */
  write(content: Buffer | string | null | undefined): Promise<void>;
}

////////////////////////////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////////////////////////////

export class FileHandler implements IFileHandler {
  constructor(private readonly _spec: FileHandlerSpec) {}

  /** the root of the file */
  @CachedProperty()
  private get _root(): string {
    return this._spec.root;
  }

  @CachedProperty()
  get name(): string {
    return this._spec.name;
  }

  @CachedProperty()
  get path(): string {
    return nodePath.join(this._root, this.name);
  }
  async exists(): Promise<boolean> {
    return exists(this.path);
  }

  async read(): Promise<Buffer | null> {
    try {
      return await fs.readFile(this.path);
    } catch (exception) {
      if (exception.code === 'ENOENT') {
        return null;
      } else {
        throw exception;
      }
    }
  }

  async write(content: Buffer | string | null | undefined): Promise<void> {
    return writeFile(this.path, content != null ? content : Buffer.alloc(0));
  }
}
