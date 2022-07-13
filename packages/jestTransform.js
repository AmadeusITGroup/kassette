const { shouldInstrument, process: instrument } = require('./instrument');
const { createTransformer } = require('ts-jest').default;

exports.createTransformer = () => {
  const tsJestTransformer = createTransformer();

  return {
    process(content, filename, jestConfig) {
      if (jestConfig.collectCoverage && shouldInstrument(filename)) {
        content = instrument(content, filename);
      }
      content = tsJestTransformer.process(content, filename, jestConfig);
      return content;
    },
  };
};
