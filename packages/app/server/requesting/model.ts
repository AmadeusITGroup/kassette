// ------------------------------------------------------------------------- std

import { IncomingHttpHeaders } from 'http';

// -------------------------------------------------------------------- internal

import { IFetchedServerResponse } from '../server-response/model';
import { IFetchedRequest } from '../request/model';

////////////////////////////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////////////////////////////

export interface RequestPayload {
  url: string;
  method: string;
  headers: IncomingHttpHeaders;
  body: string | Buffer;
}

export interface SendRequestSpec {
  baseUrl: string;
  original: IFetchedRequest;
  skipLog?: boolean;
}

export interface SendRequestOutput {
  response: IFetchedServerResponse;
  time: number;
  requestOptions: RequestPayload;
}
