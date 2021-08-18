// ---------------------------------------------------------------------- common

import { NonSanitizedArray } from '../../lib/array';

// ------------------------------------------------------------------------- app

import { IMergedConfiguration, Mode, Delay } from '../configuration';

import { Headers, Status, IFetchedRequest, IResponse, RequestPayload } from '../server/model';

import { ConsoleSpec } from '../logger/model';
import { ChecksumArgs } from './checksum/model';

////////////////////////////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////////////////////////////

/**
 * @public
 */
export interface HookAPI {
  mock: IMock;
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
  /** The wrapper around the input request (see `Request`) */
  readonly request: IFetchedRequest;
  /** The wrapper around the output response (see `Response`) */
  readonly response: IResponse;
  readonly options: MockingOptions;

  readonly mode: Mode;
  setMode(mode: Mode | null): void;
  readonly remoteURL: string | null;
  setRemoteURL(url: string | null): void;
  readonly delay: number;
  setDelay(delay: Delay | null): void;
  /** The root folder of all mocks, from which specific mocks paths will be resolved (resolved against `options.root`) */
  readonly mocksFolder: string;
  setMocksFolder(value: NonSanitizedArray<string> | null): void;

  /** The local path — relative to `mocksFolder` — of the mock, which is either the one set by the user through `setLocalPath` or the `defaultLocalPath` */
  readonly localPath: string;
  /** The default local path — relative to `mocksFolder` — of the mock computed from input request */
  readonly defaultLocalPath: string;
  /** The full path of the mock */
  readonly mockFolderFullPath: string;

  /** The hash of the mock (TBD) */
  readonly hash: string;

  readonly checksumContent: string | null;
  checksum(spec: ChecksumArgs): Promise<string>;

  /** Sets the local path of the mock */
  setLocalPath(
    /** Any combination of values and array of values, which will eventually all be flattened, converted to strings and joined to build a path */
    pathParts: NonSanitizedArray<string>,
  ): void;
  /** Tells if the mock exists locally or not */
  hasLocalFiles(): Promise<boolean>;
  hasNoLocalFiles(): Promise<boolean>;

  readLocalPayload(): Promise<PayloadWithOrigin<'local' | 'user'> | undefined>;
  persistPayload(payload: PayloadWithOrigin): Promise<void>;
  fetchPayload(): Promise<RemotePayload>;
  createPayload(payload: Payload): PayloadWithOrigin<'user'>;
  setPayload(payload: PayloadWithOrigin<'local' | 'user'>): void;

  downloadPayload(): Promise<RemotePayload>;
  readOrDownloadPayload(): Promise<PayloadWithOrigin<'local' | 'user'> | RemotePayload>;
  readOrFetchPayload(): Promise<PayloadWithOrigin<'local' | 'user'> | RemotePayload>;

  sourcePayload: PayloadWithOrigin | undefined;
  fillResponseFromPayload(payload: PayloadWithOrigin): void;
  getPayloadAndFillResponse(): Promise<void>;
  readLocalPayloadAndFillResponse(): Promise<boolean>;

  sendResponse(): Promise<void>;
  /** Processes the input request to manage the mock and fill in the response, using user configuration */
  process(): Promise<void>;
}

////////////////////////////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////////////////////////////

/**
 * @public
 */
export interface MockingOptions {
  /** The root folder from which to resolve given relative paths */
  readonly root: string;
  /** The user configuration */
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
  /** Recorded headers to be served back, without the ignored ones */
  readonly headers: Readonly<Headers>;
  /** Ignored headers */
  readonly ignoredHeaders: Readonly<Headers>;
  /** The name of the local file containing the body content (needed since the name is dynamic) */
  readonly bodyFileName: string;
  readonly status: Readonly<Status>;
  readonly time: number;
  readonly creationDateTime: Date;
}

/**
 * @public
 */
export interface Payload {
  data: MockData;
  body: Buffer | string | null;
}

/**
 * @public
 */
export type PayloadOrigin = 'local' | 'proxy' | 'remote' | 'user';

/**
 * @public
 */
export interface PayloadWithOrigin<Origin extends PayloadOrigin = PayloadOrigin> {
  origin: Origin;
  payload: Payload;
}

/**
 * @public
 */
export interface RemotePayload extends PayloadWithOrigin<'remote'> {
  requestOptions: RequestPayload;
}

export type MockDataPatch = {
  -readonly [key in keyof MockData]+?: MockData[key];
};

export interface PayloadPatch {
  body?: Buffer | string | null;
  data?: MockDataPatch;
}
