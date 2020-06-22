// ------------------------------------------------------------------------- std

import {
  IncomingMessage,
  IncomingHttpHeaders,
} from 'http';

// -------------------------------------------------------------------- internal

import { Status } from '../model';

////////////////////////////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////////////////////////////

export type ServerResponseStatus = Readonly<Status>;

export interface IBaseServerResponse {
  /** The original Node.js object representing the response from the server */
  readonly original: IncomingMessage;
  readonly headers: IncomingHttpHeaders;
  readonly status: ServerResponseStatus;
}

export interface IServerResponse extends IBaseServerResponse {
  /** Returns the body content */
  body: () => Promise<Buffer>;
}

export interface IFetchedServerResponse extends IBaseServerResponse {
  /** The body content */
  readonly body: Buffer;
}
