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
  MocksFormat,
} from './model';
import { defaultHarKeyManager, HarKeyManager } from '../../lib/har/harFile';

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
    fileConfiguration = await getFileConfiguration(nodePath.resolve(configurationPath), {
      cliConfiguration,
      apiConfiguration,
      context: fileConfigurationContext,
    });
  }
  if (fileConfiguration == null) {
    fileConfiguration = {};
  }

  const mocksFolder = buildProperty({
    cliValue: cliConfiguration.mocksFolder,
    fileValue: fileConfiguration.mocksFolder,
    apiValue: apiConfiguration.mocksFolder,
    defaultValue: './mocks',
  });
  const mocksHarFile = buildProperty({
    cliValue: cliConfiguration.mocksHarFile,
    fileValue: fileConfiguration.mocksHarFile,
    apiValue: apiConfiguration.mocksHarFile,
    defaultValue: './mocks.har',
  });

  return {
    filePath: configurationPath == null ? null : configurationPath,
    skipLog: buildProperty({
      cliValue: cliConfiguration.skipLog,
      fileValue: fileConfiguration.skipLog,
      apiValue: apiConfiguration.skipLog,
      defaultValue: false,
    }),
    hostname: buildProperty({
      cliValue: cliConfiguration.hostname,
      fileValue: fileConfiguration.hostname,
      apiValue: apiConfiguration.hostname,
      defaultValue: '127.0.0.1',
    }),
    port: buildProperty({
      cliValue: cliConfiguration.port,
      fileValue: fileConfiguration.port,
      apiValue: apiConfiguration.port,
      defaultValue: 8080,
    }),
    mocksFolder,
    mocksHarFile,
    harFileCacheTime: buildProperty({
      cliValue: cliConfiguration.harFileCacheTime,
      fileValue: fileConfiguration.harFileCacheTime,
      apiValue: apiConfiguration.harFileCacheTime,
      defaultValue: 5 * 60 * 1000, // 5 min
    }),
    mocksHarKeyManager: buildProperty<HarKeyManager>({
      cliValue: null,
      fileValue: fileConfiguration.mocksHarKeyManager,
      apiValue: apiConfiguration.mocksHarKeyManager,
      defaultValue: defaultHarKeyManager,
    }),
    harMimeTypesParseJson: buildProperty<Array<string>>({
      cliValue: cliConfiguration.harMimeTypesParseJson,
      fileValue: fileConfiguration.harMimeTypesParseJson,
      apiValue: apiConfiguration.harMimeTypesParseJson,
      defaultValue: [],
    }),
    mode: buildProperty<Mode>({
      cliValue: cliConfiguration.mode,
      fileValue: fileConfiguration.mode,
      apiValue: apiConfiguration.mode,
      defaultValue: 'local_or_download',
    }),
    mocksFormat: buildProperty<MocksFormat>({
      cliValue: cliConfiguration.mocksFormat,
      fileValue: fileConfiguration.mocksFormat,
      apiValue: apiConfiguration.mocksFormat,
      // defaults to folder, unless mocksHarFile is specified and mocksFolder is unspecified
      defaultValue:
        mocksHarFile.origin !== 'default' && mocksFolder.origin === 'default' ? 'har' : 'folder',
    }),
    saveChecksumContent: buildProperty<boolean>({
      cliValue: cliConfiguration.saveChecksumContent,
      fileValue: fileConfiguration.saveChecksumContent,
      apiValue: apiConfiguration.saveChecksumContent,
      defaultValue: true,
    }),
    saveDetailedTimings: buildProperty<boolean>({
      cliValue: cliConfiguration.saveDetailedTimings,
      fileValue: fileConfiguration.saveDetailedTimings,
      apiValue: apiConfiguration.saveDetailedTimings,
      defaultValue: true,
    }),
    saveInputRequestData: buildProperty<boolean>({
      cliValue: cliConfiguration.saveInputRequestData,
      fileValue: fileConfiguration.saveInputRequestData,
      apiValue: apiConfiguration.saveInputRequestData,
      defaultValue: true,
    }),
    saveInputRequestBody: buildProperty<boolean>({
      cliValue: cliConfiguration.saveInputRequestBody,
      fileValue: fileConfiguration.saveInputRequestBody,
      apiValue: apiConfiguration.saveInputRequestBody,
      defaultValue: true,
    }),
    saveForwardedRequestData: buildProperty<boolean | null>({
      cliValue: cliConfiguration.saveForwardedRequestData,
      fileValue: fileConfiguration.saveForwardedRequestData,
      apiValue: apiConfiguration.saveForwardedRequestData,
      defaultValue: null,
    }),
    saveForwardedRequestBody: buildProperty<boolean | null>({
      cliValue: cliConfiguration.saveForwardedRequestBody,
      fileValue: fileConfiguration.saveForwardedRequestBody,
      apiValue: apiConfiguration.saveForwardedRequestBody,
      defaultValue: null,
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
    tlsKeySize: buildProperty({
      cliValue: cliConfiguration.tlsKeySize,
      fileValue: fileConfiguration.tlsKeySize,
      apiValue: apiConfiguration.tlsKeySize,
      defaultValue: 2048,
    }),
    http2: buildProperty({
      cliValue: cliConfiguration.http2,
      fileValue: fileConfiguration.http2,
      apiValue: apiConfiguration.http2,
      defaultValue: true,
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
      defaultValue: '*',
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
      apiValue: apiConfiguration.onProxyConnect,
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
export async function getFileConfiguration(
  path: string,
  arg: GetConfigurationProps,
): Promise<ConfigurationSpec> {
  try {
    const { loaded, module: configurationModule } = await load<IConfigurationFile>({ path });
    if (!loaded) {
      throw new Error('Missing loader, please see https://github.com/gulpjs/interpret');
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
    return { origin: 'cli', value: cliValue };
  }
  if (fileValue != null) {
    return { origin: 'file', value: fileValue };
  }
  if (apiValue != null) {
    return { origin: 'api', value: apiValue };
  }
  return { origin: 'default', value: defaultValue };
}
