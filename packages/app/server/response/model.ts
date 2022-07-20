// ------------------------------------------------------------------------- std

import { ServerResponse, IncomingHttpHeaders } from 'http';
import { Http2ServerResponse } from 'http2';

// -------------------------------------------------------------------- internal

import { Status } from '../model';

////////////////////////////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////////////////////////////

/**
 * A handier wrapper around a server response
 *
 * @public
 */
export interface IResponse {
  /**
   * The original Node.js object representing the response
   */
  readonly original: ServerResponse | Http2ServerResponse;

  /**
   * An object `{code, message}`, where each property is optional.
   * If `code` is never given, a default value of `200` is applied.
   */
  status: Partial<Readonly<Status>> | null;

  /**
   * Whether the {@link IResponse.body|body} field should be serialized into JSON (and `content-type` header should be set to `application/json`).
   *
   * @remarks
   * When not explicitly set, the returned value will still be true
   * if the `body` value is not a string, not a `Buffer`, and not `null` either.
   */
  json: boolean;

  /**
   * The body of the response.
   *
   * @remarks
   * If `json` is explicitly set to `true`, it will be serialized into JSON (and `content-type` header will be set to `application/json`).
   * It will also be if `json` is not explicitly set but the `body` value is not a string, not a `Buffer`, and not `null` either.
   * After that, the result will eventually be converted to a `Buffer` to be sent.
   */
  body: any;

  /**
   * A convenient method to set the {@link IResponse.body|body} value and
   * set {@link IResponse.json|json} to `true`.
   * @param data - json object to use as the response body
   */
  setData(data: any): void;

  /**
   * The currently set headers.
   * Use {@link IResponse.setHeaders|setHeaders} to change them.
   */
  readonly headers: Readonly<IncomingHttpHeaders>;

  /**
   * Merge given `headers` map with the previously set headers (initial set is an empty map).
   * @param headers - Headers to set. Each header value can be a number, a string, or an array of strings. Put a `null` value to suppress a header
   */
  setHeaders(headers?: Readonly<IncomingHttpHeaders>): Readonly<IncomingHttpHeaders>;

  /**
   * Sends the response, applying some data previously specified but not set yet
   */
  send(): Promise<void>;
}
