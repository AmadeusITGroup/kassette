// -------------------------------------------------------------------- internal

const { getCurrentContext } = require('../common');
const { launchServer } = require('../common/launcher');

const { createServer } = require('./server');

////////////////////////////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////////////////////////////

function Launcher({ processName, hookName, secure }) {
  return async function launch({ pushResult }) {
    return await launchServer({
      name: processName,
      run({ onStart, onExit, console }) {
        return createServer({
          onStart,
          onExit,
          secure,
          registerRoutes: (router) => registerRoutes({ router, console, pushResult, hookName }),
        });
      },
    });
  };
}
exports.Launcher = Launcher;

function registerRoutes({ router, console, pushResult, hookName }) {
  router.all('use case implementation', '/:pathname*', async function (context) {
    const { pathname } = context.params;

    const { useCase, name, iteration } = getCurrentContext();
    console.log(`Executing use case "${name}", iteration ${iteration}`);

    context.response.status = 200;
    let result = {};
    if (useCase[hookName] != null) {
      result = await useCase[hookName](context, { console, useCase, name, iteration, pathname });
    }
    await pushResult({ useCase: name, iteration, data: result });
  });
}
