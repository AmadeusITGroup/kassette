import * as nodepath from 'path';

import { buildProperty, getFileConfiguration, getConfiguration } from './index';
import { FileConfigurationError } from '../error';

describe('configuration', () => {
  describe('buildProperty', () => {
    it('should respect precedence', () => {
      const cliValue = 'cli-value';
      const fileValue = 'file-value';
      const apiValue = 'api-value';
      const defaultValue = 'default-value';
      let result;

      result = buildProperty({ cliValue: null, fileValue: null, apiValue: null, defaultValue });
      expect(result.value).toEqual(defaultValue);
      expect(result.origin).toEqual('default');

      result = buildProperty({ cliValue: null, fileValue: null, apiValue, defaultValue });
      expect(result.value).toEqual(apiValue);
      expect(result.origin).toEqual('api');

      result = buildProperty({ cliValue: null, fileValue, apiValue, defaultValue });
      expect(result.value).toEqual(fileValue);
      expect(result.origin).toEqual('file');

      result = buildProperty({ cliValue, fileValue, apiValue, defaultValue });
      expect(result.value).toEqual(cliValue);
      expect(result.origin).toEqual('cli');
    });
  });

  describe('getFileConfiguration', () => {
    it('should load and pass context and other configurations', async () => {
      const port = 8080;
      const mode = 'remote';
      const delay = 'recorded';
      const configuration = await getFileConfiguration(
        nodepath.join(__dirname, '__test__/dummy-config.ts'),
        {
          apiConfiguration: { port },
          cliConfiguration: { mode },
          context: { delay },
        },
      );

      expect(configuration.remoteURL).toEqual('remoteURL');
      expect(configuration.port).toEqual(port);
      expect(configuration.mode).toEqual(mode);
      expect(configuration.delay).toEqual(delay);
    });

    it('should throw if it cannot find the file', async () => {
      expect(
        getFileConfiguration(nodepath.join(__dirname, '__test__/nonexistent-config.ts'), {
          apiConfiguration: {},
          cliConfiguration: {},
          context: {},
        }),
      ).rejects.toBeInstanceOf(FileConfigurationError);
    });

    it('should throw if it cannot load the file', async () => {
      expect(
        getFileConfiguration(nodepath.join(__dirname, '__test__/non-loadable-config.xyz'), {
          apiConfiguration: {},
          cliConfiguration: {},
          context: {},
        }),
      ).rejects.toBeInstanceOf(FileConfigurationError);
    });
  });

  describe('getConfiguration', () => {
    it('should work as getFileConfiguration and build real properties with wrappers', async () => {
      const port = 8080;
      const mode = 'remote';
      const delay = 'recorded';
      const configuration = await getConfiguration({
        configurationPath: nodepath.join(__dirname, '__test__/dummy-config.ts'),
        apiConfiguration: { port },
        cliConfiguration: { mode },
        fileConfigurationContext: { delay },
      });

      expect(configuration.remoteURL.value).toEqual('remoteURL');
      expect(configuration.port.value).toEqual(port);
      expect(configuration.mode.value).toEqual(mode);
      expect(configuration.delay.value).toEqual(delay);
    });

    it('should work without a file configuration too', async () => {
      const port = 8080;
      const mode = 'remote';
      const configuration = await getConfiguration({
        apiConfiguration: { port },
        cliConfiguration: { mode },
      });

      expect(configuration.port.value).toEqual(port);
      expect(configuration.mode.value).toEqual(mode);
    });

    it('should apply proper default values', async () => {
      const configuration = await getConfiguration({
        configurationPath: nodepath.join(__dirname, '__test__/empty-config.ts'),
        apiConfiguration: {},
        cliConfiguration: {},
      });

      expect(configuration.port.value).toEqual(8080);
      expect(configuration.mocksFolder.value).toEqual('./mocks');
      expect(configuration.mode.value).toEqual('local_or_download');
      expect(configuration.delay.value).toEqual('recorded');
      expect(configuration.remoteURL.value).toEqual('*');
      expect(configuration.http2.value).toEqual(true);
      expect(configuration.onListen.value(undefined as any)).toBeUndefined();
      expect(configuration.onExit.value()).toBeUndefined();
      expect(configuration.hook.value(undefined as any)).toBeUndefined();
      expect(configuration.console.value).toBe(console);
      expect(configuration.harMimeTypesParseJson.value).toEqual([]);
    });
  });
});
