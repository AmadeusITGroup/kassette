// ------------------------------------------------------------------------- std

import { IncomingMessage, globalAgent as httpAgent } from 'http';
import { auto as httpRequest, globalAgent as http2Agent } from 'http2-wrapper';
import { globalAgent as httpsAgent } from 'https';

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
import { TLSSocket } from 'tls';
import { SecureClientSessionOptions } from 'http2';
import { RequestTimings } from '../../../lib/har/harTypes';

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

const computeDiffFactory = (curTime: number) => (nextTime: ReturnType<typeof timestamp>) => {
  if (nextTime.defined) {
    const diff = nextTime.value! - curTime;
    curTime = nextTime.value!;
    return diff;
  }
  return -1;
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
  return {
    start: timeStart.trigger,
    socket(socket: Socket) {
      if (timeInit.defined) {
        // note: with HTTP/2, this method is called twice:
        // once for the underlying socket (for which we need the timings)
        // and the second time for the http/2 stream (that we can ignore)
        return;
      }
      timeInit.trigger();
      if (socket.connecting) {
        socket.once('lookup', timeLookup.trigger);
        socket.once('connect', timeConnect.trigger);
        if (socket instanceof TLSSocket) {
          socket.once('secureConnect', timeTlsConnect.trigger);
        }
      }
    },
    finish: timeSendComplete.trigger,
    response: timeReceiveResponse.trigger,
    end: timeEnd.trigger,
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

const forceHttp1: Pick<Parameters<typeof httpRequest>[0], 'ALPNProtocols' | 'resolveProtocol'> = {
  ALPNProtocols: ['http/1.1'],
  resolveProtocol: async () => ({ alpnProtocol: 'http/1.1' }),
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

  const requestOptions: RequestPayload = {
    url,
    method: original.method,
    body: original.body,
    headers: Object.assign(headersContainer(), original.headers, {
      'Accept-Encoding': 'identity',
    }),
  };
  delete requestOptions.headers.host;

  // remove any http/2.0-only header:
  delete requestOptions.headers[':method'];
  delete requestOptions.headers[':scheme'];
  delete requestOptions.headers[':authority'];
  delete requestOptions.headers[':path'];

  const timings = timingCollector();
  timings.start();

  const request = await httpRequest(requestOptions.url, {
    // forces the use of http/1.x in case http/1.x is used in the original request:
    ...(original.original?.httpVersionMajor < 2 ? forceHttp1 : {}),
    rejectUnauthorized: false,
    method: requestOptions.method,
    headers: requestOptions.headers,
    agent: {
      http: httpAgent,
      https: httpsAgent,
      http2: Object.create(http2Agent, {
        createConnection: {
          async value(origin: URL, options: SecureClientSessionOptions): Promise<TLSSocket> {
            const res = await http2Agent.createConnection.call(this, origin, options);
            timings.socket(res);
            return res;
          },
        },
      }),
    },
  });

  const response = await new Promise<IncomingMessage>((resolve, reject) =>
    request
      .on('response', resolve)
      .on('error', reject)
      .on('finish', timings.finish)
      .on('socket', timings.socket)
      .end(requestOptions.body && requestOptions.body.length > 0 ? requestOptions.body : undefined),
  );

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
