// ---------------------------------------------------------------------- common

import { NonSanitizedArray } from '../../lib/array';

// ------------------------------------------------------------------------- app

import {
  IMergedConfiguration,
  Mode,
  Delay,
} from '../configuration';

import {
  ReadOnlyHeaders,
  Status,
  IFetchedRequest,
  IResponse,
  RequestPayload,
} from '../server/model';

import { Console } from '../logger/model';



////////////////////////////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////////////////////////////

export interface HookAPI {
  mock: IMock;
  console: Console;
}

export type HookFunction = (parameters: HookAPI) => void;



////////////////////////////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////////////////////////////

/** The public interface exposed to the end user to handle a given request and the associated mock and response */
export interface IMock {
  /** The wrapper around the input request (see `Request`) */
  readonly request: IFetchedRequest;
  /** The wrapper around the output response (see `Response`) */
  readonly response: IResponse;
  readonly options: MockingOptions;

  readonly mode: Mode;
  setMode: (mode: Mode | null) => void;
  readonly remoteURL: string | null;
  setRemoteURL: (url: string | null) => void;
  readonly delay: number;
  setDelay: (delay: Delay | null) => void;
  /** The root folder of all mocks, from which specific mocks paths will be resolved (resolved against `options.root`) */
  readonly mocksFolder: string;
  setMocksFolder: (value: NonSanitizedArray<string> | null) => void;

  /** The local path — relative to `mocksFolder` — of the mock, which is either the one set by the user through `setLocalPath` or the `defaultLocalPath` */
  readonly localPath: string;
  /** The default local path — relative to `mocksFolder` — of the mock computed from input request */
  readonly defaultLocalPath: string;
  /** The full path of the mock */
  readonly mockFolderFullPath: string;

  /** The hash of the mock (TBD) */
  readonly hash: string;

  /** Sets the local path of the mock */
  setLocalPath: (
    /** Any combination of values and array of values, which will eventually all be flattened, converted to strings and joined to build a path */
    pathParts: NonSanitizedArray<string>,
  ) => void;
  /** Tells if the mock exists locally or not */
  hasLocalFiles: () => Promise<boolean>;
  hasNoLocalFiles: () => Promise<boolean>;

  readLocalPayload: () => Promise<LocalPayload | UserPayload | undefined>;
  persistPayload: (payload: PayloadWithOrigin) => Promise<void>;
  fetchPayload: () => Promise<RemotePayload>;
  createPayload: (payload: Payload) => UserPayload;
  setPayload: (payload: LocalPayload | UserPayload) => void;

  downloadPayload: () => Promise<RemotePayload>;
  readOrDownloadPayload: () => Promise<LocalPayload | UserPayload | RemotePayload>;
  readOrFetchPayload: () => Promise<LocalPayload | UserPayload | RemotePayload>;

  sourcePayload: PayloadWithOrigin | undefined;
  fillResponseFromPayload: (payload: PayloadWithOrigin) => void;
  getPayloadAndFillResponse: () => Promise<void>;
  readLocalPayloadAndFillResponse: () => Promise<boolean>;

  sendResponse: () => Promise<void>;
  /** Processes the input request to manage the mock and fill in the response, using user configuration */
  process: () => Promise<void>;
}

////////////////////////////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////////////////////////////

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

export type PersistedStatus = Readonly<Status>;

/** The data representing the mock, which is persisted and used for serving the mock */
export interface MockData {
   /** Recorded headers to be served back, without the ignored ones */
  readonly headers: ReadOnlyHeaders;
   /** Ignored headers */
  readonly ignoredHeaders: ReadOnlyHeaders;
   /** The name of the local file containing the body content (needed since the name is dynamic) */
  readonly bodyFileName: string;
  readonly status: PersistedStatus;
  readonly time: number;
  readonly creationDateTime: Date;
}

/** The type representing the body content */
export type MockBody = Buffer | string | null;

export interface Payload {
  data: MockData;
  body: MockBody;
}

export type PayloadOrigin = 'local' | 'proxy' | 'remote' | 'user';

export interface PayloadWithOrigin<Origin = PayloadOrigin> {
  origin: Origin;
  payload: Payload;
}

export type LocalPayload = PayloadWithOrigin<'local'>;
export type NotFoundPayload = PayloadWithOrigin<'proxy'>;
export type DefaultPayload = PayloadWithOrigin<'default'>;
export interface RemotePayload extends PayloadWithOrigin<'remote'> {
  requestOptions: RequestPayload;
}
export type UserPayload = PayloadWithOrigin<'user'>;

export type MockDataPatch = {
  -readonly [key in keyof MockData]+?: MockData[key];
};

export interface PayloadPatch {
  body?: MockBody;
  data?: MockDataPatch;
}
