// ---------------------------------------------------------------------- common

import { RecursiveArray } from '../../lib/array';

// ------------------------------------------------------------------------- app

import { IMergedConfiguration, Mode, Delay } from '../configuration';

import { Headers, Status, IFetchedRequest, IResponse, RequestPayload } from '../server/model';

import { ConsoleSpec } from '../logger/model';
import { ChecksumArgs } from './checksum/model';

////////////////////////////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////////////////////////////

/**
 * Parameter of the {@link ConfigurationSpec.hook|hook} callback, that is called for every
 * HTTP request that kassette receives.
 * @public
 */
export interface HookAPI {
  /**
   * Provides the API to specify how to handle the HTTP request.
   */
  mock: IMock;

  /**
   * The console object as specified in the {@link ConfigurationSpec.console|configuration},
   * otherwise it is the global console object (usually the one of the platform).
   */
  console: ConsoleSpec;
}

/**
 * The public interface exposed to the end user to handle a given request and the associated mock and response.
 *
 * An object implementing this interface is passed to the {@link ConfigurationSpec.hook|hook} function, under property `mock` of the single argument object.
 *
 * @public
 */
export interface IMock {
  /**
   * The wrapper around the input request
   */
  readonly request: IFetchedRequest;

  /**
   * The wrapper around the output response
   */
  readonly response: IResponse;

  /**
   * Link to global configuration options
   */
  readonly options: MockingOptions;

  /**
   * The current mode, configured either by a call to {@link IMock.setMode|setMode},
   * or by {@link CLIConfigurationSpec.mode|the global setting}.
   */
  readonly mode: Mode;

  /**
   * Sets the {@link IMock.mode|mode} for the current request.
   * @param mode - mode to set, or null to use the default value from {@link CLIConfigurationSpec.mode|the global setting}
   */
  setMode(mode: Mode | null): void;

  /**
   * The current remote URL, configured either by a call to {@link IMock.setRemoteURL|setRemoteURL},
   * or by {@link CLIConfigurationSpec.remoteURL|the global setting}.
   */
  readonly remoteURL: string | null;

  /**
   * Sets the {@link IMock.remoteURL|remote URL} for the current request.
   * @param url - the URL to set, or null to use the default value from {@link CLIConfigurationSpec.remoteURL|the global setting}
   */
  setRemoteURL(url: string | null): void;

  /**
   * The currently computed delay that will be applied, configured either by a call to {@link IMock.setDelay|setDelay},
   * or by {@link CLIConfigurationSpec.delay|the global setting}. Note that if the delay is set to `recorded` and the local mock
   * to use is not yet loaded, the value returned by this getter will be the default delay and not the recorded delay.
   */
  readonly delay: number;

  /**
   * Sets the {@link IMock.delay|delay} that will be used to send the response to the client
   * when the data is taken from the local mock.
   * @param delay - can be either a number (to directly specify the delay in milliseconds),
   * `'recorded'` (to read the delay from the {@link MockData.time|time} property of an already recorded mock if any)
   * or `null` (to remove the effect of any previous call of `setDelay` and use the default value from {@link CLIConfigurationSpec.delay|the global setting} instead).
   */
  setDelay(delay: Delay | null): void;

  /**
   * The root folder of all mocks, from which specific mocks paths will be resolved (resolved against {@link MockingOptions.root|options.root})
   */
  readonly mocksFolder: string;

  /**
   * Sets the {@link IMock.mocksFolder|mocksFolder} value.
   *
   * @param value - any combination of arrays of path parts,
   * (as it is also possible for {@link IMock.setLocalPath|setLocalPath}).
   * You can pass an absolute path, or a relative one which will be resolved against {@link MockingOptions.root|options.root}.
   * Passing null resets the value to the default coming from {@link CLIConfigurationSpec.mocksFolder|the global setting}.
   */
  setMocksFolder(value: RecursiveArray<string | null | undefined> | null): void;

  /**
   * The local path of the mock, relative to {@link IMock.mocksFolder|mocksFolder}.
   * It is either the one set by the user through {@link IMock.setLocalPath|setLocalPath} or {@link IMock.defaultLocalPath|defaultLocalPath}.
   */
  readonly localPath: string;

  /**
   * The default local path of the mock, relative to {@link IMock.mocksFolder|mocksFolder}.
   * It uses the URL pathname to build an equivalent folders hierarchy,
   * and appends the HTTP method as a leaf folder.
   */
  readonly defaultLocalPath: string;

  /**
   * The full, absolute path of the mock, built from {@link IMock.localPath|localPath}/{@link IMock.defaultLocalPath|defaultLocalPath}, {@link IMock.mocksFolder|mocksFolder}
   * and possibly {@link MockingOptions.root|options.root} if {@link IMock.mocksFolder|mocksFolder} is not absolute.
   */
  readonly mockFolderFullPath: string;

  /**
   * Content produced by the last call to the {@link IMock.checksum|checksum} method,
   * as it was passed to the hash algorithm.
   */
  readonly checksumContent: string | null;

  /**
   * Compute a checksum using content from the request.
   *
   * @remarks
   * The computed checksum is intended to be added to the path of the mock
   * so that semantically different requests use different mocks.
   *
   * It is difficult to predict what will actually be relevant to include in
   * the checksum or not for your use case, and that's why we provide many options
   * to include/exclude/transform data (cf {@link ChecksumArgs}).
   *
   * Note that we designed the API so that it is usually not needed to
   * call the checksum method more than once for a given request/mock.
   *
   * The method stores the computed content (which is passed to the hash
   * algorithm) in property {@link IMock.checksumContent|checksumContent}
   * (in the `mock` object), as a string. It is built according to your options
   * and the request's data. It is also persisted, so that you can debug more easily,
   * especially by committing it into your SCM to analyze changes across versions of
   * your code. File is along with the other files of the mock under file name `checksum`.
   *
   * @param spec - specifies which data from the request to include in the checksum
   * @returns The actual checksum value, that you can then
   * use for instance to add to the mock's path.
   */
  checksum(spec: ChecksumArgs): Promise<string>;

  /**
   * Sets the {@link IMock.localPath|localPath} value.
   *
   * @param pathParts - Any combination of values and array of values,
   * which will eventually all be flattened, converted to strings and
   * joined to build a path.
   *
   * @example
   * The following example will use the HTTP method followed by the URL pathname:
   * ```
   * mock.setLocalPath([mock.request.method, mock.request.pathname])
   * ```
   * @example
   * The following example will concatenate `prefix`, all portions of the
   * URL pathname except the first one (also excluding the very first one which is empty since {@link IFetchedRequest.pathname} has a leading slash)
   * and optionally a suffix sequence depending on a boolean.
   *
   * ```
   * mock.setLocalPath([prefix, mock.request.pathname.split('/').slice(2), addSuffix ? [suffix, '-static-suffix'] : null])
   * ```
   */
  setLocalPath(pathParts: RecursiveArray<string | null | undefined>): void;

  /**
   * Returns true if the mock exists locally.
   *
   * @remarks
   *
   * {@link IMock.hasNoLocalFiles|hasNoLocalFiles} returns the opposite boolean value.
   */
  hasLocalFiles(): Promise<boolean>;

  /**
   * Returns true if the mock does not exist locally.
   *
   * @remarks
   *
   * {@link IMock.hasLocalFiles|hasLocalFiles} returns the opposite boolean value.
   */
  hasNoLocalFiles(): Promise<boolean>;

  /**
   * Returns a wrapped payload built from data persisted in local files.
   * If no local file is present, returns `undefined`.
   */
  readLocalPayload(): Promise<PayloadWithOrigin<'local' | 'user'> | undefined>;

  /**
   * Take the given wrapped payload and persist it in local files.
   * @param payload - payload to persist in local files
   */
  persistPayload(payload: PayloadWithOrigin): Promise<void>;

  /**
   * Forward the client request to the remote backend and get a wrapped payload from the response in output.
   */
  fetchPayload(): Promise<RemotePayload>;

  /**
   * Create a wrapped payload (with `user` origin) from the given payload data.
   * @param payload - payload data
   */
  createPayload(payload: Payload): PayloadWithOrigin<'user'>;

  /**
   * Sets the current local payload, with a custom one you would have created.
   * @param payload - payload to set
   */
  setPayload(payload: PayloadWithOrigin<'local' | 'user'>): void;

  /**
   * Combines {@link IMock.fetchPayload|fetchPayload} and {@link IMock.persistPayload|persistPayload}
   * and returns the wrapped payload.
   */
  downloadPayload(): Promise<RemotePayload>;

  /**
   * Returns the wrapped local payload using {@link IMock.readLocalPayload|readLocalPayload} if it exists,
   * otherwise use {@link IMock.downloadPayload|downloadPayload} and returns this wrapped payload.
   */
  readOrDownloadPayload(): Promise<PayloadWithOrigin<'local' | 'user'> | RemotePayload>;

  /**
   * Returns the wrapped local payload using {@link IMock.readLocalPayload|readLocalPayload} if it exists,
   * otherwise use {@link IMock.fetchPayload|fetchPayload} and returns this wrapped payload.
   */
  readOrFetchPayload(): Promise<PayloadWithOrigin<'local' | 'user'> | RemotePayload>;

  /**
   * As soon as response is filled with a payload, this property holds the reference to that
   * payload's wrapper. The wrapper is useful here to know where the payload comes from.
   * Before that, this property is `undefined`.
   */
  sourcePayload: PayloadWithOrigin | undefined;

  /**
   * Use data present in given wrapped payload to fill in the response.
   * @param payload - payload to use to fill the response.
   *
   * @remarks
   *
   * This method changes {@link IMock.sourcePayload|sourcePayload}.
   * It does nothing if {@link IMock.sourcePayload|sourcePayload} is already set.
   */
  fillResponseFromPayload(payload: PayloadWithOrigin): void;

  /**
   * Depending on the {@link IMock.mode|mode}, gets the payload (remote / local / default)
   * and uses {@link IMock.fillResponseFromPayload|fillResponseFromPayload} with that payload.
   * If {@link IMock.mode|mode} is `manual`, does nothing.
   */
  getPayloadAndFillResponse(): Promise<void>;

  /**
   * Combines {@link IMock.readLocalPayload|readLocalPayload} and {@link IMock.fillResponseFromPayload|fillResponseFromPayload} if there is a
   * local payload then returns `true`, otherwise does nothing and return `false`.
   */
  readLocalPayloadAndFillResponse(): Promise<boolean>;

  /**
   * Sends the response back to the client, with the previously specified delay
   * if the payload origin is not `remote`.
   */
  sendResponse(): Promise<void>;

  /**
   * Combines {@link IMock.getPayloadAndFillResponse|getPayloadAndFillResponse} and {@link IMock.sendResponse|sendResponse}.
   *
   * @remarks
   *
   * If {@link IMock.mode|mode} is `manual`, this method does nothing.
   * It also uses a private guard to make sure it is executed only once.
   * Therefore, if you call it from the {@link ConfigurationSpec.hook|hook} method, the automatic call made for you after the
   * hook execution will actually not do anything (and the same if you call it yourself multiple times).
   */
  process(): Promise<void>;
}

////////////////////////////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////////////////////////////

/**
 * Configuration options, including the root folder used to resolve
 * relative paths and the current global configuration.
 * @public
 */
export interface MockingOptions {
  /** The root folder from which to resolve given relative paths */
  readonly root: string;
  /** The current global user configuration */
  readonly userConfiguration: IMergedConfiguration;
}

export interface MockSpec {
  /** See `MockingOptions` */
  readonly options: MockingOptions;
  /** A wrapper around the input request (see `Request`) */
  readonly request: IFetchedRequest;
  /** A wrapper around the output response (see `Response`) */
  readonly response: IResponse;
}

////////////////////////////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////////////////////////////

/**
 * The data representing the mock, which is persisted and used for serving the mock
 *
 * @public
 */
export interface MockData {
  /**
   * Recorded headers to be served back, without the ignored ones.
   */
  readonly headers: Readonly<Headers>;

  /**
   * Ignored headers, which are recorded headers that should not be served back.
   * In practice, this is mainly the `content-length` header (because the `content-length` header that is
   * actually served back is computed based on the actual data to send).
   */
  readonly ignoredHeaders: Readonly<Headers>;

  /**
   * The name of the local file containing the body content (needed since the name is dynamic)
   */
  readonly bodyFileName: string;

  /**
   * HTTP status.
   */
  readonly status: Readonly<Status>;

  /**
   * Time used by the server to process the request.
   * It is used to simulate the real processing time when mocking the server if the {@link CLIConfigurationSpec.delay|delay} is set to `recorded`.
   */
  readonly time: number;

  /**
   * Timestamp when the payload was created.
   */
  readonly creationDateTime: Date;
}

/**
 * The payload represents the content of an HTTP response from the backend, no matter if it actually comes from it or if it was created manually.
 *
 * @remarks
 *
 * A payload is often wrapped in {@link PayloadWithOrigin}. To create the wrapped payload, you can use {@link IMock.createPayload|createPayload}.
 *
 * From the wrapped payload, response to the client can be filled with {@link IMock.fillResponseFromPayload|fillResponseFromPayload}.
 *
 * The payload can also be persisted and read, to avoid contacting the backend later on.
 *
 * @public
 */
export interface Payload {
  /**
   * Data such as http status and headers, response delay.
   */
  data: MockData;

  /**
   * Body of the HTTP response.
   */
  body: Buffer | string | null;
}

/**
 * Origin of the payload.
 *
 * @remarks
 *
 * Here are the possible values:
 *
 * - `local`: if the payload was read from local mock
 *
 * - `remote`: if the payload was fetched from the remote backend by forwarding the request
 *
 * - `user`: if the payload has been created from the user, manually using {@link IMock.createPayload|createPayload}
 *
 * - `proxy`: if the payload has been created from kassette itself, especially for `404 Not found` errors (in `local` mode)
 * and `502 Bad Gateway` errors (when kassette cannot reach the remote server)
 *
 * @public
 */
export type PayloadOrigin = 'local' | 'proxy' | 'remote' | 'user';

/**
 * Contains the payload along with its origin.
 * @public
 */
export interface PayloadWithOrigin<Origin extends PayloadOrigin = PayloadOrigin> {
  /**
   * Origin of the payload.
   */
  origin: Origin;

  /**
   * Content of the payload.
   */
  payload: Payload;
}

/**
 * Remote payload and the request that was made to get it.
 * @public
 */
export interface RemotePayload extends PayloadWithOrigin<'remote'> {
  /**
   * Request used to get this remote payload.
   */
  requestOptions: RequestPayload;
}

export type MockDataPatch = {
  -readonly [key in keyof MockData]+?: MockData[key];
};

export interface PayloadPatch {
  body?: Buffer | string | null;
  data?: MockDataPatch;
}
