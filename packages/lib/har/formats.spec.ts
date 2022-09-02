import { detectHarFormat, FileFormat, jsonFormat, yamlFormat } from './formats';

describe('formats', () => {
  const checkFormat = (formatName: string, format: FileFormat) => {
    const checkWithEntry = (input: any) => {
      const buffer = format.stringify(input);
      const parsed = format.parse(buffer);
      expect(parsed).toEqual(input);
      const buffer2 = format.stringify(parsed);
      expect(buffer).toEqual(buffer2);
    };

    describe(formatName, () => {
      it('should work with null', () => {
        checkWithEntry(null);
      });

      it('should work with a simple json object', () => {
        checkWithEntry({
          a: 'abc\n\tdef',
          b: 2,
          c: true,
          d: false,
          e: {
            f: 0.001,
          },
        });
      });

      it('should work with a binary string', () => {
        const binaryString = Buffer.from('656600010203AB0C0D106566', 'hex').toString('binary');
        checkWithEntry({
          binaryString,
        });
      });
    });
  };

  checkFormat('json', jsonFormat);
  checkFormat('yaml', yamlFormat);

  describe('detectFormat', () => {
    it('should detect yaml extension', () => {
      expect(detectHarFormat('file.har.yaml')).toBe(yamlFormat);
      expect(detectHarFormat('file.har.yml')).toBe(yamlFormat);
      expect(detectHarFormat('file.yaml')).toBe(yamlFormat);
      expect(detectHarFormat('file.yml')).toBe(yamlFormat);
      expect(detectHarFormat('file.har.Yaml')).toBe(yamlFormat);
      expect(detectHarFormat('file.har.Yml')).toBe(yamlFormat);
      expect(detectHarFormat('file.har.YAML')).toBe(yamlFormat);
      expect(detectHarFormat('file.har.YML')).toBe(yamlFormat);
      expect(detectHarFormat('file.YAML')).toBe(yamlFormat);
      expect(detectHarFormat('file.YML')).toBe(yamlFormat);
    });

    it('should use json by default', () => {
      expect(detectHarFormat('file')).toBe(jsonFormat);
      expect(detectHarFormat('file.har')).toBe(jsonFormat);
      expect(detectHarFormat('file.json')).toBe(jsonFormat);
    });
  });
});
