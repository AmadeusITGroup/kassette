// ------------------------------------------------------------------------- std

const util = require('util');
const { promises: fs } = require('fs');

// ------------------------------------------------------------------------- 3rd

const rimraf = require('rimraf');
const picocolors = require('picocolors');

// -------------------------------------------------------------------- internal

const { getCurrentContext } = require('../common');
const { ResultsHandler } = require('../common/results');
const { PATHS } = require('../common/paths');
const { createLogger } = require('../common/logger');

const backendsHandler = require('../backends');
const proxyHandler = require('../proxy');
const clientHandler = require('../client');

////////////////////////////////////////////////////////////////////////////////
// Console logging
////////////////////////////////////////////////////////////////////////////////

function logWithIndent(message, indent = 0) {
  console.log(`${'    '.repeat(indent)}> ${message}`);
}

function Logger() {
  let indent = 0;
  function log(message) {
    logWithIndent(message, indent);
  }
  function groupStart(label) {
    log(label);
    indent++;
  }
  function groupEnd() {
    indent--;
  }
  function resetIndent() {
    indent = 0;
  }

  return { log, groupStart, groupEnd, resetIndent };
}

function highlight(string, color = 'green') {
  return picocolors[`${color}`](string);
}

function highlightEntity(string) {
  return highlight(string, 'magenta');
}

////////////////////////////////////////////////////////////////////////////////
// Workspace reset
////////////////////////////////////////////////////////////////////////////////

const rmrf = util.promisify(rimraf);
async function mkdir(path) {
  return fs.mkdir(path, { recursive: true });
}

async function resetWorkspace() {
  await rmrf(PATHS.workspace);
  await mkdir(PATHS.outputs);
  await mkdir(PATHS.resultsFolder);
}

////////////////////////////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////////////////////////////

function ensureSIGINT() {
  if (process.platform !== 'win32') return;

  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  readline.on('SIGINT', () => process.emit('SIGINT'));
}
exports.ensureSIGINT = ensureSIGINT;

////////////////////////////////////////////////////////////////////////////////
// Main
////////////////////////////////////////////////////////////////////////////////

async function run() {
  //////////////////////////////////////////////////////////////////////////////
  // Setup
  //////////////////////////////////////////////////////////////////////////////

  ensureSIGINT();

  const { log, groupStart, groupEnd, resetIndent } = Logger();

  await resetWorkspace();

  const results = new ResultsHandler();
  await results.initialize();

  groupStart('executing use cases');

  const orchestratorLogger = await createLogger({ processName: 'orchestrator' });

  //////////////////////////////////////////////////////////////////////////////
  // Backend launch
  //////////////////////////////////////////////////////////////////////////////

  groupStart(`launching ${highlightEntity('backend')}`);

  const backend = await backendsHandler.launchBackend({
    pushResult: results.pusher('backend'),
  });

  log(`backend started and ready, listening on port ${highlight(backend.port)}`);
  groupEnd();

  //////////////////////////////////////////////////////////////////////////////
  // Alternative backend launch
  //////////////////////////////////////////////////////////////////////////////

  groupStart(`launching ${highlightEntity('alternative backend')}`);

  const alternativeBackend = await backendsHandler.launchAlternativeBackend({
    pushResult: results.pusher('alternativeBackend'),
  });

  log(
    `alternative backend started and ready, listening on port ${highlight(
      alternativeBackend.port,
    )}`,
  );
  groupEnd();

  //////////////////////////////////////////////////////////////////////////////
  // Proxy launch
  //////////////////////////////////////////////////////////////////////////////

  groupStart(`launching ${highlightEntity('proxy')}`);

  const proxy = await proxyHandler.launch({
    backendPort: backend.port,
    alternativeBackendPort: alternativeBackend.port,

    pushResult: results.pusher('proxy'),
  });

  log(`proxy started and ready, listening on port ${highlight(proxy.port)}`);
  groupEnd();

  //////////////////////////////////////////////////////////////////////////////
  // Client launch
  //////////////////////////////////////////////////////////////////////////////

  const _pushClientResult = results.pusher('client');
  const pushPostProcessingResult = results.pusher('postProcessing');

  // when client result is pushed,
  // there's finalization to be done for the current use case
  // That is the data post-processing
  async function pushClientResult(payload) {
    await _pushClientResult(payload);

    const { useCase, name, iteration } = getCurrentContext();

    let postProcessingResult;
    if (useCase.postProcess != null) {
      orchestratorLogger.console.log(
        `Post processing use case "${highlight(name)}", iteration ${highlight(iteration)}`,
      );
      const data = results.results[name].iterations[iteration];
      postProcessingResult = await useCase.postProcess({
        data,
        console: orchestratorLogger.console,
        useCase,
        name,
        iteration,
      });
    }
    await pushPostProcessingResult({ useCase: name, iteration, data: postProcessingResult });
  }

  const clientLogger = await createLogger({ processName: 'client' });

  groupStart(`launching ${highlightEntity('client')}`);
  const client = await clientHandler.create({
    proxyPort: proxy.port,
    backendPort: backend.port,
    alternativeBackendPort: alternativeBackend.port,

    pushClientData: results.pusher('clientData'),
    pushClientResult,

    console: clientLogger.console,
    onStartUseCase({ name }) {
      groupStart(`use case ${highlight(name)}`);
    },
    onStartIteration(iteration) {
      log(`iteration ${highlight(iteration)}`);
    },
    onEndUseCase() {
      groupEnd();
    },
  });
  log('client launched');
  groupEnd();

  //////////////////////////////////////////////////////////////////////////////
  // Tests execution
  //////////////////////////////////////////////////////////////////////////////

  groupStart('executing tests');
  await client.run();
  groupStart('tests done, shutting down processes');

  //////////////////////////////////////////////////////////////////////////////
  // Tear down
  //////////////////////////////////////////////////////////////////////////////

  resetIndent();

  groupStart(`closing ${highlightEntity('backend')}`);
  await backend.close();
  log('backend closed');
  groupEnd();

  groupStart(`closing ${highlightEntity('alternative backend')}`);
  await alternativeBackend.close();
  log('alternative backend closed');
  groupEnd();

  groupStart(`closing ${highlightEntity('client')}`);
  await client.close();
  log('client closed');
  groupEnd();

  groupStart(`closing ${highlightEntity('proxy')}`);
  await proxy.close();
  log('proxy server stopped');
  groupEnd();

  //////////////////////////////////////////////////////////////////////////////
  // Finalization
  //////////////////////////////////////////////////////////////////////////////

  await results.finalize();

  resetIndent();
  groupStart('checking results');

  const checkerLogger = await createLogger({ processName: 'checker' });

  const testPayload = {
    results: await results.getResults(),
    console: checkerLogger.console,
  };

  async function finalize() {
    await checkerLogger.finalize();
    log('tests done');
    groupEnd();
    setTimeout(() => process.exit(0), 2000);
  }

  return { testPayload, finalize };
}
exports.run = run;
