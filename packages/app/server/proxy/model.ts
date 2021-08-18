import { IncomingMessage } from 'http';
import { Socket } from 'net';
import { ProxyConnectMode } from '../../configuration';
import { Connection } from '../request';

/**
 * A handier wrapper around a CONNECT request
 *
 * @public
 */
export interface IProxyConnectAPI {
  /** The original Node.js object representing the request */
  readonly request: IncomingMessage;
  /** The underlying socket */
  readonly socket: Socket;
  /** The connections stack */
  readonly connectionsStack: readonly Readonly<Connection>[];
  /** The last connection in connectionsStack */
  readonly connection: Readonly<Connection>;
  /** The target hostname in the CONNECT request */
  readonly hostname: string;
  /** The target port in the CONNECT request */
  readonly port: number;
  /** The destination hostname that will be used in 'forward' mode. By default, it is equal to hostname. Can be changed with setDestination. */
  readonly destinationHostname: string;
  /** The destination port that will be used in 'forward' mode. By default, it is equal to port. Can be changed with setDestination. */
  readonly destinationPort: number;
  /**
   * Sets the destination hostname and port that will be used when the process method is called. Also changes the mode to 'forward'.
   * @param hostname - Destination hostname
   * @param port - Destination port
   */
  setDestination(hostname: string, port: number): void;
  /** The currently selected mode. Can be changed with setMode. */
  readonly mode: ProxyConnectMode;
  /**
   * Changes the mode that will be used when the process method is called.
   * @param mode - mode to set
   */
  setMode(mode: ProxyConnectMode): void;
  /** Processes the socket according to the mode stored in mode. This method is called automatically when the onProxyConnect function finishes, but it can also be called manually before. */
  process(): void;
}
