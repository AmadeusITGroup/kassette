import { IncomingHttpHeaders } from 'http';

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

export const processRawHeaders = (rawHeaders: string[]) => {
  const headers = headersContainer();
  for (let i = 0, l = rawHeaders.length; i < l; i += 2) {
    const headerName = rawHeaders[i];
    let headerValue: string | string[] = rawHeaders[i + 1];
    const existingHeader = headers[headerName];
    if (Array.isArray(existingHeader)) {
      existingHeader.push(headerValue);
      headerValue = existingHeader;
    } else if (typeof existingHeader === 'string') {
      headerValue = [existingHeader, headerValue];
    }
    headers[headerName] = headerValue;
  }
  return headers;
};
