import { GetConfigurationProps } from '../model';

export async function getConfiguration({apiConfiguration, cliConfiguration, context}: GetConfigurationProps) {
  return {
    remoteURL: 'remoteURL',
    port: apiConfiguration.port,
    mode: cliConfiguration.mode,
    delay: context.delay,
  };
}
