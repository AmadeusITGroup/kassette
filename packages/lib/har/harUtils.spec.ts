import {
  fromHarContent,
  fromHarHeaders,
  fromHarHttpVersion,
  rawHeadersToHarHeaders,
  toHarContent,
  toHarHeaders,
  toHarHttpVersion,
  toHarPostData,
  toHarQueryString,
} from './harUtils';

describe('harUtils', () => {
  describe('headers', () => {
    it('should work with no headers', () => {
      expect(fromHarHeaders()).toEqual({});
      expect(fromHarHeaders([])).toEqual({});
      expect(toHarHeaders()).toEqual([]);
      expect(toHarHeaders({})).toEqual([]);
    });

    it('should convert back and forth from node.js headers to har headers', () => {
      const headers = {
        a: '1',
        b: ['2', '3'],
      };
      const harHeaders = toHarHeaders(headers);
      expect(harHeaders).toEqual([
        { name: 'a', value: '1' },
        { name: 'b', value: '2' },
        { name: 'b', value: '3' },
      ]);
      expect(fromHarHeaders(harHeaders)).toEqual(headers);
    });

    it('should convert from har headers to node.js headers', () => {
      const harHeaders = [
        { name: 'my-header', value: '1' },
        { name: 'my-second-header', value: '2' },
        { name: 'my-header', value: '3' },
        { name: 'my-header', value: '4' },
        { name: 'MY-header', value: '5' },
      ];
      expect(fromHarHeaders(harHeaders)).toEqual({
        'my-second-header': '2',
        'MY-header': ['1', '3', '4', '5'],
      });
    });

    it('should convert from raw headers headers to har headers', () => {
      const rawHeaders = [
        'my-header',
        '1',
        'my-second-header',
        '2',
        'my-header',
        '3',
        'my-header',
        '4',
        'MY-header',
        '5',
      ];
      expect(rawHeadersToHarHeaders(rawHeaders)).toEqual([
        { name: 'my-header', value: '1' },
        { name: 'my-second-header', value: '2' },
        { name: 'my-header', value: '3' },
        { name: 'my-header', value: '4' },
        { name: 'MY-header', value: '5' },
      ]);
    });
  });

  describe('toHarQueryString', () => {
    it('should work with no parameters', () => {
      const myURL = new URL('https://something/');
      expect(toHarQueryString(myURL.searchParams)).toEqual([]);
    });

    it('should work with multiple parameters', () => {
      const myURL = new URL('https://something/?a=v1&a=v2&b=b3&c=c3');
      expect(toHarQueryString(myURL.searchParams)).toEqual([
        { name: 'a', value: 'v1' },
        { name: 'a', value: 'v2' },
        { name: 'b', value: 'b3' },
        { name: 'c', value: 'c3' },
      ]);
    });
  });

  describe('content', () => {
    it('should work with empty content', () => {
      expect(toHarContent([], null)).toEqual({ mimeType: '', size: 0, text: '' });
      const emptyBuffer = fromHarContent({});
      expect(Buffer.isBuffer(emptyBuffer)).toBeTruthy();
      expect(emptyBuffer.length).toBe(0);
    });

    it('should work with binary content', () => {
      const content = Buffer.from(
        '000102030405060708090a0b0c0d0e0f414243444546474849',
        'hex',
      ).toString('base64');
      const buffer = Buffer.from(content, 'base64');
      expect(toHarContent([], buffer, 'application/octet-stream')).toEqual({
        mimeType: 'application/octet-stream',
        size: 25,
        encoding: 'base64',
        text: content,
      });
      expect(toHarContent([], buffer)).toEqual({
        mimeType: '',
        size: 25,
        encoding: 'base64',
        text: content,
      });
      const outputBuffer = fromHarContent({
        mimeType: 'application/octet-stream',
        size: 25,
        encoding: 'base64',
        text: content,
      }) as Buffer;
      expect(buffer.equals(outputBuffer)).toBeTruthy();
    });

    it('should work with text content', () => {
      const content = 'Hello!';
      const buffer = Buffer.from(content, 'utf8');
      expect(toHarContent([], buffer, 'text/plain')).toEqual({
        mimeType: 'text/plain',
        size: 6,
        text: content,
      });
      expect(toHarContent([], buffer)).toEqual({
        mimeType: '',
        size: 6,
        text: content,
      });
      expect(toHarContent([], content, 'text/plain')).toEqual({
        mimeType: 'text/plain',
        size: 6,
        text: content,
      });
      expect(toHarContent([], content)).toEqual({
        mimeType: '',
        size: 6,
        text: content,
      });
      const outputBuffer = fromHarContent({
        mimeType: 'text/plain',
        size: 6,
        text: content,
      }) as Buffer;
      expect(buffer.equals(outputBuffer)).toBeTruthy();
    });

    it('should parse json data', () => {
      const content = '{"test": "hello"}';
      const buffer = Buffer.from(content, 'utf8');
      expect(toHarContent(['application/json'], buffer, 'application/json')).toEqual({
        mimeType: 'application/json',
        size: 17,
        json: { test: 'hello' },
      });
    });

    it('should not parse json data when mimeType is not application/json', () => {
      const content = '{"test": "hello"}';
      const buffer = Buffer.from(content, 'utf8');
      expect(toHarContent(['application/json'], buffer, 'text/plain')).toEqual({
        mimeType: 'text/plain',
        size: 17,
        text: content,
      });
    });

    it('should not parse json data when saveAsString is true', () => {
      const content = '{"test": "hello"}';
      const buffer = Buffer.from(content, 'utf8');
      expect(toHarContent([], buffer, 'text/plain')).toEqual({
        mimeType: 'text/plain',
        size: 17,
        text: content,
      });
    });
  });

  describe('postData', () => {
    it('should work with no data', () => {
      expect(toHarPostData([], Buffer.alloc(0))).toBe(undefined);
    });

    it('should work with binary data', () => {
      const buffer = Buffer.from('000102030405060708090a0b0c0d0e0f414243444546474849', 'hex');
      expect(toHarPostData([], buffer, 'application/octet-stream')).toEqual({
        mimeType: 'application/octet-stream',
        text: buffer.toString('binary'),
      });
    });

    it('should work with text data', () => {
      const content = 'Hello!';
      expect(toHarPostData([], Buffer.from(content, 'utf8'), 'text/plain')).toEqual({
        mimeType: 'text/plain',
        text: content,
      });
      expect(toHarPostData([], content, 'text/plain')).toEqual({
        mimeType: 'text/plain',
        text: content,
      });
    });

    it('should parse json data', () => {
      const content = '{"test": "hello"}';
      expect(
        toHarPostData(['application/json'], Buffer.from(content, 'utf8'), 'application/json'),
      ).toEqual({
        mimeType: 'application/json',
        json: { test: 'hello' },
      });
    });

    it('should not parse json data when mimeType is not application/json', () => {
      const content = '{"test": "hello"}';
      expect(
        toHarPostData(['application/json'], Buffer.from(content, 'utf8'), 'text/plain'),
      ).toEqual({
        mimeType: 'text/plain',
        text: content,
      });
    });
  });

  describe('fromHarContent', () => {
    it('should return content if json is set', () => {
      const content = { test: 'hello' };
      const returned = fromHarContent({
        mimeType: 'application/json',
        size: 17,
        json: content,
      });
      expect(returned).toEqual(content);
    });
  });

  describe('version', () => {
    it('should work with no version', () => {
      expect(toHarHttpVersion()).toEqual('HTTP/1.1');
      expect(fromHarHttpVersion()).toEqual('1.1');
    });

    it('should work with version 1.0', () => {
      expect(toHarHttpVersion('1.0')).toEqual('HTTP/1.0');
      expect(fromHarHttpVersion('HTTP/1.0')).toEqual('1.0');
    });
  });
});
