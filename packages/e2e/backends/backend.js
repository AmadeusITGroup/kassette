// -------------------------------------------------------------------- internal

const { getCurrentContext } = require('../common');
const { launchServer } = require('../common/launcher');

const { createServer } = require('./server');

////////////////////////////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////////////////////////////

function Launcher({ processName, hookName, secure, http2Server }) {
  return async function launch({ pushResult }) {
    return await launchServer({
      name: processName,
      run({ onStart, onExit, console }) {
        return createServer({
          onStart,
          onExit,
          secure,
          http2Server,
          onRequest: (request, response) =>
            onRequest({ request, response, console, pushResult, hookName }),
        });
      },
    });
  };
}
exports.Launcher = Launcher;

/**
 * @param {{request: import('http').IncomingMessage, response: import('http').ServerResponse}} param
 */
async function onRequest({ request, response, console, pushResult, hookName }) {
  const { pathname } = new URL(request.url, `http://127.0.0.1/`);

  const { useCase, name, iteration } = getCurrentContext();
  console.log(`Executing use case "${name}", iteration ${iteration}`);

  let result = {};
  response.statusCode = 200;
  if (useCase[hookName] != null) {
    try {
      result = await useCase[hookName](
        { request, response },
        { console, useCase, name, iteration, pathname },
      );
    } catch (error) {
      console.error(`Error in ${name} ${hookName}:`, error);
      response.statusCode = 500;
      response.end('Internal Server Error');
    }
  }
  if (!response.writableEnded) {
    response.end();
  }
  await pushResult({ useCase: name, iteration, data: result });
}
