// ---------------------------------------------------------------------- common

import { ImmutableFullyOptional } from '../../lib/interfaces';

// ------------------------------------------------------------------------- app

import {
  HookFunction,
} from '../mocking';
import {
  OnListenFunction,
  OnExitFunction,
} from '../server';

import { Console } from '../logger';

////////////////////////////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////////////////////////////

/** The main working mode of the proxy */
export type Mode =
  'local' | 'remote' | 'download' |
  'local_or_remote' | 'local_or_download' |
  'manual';
export type Delay = 'recorded' | number;

/**
 * The set of possible properties defined through the CLI
 * (it is reduced since it can't contain runtime values)
 */
interface BaseCLIConfigurationSpec {
  skipLog: boolean;
  port: number;
  mode: Mode;
  delay: Delay;
  mocksFolder: string;
  remoteURL: string;
}

/**
 * Augments the CLI spec to add all pure runtime properties,
 * that can be defined through the configuration file only
 */
export interface BaseConfigurationSpec extends BaseCLIConfigurationSpec {
  readonly hook?: HookFunction | null | undefined;
  readonly onListen?: OnListenFunction | null | undefined;
  readonly onExit?: OnExitFunction | null | undefined;
  readonly console?: Console | null | undefined;
}

export type CLIConfigurationSpec = ImmutableFullyOptional<BaseCLIConfigurationSpec>;
export type ConfigurationSpec = ImmutableFullyOptional<BaseConfigurationSpec>;

////////////////////////////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////////////////////////////

/**
 * The id of the source of the resolved value, currently:
 *
 * - `cli`: the CLI input
 * - `file`: the file configuration input
 * - `default`: the default value
 */
export type ConfigurationPropertySource = 'cli' | 'file' | 'api' | 'default';

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
 */
export interface IMergedConfiguration {
  /**
   * The path of the configuration file
   */
  readonly filePath: string | null;

  readonly skipLog: IConfigurationProperty<boolean>;
  readonly port: IConfigurationProperty<number>;
  readonly mode: IConfigurationProperty<Mode>;
  readonly delay: IConfigurationProperty<Delay>;
  readonly mocksFolder: IConfigurationProperty<string>;
  readonly remoteURL: IConfigurationProperty<string | null>;
  readonly hook: IConfigurationProperty<HookFunction>;
  readonly onListen: IConfigurationProperty<OnListenFunction>;
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
