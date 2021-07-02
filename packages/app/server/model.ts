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

export type Headers = { [key in string]: string | string[] | number | null };
/** A map from strings to strings or array of strings */
export type ReadOnlyHeaders = Readonly<Headers>;

/** The response status */
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

export interface CLIOptions {
  /** The configuration input from the CLI */
  readonly cliConfiguration: CLIConfigurationSpec;
  /** The path of the configuration file */
  readonly configurationPath?: string;
}

export interface APIOptions {
  readonly apiConfiguration: ConfigurationSpec;
  readonly configurationPath?: string;
  readonly fileConfigurationContext?: any;
}

/** The main options used to power the application */
export interface RunOptions {
  readonly apiConfiguration: ConfigurationSpec;
  readonly cliConfiguration: CLIConfigurationSpec;
  readonly configurationPath?: string;
  readonly fileConfigurationContext?: any;
}

export type RunResult = () => void;

////////////////////////////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////////////////////////////

export interface OnListenProps {
  port: number;
}
export type OnListenFunction = (parameters: OnListenProps) => void;

export type OnExitFunction = () => void;
