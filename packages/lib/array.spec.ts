import { flatten, sanitize } from './array';

describe('array', () => {
  describe('flatten', () => {
    it('should handle non-arrays', () => {
      expect(flatten(1)).toEqual([1]);
    });

    it('should handle simple array', () => {
      const input = [1, 2];
      const output = flatten(input);
      expect(output).not.toBe(input);
      expect(output).toEqual([1, 2]);
    });

    it('should handle nested arrays', () => {
      const input = [1, [2, 3, [4]], 5];
      const output = flatten(input);
      expect(output).not.toBe(input);
      expect(output).toEqual([1, 2, 3, 4, 5]);
    });
  });

  describe('sanitize', () => {
    it('should handle non-arrays', () => {
      expect(sanitize(1)).toEqual([1]);
    });

    it('should handle simple array', () => {
      const input = [1, null, 2, undefined];
      const output = sanitize(input);
      expect(output).not.toBe(input);
      expect(output).toEqual([1, 2]);
    });

    it('should handle nested arrays', () => {
      const input = [1, null, [2, undefined, 3, [4]], 5, null];
      const output = sanitize(input);
      expect(output).not.toBe(input);
      expect(output).toEqual([1, 2, 3, 4, 5]);
    });
  });
});
