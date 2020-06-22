// ------------------------------------------------------------------------- std

import {
  IncomingMessage,
  IncomingHttpHeaders,
} from 'http';

import { URL } from 'url';

// ---------------------------------------------------------------------- common

import { ReadOnlyStringsMap } from '../../../lib/interfaces';
import { CachedProperty } from '../../../lib/oop';
import { fromPairs } from '../../../lib/object';

// -------------------------------------------------------------------- internal

import { IFetchedRequest } from './model';

////////////////////////////////////////////////////////////////////////////////
// Request
////////////////////////////////////////////////////////////////////////////////

/**
 * Implementation of the wrapper around a fetched request.
 *
 * @param original The original request object
 * @param body The body of the request
 */
export class Request implements IFetchedRequest {
  constructor(
    public readonly original: IncomingMessage,
    public readonly body: Buffer,
  ) {}

  @CachedProperty()
  get method(): string {
    return this.original.method!.toLowerCase();
  }

  @CachedProperty()
  get headers(): IncomingHttpHeaders {
    return this.original.headers;
  }

  @CachedProperty()
  get url(): URL {
    return new URL(this.original.url!, 'http://127.0.0.1'); // "new URL" requires a base URL if relative
    // using new URL is handier but we don't care about the base, so provide anything here
  }

  @CachedProperty()
  get queryParameters(): ReadOnlyStringsMap {
    return fromPairs(Array.from(this.url.searchParams.entries()));
  }

  @CachedProperty()
  get pathname(): string {
    return this.url.pathname;
  }
}
