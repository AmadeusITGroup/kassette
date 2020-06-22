import { stringifyPretty } from './json';

describe('json', () => {
  describe('stringifyPretty', () => {
    it('should inent', () => {
      expect(stringifyPretty({property: 'value'})).toEqual('{\n    "property": "value"\n}');
    });
  });
});
