// ------------------------------------------------------------------------- app

import { HookAPI } from '../mocking';
import { IProxyConnectAPI } from '../server/proxy';

import { ConsoleSpec } from '../logger';

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
  readonly skipLog?: boolean;
  readonly port?: number;
  readonly hostname?: string;
  readonly mode?: Mode;
  readonly delay?: Delay;
  readonly mocksFolder?: string;
  readonly remoteURL?: string | null;
  readonly proxyConnectMode?: ProxyConnectMode;
  readonly tlsCAKeyPath?: string | null;
}

/**
 * Augments the CLI spec to add all pure runtime properties,
 * that can be defined through the configuration file only
 *
 * @public
 */
export interface ConfigurationSpec extends CLIConfigurationSpec {
  hook?(parameters: HookAPI): void | Promise<void>;
  onProxyConnect?(parameters: IProxyConnectAPI): void | Promise<void>;
  onListen?(parameters: { port: number }): void;
  onExit?(): void;
  readonly console?: ConsoleSpec;
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

export interface GetConfigurationProps {
  cliConfiguration: CLIConfigurationSpec;
  apiConfiguration: ConfigurationSpec;
  context: any;
}

export interface IConfigurationFile {
  getConfiguration(arg: GetConfigurationProps): Promise<ConfigurationSpec>;
}
