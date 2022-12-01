const fs = require('fs');
const { normalize } = require('path');
const { process, shouldInstrument } = require('./instrument');

// override readFileSync to provide instrumented files:
const trueReadFileSync = fs.readFileSync;
fs.readFileSync = (...args) => {
  let code = trueReadFileSync(...args);
  const filename = normalize(args[0]);
  if (shouldInstrument(filename)) {
    const isBuffer = Buffer.isBuffer(code);
    if (isBuffer) {
      code = code.toString('utf8');
    }
    code = process(code, filename);
    if (isBuffer) {
      code = Buffer.from(code, 'utf8');
    }
  }
  return code;
};

module.exports = require('./rollup.config');
