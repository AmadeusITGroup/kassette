import { IncomingMessage } from 'http';
import { ServerHttp2Stream, Http2ServerRequest } from 'http2';
import { Socket } from 'net';
import { ProxyConnectMode, ConfigurationSpec, CLIConfigurationSpec } from '../../configuration';
import { Connection } from '../request';

/**
 * A handier wrapper around a CONNECT request
 *
 * @public
 */
export interface IProxyConnectAPI {
  /**
   * The original Node.js object representing the request
   */
  readonly request: IncomingMessage | Http2ServerRequest;

  /**
   * The underlying socket
   */
  readonly socket: Socket | ServerHttp2Stream;

  /**
   * The connections stack
   */
  readonly connectionsStack: readonly Readonly<Connection>[];

  /**
   * The last connection in {@link IProxyConnectAPI.connectionsStack|connectionsStack}
   */
  readonly connection: Readonly<Connection>;

  /**
   * The target hostname in the CONNECT request
   */
  readonly hostname: string;

  /**
   * The target port in the CONNECT request
   */
  readonly port: number;

  /**
   * The destination hostname that will be used in `forward` mode.
   * By default, it is equal to {@link IProxyConnectAPI.hostname|hostname}.
   * Can be changed with {@link IProxyConnectAPI.setDestination|setDestination}.
   */
  readonly destinationHostname: string;

  /**
   * The destination port that will be used in `forward` mode.
   * By default, it is equal to {@link IProxyConnectAPI.port|port}.
   * Can be changed with {@link IProxyConnectAPI.setDestination|setDestination}.
   */
  readonly destinationPort: number;

  /**
   * Sets the destination {@link IProxyConnectAPI.destinationHostname|hostname} and {@link IProxyConnectAPI.destinationPort|port}
   * that will be used when the {@link IProxyConnectAPI.process|process} method is called.
   * Also changes the {@link IProxyConnectAPI.mode|mode} to `forward`.
   * @param hostname - Destination hostname
   * @param port - Destination port
   */
  setDestination(hostname: string, port: number): void;

  /**
   * The currently selected mode, configured either by a call to {@link IProxyConnectAPI.setMode|setMode}
   * or by {@link CLIConfigurationSpec.proxyConnectMode|the global setting}
   */
  readonly mode: ProxyConnectMode;

  /**
   * Changes the {@link IProxyConnectAPI.mode|mode} that will be used when the {@link IProxyConnectAPI.process|process} method is called.
   * @param mode - mode to set
   */
  setMode(mode: ProxyConnectMode): void;

  /**
   * Processes the socket according to the mode stored in {@link IProxyConnectAPI.mode|mode}. This method is called automatically when the
   * {@link ConfigurationSpec.onProxyConnect|onProxyConnect} function finishes, but it can also be called manually before.
   */
  process(): void;
}
