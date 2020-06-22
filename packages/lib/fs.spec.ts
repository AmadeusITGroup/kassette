jest.mock('fs');

// import * as nodePath from 'path';
import * as fs from 'fs';

const volume = (fs as any).__volume;

import {
  exists,
  FileHandler,
} from './fs';

describe('fs', () => {
  beforeEach(() => {
    volume.reset();
  });

  describe('exists', () => {
    it('should return whether existing or not', async () => {
      volume.fromJSON({
        'existing': 'I exist',
      });
      expect(await exists('existing')).toBeTruthy();
      expect(await exists('non-existing')).toBeFalsy();
    });
  });

  describe('ensurePath', () => {
    // 2019-08-27T17:08:08+02:00
    // difficult to do,
    // it needs to be mocked as well for absolute path resolution
  });

  describe('writeFile', () => {
    // 2019-08-27T17:09:01+02:00
    // same problem, uses ensurePath under the hood
  });

  describe('FileHandler', () => {
    it('should be created with a root and name', () => {
      const root = '/root';
      const name = 'filename';
      const handler = new FileHandler({root, name});
      expect(handler.name).toBe(name);
      expect(handler.path.split(/[\\\/]/g)).toEqual(['', 'root', name]);
    });

    it('should be created with a root and name', async () => {
      volume.fromJSON({
        '/root/existing': 'I exist',
      });
      let handler;
      handler = new FileHandler({root: '/root', name: 'existing'});
      expect(await handler.exists()).toBeTruthy();
      handler = new FileHandler({root: '/root', name: 'non-existing'});
      expect(await handler.exists()).toBeFalsy();
    });

    it('should read and write', async () => {
      const handler = new FileHandler({root: '/root', name: 'existing'});

      expect(await handler.read()).toBeNull();

      await handler.write(null);
      expect((await handler.read())!.toString()).toBe('');

      await handler.write('Hello');
      expect((await handler.read())!.toString()).toBe('Hello');
    });
  });
});
