jest.mock('http2-wrapper');

import picocolors from 'picocolors';

import { sendRequest } from './impl';

import { IFetchedRequest } from '../request/model';
import { URL } from 'url';
import { createGlobalLogger } from '../../logger';

////////////////////////////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////////////////////////////

function createLogger() {
  const output: { message: any; type: 'log' | 'error' }[] = [];
  const console = {
    log: (message: any) => output.push({ message, type: 'log' }),
    error: (message: any) => output.push({ message, type: 'error' }),
  };
  createGlobalLogger(console);
  const clear = () => (output.length = 0);
  return { output, clear };
}

function highlighted(text: string, color = 'green'): string {
  return picocolors.bold((picocolors as any)[color](text));
}

////////////////////////////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////////////////////////////

describe('requesting', () => {
  describe('sendRequest', () => {
    it('should copy input data and send request', async () => {
      const { output } = createLogger();

      const result = await sendRequest({
        baseUrl: 'http://target:5000',
        original: {
          url: {
            pathname: '/original',
            search: '?original=original',
          } as URL,
          method: 'post',
          body: 'Original',
          headers: { 'x-original': 'original', host: 'original:8080' },
        } as unknown as IFetchedRequest,
      });

      expect(result.time).toBeGreaterThan(0);
      const sentRequest = JSON.parse(result.response.body.toString());
      expect(sentRequest.headers).toEqual({
        'x-original': 'original',
        'Accept-Encoding': 'identity',
      });
      expect(sentRequest.method).toEqual('post');
      expect(sentRequest.url).toEqual('http://target:5000/original?original=original');
      expect(sentRequest.body).toEqual('Original');
      expect(sentRequest.secure).toBeFalsy();

      const timestampPattern = /\d{4}\/\d{2}\/\d{2} \d{2}\:\d{2}\:\d{2}[ap]m [+-]\d{2}\:\d{2}/
        .source;

      const messagePattern = ` - Sending request to: ${highlighted(
        'http://target:5000/original?original=original',
      )}`
        .replace(/\//g, '\\/')
        .replace(/\[/g, '\\[')
        .replace(/\?/g, '\\?')
        .replace(/\u001b/g, '\\u001b');
      expect(output).toEqual([
        {
          type: 'log',
          message: expect.stringMatching(new RegExp(timestampPattern + messagePattern)),
        },
        {
          type: 'log',
          message: expect.stringMatching(new RegExp(timestampPattern + ' - Request complete')),
        },
      ]);
    });

    it('should detect and switch to HTTPS', async () => {
      const result = await sendRequest({
        skipLog: true,
        baseUrl: 'https://target:5000',
        original: {
          url: {
            pathname: '/original',
            search: '?original=original',
          } as URL,
          method: 'post',
          body: 'Original',
          headers: { 'x-original': 'original', host: 'original:8080' },
        } as unknown as IFetchedRequest,
      });

      expect(result.time).toBeGreaterThan(0);
      const sentRequest = JSON.parse(result.response.body.toString());
      expect(sentRequest.headers).toEqual({
        'x-original': 'original',
        'Accept-Encoding': 'identity',
      });
      expect(sentRequest.method).toEqual('post');
      expect(sentRequest.url).toEqual('https://target:5000/original?original=original');
      expect(sentRequest.body).toEqual('Original');
    });

    it('should be able to skip log', async () => {
      const { output } = createLogger();

      await sendRequest({
        skipLog: true,
        baseUrl: 'http://target:5000',
        original: {
          url: {
            pathname: '/original',
            search: '?original=original',
          } as URL,
          method: 'post',
          body: 'Original',
          headers: { 'x-original': 'original', host: 'original:8080' },
        } as unknown as IFetchedRequest,
      });

      expect(output).toEqual([]);
    });

    it('should handle the case with no target port', async () => {
      const result = await sendRequest({
        skipLog: true,
        baseUrl: 'http://target',
        original: {
          url: {
            pathname: '/original',
            search: '?original=original',
          } as URL,
          method: 'post',
          body: 'Original',
          headers: { 'x-original': 'original', host: 'original:8080' },
        } as unknown as IFetchedRequest,
      });

      expect(result.time).toBeGreaterThan(0);
      const sentRequest = JSON.parse(result.response.body.toString());
      expect(sentRequest.headers).toEqual({
        'x-original': 'original',
        'Accept-Encoding': 'identity',
      });
      expect(sentRequest.method).toEqual('post');
      expect(sentRequest.url).toEqual('http://target/original?original=original');
      expect(sentRequest.body).toEqual('Original');
      expect(sentRequest.secure).toBeFalsy();
    });
  });
});
