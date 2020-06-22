// ------------------------------------------------------------------------- std

import {
  createServer,
  Server,
} from 'http';

import {
  Socket,
  AddressInfo,
} from 'net';

// ---------------------------------------------------------------------- common

import { readAll } from '../../lib/stream';

// ------------------------------------------------------------------------- app

import {
  createGlobalLogger,

  logInfo,
  logSeparator,
  getConsole,
} from '../logger';

import {
  IMergedConfiguration,
} from '../configuration';

import { Mock } from '../mocking';

// -------------------------------------------------------------------- internal

import {
  CLIOptions,
  APIOptions,
  RunOptions,
  RunResult,
  ApplicationData,
} from './model';

import { Request } from './request';
import { Response } from './response';
import {
  logApplicationData,
  build as buildConfiguration,
} from './configuration';

// ------------------------------------------------------------------------ conf

import CONF from './conf';



////////////////////////////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////////////////////////////

export * from './configuration';
export * from './requesting';
/** A wrapper around a Node.js request (`IncomingMessage`) */
export * from './request';
/** A wrapper around a Node.js response (`ServerResponse`) */
export * from './response';
/** A wrapper around a Node.js response from a server (`IncomingMessage`) */
export * from './server-response';



////////////////////////////////////////////////////////////////////////////////
// Server
// FIXME 2018-09-25T14:00:24+02:00
// Multiple requests will be received in parallel, leading to a messed up output in the console...
// they should be queued and processed one by one to avoid that
////////////////////////////////////////////////////////////////////////////////

/** Spawns the server */
export function spawnServer({configuration, root}: ApplicationData): Server {
  const server = createServer(async (request, response) => {
    const mock = new Mock({
      options: {root, userConfiguration: configuration},
      request: new Request(request, await readAll(request)),
      response: new Response(response),
    });

    logInfo({
      timestamp: true,
      message: CONF.messages.handlingRequest,
      data: `${request.method} ${request.url}`,
    });

    await configuration.hook.value({mock, console: getConsole()});
    await mock.process();
  });

  server.listen(configuration.port.value, function(this: Socket) {
    const port = (this.address() as AddressInfo).port;
    configuration.onListen.value({port});

    logInfo({ message: CONF.messages.listening, data: port});
    logSeparator();
  });

  server.on('close', () => configuration.onExit.value());

  return server;
}



////////////////////////////////////////////////////////////////////////////////
// Execution
////////////////////////////////////////////////////////////////////////////////

export async function _run(configuration: IMergedConfiguration | null): Promise<RunResult> {
  if (configuration == null) { return () => {}; }

  const console = configuration.console.value;
  if (console != null) {
    createGlobalLogger(console);
  }

  const data = {configuration, root: process.cwd()};
  logApplicationData(data);
  const server = spawnServer(data);

  const output = function() {
    return new Promise(resolve => server.close(resolve));
  };

  output.server = server;

  return output;
}

export async function run(options: Partial<RunOptions>): Promise<RunResult> {
  return _run(await buildConfiguration(options));
}

export async function runFromAPI(options: APIOptions): Promise<RunResult> {
  return _run(await buildConfiguration(options));
}

export async function runFromCLI(options: CLIOptions): Promise<RunResult> {
  return _run(await buildConfiguration(options));
}
