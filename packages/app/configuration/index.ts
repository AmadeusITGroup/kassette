// ------------------------------------------------------------------------- std

import * as nodePath from 'path';

// ---------------------------------------------------------------------- common

import { load } from '../../lib/module';

// ------------------------------------------------------------------------- app

import { RunOptions } from '../server';
import { FileConfigurationError } from '../error';

// -------------------------------------------------------------------- internal

import {
  Mode,
  ProxyConnectMode,
  ConfigurationSpec,
  IConfigurationFile,
  GetConfigurationProps,

  IMergedConfiguration,

  ConfigurationPropertySpec,
  ConfigurationPropertySource,
} from './model';

export * from './model';

////////////////////////////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////////////////////////////

/**
 * Returns the configuration merged from the CLI input and the file input
 * (retrieved from the path).
 */
export async function getConfiguration({
  cliConfiguration,
  configurationPath,
  apiConfiguration,
  fileConfigurationContext,
}: RunOptions): Promise<IMergedConfiguration> {
  let fileConfiguration: ConfigurationSpec | null = null;
  if (configurationPath != null) {
    fileConfiguration = await getFileConfiguration(
      nodePath.resolve(configurationPath),
      {cliConfiguration, apiConfiguration, context: fileConfigurationContext},
    );
  }
  if (fileConfiguration == null) { fileConfiguration = {}; }

  return {
    filePath: configurationPath == null ? null : configurationPath,
    skipLog: buildProperty({
      cliValue: cliConfiguration.skipLog,
      fileValue: fileConfiguration.skipLog,
      apiValue: apiConfiguration.skipLog,
      defaultValue: false,
    }),
    port: buildProperty({
      cliValue: cliConfiguration.port,
      fileValue: fileConfiguration.port,
      apiValue: apiConfiguration.port,
      defaultValue: 8080,
    }),
    mocksFolder: buildProperty({
      cliValue: cliConfiguration.mocksFolder,
      fileValue: fileConfiguration.mocksFolder,
      apiValue: apiConfiguration.mocksFolder,
      defaultValue: './mocks',
    }),
    mode: buildProperty<Mode>({
      cliValue: cliConfiguration.mode,
      fileValue: fileConfiguration.mode,
      apiValue: apiConfiguration.mode,
      defaultValue: 'local_or_download',
    }),
    proxyConnectMode: buildProperty<ProxyConnectMode>({
      cliValue: cliConfiguration.proxyConnectMode,
      fileValue: fileConfiguration.proxyConnectMode,
      apiValue: apiConfiguration.proxyConnectMode,
      defaultValue: 'intercept',
    }),
    tlsCAKeyPath: buildProperty({
      cliValue: cliConfiguration.tlsCAKeyPath,
      fileValue: fileConfiguration.tlsCAKeyPath,
      apiValue: apiConfiguration.tlsCAKeyPath,
      defaultValue: null,
    }),
    delay: buildProperty({
      cliValue: cliConfiguration.delay,
      fileValue: fileConfiguration.delay,
      apiValue: apiConfiguration.delay,
      defaultValue: 'recorded',
    }),
    remoteURL: buildProperty({
      cliValue: cliConfiguration.remoteURL,
      fileValue: fileConfiguration.remoteURL,
      apiValue: apiConfiguration.remoteURL,
      defaultValue: null,
    }),
    onListen: buildProperty({
      cliValue: null,
      fileValue: fileConfiguration.onListen,
      apiValue: apiConfiguration.onListen,
      defaultValue: () => {},
    }),
    onExit: buildProperty({
      cliValue: null,
      fileValue: fileConfiguration.onExit,
      apiValue: apiConfiguration.onExit,
      defaultValue: () => {},
    }),
    hook: buildProperty({
      cliValue: null,
      fileValue: fileConfiguration.hook,
      apiValue: apiConfiguration.hook,
      defaultValue: () => {},
    }),
    onProxyConnect: buildProperty({
      cliValue: null,
      fileValue: fileConfiguration.onProxyConnect,
      apiValue: fileConfiguration.onProxyConnect,
      defaultValue: () => {},
    }),
    console: buildProperty({
      cliValue: null,
      fileValue: fileConfiguration.console,
      apiValue: apiConfiguration.console,
      defaultValue: console,
    }),
  };
}

/**
 * Retrieves the configuration input from the file pointed by the path given in constructor.
 * If no path was given, returns null.
 *
 * Throws an error if the path was specified but getting the configuration input failed.
 */
export async function getFileConfiguration(path: string, arg: GetConfigurationProps): Promise<ConfigurationSpec> {
  try {
    const {loaded, module: configurationModule} = await load<IConfigurationFile>({path});
    if (!loaded) {
      throw(new Error('Missing loader, please see https://github.com/gulpjs/interpret'));
    }
    return await configurationModule!.getConfiguration(arg);
  } catch (exception) {
    throw new FileConfigurationError(exception, path);
  }
}

export function buildProperty<PropertyType>({
  cliValue,
  fileValue,
  apiValue,
  defaultValue,
}: ConfigurationPropertySpec<PropertyType>): {
  origin: ConfigurationPropertySource;
  value: PropertyType;
} {
  if (cliValue != null) {
    return {origin: 'cli', value: cliValue};
  }
  if (fileValue != null) {
    return {origin: 'file', value: fileValue};
  }
  if (apiValue != null) {
    return {origin: 'api', value: apiValue};
  }
  return {origin: 'default', value: defaultValue};
}
