import { sanitizePath, joinPath } from './path';

describe('path', () => {
  describe('sanitizePath', () => {
    it('should remove empty parts', () => {
      [
        {
          input: [null, 'a', '', [undefined, '', ' ']],
          output: ['a', ' '],
        },
        {
          input: ['a', '', 'b', '', 'c'],
          output: ['a', 'b', 'c'],
        },
      ].forEach(({ input, output }) => {
        expect(sanitizePath(input)).toEqual(output);
      });
    });

    it('should keep leading and trailing empty parts', () => {
      [
        {
          input: ['', 'root', 'folder', ''],
          output: ['', 'root', 'folder', ''],
        },
      ].forEach(({ input, output }) => {
        expect(sanitizePath(input)).toEqual(output);
      });
    });
  });

  describe('joinPath', () => {
    it('should build paths with no double slash', () => {
      [
        {
          input: ['a', '', 'b', '', 'c'],
          output: 'a/b/c',
        },
      ].forEach(({ input, output }) => {
        expect(joinPath(input)).toEqual(output);
      });
    });

    it('should keep leading and trailing slashes', () => {
      [
        {
          input: ['', 'root', 'folder', ''],
          output: '/root/folder/',
        },
      ].forEach(({ input, output }) => {
        expect(joinPath(input)).toEqual(output);
      });
    });
  });
});
