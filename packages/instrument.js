const { join } = require('path');

const foldersToInstrument = [join(__dirname, 'app'), join(__dirname, 'lib')];

const isInFolderToInstrument = (file) =>
  foldersToInstrument.some((folder) => file.startsWith(folder));

exports.shouldInstrument = (filename) =>
  isInFolderToInstrument(filename) &&
  /\.ts$/.test(filename) &&
  !/\.spec\.ts$|__test__/.test(filename);

exports.process = (code, filename) => {
  try {
    code = require('@babel/core').transform(code, {
      filename,
      plugins: [
        '@babel/plugin-syntax-typescript',
        ['@babel/plugin-syntax-decorators', { version: 'legacy' }],
        'babel-plugin-istanbul',
      ],
    }).code;
  } catch (error) {
    console.log('Error while instrumenting: ', error);
    throw error;
  }
  return code;
};
