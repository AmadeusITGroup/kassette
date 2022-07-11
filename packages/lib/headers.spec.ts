import { headersContainer, processRawHeaders } from './headers';

describe('headers', () => {
  describe('headersContainer', () => {
    it('should allow access in a case-insensitive way', () => {
      const headers = headersContainer();
      headers['Content-Type'] = 'application/javascript';
      expect(headers['Content-Type']).toEqual('application/javascript');
      expect(headers['content-type']).toEqual('application/javascript');
      // keeps the upper case from last set:
      expect(headers).toEqual({ 'Content-Type': 'application/javascript' });
      headers['content-type'] = 'text/html';
      // keeps the lower case from last set:
      expect(headers).toEqual({ 'content-type': 'text/html' });
      expect(headers['Content-Type']).toEqual('text/html');
      expect(headers['content-type']).toEqual('text/html');
      delete headers['Content-Type'];
      expect(headers).toEqual({});
      expect(headers['Content-Type']).toEqual(undefined);
      expect(headers['content-type']).toEqual(undefined);
    });
  });

  describe('processRawHeaders', () => {
    it('should transform multiple occurrences of the same header into an array', () => {
      const rawHeaders = [
        'Content-Type',
        'text/html',
        'WWW-Authenticate',
        'Negotiate',
        'WWW-Authenticate',
        'Basic realm="my realm"',
      ];
      const expectedHeaders = {
        'Content-Type': 'text/html',
        'WWW-Authenticate': ['Negotiate', 'Basic realm="my realm"'],
      };
      expect(processRawHeaders(rawHeaders)).toEqual(expectedHeaders);
    });

    it('should keep the case of the last occurrence of the same header', () => {
      const rawHeaders = [
        'multi-case-header',
        'a',
        'Multi-Case-header',
        'b',
        'multi-Case-Header',
        'c',
        'Multi-Case-HEADER', // should keep the case of this one
        'd',
      ];
      const expectedHeaders = {
        'Multi-Case-HEADER': ['a', 'b', 'c', 'd'],
      };
      expect(processRawHeaders(rawHeaders)).toEqual(expectedHeaders);
    });
  });
});
