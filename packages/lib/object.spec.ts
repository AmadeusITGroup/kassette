import { isObject, copyDeep, mergeDeepLeft, fromPairs, rejectVoid } from './object';

describe('object', () => {
  describe('isObject', () => {
    it('should handle primitive types', () => {
      expect(isObject(null)).toBe(false);
      expect(isObject(undefined)).toBe(false);
      expect(isObject(false)).toBe(false);
      expect(isObject(1)).toBe(false);
      expect(isObject('1')).toBe(false);
      expect(isObject([])).toBe(false);
      expect(isObject({})).toBe(true);
      expect(isObject(/1/)).toBe(false);
      expect(isObject(new Date())).toBe(false);
    });

    it('should handle primitive types with constructors', () => {
      // eslint-disable-next-line no-new-wrappers
      expect(isObject(new Boolean(false))).toBe(false);
      // eslint-disable-next-line no-new-wrappers
      expect(isObject(new Number(1))).toBe(false);
      // eslint-disable-next-line no-new-wrappers
      expect(isObject(new String('1'))).toBe(false);
      expect(isObject(new Array(1))).toBe(false);
      expect(isObject(new Object())).toBe(true);
      expect(isObject(new RegExp('1'))).toBe(false);
    });

    it('should handle extended types', () => {
      expect(isObject(Buffer.from([]))).toBe(false);
    });
  });

  describe('copyDeep', () => {
    it('should handle simple object', () => {
      const source = { property: 'value' };
      const copy = copyDeep(source);

      expect(copy).not.toBe(source);
      expect(copy).toEqual(source);
    });

    it('should not copy arrays', () => {
      const source = { property: 'value', array: [] };
      const copy = copyDeep(source);

      expect(copy).not.toBe(source);
      expect(copy).toEqual(source);
      expect(copy.array).toBe(source.array);
    });

    it('should copy nested objects, and still not copy arrays', () => {
      const source = { property: 'value', nested: { array: [] } };
      const copy = copyDeep(source);

      expect(copy).not.toBe(source);
      expect(copy).toEqual(source);

      expect(copy.nested).not.toBe(source.nested);
      expect(copy.nested).toEqual(source.nested);

      expect(copy.nested.array).toBe(source.nested.array);
    });
  });

  describe('mergeDeepLeft', () => {
    it('should keep left value when exists and cannot be merged', () => {
      const left = { both: 'left' };
      const right = { both: 'right' };
      const output = mergeDeepLeft(left, right);

      expect(output).toEqual({ both: 'left' });
      expect(output).not.toBe(left);
      expect(output).not.toBe(right);
    });

    it('should write left value when it does not exist', () => {
      const left = { left: 'left' };
      const right = { right: 'right' };
      const output = mergeDeepLeft(left, right);

      expect(output).toEqual({ left: 'left', right: 'right' });
      expect(output).not.toBe(left);
      expect(output).not.toBe(right);
    });

    it('should write left value with an object copy (left does not exist, right is object)', () => {
      const left = {};
      const right = { nested: { property: 'value' } };
      const output = mergeDeepLeft(left, right);

      expect(output).toEqual({ nested: { property: 'value' } });
      expect(output).not.toBe(left);
      expect(output).not.toBe(right);
      expect(output.nested).not.toBe(right.nested);
    });

    it('should recursively merge nested objects', () => {
      const left = { nested: { left: 'left', both: 'left' } };
      const right = { nested: { both: 'right', right: 'right' } };
      const output = mergeDeepLeft(left, right);

      expect(output).toEqual({ nested: { left: 'left', both: 'left', right: 'right' } });
      expect(output).not.toBe(left);
      expect(output).not.toBe(right);
      expect(output.nested).not.toBe(left.nested);
      expect(output.nested).not.toBe(right.nested);
    });
  });

  describe('fromPairs', () => {
    it('should convert pairs to an object', () => {
      expect(
        fromPairs([
          ['a', '1'],
          ['b', 'two'],
        ]),
      ).toEqual({ a: '1', b: 'two' });
    });
  });

  describe('rejectVoid', () => {
    it('should reject null and undefined values', () => {
      const input = {
        one: null,
        two: undefined,
        three: '3',
      };
      const output = rejectVoid(input);

      expect(output).not.toBe(input);
      expect(output).toEqual({ three: '3' });
    });
  });
});
