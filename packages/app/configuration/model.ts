// ------------------------------------------------------------------------- app

import { HookAPI } from '../mocking';
import { IProxyConnectAPI } from '../server/proxy';

import { ConsoleSpec } from '../logger';

////////////////////////////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////////////////////////////

/**
 * The main working mode of the proxy. It can be defined globally through
 * the {@link CLIConfigurationSpec.mode|mode} setting
 * or per-request from the {@link ConfigurationSpec.hook|hook} method through
 * {@link IMock.setMode|setMode}.
 *
 * @remarks
 *
 * The mode drives how {@link IMock.getPayloadAndFillResponse|getPayloadAndFillResponse} and {@link IMock.process|process}
 * will behave. Here are the possible modes:
 *
 * - `manual`: don't do anything, leaving the responsibility to the user to call proper APIs to manage local files and/or
 * backend querying, and response filling
 *
 * - `remote`: forward the request to the remote backend and never touch the local mock
 *
 * - `download`: get payload from remote backend by forwarding request, create the local mock from this payload, and fill
 * the response with it
 *
 * - `local_or_remote`: if local mock exists, read it and fill the response with it, if local mock doesn't exist, do as for `remote` mode
 *
 * - `local_or_download`: if local mock exists, read it and fill the response with it, if local mock doesn't exist, do as for `download` mode
 *
 * - `local`: if local mock exists, read it and fill the response with it, if local mock doesn't exist, create a minimal payload with a 404 status
 * code, do not persist it and fill the response with it
 *
 * @public
 */
export type Mode =
  | 'local'
  | 'remote'
  | 'download'
  | 'local_or_remote'
  | 'local_or_download'
  | 'manual';

/**
 * Delay that will be used to send the response to the client
 * when the data is taken from the local mock.
 *
 * @remarks
 *
 * It can be expressed either as a direct value (in milliseconds) or as the
 * `'recorded'` string, which means to use the delay recorded
 * in the local mock (in the {@link MockData.time|time} field).
 *
 * @public
 */
export type Delay = 'recorded' | number;

/**
 * The mode describing how to process `CONNECT` requests. It can be defined globally through
 * the {@link CLIConfigurationSpec.proxyConnectMode|proxyConnectMode} setting
 * or per-request from the {@link ConfigurationSpec.onProxyConnect|onProxyConnect} method through
 * {@link IProxyConnectAPI.setMode|setMode}.
 *
 * @remarks
 *
 * Here are the possible modes for `CONNECT` requests:
 *
 * - `intercept`: kassette answers with `HTTP/1.1 200 Connection established` and pretends to be the target server. If the browser then makes http or https requests on the socket after this `CONNECT` request, they will be processed by kassette and pass through the {@link ConfigurationSpec.hook|hook} method (if any). That's the default mode.
 *
 * - `forward`: kassette blindly connects to the remote destination {@link IProxyConnectAPI.hostname|hostname} and {@link IProxyConnectAPI.port|port} specified in the `CONNECT` request and forwards all data in both directions. This is what a normal proxy server is supposed to do. The destination hostname and port can optionally be modified in the {@link ConfigurationSpec.onProxyConnect|onProxyConnect} method through the {@link IProxyConnectAPI.setDestination|setDestination} method.
 *
 * - `close`: kassette simply closes the underlying socket. This is what servers which do not support the `CONNECT` method do.
 *
 * - `manual`: kassette does nothing special with the socket, leaving it in its current state. This setting allows to use any custom logic in the {@link ConfigurationSpec.onProxyConnect|onProxyConnect} callback. It only makes sense if the {@link ConfigurationSpec.onProxyConnect|onProxyConnect} callback is implemented, otherwise the browser will wait indefinitely for an answer.
 *
 * @public
 */
export type ProxyConnectMode = 'close' | 'intercept' | 'forward' | 'manual';

/**
 * The set of possible properties defined through the CLI
 * (it is reduced since it can't contain runtime values)
 *
 * @public
 */
export interface CLIConfigurationSpec {
  /**
   * If true, will simplify the logging output, logging only one line
   * when the request is received but nothing else afterwards.
   */
  readonly skipLog?: boolean;

  /**
   * The port on which the proxy should listen. Note that kassette accepts both http and https connections on this port.
   *
   * @remarks
   *
   * If the port is not available, it will fail and stop the program; try again with another, available port.
   * If the port is set to 0, the proxy will listen on a random port
   * (actually depends on the OS implementation): use the callback {@link ConfigurationSpec.onListen|onListen} to catch its value.
   */
  readonly port?: number;

  /**
   * The hostname on which the proxy should listen.
   * Uses `127.0.0.1` by default, which only allows local connections.
   * To allow remote connections, use the ip address of the specific network interface that should be allowed to connect
   * or the unspecified IPv4 (`0.0.0.0`) or IPv6 (`::`) address.
   *
   * @remarks
   *
   * Note that kassette has not been reviewed for security issues.
   * It is intended to be used in a safe local/testing environment.
   * Binding it to an open connection can result in compromising your
   * computer or your network.
   */
  readonly hostname?: string;

  /**
   * The default mode.
   *
   * @remarks
   *
   * It can be changed at request level in the {@link ConfigurationSpec.hook|hook} method
   * through {@link IMock.setMode|mock.setMode}.
   */
  readonly mode?: Mode;

  /**
   * The default delay.
   *
   * @remarks
   *
   * It can be changed at request level in the {@link ConfigurationSpec.hook|hook} method
   * through {@link IMock.setDelay|mock.setDelay}.
   */
  readonly delay?: Delay;

  /**
   * The default root folder of all mocks, from which specific mocks paths will be resolved.
   *
   * @remarks
   *
   * It can be changed at a request level in the {@link ConfigurationSpec.hook|hook} method
   * through {@link IMock.setMocksFolder|mock.setMocksFolder}.
   */
  readonly mocksFolder?: string;

  /**
   * The URL of the remote backend, from which only the protocol, hostname and port are used.
   * Can be left `null`, in which case anything leading to sending the request to the remote backend will trigger an exception.
   * Can also contain the special `"*"` value, which means reading from the request the remote backend to target. This is useful when using kassette as a browser proxy.
   *
   * @remarks
   *
   * It can be changed at a request level in the {@link ConfigurationSpec.hook|hook} method
   * through {@link IMock.setRemoteURL|mock.setRemoteURL}.
   */
  readonly remoteURL?: string | null;

  /**
   * Default mode for `CONNECT` requests.
   *
   * @remarks
   *
   * It can be changed at a request level in the {@link ConfigurationSpec.onProxyConnect|onProxyConnect} method
   * through {@link IProxyConnectAPI.setMode|setMode}.
   */
  readonly proxyConnectMode?: ProxyConnectMode;

  /**
   * Path to a PEM-encoded CA (Certificate Authority) certificate and key file,
   * created if it does not exist. If not provided, the certificate and key are
   * generated but only kept in memory. This certificate and key are used as needed
   * to sign certificates generated on the fly for any HTTPS connection intercepted
   * by kassette.
   *
   * @remarks
   *
   * You can optionally import in the browser the TLS certificate from this
   * file in order to remove the warning when connecting to HTTPS websites
   * through kassette.
   */
  readonly tlsCAKeyPath?: string | null;

  /**
   * Size in bits of generated RSA keys.
   */
  readonly tlsKeySize?: number;
}

/**
 * Augments the CLI spec to add all pure runtime properties,
 * that can be defined through the configuration file only
 *
 * @public
 */
export interface ConfigurationSpec extends CLIConfigurationSpec {
  /**
   * Callback called for every HTTP request that kassette receives (with the exception of `CONNECT` requests,
   * which trigger the call of {@link ConfigurationSpec.onProxyConnect|onProxyConnect} instead).
   * @param parameters - exposes the API to control how to process the request
   */
  hook?(parameters: HookAPI): void | Promise<void>;

  /**
   * Callback called when kassette receives a request with the
   * {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/CONNECT|HTTP CONNECT method},
   * which usually happens when kassette is used as a browser proxy and the browser is trying to
   * connect to a secure web site with the https protocol.
   * @param parameters - exposes the API to control how to process the request
   */
  onProxyConnect?(parameters: IProxyConnectAPI): void | Promise<void>;

  /**
   * Callback called when the proxy is started and listening.
   *
   * @param parameters - the port property contains the port on which the
   * proxy is listening.
   */
  onListen?(parameters: { port: number }): void;

  /**
   * Callback called when the proxy is programmatically closed (which can
   * be done by using the callback returned from {@link runFromAPI})
   */
  onExit?(): void;

  /**
   * Custom implementation of the {@link ConsoleSpec} interface, with methods
   * {@link ConsoleSpec.log|log} and {@link ConsoleSpec.error|error},
   * each receiving one single argument of any type.
   * Useful to capture the logs of the application.
   */
  readonly console?: ConsoleSpec;
}

////////////////////////////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////////////////////////////

/**
 * The id of the source of the resolved value.
 *
 * @public
 */
export type ConfigurationPropertySource = 'cli' | 'file' | 'api' | 'default';

/**
 * Contains the value and origin of a configuration property.
 * @public
 */
export interface IConfigurationProperty<PropertyType> {
  /** The resolved value of the property */
  readonly value: PropertyType;
  /** The id of the source of the resolved value of the property */
  readonly origin: ConfigurationPropertySource;
}

export interface ConfigurationPropertySpec<PropertyType> {
  /** The value of the property as defined from the API */
  readonly apiValue: PropertyType | null | undefined;
  /** The value of the property as defined from the CLI */
  readonly cliValue: PropertyType | null | undefined;
  /** The value of the property as defined from the file configuration CLI */
  readonly fileValue: PropertyType | null | undefined;
  /** The default value this property should have */
  readonly defaultValue: PropertyType;
}

/**
 * The resulting configuration that was merged from its different {@link ConfigurationPropertySource|sources}.
 *
 * @remarks
 *
 * It contains the path to the configuration file in `filePath`, and also for each property defined in {@link ConfigurationSpec},
 * there is an {@link IConfigurationProperty} object describing the {@link IConfigurationProperty.origin|origin} of the property
 * and its {@link IConfigurationProperty.value|value}.
 *
 * @public
 */
export type IMergedConfiguration = {
  /**
   * The path of the configuration file
   */
  readonly filePath: string | null;
} & {
  readonly [k in keyof ConfigurationSpec]-?: IConfigurationProperty<Required<ConfigurationSpec>[k]>;
};

////////////////////////////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////////////////////////////

/**
 * Parameter of the {@link IConfigurationFile.getConfiguration|getConfiguration} function
 * (which a kassette configuration file is supposed to export).
 *
 * @public
 */
export interface GetConfigurationProps {
  /**
   * If run from the CLI, this is the configuration coming from the CLI.
   * Otherwise it is an empty object.
   */
  cliConfiguration: CLIConfigurationSpec;

  /**
   * If run from the API, this is the configuration coming from the {@link runFromAPI} call.
   * Otherwise it is an empty object.
   */
  apiConfiguration: ConfigurationSpec;

  /**
   * If run from the API, this is the context value provided (if any) through {@link runFromAPI}.
   * Otherwise it is undefined.
   */
  context: any;
}

/**
 * Interface that a kassette configuration file should export.
 *
 * @public
 */
export interface IConfigurationFile {
  /**
   * Function returning the configuration to be used by kassette.
   * @param arg - contains information that can be used to build
   * the configuration.
   */
  getConfiguration(arg: GetConfigurationProps): ConfigurationSpec | Promise<ConfigurationSpec>;
}
