import { Request } from './impl';

////////////////////////////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////////////////////////////

describe('Request', () => {
  const socket = {
    localAddress: '127.0.0.1',
    localPort: 8080,
  };

  it('should provide method, lower cased', () => {
    const request = new Request(
      {
        socket,
        method: 'GET',
        rawHeaders: [],
        url: 'http://localhost:8080/my/api',
      } as any,
      Buffer.from(''),
    );
    expect(request.method).toBe('get');
  });

  it('should provide the given body', () => {
    const body = 'Hello';
    const request = new Request(
      {
        socket,
        method: 'GET',
        rawHeaders: [],
        url: 'http://localhost:8080/my/api',
      } as any,
      Buffer.from(body),
    );
    expect(request.body.toString()).toBe(body);
  });

  it('should provide the headers', () => {
    const rawHeaders = ['Accepts', 'application/json', 'x-header', 'custom value'];
    const headers = {
      Accepts: 'application/json',
      'x-header': 'custom value',
    };
    const request = new Request(
      {
        socket,
        method: 'GET',
        rawHeaders,
        url: 'http://localhost:8080/my/api',
      } as any,
      Buffer.from(''),
    );
    expect(request.headers).toEqual(headers);
  });

  it('should provide a built URL', () => {
    const protocol = 'http:';
    const hostname = 'localhost';
    const port = '8080';
    const host = `${hostname}:${port}`;
    const pathname = '/my/api';
    const search = '?query=parameter&additional=argument';
    const url = `${protocol}//${host}${pathname}${search}`;

    const request = new Request(
      {
        socket,
        method: 'GET',
        rawHeaders: [],
        url,
      } as any,
      Buffer.from(''),
    );

    expect(request.url.href).toBe(url);
    expect(request.url.protocol).toBe(protocol);
    expect(request.url.hostname).toBe(hostname);
    expect(request.url.port).toBe(port);
    expect(request.url.host).toBe(host);
    expect(request.url.pathname).toBe(pathname);
    expect(request.url.search).toBe(search);
    expect(request.url.searchParams.get('query')).toBe('parameter');
    expect(request.url.searchParams.get('additional')).toBe('argument');
  });

  it('should provide pathname', () => {
    const protocol = 'http:';
    const hostname = 'localhost';
    const port = '8080';
    const host = `${hostname}:${port}`;
    const pathname = '/my/api';
    const search = '?query=parameter&additional=argument';
    const url = `${protocol}//${host}${pathname}${search}`;

    const request = new Request(
      {
        socket,
        method: 'GET',
        rawHeaders: [],
        url,
      } as any,
      Buffer.from(''),
    );

    expect(request.pathname).toBe(pathname);
  });

  it('should provide query parameters', () => {
    const protocol = 'http:';
    const hostname = 'localhost';
    const port = '8080';
    const host = `${hostname}:${port}`;
    const pathname = '/my/api';
    const search = '?query=parameter&additional=argument';
    const url = `${protocol}//${host}${pathname}${search}`;

    const request = new Request(
      {
        socket,
        method: 'GET',
        rawHeaders: [],
        url,
      } as any,
      Buffer.from(''),
    );

    expect(request.queryParameters).toEqual({
      query: 'parameter',
      additional: 'argument',
    });
  });
});
