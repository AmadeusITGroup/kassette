// ------------------------------------------------------------------------- std

import { IncomingMessage, IncomingHttpHeaders } from 'http';

import { URL } from 'url';

// ---------------------------------------------------------------------- common

import { CachedProperty } from '../../../lib/oop';
import { fromPairs } from '../../../lib/object';
import { processRawHeaders } from '../../../lib/headers';

// -------------------------------------------------------------------- internal

import { IFetchedRequest } from './model';
import { connectionToURL, getSocketConnections } from '../connection';

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
  constructor(public readonly original: IncomingMessage, public readonly body: Buffer) {}

  @CachedProperty()
  get connectionsStack() {
    return getSocketConnections(this.original.socket);
  }

  @CachedProperty()
  get connection() {
    const stack = this.connectionsStack;
    return stack[stack.length - 1];
  }

  @CachedProperty()
  get method(): string {
    return this.original.method!.toLowerCase();
  }

  @CachedProperty()
  get headers(): IncomingHttpHeaders {
    return processRawHeaders(this.original.rawHeaders);
  }

  @CachedProperty()
  get url(): URL {
    const baseURL = connectionToURL(this.connection);
    const host = this.headers.host;
    if (host) {
      baseURL.host = host;
    }
    return new URL(this.original.url!, baseURL);
  }

  @CachedProperty()
  get queryParameters(): Readonly<Record<string, string>> {
    return fromPairs(Array.from(this.url.searchParams.entries()));
  }

  @CachedProperty()
  get pathname(): string {
    return this.url.pathname;
  }

  @CachedProperty()
  get protocol(): string {
    return this.url.protocol.replace(/:$/, '');
  }

  @CachedProperty()
  get hostname(): string {
    return this.url.hostname;
  }

  @CachedProperty()
  get port(): string {
    return this.url.port;
  }
}
