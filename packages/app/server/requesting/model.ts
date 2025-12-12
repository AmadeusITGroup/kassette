// ------------------------------------------------------------------------- std

import type { IncomingHttpHeaders, Agent as HttpAgent } from 'http';
import type { Agent as HttpsAgent } from 'https';
import type { Agent as Http2Agent } from 'http2-wrapper';

// -------------------------------------------------------------------- internal

import { IFetchedServerResponse } from '../server-response/model';
import { IFetchedRequest } from '../request/model';
import { RequestTimings } from '../../../lib/har/harTypes';

////////////////////////////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////////////////////////////

/**
 * Content of an HTTP request.
 * @public
 */
export interface RequestPayload {
  /**
   * HTTP url
   */
  url: string;

  /**
   * HTTP method
   */
  method: string;

  /**
   * HTTP headers
   */
  headers: IncomingHttpHeaders;

  /**
   * HTTP request body
   */
  body?: string | Buffer;
}

export interface SendRequestSpec {
  baseUrl: string;
  original: IFetchedRequest;
  skipLog?: boolean;
  httpAgent: HttpAgent;
  httpsAgent: HttpsAgent;
  http2Agent: Http2Agent;
}

export interface SendRequestOutput {
  response: IFetchedServerResponse;
  timings: RequestTimings;
  time: number;
  requestOptions: RequestPayload;
}
