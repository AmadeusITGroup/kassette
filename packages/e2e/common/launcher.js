// -------------------------------------------------------------------- internal

const {createLogger} = require('./logger');
const {createPromise} = require('./lib');



////////////////////////////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////////////////////////////

async function launchServer({name, run}) {
  const logger = await createLogger({processName: name});

  const exit = createPromise();
  const exitPromise = exit.promise.then(logger.finalize);
  const ready = createPromise();

  function onStart({port}) {
    ready.resolve({
      port,
      close: function () {
        close();
        return exitPromise;
      },
    })
  }

  const close = await run({
    onStart,
    onExit: exit.resolve,
    console: logger.console,
  });

  return ready.promise;
}
exports.launchServer = launchServer;
