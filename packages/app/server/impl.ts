// ------------------------------------------------------------------------- std

import { createServer as createHttp1Server, IncomingMessage, ServerResponse } from 'http';
import { createServer as createHttp2Server, Http2ServerRequest, Http2ServerResponse } from 'http2';

import { AddressInfo, createServer as createNetServer, Server, Socket } from 'net';

import { TLSSocket } from 'tls';

// ---------------------------------------------------------------------- common

import { readAll } from '../../lib/stream';

// ------------------------------------------------------------------------- app

import { createGlobalLogger, getConsole, logError, logInfo, logSeparator } from '../logger';

import { ConfigurationSpec, IMergedConfiguration } from '../configuration';

import { Mock } from '../mocking';

// -------------------------------------------------------------------- internal

import { APIOptions, ApplicationData, CLIOptions } from './model';

import { build as buildConfiguration, logApplicationData } from './configuration';
import { Request } from './request';
import { Response } from './response';

import { setConnectionProtocol } from './connection';
import { ProxyConnectAPI } from './proxy';
import { TLSManager } from './tls';

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

const http2Signature = Buffer.from('PRI * HTTP/2.0\r\n\r\nSM\r\n\r\n', 'ascii');

/** Spawns the server */
export async function spawnServer({ configuration, root }: ApplicationData): Promise<Server> {
  const requestListener = async (
    request: Http2ServerRequest | IncomingMessage,
    response: Http2ServerResponse | ServerResponse,
  ) => {
    const mock = new Mock({
      options: { root, userConfiguration: configuration },
      request: new Request(request, await readAll(request)),
      response: new Response(response),
    });

    if (!configuration.skipLog) {
      logInfo({
        timestamp: true,
        message: CONF.messages.handlingRequest,
        data: `${request.method} ${request.url}`,
      });
    }

    await configuration.hook.value({ mock, console: getConsole() });
    await mock.process();
  };
  const http1Server = createHttp1Server(requestListener);
  const http2Server = configuration.http2.value ? createHttp2Server(requestListener) : null;
  const alpnProtocols = http2Server ? ['h2', 'http/1.1'] : ['http/1.1'];

  const tlsManager = new TLSManager({
    tlsCAKeyPath: configuration.tlsCAKeyPath.value,
    tlsKeySize: configuration.tlsKeySize.value,
    root,
  });
  await tlsManager.init();

  const handleSocket = (socket: Socket) => {
    socket.once('data', async (data) => {
      socket.pause();
      socket.unshift(data);
      // cf https://github.com/mscdex/httpolyglot/issues/3#issuecomment-173680155
      // HTTPS:
      if (data.readUInt8(0) === 22) {
        const tlsSocket = await tlsManager.process(socket, alpnProtocols);
        handleSocket(tlsSocket);
      } else {
        await Promise.resolve();
        const isTLS = socket instanceof TLSSocket;
        const isHttp2 =
          http2Server &&
          ((isTLS && socket.alpnProtocol === 'h2') ||
            http2Signature.equals(data.subarray(0, http2Signature.length)));
        if (isHttp2) {
          // this is a hack that makes node.js correctly initialize the http/2.0 socket
          // without it, node.js plans to initialize the socket in the secureConnect event that is never emitted,
          // and later crashes because initialization was not done
          (socket as any).secureConnecting = false;
        }
        setConnectionProtocol(socket, isTLS ? 'https' : 'http');
        (isHttp2 ? http2Server : http1Server).emit('connection', socket);
      }
      socket.resume();
    });
    socket.on('error', (exception) => logError({ message: CONF.messages.socketError, exception }));
  };

  const connectListener = async (
    request: IncomingMessage | Http2ServerRequest,
    socket: Socket,
    data?: Buffer,
  ) => {
    if (data && data.length > 0) {
      socket.unshift(data);
    }
    const api = new ProxyConnectAPI(request, configuration.proxyConnectMode.value, handleSocket);

    if (!configuration.skipLog) {
      logInfo({
        timestamp: true,
        message: CONF.messages.handlingRequest,
        data: `${request.method} ${api.hostname}:${api.port}`,
      });
    }
    await configuration.onProxyConnect.value(api);
    api.process();
  };
  http1Server.on('connect', connectListener);
  http2Server?.on('connect', connectListener);

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

export async function _run(configuration: IMergedConfiguration | null): Promise<() => void> {
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
 * @param options - kassette configuration options
 * @returns a callback that can be used to shutdown the proxy, calling the {@link ConfigurationSpec.onExit|onExit} callback defined in configuration (if provided).
 *
 * @public
 */
export async function runFromAPI(options: APIOptions): Promise<() => void> {
  return _run(await buildConfiguration(options));
}

/**
 * @internal
 */
export async function runFromCLI(options: CLIOptions): Promise<() => void> {
  return _run(await buildConfiguration(options));
}
