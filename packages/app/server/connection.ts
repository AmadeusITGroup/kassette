import { ServerHttp2Stream } from 'http2';
import { Socket } from 'net';
import { URL } from 'url';
import { Connection } from './request';

const connectionsSymbol = Symbol('connections');

export const connectionToURL = (address: Connection) => {
  const url = new URL('http://127.0.0.1');
  url.protocol = address.protocol;
  url.hostname = address.hostname;
  url.port = `${address.port}`;
  return url;
};

const _getSocketConnections = (socket: Socket | ServerHttp2Stream): Connection[] => {
  let result: Connection[] = (socket as any)[connectionsSymbol];
  if (!result) {
    if ('session' in socket) {
      const parentSocket = socket.session!.socket;
      result = _getSocketConnections(parentSocket).slice(0);
    } else {
      result = [
        {
          hostname: socket.localAddress!,
          port: socket.localPort!,
          protocol: 'http',
        },
      ];
    }
    (socket as any)[connectionsSymbol] = result;
  }
  return result;
};

const _getSocketConnection = (socket: Socket | ServerHttp2Stream) => {
  const stack = _getSocketConnections(socket);
  return stack[stack.length - 1];
};

export const pushSocketConnection = (
  socket: Socket | ServerHttp2Stream,
  hostname: string,
  port: number,
  protocol: string,
) => {
  const socketInfo = _getSocketConnections(socket);
  socketInfo.push({ hostname, port, protocol });
};

export const setConnectionProtocol = (socket: Socket | ServerHttp2Stream, protocol: string) => {
  _getSocketConnection(socket).protocol = protocol;
};

export const forwardSocketConnections = (
  parentSocket: Socket | ServerHttp2Stream,
  childSocket: Socket | ServerHttp2Stream,
) => {
  const socketInfo = _getSocketConnections(parentSocket);
  (childSocket as any)[connectionsSymbol] = socketInfo;
};

export const getSocketConnections: (
  socket: Socket | ServerHttp2Stream,
) => readonly Readonly<Connection>[] = _getSocketConnections;

export const getSocketConnection: (socket: Socket | ServerHttp2Stream) => Readonly<Connection> =
  _getSocketConnection;
