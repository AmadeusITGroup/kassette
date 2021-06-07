import { ProxyConnectMode } from '../../configuration';
import { IncomingMessage } from 'http';
import { IProxyConnectAPI } from './model';
import { Socket, connect } from 'net';
import { getSocketConnections, pushSocketConnection } from '../connection';
import { Connection } from '../request';

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

export class ProxyConnectAPI implements IProxyConnectAPI {
  connectionsStack: readonly Readonly<Connection>[];
  readonly hostname: string;
  readonly port: number;
  destinationHostname: string;
  destinationPort: number;
  private _processed: boolean;

  constructor(
    public readonly request: IncomingMessage,
    public mode: ProxyConnectMode,
    private _intercept: (socket: Socket) => void,
  ) {
    this.connectionsStack = getSocketConnections(this.socket).slice(0);
    const parsed = parseHost(request.url!);
    if (!parsed) {
      this.mode = 'close';
    } else {
      this.destinationHostname = this.hostname = parsed.hostname;
      this.destinationPort = this.port = parsed.port;
    }
  }

  get socket() {
    return this.request.socket;
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
      this.socket.end();
    } else if (this.mode === 'intercept') {
      pushSocketConnection(socket, this.hostname, this.port, '');
      this._intercept(socket);
      socket.write('HTTP/1.1 200 Connection established\r\n\r\n');
    } else if (this.mode === 'forward') {
      const remoteSocket = connect(this.destinationPort, this.destinationHostname, () => {
        socket.write('HTTP/1.1 200 Connection established\r\n\r\n');
        remoteSocket.pipe(socket);
        socket.pipe(remoteSocket);
      }).on('error', () => {
        socket.end('HTTP/1.1 500 Connection error\r\n\r\n');
      });
    }
  }
}
