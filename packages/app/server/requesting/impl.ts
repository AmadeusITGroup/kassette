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
import { Socket } from 'net';
import { RequestTimings } from '../../../lib/har/harTypes';

////////////////////////////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////////////////////////////

const noop = () => {};

export interface RequestEvents {
  socket?: (socket: Socket) => void;
  finish?: () => void;
}

export async function requestHTTP(
  { url, method, headers, body }: RequestPayload,
  { socket = noop, finish = noop }: RequestEvents = {},
): Promise<IncomingMessage> {
  return new Promise<IncomingMessage>((resolve, reject) =>
    httpRequest(url, { method, headers }, (message) => resolve(message))
      .on('error', reject)
      .on('finish', finish)
      .on('socket', socket)
      .end(body),
  );
}

export async function requestHTTPS(
  { url, method, headers, body }: RequestPayload,
  { socket = noop, finish = noop }: RequestEvents = {},
): Promise<IncomingMessage> {
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
      .on('finish', finish)
      .on('socket', socket)
      .end(body),
  );
}

////////////////////////////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////////////////////////////

const timestamp = () => {
  let value: number | undefined;
  return {
    get value() {
      return value;
    },
    get defined() {
      return value != null;
    },
    trigger() {
      value = performance.now();
    },
  };
};

const computeDiffFactory = (curTime: number) => {
  return (nextTime: ReturnType<typeof timestamp>) => {
    if (nextTime.defined) {
      const diff = nextTime.value! - curTime;
      curTime = nextTime.value!;
      return diff;
    }
    return -1;
  };
};

const timingCollector = () => {
  const timeStart = timestamp();
  const timeInit = timestamp();
  const timeLookup = timestamp();
  const timeConnect = timestamp();
  const timeTlsConnect = timestamp();
  const timeSendComplete = timestamp();
  const timeReceiveResponse = timestamp();
  const timeEnd = timestamp();
  const requestEvents: RequestEvents = {
    socket(socket) {
      timeInit.trigger();
      socket.once('lookup', timeLookup.trigger);
      socket.once('connect', timeConnect.trigger);
      socket.once('secureConnect', timeTlsConnect.trigger);
    },
    finish: timeSendComplete.trigger,
  };
  return {
    start: timeStart.trigger,
    response: timeReceiveResponse.trigger,
    end: timeEnd.trigger,
    requestEvents,
    total() {
      return timeEnd.value! - timeStart.value!;
    },
    timings(): RequestTimings {
      const computeDiff = computeDiffFactory(timeStart.value!);
      return {
        blocked: computeDiff(timeInit),
        dns: computeDiff(timeLookup),
        connect: computeDiff(timeTlsConnect.defined ? timeTlsConnect : timeConnect),
        send: computeDiff(timeSendComplete),
        wait: computeDiff(timeReceiveResponse),
        receive: computeDiff(timeEnd),
        ssl:
          timeTlsConnect.defined && timeConnect.defined
            ? timeTlsConnect.value! - timeConnect.value!
            : -1,
      };
    },
  };
};

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

  const timings = timingCollector();
  timings.start();
  const response = await request(requestOptions, timings.requestEvents);
  timings.response();
  const body = await readAll(response);
  timings.end();

  if (!skipLog) {
    logInfo({ timestamp: true, message: CONF.messages.requestComplete });
  }

  return {
    response: new ServerResponse(response, body),
    time: timings.total(),
    timings: timings.timings(),
    requestOptions,
  };
}
