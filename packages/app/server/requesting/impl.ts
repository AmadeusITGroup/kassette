// ------------------------------------------------------------------------- std

import { IncomingMessage, request as httpRequest } from 'http';

import { request as httpsRequest } from 'https';

import { URL } from 'url';

import { performance } from 'perf_hooks';

// ---------------------------------------------------------------------- common

import { build as buildURL } from '../../../lib/url';
import { readAll } from '../../../lib/stream';
import { headersContainer } from '../../../lib/headers';

// ------------------------------------------------------------------------- app

import { logInfo } from '../../logger';

// -------------------------------------------------------------------- internal

import { SendRequestOutput, SendRequestSpec, RequestPayload } from './model';

import { ServerResponse } from '../server-response';

// ------------------------------------------------------------------------ conf

import CONF from '../conf';

////////////////////////////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////////////////////////////

export async function requestHTTP({
  url,
  method,
  headers,
  body,
}: RequestPayload): Promise<IncomingMessage> {
  return new Promise<IncomingMessage>((resolve, reject) =>
    httpRequest(url, { method, headers }, (message) => resolve(message))
      .on('error', reject)
      .end(body),
  );
}

export async function requestHTTPS({
  url,
  method,
  headers,
  body,
}: RequestPayload): Promise<IncomingMessage> {
  const { hostname, port, pathname, search, hash } = new URL(url);
  return new Promise<IncomingMessage>((resolve, reject) =>
    httpsRequest(
      // url,
      // {rejectUnauthorized: false, method, headers},

      // XXX 2018-12-17T11:57:56+01:00
      // This is to make it compatible with older versions of Node.js
      // as well as some 3rd-party dependencies used in e2e testing
      // see https://github.com/TooTallNate/node-agent-base/issues/24
      // agent-base is indirectly used by puppeteer
      // and patches this Node.js core API
      {
        rejectUnauthorized: false,
        method,
        headers,

        hostname,
        port,
        path: [pathname, search, hash].join(''),
      },
      (message) => resolve(message),
    )
      .on('error', reject)
      .end(body),
  );
}

////////////////////////////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////////////////////////////

export async function measure(callback: Function) {
  const { now } = performance;

  const start = now();
  const output = await callback();
  const end = now();

  return {
    start,
    end,
    duration: end - start,
    output,
  };
}

/** Returns a server response with a fetched body, as well as timing information */
export async function sendRequest({
  baseUrl,
  original,
  skipLog,
}: SendRequestSpec): Promise<SendRequestOutput> {
  const targetURL = new URL(baseUrl);

  const url = buildURL({
    protocol: targetURL.protocol,
    hostname: targetURL.hostname,
    port: targetURL.port === '' ? null : targetURL.port,
    // XXX 2018-12-12T11:55:24+01:00
    // could the base url provide a base path (to be prefixed or suffixed?)?
    // and a base set of query parameters to be merged (with which having precedence?)?
    pathname: original.url.pathname,
    search: original.url.search,
  });
  if (!skipLog) {
    logInfo({ timestamp: true, message: CONF.messages.sendingRequest, data: url });
  }

  const request =
    targetURL.protocol.slice(0, -1).toLowerCase() === 'http' ? requestHTTP : requestHTTPS;

  const requestOptions = {
    url,
    method: original.method,
    body: original.body,
    headers: Object.assign(headersContainer(), original.headers, {
      'Accept-Encoding': 'identity',
    }),
  };
  delete requestOptions.headers.host;

  const { duration: time, output: response } = await measure(() => request(requestOptions));

  if (!skipLog) {
    logInfo({ timestamp: true, message: CONF.messages.requestComplete });
  }

  return {
    response: new ServerResponse(response, await readAll(response)),
    time,
    requestOptions,
  };
}
