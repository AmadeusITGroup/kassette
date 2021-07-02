// ------------------------------------------------------------------------- std

import { IncomingMessage, IncomingHttpHeaders } from 'http';

import { URL } from 'url';

// ------------------------------------------------------------------------- app

import { ReadOnlyStringsMap } from '../../../lib/interfaces';

////////////////////////////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////////////////////////////

/** A handier wrapper around a request */
export interface IBaseRequest {
  /** The original Node.js object representing the request */
  readonly original: IncomingMessage;
  /** The connections stack */
  readonly connectionsStack: readonly Readonly<Connection>[];
  /** The last connection in connectionsStack */
  readonly connection: Readonly<Connection>;
  /** The URL */
  readonly url: URL;
  /** The headers */
  readonly headers: IncomingHttpHeaders;
  /** The query parameters taken from the URL, as a read-only map of strings */
  readonly queryParameters: ReadOnlyStringsMap;
  /** The protocol part of the URL, without the trailing `:` */
  readonly protocol: string;
  /** The hostname part of the URL */
  readonly hostname: string;
  /** The port part of the URL */
  readonly port: string;
  /** The HTTP method */
  readonly method: string;
  /** The path part of the URL */
  readonly pathname: string;
}

export interface IRequest extends IBaseRequest {
  /** Returns the body content */
  body(): Promise<Buffer>;
}

export interface IFetchedRequest extends IBaseRequest {
  /** The body content */
  readonly body: Buffer;
}

/** A connection intercepted by kassette */
export interface Connection {
  /** protocol such as `http` or `https`, without the trailing `:` */
  protocol: string;
  /** target hostname */
  hostname: string;
  /** target port */
  port: number;
}
