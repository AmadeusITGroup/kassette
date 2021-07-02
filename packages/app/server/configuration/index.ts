// ---------------------------------------------------------------------- common

import { stringifyPretty } from '../../../lib/json';

// ------------------------------------------------------------------------- app

import { isAppError } from '../../error';

import {
  buildString,
  logInfo,
  logError,
} from '../../logger';

import {
  IMergedConfiguration,
  IConfigurationProperty,
  ConfigurationPropertySource,
  getConfiguration,
} from '../../configuration';

// -------------------------------------------------------------------- internal

import {
  RunOptions,
  ApplicationData,
} from '../model';



////////////////////////////////////////////////////////////////////////////////
// Logging
////////////////////////////////////////////////////////////////////////////////

/**
 * Logs a single configuration property by indicating the name, value and origin of the value
 *
 * @param name The name of the property
 * @param property The wrapper of the property
 * @param checkable Tells whether the property is considered as a boolean (checked or not)
 */
export function logProperty(
  name: string,
  property: IConfigurationProperty<any>,
  checkable = false,
) {
  const greenIfFrom = (origin: ConfigurationPropertySource) =>
    property.origin === origin ? 'green' : null;

  return logInfo({
    checked: !checkable ? undefined : property.origin !== 'default',
    data: checkable ? undefined : stringifyPretty(property.value),
    message: buildString([
      '- (', { text: 'cli', color: greenIfFrom('cli') },
      ' | ', { text: 'file', color: greenIfFrom('file') },
      ' | ', { text: 'api', color: greenIfFrom('api') },
      ' | ', { text: 'default', color: greenIfFrom('default') },
      ') ',
      name,
    ]),
  });
}

/** Logs the full use configuration object as other application data */
export function logApplicationData({configuration, root}: ApplicationData) {
  logInfo({ message: 'Running server with configuration: ', extraLine: true });
  logInfo({
    message: `- configuration file path: ${
      configuration.filePath != null
        ? buildString([{ text: configuration.filePath, color: 'green' }])
        : buildString([{ text: '<none>', color: 'red' }])
    }`,
  });
  logProperty('skip logs', configuration.skipLog, true);
  logProperty('hostname', configuration.hostname);
  logProperty('port', configuration.port);
  logProperty('URL', configuration.remoteURL);
  logProperty('proxy mode', configuration.mode);
  logProperty('proxy connect mode', configuration.proxyConnectMode);
  logProperty('CA key file path', configuration.tlsCAKeyPath);
  logProperty('mocks folder', configuration.mocksFolder);
  logProperty('delay', configuration.delay);
  logProperty('custom request handler', configuration.hook, true);
  logProperty('on proxy connect handler', configuration.onProxyConnect, true);
  logProperty('on listen handler', configuration.onListen, true);
  logProperty('on exit handler', configuration.onExit, true);
  logProperty('custom logger', configuration.console, true);

  logInfo({message: ''});

  logInfo({
    message: 'Root folder used for relative paths resolution',
    data: root,
    extraLine: true,
  });
}



////////////////////////////////////////////////////////////////////////////////
// Building
////////////////////////////////////////////////////////////////////////////////

/** Returns the final single full featured user configuration object */
export async function build({
  apiConfiguration,
  cliConfiguration,
  configurationPath,
  fileConfigurationContext,
}: Partial<RunOptions>): Promise<IMergedConfiguration | null> {
  try {
    // please keep "return await", it is semantically correct and needed here to
    // properly catch the exception from the underlying async function
    return await getConfiguration({
      apiConfiguration: apiConfiguration != null ? apiConfiguration : {},
      cliConfiguration: cliConfiguration != null ? cliConfiguration : {},
      configurationPath,
      fileConfigurationContext,
    });
  } catch (exception) {
    if (isAppError(exception) && exception.type === 'file_configuration') {
      logError({ message: exception.message, exception: exception.original! });
      return null;
    }
    throw exception;
  }
}
