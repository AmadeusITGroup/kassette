// ------------------------------------------------------------------------- std

const { promises: fs } = require('fs');
const nodePath = require('path');

// ------------------------------------------------------------------------- 3rd

const playwright = require('playwright');

// -------------------------------------------------------------------- internal

const { setCurrentContext } = require('../common');
const { useCases } = require('../use-cases');

////////////////////////////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////////////////////////////

function localPath(...args) {
  return nodePath.join(__dirname, ...args);
}

////////////////////////////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////////////////////////////

async function create({
  proxyPort,
  backendPort,
  alternativeBackendPort,
  pushClientData,
  pushClientResult,
  console,
  onStartUseCase,
  onStartIteration,
  onEndUseCase,
}) {
  let browser;
  return {
    async run() {
      //////////////////////////////////////////////////////////////////////////
      // Start instance
      //////////////////////////////////////////////////////////////////////////

      browser = await playwright.chromium.launch({
        headless: true,
        proxy: {
          server: 'per-context',
        },
      });

      for (const useCase of useCases) {
        const { name, iterations, browserProxy, nodeRequest } = useCase;
        onStartUseCase(useCase);
        if (nodeRequest) {
          for (let iteration = 0; iteration < iterations; iteration++) {
            setCurrentContext(useCase, iteration);
            onStartIteration(iteration);
            const result = await nodeRequest({
              iteration,
              proxyPort,
              backendPort,
              alternativeBackendPort,
            });
            await pushClientResult({ useCase: name, iteration, data: result });
          }
        } else {
          const context = await browser.newContext({
            ignoreHTTPSErrors: true,
            proxy: browserProxy
              ? {
                  server: `http://127.0.0.1:${proxyPort}`,
                }
              : {
                  server: 'per-context',
                  bypass: '*',
                },
          });
          const page = await context.newPage();

          // 2020-06-09T14:50:14+02:00 seems to be not working all the time
          // page.on('console', message => (console[message.type()] || console.error)(message.text()));

          //////////////////////////////////////////////////////////////////////////
          // Load page
          // (hooked with a dummy content just to have a base URI
          // and avoid CORS issues)
          //////////////////////////////////////////////////////////////////////////

          const urlPattern = '**/*';

          const routeHandler = (route) => {
            route.fulfill({ status: 200, body: '<html></html>' });
            page.unroute(urlPattern, routeHandler);
          };

          page.route(urlPattern, routeHandler);

          await page.goto(`http://127.0.0.1:${proxyPort}`);

          //////////////////////////////////////////////////////////////////////////
          // Expose functions & inject data and scripts
          //////////////////////////////////////////////////////////////////////////

          await page.exposeFunction('pushClientData', pushClientData);
          await page.exposeFunction('pushClientResult', pushClientResult);
          await page.exposeFunction('log', console.log);

          const useCasesSource = await fs.readFile(localPath('../use-cases.js'), 'utf8');
          await page.addScriptTag({
            content: `(function(exports) {${useCasesSource}})(window.UseCases = {});`,
          });
          await page.addScriptTag({ path: localPath('browser.js') });

          for (let iteration = 0; iteration < iterations; iteration++) {
            setCurrentContext(useCase, iteration);
            onStartIteration(iteration);
            await page.evaluate((spec) => execute(spec), {
              name,
              iteration,
              proxyPort,
              backendPort,
              alternativeBackendPort,
            });
          }
        }
        onEndUseCase();
      }
    },
    async close() {
      await browser.close();
    },
  };
}
exports.create = create;
