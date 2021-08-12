/**
 * kassette is a development server, used mainly for testing, which proxies requests and is able to easily manage local mocks.
 *
 * @packageDocumentation
 */

export {
  APIOptions,
  Body,
  ChecksumArgs,
  CLIConfigurationSpec,
  CLIOptions, // internal
  ConfigurationPropertySource,
  ConfigurationSpec,
  Connection,
  ConsoleSpec,
  Delay,
  FilterableSpec,
  Headers,
  HookAPI,
  HookFunction,
  IBaseRequest,
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
  OnExitFunction,
  OnListenFunction,
  OnListenProps,
  OnProxyConnectFunction,
  Payload,
  PayloadOrigin,
  PayloadWithOrigin,
  ProxyConnectMode,
  RawBody,
  RemotePayload,
  RequestPayload,
  ResponseStatus,
  runFromAPI,
  runFromCLI, // internal
  RunResult,
  Status,
} from './app';
export { JSONData } from './lib/json';
export { NonSanitizedArray, RecursiveArray } from './lib/array';
