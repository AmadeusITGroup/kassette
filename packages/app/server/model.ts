// ------------------------------------------------------------------------- app

import { ConfigurationSpec, CLIConfigurationSpec, IMergedConfiguration } from '../configuration';

////////////////////////////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////////////////////////////

export * from './requesting/model';
export * from './request/model';
export * from './response/model';
export * from './server-response/model';
export * from './proxy/model';

////////////////////////////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////////////////////////////

/**
 * A map from strings to strings or array of strings
 *
 * @public
 */
export type Headers = Record<string, string | string[] | number | null>;

/**
 * The response status
 *
 * @public
 */
export interface Status {
  /** The status code */
  code: number;
  /** The status message */
  message: string;
}

////////////////////////////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////////////////////////////

export interface ApplicationData {
  /** The final single full featured user configuration object */
  readonly configuration: IMergedConfiguration;
  /** The root folder from which all relative paths are resolved */
  readonly root: string;
}

/**
 * @internal
 */
export interface CLIOptions {
  /** The configuration input from the CLI */
  readonly cliConfiguration: CLIConfigurationSpec;
  /** The path of the configuration file */
  readonly configurationPath?: string;
}

/**
 * Specifies the argument expected to start kassette programmatically with {@link runFromAPI}.
 *
 * @public
 */
export interface APIOptions {
  /**
   * kassette configuration passed through the API.
   *
   * @remarks
   *
   * If {@link APIOptions.configurationPath|configurationPath} is also specified, both configurations are merged,
   * but `apiConfiguration` has the least precedence.
   * However, this object is also forwarded to the configuration file's {@link IConfigurationFile.getConfiguration|getConfiguration}
   * method, as {@link GetConfigurationProps.apiConfiguration|apiConfiguration}, so you can apply your own logic to determine what configuration
   * to actually use.
   */
  readonly apiConfiguration?: ConfigurationSpec;

  /**
   * Path to a configuration file, if the configuration should be loaded from a configuration file.
   */
  readonly configurationPath?: string;

  /**
   * Specifies the context argument passed to the {@link IConfigurationFile.getConfiguration|getConfiguration} function defined in the
   * configuration file (only used if {@link APIOptions.configurationPath|configurationPath} is specified).
   */
  readonly fileConfigurationContext?: any;
}

/** The main options used to power the application */
export interface RunOptions {
  readonly apiConfiguration: ConfigurationSpec;
  readonly cliConfiguration: CLIConfigurationSpec;
  readonly configurationPath?: string;
  readonly fileConfigurationContext?: any;
}

////////////////////////////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////////////////////////////
