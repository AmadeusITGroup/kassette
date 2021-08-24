// ------------------------------------------------------------------------- std

import { ServerResponse } from 'http';

// -------------------------------------------------------------------- internal

import { Status, Headers } from '../model';

////////////////////////////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////////////////////////////

/**
 * A handier wrapper around a server response
 *
 * @public
 */
export interface IResponse {
  /** The original Node.js object representing the response */
  readonly original: ServerResponse;

  status: Partial<Readonly<Status>> | null;

  json: boolean;
  body: any;
  setData(data: any): void;

  readonly headers: Readonly<Headers>;
  setHeaders(headers: Readonly<Headers>): Readonly<Headers>;

  /** Sends the response, applying some data previously specified but not set yet */
  send(): Promise<void>;
}
