const { shouldInstrument, process: instrument } = require('./instrument');
const { createTransformer } = require('ts-jest').default;
const { normalize } = require('path');

exports.createTransformer = () => {
  const tsJestTransformer = createTransformer();

  return {
    process(content, filename, jestConfig) {
      if (jestConfig.collectCoverage) {
        const normalizedFileName = normalize(filename);
        if (shouldInstrument(normalizedFileName)) {
          content = instrument(content, normalizedFileName);
        }
      }
      content = tsJestTransformer.process(content, filename, jestConfig);
      return content;
    },
  };
};
