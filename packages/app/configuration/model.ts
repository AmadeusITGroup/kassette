// ------------------------------------------------------------------------- app

import { HookFunction } from '../mocking';
import { OnProxyConnectFunction } from '../server/proxy';
import { OnListenFunction, OnExitFunction } from '../server';

import { Console } from '../logger';

////////////////////////////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////////////////////////////

/**
 * The main working mode of the proxy
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
 * @public
 */
export type Delay = 'recorded' | number;
/**
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
  readonly skipLog?: boolean | null;
  readonly port?: number | null;
  readonly hostname?: string | null;
  readonly mode?: Mode | null;
  readonly delay?: Delay | null;
  readonly mocksFolder?: string | null;
  readonly remoteURL?: string | null;
  readonly proxyConnectMode?: ProxyConnectMode | null;
  readonly tlsCAKeyPath?: string | null;
}

/**
 * Augments the CLI spec to add all pure runtime properties,
 * that can be defined through the configuration file only
 *
 * @public
 */
export interface ConfigurationSpec extends CLIConfigurationSpec {
  readonly hook?: HookFunction | null;
  readonly onProxyConnect?: OnProxyConnectFunction | null;
  readonly onListen?: OnListenFunction | null;
  readonly onExit?: OnExitFunction | null;
  readonly console?: Console | null;
}

////////////////////////////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////////////////////////////

/**
 * The id of the source of the resolved value, currently:
 *
 * - `cli`: the CLI input
 * - `file`: the file configuration input
 * - `default`: the default value
 *
 * @public
 */
export type ConfigurationPropertySource = 'cli' | 'file' | 'api' | 'default';

/**
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
 * The merged configuration, containing wrapped configuration properties
 *
 * @public
 */
export interface IMergedConfiguration {
  /**
   * The path of the configuration file
   */
  readonly filePath: string | null;

  readonly skipLog: IConfigurationProperty<boolean>;
  readonly hostname: IConfigurationProperty<string>;
  readonly port: IConfigurationProperty<number>;
  readonly mode: IConfigurationProperty<Mode>;
  readonly proxyConnectMode: IConfigurationProperty<ProxyConnectMode>;
  readonly delay: IConfigurationProperty<Delay>;
  readonly mocksFolder: IConfigurationProperty<string>;
  readonly remoteURL: IConfigurationProperty<string | null>;
  readonly tlsCAKeyPath: IConfigurationProperty<string | null>;
  readonly hook: IConfigurationProperty<HookFunction>;
  readonly onListen: IConfigurationProperty<OnListenFunction>;
  readonly onProxyConnect: IConfigurationProperty<OnProxyConnectFunction>;
  readonly onExit: IConfigurationProperty<OnExitFunction>;
  readonly console: IConfigurationProperty<Console>;
}

////////////////////////////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////////////////////////////

export interface GetConfigurationProps {
  cliConfiguration: CLIConfigurationSpec;
  apiConfiguration: ConfigurationSpec;
  context: any;
}

export interface IConfigurationFile {
  getConfiguration(arg: GetConfigurationProps): Promise<ConfigurationSpec>;
}
