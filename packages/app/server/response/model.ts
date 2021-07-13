// ------------------------------------------------------------------------- std

import { ServerResponse } from 'http';

// ---------------------------------------------------------------------- common

import { JSONData } from '../../../lib/json';

// -------------------------------------------------------------------- internal

import { Status, ReadOnlyHeaders } from '../model';

////////////////////////////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////////////////////////////

/**
 * @public
 */
export type RawBody = string | Buffer;
/**
 * @public
 */
export type Body = RawBody | JSONData;
/**
 * @public
 */
export type ResponseStatus = Partial<Readonly<Status>> | null;

/**
 * A handier wrapper around a server response
 *
 * @public
 */
export interface IResponse {
  /** The original Node.js object representing the response */
  readonly original: ServerResponse;

  status: ResponseStatus;

  json: boolean;
  body: Body | null;
  setData: (data: JSONData) => void;

  readonly headers: ReadOnlyHeaders;
  setHeaders: (headers: ReadOnlyHeaders) => ReadOnlyHeaders;

  /** Sends the response, applying some data previously specified but not set yet */
  send: () => Promise<void>;
}
