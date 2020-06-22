// ------------------------------------------------------------------------- std

import {
  IncomingMessage,
  IncomingHttpHeaders,
} from 'http';

// ---------------------------------------------------------------------- common

import { CachedProperty } from '../../../lib/oop';

// -------------------------------------------------------------------- internal

import { IFetchedServerResponse, ServerResponseStatus } from './model';

////////////////////////////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////////////////////////////

/**
 * Implementation of the wrapper around a fetched response.
 *
 * @param original The original response object (that can be retrieved through `original`)
 * @param buffer The body of the response (that can be retrieved through `body`)
 */
export class ServerResponse implements IFetchedServerResponse {
  constructor(
    public readonly original: IncomingMessage,
    public readonly body: Buffer,
  ) {}

  @CachedProperty()
  get headers(): IncomingHttpHeaders { return this.original.headers; }

  @CachedProperty()
  get status(): ServerResponseStatus {
    return {
      code: this.original.statusCode!,
      message: this.original.statusMessage!,
    };
  }
}
