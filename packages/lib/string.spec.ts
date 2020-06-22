import { safeBuildString } from './string';

describe('string', () => {
  describe('safeBuildString', () => {
    it('should handle non-arrays', () => {
      expect(safeBuildString('hello')).toEqual('hello');
    });

    it('should handle simple array', () => {
      expect(safeBuildString(['hello', null, ' world', undefined])).toEqual('hello world');
    });

    it('should handle nested arrays', () => {
      expect(safeBuildString(['hello', null, [' my', undefined, ' dear', [' world']], ' today', null])).toEqual('hello my dear world today');
    });
  });
});
