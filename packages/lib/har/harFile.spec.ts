import { rm, writeFile } from 'fs/promises';
import path from 'path';
import { defaultHarKeyManager, getHarFile, harFileMap } from './harFile';
import { emptyHar } from './harUtils';

describe('harFile', () => {
  const tmpDir = path.join(__dirname, '__ws__');
  const sleep = (time: number) => new Promise((resolve) => setTimeout(resolve, time));

  beforeAll(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('should work with multiple concurrent read or write operations', async () => {
    const harFile = path.join(tmpDir, 'concurrent.har');
    const myHarFile = getHarFile(harFile, 100);
    const entry1 = myHarFile.setEntry('1', { comment: 'entry1' }, defaultHarKeyManager);
    const entry2 = myHarFile.setEntry('2', { comment: 'entry2' }, defaultHarKeyManager);
    await entry1;
    const entry3 = myHarFile.setEntry('3', { comment: 'entry3' }, defaultHarKeyManager);
    const entry4 = myHarFile.setEntry('4', { comment: 'entry4' }, defaultHarKeyManager);
    await entry2;
    await entry3;
    await entry4;
    expect(await myHarFile.getEntry('1', defaultHarKeyManager)).toEqual({
      comment: 'entry1',
      _kassetteMockKey: '1',
    });
    expect(await myHarFile.getEntry('2', defaultHarKeyManager)).toEqual({
      comment: 'entry2',
      _kassetteMockKey: '2',
    });
    expect(await myHarFile.getEntry('3', defaultHarKeyManager)).toEqual({
      comment: 'entry3',
      _kassetteMockKey: '3',
    });
    expect(await myHarFile.getEntry('4', defaultHarKeyManager)).toEqual({
      comment: 'entry4',
      _kassetteMockKey: '4',
    });

    // replaces entries:
    const replaceEntry1 = myHarFile.setEntry('1', { comment: 'newentry1' }, defaultHarKeyManager);
    const replaceEntry3 = myHarFile.setEntry('3', { comment: 'newentry3' }, defaultHarKeyManager);
    await replaceEntry1;
    await replaceEntry3;
    expect(await myHarFile.getEntry('1', defaultHarKeyManager)).toEqual({
      comment: 'newentry1',
      _kassetteMockKey: '1',
    });
    expect(await myHarFile.getEntry('2', defaultHarKeyManager)).toEqual({
      comment: 'entry2',
      _kassetteMockKey: '2',
    });
    expect(await myHarFile.getEntry('3', defaultHarKeyManager)).toEqual({
      comment: 'newentry3',
      _kassetteMockKey: '3',
    });
    expect(await myHarFile.getEntry('4', defaultHarKeyManager)).toEqual({
      comment: 'entry4',
      _kassetteMockKey: '4',
    });

    // replaces the whole file:
    const newFileContent = emptyHar();
    newFileContent.log.entries.push({ comment: 'newEntry', _kassetteMockKey: 'n' });
    await writeFile(harFile, JSON.stringify(newFileContent));

    // the new file should be taken into account:
    const writeEntry1 = myHarFile.setEntry('1', { comment: 'e1' }, defaultHarKeyManager);
    const entryN = myHarFile.getEntry('n', defaultHarKeyManager);
    const readEntry2 = myHarFile.getEntry('2', defaultHarKeyManager);
    const readEntry3 = myHarFile.getEntry('3', defaultHarKeyManager);
    const readEntry4 = myHarFile.getEntry('4', defaultHarKeyManager);
    expect(await entryN).toEqual({ comment: 'newEntry', _kassetteMockKey: 'n' });
    expect(await readEntry2).toEqual(undefined);
    expect(await readEntry3).toEqual(undefined);
    expect(await readEntry4).toEqual(undefined);
    await writeEntry1;
    expect(await myHarFile.getEntry('1', defaultHarKeyManager)).toEqual({
      comment: 'e1',
      _kassetteMockKey: '1',
    });

    // removes the whole file
    await rm(harFile);

    // there should be no entry:
    expect(await myHarFile.getEntry('n', defaultHarKeyManager)).toEqual(undefined);
    expect(await myHarFile.getEntry('1', defaultHarKeyManager)).toEqual(undefined);

    // check that the file is still in the map:
    expect(harFileMap.get(harFile)).toBe(myHarFile);
    await sleep(101); // after the cache time expires, the file is unloaded
    expect(harFileMap.get(harFile)).toBe(undefined);
  });
});
