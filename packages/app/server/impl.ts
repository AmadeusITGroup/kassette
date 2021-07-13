// ------------------------------------------------------------------------- std

import { createServer, IncomingMessage } from 'http';

import { createServer as createNetServer, Server, Socket, AddressInfo } from 'net';

// ---------------------------------------------------------------------- common

import { readAll } from '../../lib/stream';

// ------------------------------------------------------------------------- app

import { createGlobalLogger, logInfo, logSeparator, getConsole, logError } from '../logger';

import { IMergedConfiguration } from '../configuration';

import { Mock } from '../mocking';

// -------------------------------------------------------------------- internal

import { CLIOptions, APIOptions, RunResult, ApplicationData } from './model';

import { Request } from './request';
import { Response } from './response';
import { logApplicationData, build as buildConfiguration } from './configuration';

import { TLSManager } from './tls';
import { ProxyConnectAPI } from './proxy';
import { setConnectionProtocol } from './connection';

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
export async function spawnServer({ configuration, root }: ApplicationData): Promise<Server> {
  const server = createServer(async (request, response) => {
    const mock = new Mock({
      options: { root, userConfiguration: configuration },
      request: new Request(request, await readAll(request)),
      response: new Response(response),
    });

    logInfo({
      timestamp: true,
      message: CONF.messages.handlingRequest,
      data: `${request.method} ${request.url}`,
    });

    await configuration.hook.value({ mock, console: getConsole() });
    await mock.process();
  });

  const tlsManager = new TLSManager({ tlsCAKeyPath: configuration.tlsCAKeyPath.value, root });
  await tlsManager.init();

  const handleSocket = (socket: Socket) => {
    socket.once('data', async (data) => {
      socket.pause();
      socket.unshift(data);
      // cf https://github.com/mscdex/httpolyglot/issues/3#issuecomment-173680155
      // HTTPS:
      if (data.readUInt8(0) === 22) {
        socket = await tlsManager.process(socket);
        setConnectionProtocol(socket, 'https');
      } else {
        await Promise.resolve();
        setConnectionProtocol(socket, 'http');
      }
      server.emit('connection', socket);
      socket.resume();
    });
    socket.on('error', (exception) => logError({ message: CONF.messages.socketError, exception }));
  };

  server.on('connect', async (request: IncomingMessage, socket: Socket, data: Buffer) => {
    if (data.length > 0) {
      socket.unshift(data);
    }
    const api = new ProxyConnectAPI(request, configuration.proxyConnectMode.value, handleSocket);
    logInfo({
      timestamp: true,
      message: CONF.messages.handlingRequest,
      data: `${request.method} ${request.url}`,
    });
    await configuration.onProxyConnect.value(api);
    api.process();
  });

  // server that can receive both http and https connections
  const netServer = createNetServer(handleSocket);

  netServer.listen(configuration.port.value, configuration.hostname.value, function (this: Socket) {
    const port = (this.address() as AddressInfo).port;
    configuration.onListen.value({ port });

    logInfo({ message: CONF.messages.listening, data: port });
    logSeparator();
  });

  netServer.on('close', () => configuration.onExit.value());

  return netServer;
}

////////////////////////////////////////////////////////////////////////////////
// Execution
////////////////////////////////////////////////////////////////////////////////

export async function _run(configuration: IMergedConfiguration | null): Promise<RunResult> {
  if (configuration == null) {
    return () => {};
  }

  const console = configuration.console.value;
  if (console != null) {
    createGlobalLogger(console);
  }

  const data = { configuration, root: process.cwd() };
  logApplicationData(data);
  const server = await spawnServer(data);

  const output = function () {
    return new Promise((resolve) => server.close(resolve));
  };

  output.server = server;

  return output;
}

/**
 * Launch the proxy programmatically.
 *
 * @returns a callback that can be used to shutdown the proxy, calling the `onExit` callback defined in configuration (if provided).
 *
 * @public
 */
export async function runFromAPI(options: APIOptions): Promise<RunResult> {
  return _run(await buildConfiguration(options));
}

/**
 * @internal
 */
export async function runFromCLI(options: CLIOptions): Promise<RunResult> {
  return _run(await buildConfiguration(options));
}
