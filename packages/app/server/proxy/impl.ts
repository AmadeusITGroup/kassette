import { ProxyConnectMode } from '../../configuration';
import { IncomingMessage } from 'http';
import { IProxyConnectAPI } from './model';
import { Socket, connect } from 'net';
import { getSocketConnections, pushSocketConnection } from '../connection';
import { Connection } from '../request';
import { constants as http2Const, Http2ServerRequest, ServerHttp2Stream } from 'http2';

const hostRegExp = /^(.*):(\d+)$/i;
const parseHost = (host: string) => {
  const match = hostRegExp.exec(host);
  if (match) {
    const hostname = match[1];
    const port = +match[2];
    if (port >= 1 && port <= 65535) {
      return { hostname, port };
    }
  }
  return null;
};

const isHttp2Stream = (socket: Socket | ServerHttp2Stream): socket is ServerHttp2Stream =>
  'session' in socket;

const connectionEstablished = (socket: Socket | ServerHttp2Stream) => {
  if (isHttp2Stream(socket)) {
    socket.respond();
  } else {
    socket.write('HTTP/1.1 200 Connection established\r\n\r\n');
  }
};

const connectionError = (socket: Socket | ServerHttp2Stream) => {
  if (isHttp2Stream(socket)) {
    socket.close(http2Const.NGHTTP2_CONNECT_ERROR);
  } else {
    socket.end('HTTP/1.1 500 Connection error\r\n\r\n');
  }
};

export class ProxyConnectAPI implements IProxyConnectAPI {
  connectionsStack: readonly Readonly<Connection>[];
  readonly hostname: string;
  readonly port: number;
  destinationHostname: string;
  destinationPort: number;
  private _processed: boolean;

  constructor(
    public readonly request: IncomingMessage | Http2ServerRequest,
    public mode: ProxyConnectMode,
    private _intercept: (socket: Socket | ServerHttp2Stream) => void,
  ) {
    this.connectionsStack = getSocketConnections(this.socket).slice(0);
    const authority = request instanceof Http2ServerRequest ? request.authority : request.url!;
    const parsed = parseHost(authority);
    if (!parsed) {
      this.mode = 'close';
    } else {
      this.destinationHostname = this.hostname = parsed.hostname;
      this.destinationPort = this.port = parsed.port;
    }
  }

  get socket() {
    return this.request instanceof Http2ServerRequest ? this.request.stream : this.request.socket;
  }

  get connection() {
    return this.connectionsStack[this.connectionsStack.length - 1];
  }

  setDestination(hostname: string, port: number): void {
    this.destinationHostname = hostname;
    this.destinationPort = port;
    this.setMode('forward');
  }

  setMode(mode: ProxyConnectMode): void {
    this.mode = mode;
  }

  process(): void {
    if (this._processed) {
      return;
    }
    this._processed = true;
    const socket = this.socket;
    if (this.mode === 'close') {
      connectionError(socket);
    } else if (this.mode === 'intercept') {
      pushSocketConnection(socket, this.hostname, this.port, '');
      this._intercept(socket);
      connectionEstablished(socket);
    } else if (this.mode === 'forward') {
      const remoteSocket = connect(this.destinationPort, this.destinationHostname, () => {
        connectionEstablished(socket);
        remoteSocket.pipe(socket);
        socket.pipe(remoteSocket);
      }).on('error', () => connectionError(socket));
    }
  }
}
