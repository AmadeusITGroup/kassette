import { IncomingHttpHeaders } from 'http';

// copied from https://github.com/nodejs/node/blob/db8ff56629e74e8c997947b8d3960db64c1ce4f9/lib/internal/http2/util.js#L113C1-L154
export const singleValueHeaders = new Set([
  ':status',
  ':method',
  ':authority',
  ':scheme',
  ':path',
  ':protocol',
  'access-control-allow-credentials',
  'access-control-max-age',
  'access-control-request-method',
  'age',
  'authorization',
  'content-encoding',
  'content-language',
  'content-length',
  'content-location',
  'content-md5',
  'content-range',
  'content-type',
  'date',
  'dnt',
  'etag',
  'expires',
  'from',
  'host',
  'if-match',
  'if-modified-since',
  'if-none-match',
  'if-range',
  'if-unmodified-since',
  'last-modified',
  'location',
  'max-forwards',
  'proxy-authorization',
  'range',
  'referer',
  'retry-after',
  'tk',
  'upgrade-insecure-requests',
  'user-agent',
  'x-content-type-options',
]);

/**
 * A map from strings to strings or array of strings
 *
 * @public
 */
export type Headers = IncomingHttpHeaders;

const caseMapCache = new WeakMap<IncomingHttpHeaders, Map<string, string>>();

const getCaseMap = (headers: IncomingHttpHeaders) => {
  let res = caseMapCache.get(headers);
  if (!res) {
    res = new Map<string, string>();
    caseMapCache.set(headers, res);
  }
  return res;
};

const proxyHandler: ProxyHandler<IncomingHttpHeaders> = {
  get(target, property, receiver) {
    if (typeof property === 'string') {
      property = getCaseMap(target).get(property.toLowerCase()) ?? property;
    }
    return Reflect.get(target, property, receiver);
  },
  set(target, property, value, receiver) {
    if (typeof property === 'string') {
      const caseMap = getCaseMap(target);
      const key = property.toLowerCase();
      const previousCase = caseMap.get(key);
      if (previousCase == null || previousCase !== property) {
        caseMap.set(key, property);
        if (previousCase != null) {
          delete target[previousCase];
        }
      }
    }
    return Reflect.set(target, property, value, receiver);
  },
  deleteProperty(target, property) {
    if (typeof property === 'string') {
      const caseMap = getCaseMap(target);
      const key = property.toLowerCase();
      const previousCase = caseMap.get(key);
      if (previousCase != null) {
        property = previousCase;
        caseMap.delete(key);
      }
    }
    return Reflect.deleteProperty(target, property);
  },
};

export const headersContainer = (): IncomingHttpHeaders =>
  new Proxy(Object.create(null), proxyHandler);

export const appendHeader = (
  headers: IncomingHttpHeaders,
  headerName: string,
  headerValue: string,
) => {
  let result: string | string[] = headerValue;
  const existingHeader = headers[headerName];
  if (Array.isArray(existingHeader)) {
    existingHeader.push(headerValue);
    result = existingHeader;
  } else if (typeof existingHeader === 'string') {
    result = [existingHeader, headerValue];
  }
  headers[headerName] = result;
};

export const processRawHeaders = (rawHeaders: string[]) => {
  const headers = headersContainer();
  for (let i = 0, l = rawHeaders.length; i < l; i += 2) {
    appendHeader(headers, rawHeaders[i], rawHeaders[i + 1]);
  }
  return headers;
};
