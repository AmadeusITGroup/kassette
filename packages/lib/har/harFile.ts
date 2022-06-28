import { RecursiveArray } from '../array';
import { FileHandler } from '../fs';
import { HarFormatEntry, HarFormat } from './harTypes';
import { emptyHar } from './harUtils';
import { joinPath } from '../path';
import { JsonFile } from './jsonFile';

export const harFileMap = new Map<string, HarFile>();

const createHarFile = (path: string, keepDelay: number) => {
  let timeout: NodeJS.Timeout | null = null;
  const harFile = new HarFile(new FileHandler(path));
  const removeFromMap = () => {
    const item = harFileMap.get(path);
    if (item === harFile) {
      harFileMap.delete(path);
    }
  };
  const cancelTimeout = () => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
  };
  const planTimeout = () => {
    cancelTimeout();
    timeout = setTimeout(removeFromMap, keepDelay);
    timeout.unref();
  };
  harFile.addListener('busy', cancelTimeout);
  harFile.addListener('nonBusy', planTimeout);
  planTimeout();
  harFileMap.set(path, harFile);
  return harFile;
};

export const getHarFile = (path: string, keepDelay: number) =>
  harFileMap.get(path) ?? createHarFile(path, keepDelay);

/**
 * Each entry in a har file is supposed to have a corresponding unique key (a string).
 * The har key manager is both a getter and a setter for the key of an entry.
 *
 * @remarks
 *
 * The har key manager is a function that is called either to get the key of an entry (when
 * the key parameter is undefined) or to set it (when the key parameter is defined).
 *
 * It should not modify the entry when the key parameter is undefined.
 *
 * When the key parameter is defined, the har key manager is supposed to change the provided entry, in order to store the
 * key in it, because after the call, the entry will be persisted in the har file. In this case, the key parameter either
 * comes from a call to {@link IMock.setMockHarKey}, or from {@link IMock.defaultMockHarKey | defaultMockHarKey}.
 *
 * In order to compute the {@link IMock.defaultMockHarKey | defaultMockHarKey} property, the har key manager
 * is called with an entry that includes the request but not the response (and with an undefined key parameter).
 *
 * In all cases, the har key manager is expected to return the key of the entry. If an array is returned (which can
 * be nested), it is flattened with null items removed, and joined with forward slashes to produce a string.
 *
 * The default har key manager is expected to work fine for most use cases, especially when working with a har file recorded
 * with kassette. With the default har key manager, if a key is set with {@link IMock.setMockHarKey}, it is stored in the
 * {@link HarFormatEntry._kassetteMockKey | _kassetteMockKey} field. Otherwise, the default key is the concatenation of the request
 * method and url, with a separating forward slash. It can be useful to replace the default har key manager with a custom one especially
 * when working with har files that are produced by other applications than kassette, if the default key is not convenient.
 *
 * @example
 *
 * Here is the default har key manager:
 * ```ts
 * export const defaultHarKeyManager: HarKeyManager = (entry: HarFormatEntry, key?: string) => {
 *   const defaultKey = joinPath(entry._kassetteMockKey ?? [entry.request?.method, entry.request?.url]);
 *   if (key && key !== defaultKey) {
 *     entry._kassetteMockKey = key;
 *     return key;
 *   }
 *   return defaultKey;
 * };
 * ```
 *
 * @public
 */
export type HarKeyManager = (
  entry: HarFormatEntry,
  key?: string,
) => RecursiveArray<string | null | undefined>;

export const defaultHarKeyManager: HarKeyManager = (entry: HarFormatEntry, key?: string) => {
  const defaultKey = joinPath(
    entry._kassetteMockKey ?? [entry.request?.method, entry.request?.url],
  );
  if (key && key !== defaultKey) {
    entry._kassetteMockKey = key;
    return key;
  }
  return defaultKey;
};

export const callKeyManager = (
  keyManager: HarKeyManager,
  entry: HarFormatEntry,
  key?: string,
): string | undefined => {
  const nonSanitized = keyManager(entry, key);
  if (nonSanitized == null) {
    return;
  }
  const res = joinPath(nonSanitized);
  return res;
};

export class HarFile extends JsonFile<HarFormat> {
  protected _keysMaps = new WeakMap<HarKeyManager, Map<string, number>>();

  protected _afterRead(): void {
    this._keysMaps = new WeakMap();
  }

  private _getKeys(keyManager: HarKeyManager): Map<string, number> {
    let res = this._keysMaps.get(keyManager);
    if (!res) {
      res = new Map();
      this._keysMaps.set(keyManager, res);
      const entries = this._fileContent?.log.entries ?? [];
      for (let i = 0, l = entries.length; i < l; i++) {
        const key = callKeyManager(keyManager, entries[i]);
        if (key && !res.has(key)) {
          res.set(key, i);
        }
      }
    }
    return res;
  }

  async getEntry(
    key: string | undefined,
    keyManager: HarKeyManager,
  ): Promise<HarFormatEntry | undefined> {
    if (key) {
      await this._read();
      const keys = this._getKeys(keyManager);
      const entryIndex = keys.get(key) ?? -1;
      if (entryIndex > -1) {
        return this._fileContent?.log.entries[entryIndex];
      }
    }
  }

  async setEntry(
    key: string | undefined,
    entry: HarFormatEntry,
    keyManager: HarKeyManager,
  ): Promise<void> {
    key = callKeyManager(keyManager, entry, key);
    await this._read();
    let content = this._fileContent;
    if (!content) {
      content = emptyHar();
      this._fileContent = content;
    }
    const keys = this._getKeys(keyManager);

    let entryIndex = key == null ? -1 : keys.get(key) ?? -1;
    if (entryIndex === -1) {
      entryIndex = content.log.entries.length;
      if (key) {
        keys.set(key, entryIndex);
      }
    }
    content.log.entries[entryIndex] = entry;

    // remove other keys maps as they are outdated with the new entry:
    this._keysMaps = new WeakMap();
    this._keysMaps.set(keyManager, keys);

    this._markModified();
    await this._write();
  }
}
