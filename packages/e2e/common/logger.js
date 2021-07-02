// ------------------------------------------------------------------------- std

const util = require('util');
const nodePath = require('path');
const { promises: fs, writeSync, closeSync, close: _close } = require('fs');
const close = util.promisify(_close);

// -------------------------------------------------------------------- internal

const { PATHS } = require('./paths');

////////////////////////////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////////////////////////////

function processEntry(data) {
  return typeof data === 'string' ? data : util.inspect(data);
}

async function createOutput(processName, type) {
  const path = nodePath.join(PATHS.outputs, `${processName}_${type}.txt`);

  const fileHandle = await fs.open(path, 'a');

  return {
    push(...args) {
      const content = args.map(processEntry).join(' ');
      writeSync(fileHandle.fd, Buffer.from(content + '\n'));
    },

    async close() {
      try {
        await close(fileHandle.fd);
      } catch (error) {}
    },

    closeSync() {
      try {
        closeSync(fileHandle.fd);
      } catch (error) {}
    },

    fileHandle, // XXX 2019-01-09T15:18:13+01:00 required to avoid garbage collection
  };
}

////////////////////////////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////////////////////////////

async function createLogger({ processName }) {
  const stdout = await createOutput(processName, 'stdout');
  const stderr = await createOutput(processName, 'stderr');

  process.on('exit', () => {
    stdout.closeSync();
    stderr.closeSync();
  });

  const console = { log: stdout.push, error: stderr.push };

  const finalize = async () => {
    await stdout.close();
    await stderr.close();
  };

  return { console, finalize };
}
exports.createLogger = createLogger;
