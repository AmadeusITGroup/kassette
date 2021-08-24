/**
 * kassette is a development server, used mainly for testing, which proxies requests and is able to easily manage local mocks.
 *
 * @packageDocumentation
 */

export {
  APIOptions,
  ChecksumArgs,
  CLIConfigurationSpec,
  CLIOptions, // internal
  ConfigurationPropertySource,
  ConfigurationSpec,
  Connection,
  ConsoleSpec,
  Delay,
  FilterableSpec,
  GetConfigurationProps,
  Headers,
  HookAPI,
  IConfigurationFile,
  IConfigurationProperty,
  IFetchedRequest,
  IMergedConfiguration,
  IMock,
  IncludableSpec,
  IProxyConnectAPI,
  IResponse,
  ListOrFilter,
  MockData,
  MockingOptions,
  Mode,
  Payload,
  PayloadOrigin,
  PayloadWithOrigin,
  ProxyConnectMode,
  RemotePayload,
  RequestPayload,
  runFromAPI,
  runFromCLI, // internal
  Status,
} from './app';
export { NonSanitizedArray, RecursiveArray } from './lib/array';
