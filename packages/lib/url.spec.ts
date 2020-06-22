import { URL } from 'url';
import { splitPath, getPathParts, build } from './url';

describe('url', () => {
  describe('splitPath', () => {
    it('should handle edge cases', () => {
      expect(splitPath('')).toEqual(['']);
      expect(splitPath('/')).toEqual(['', '']);
    });

    it('should handle leading and trailing separators', () => {
      expect(splitPath('/a')).toEqual(['', 'a']);
      expect(splitPath('a/')).toEqual(['a', '']);
    });

    it('should handle the general case', () => {
      expect(splitPath('a/b')).toEqual(['a', 'b']);
    });
  });

  describe('getPathParts', () => {
    it('should handle the empty path edge case', () => {
      expect(getPathParts(new URL('http://www.dummy.com'))).toEqual([]);
      expect(getPathParts(new URL('http://www.dummy.com/'))).toEqual([]);
    });

    it('should handle leading and trailing separators', () => {
      expect(getPathParts(new URL('http://www.dummy.com/a'))).toEqual(['a']);
      expect(getPathParts(new URL('http://www.dummy.com/a/'))).toEqual(['a', '']);
    });

    it('should handle the general case', () => {
      expect(getPathParts(new URL('http://www.dummy.com/a/b'))).toEqual(['a', 'b']);
    });
  });

  describe('build', () => {
    it('should build from strict input', () => {
      expect(build({
        protocol: 'http:',
        hostname: 'www.dummy.com',
        port: '443',
        pathname: '/my/path',
        search: '?query=string',
      })).toEqual('http://www.dummy.com:443/my/path?query=string');
    });

    it('should be flexible regarding the input', () => {
      expect(build({
        protocol: 'http',
        hostname: 'www.dummy.com',
        port: '443',
        pathname: 'my/path',
        search: 'query=string',
      })).toEqual('http://www.dummy.com:443/my/path?query=string');
    });

    it('should make some properties optional', () => {
      expect(build({
        protocol: 'http',
        hostname: 'www.dummy.com',
      })).toEqual('http://www.dummy.com');
    });

    it('should not generate query string if input is empty string', () => {
      expect(build({
        protocol: 'http',
        hostname: 'www.dummy.com',
        port: '443',
        pathname: 'my/path',
        search: '',
      })).toEqual('http://www.dummy.com:443/my/path');
    });

    it('should keep empty query string if input is a single question mark', () => {
      expect(build({
        protocol: 'http',
        hostname: 'www.dummy.com',
        port: '443',
        pathname: 'my/path',
        search: '?',
      })).toEqual('http://www.dummy.com:443/my/path?');
    });
  });
});
