jest.mock('https');
jest.mock('http');

import chalk from 'chalk';

import { requestHTTP, requestHTTPS, measure, sendRequest } from './impl';

import { readAll } from '../../../lib/stream';
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
  return chalk.bold((chalk as any)[color](text));
}

////////////////////////////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////////////////////////////

describe('requesting', () => {
  describe('measure', () => {
    it('should return start, end, duration and output', async () => {
      const delay = 1000;
      const wait = (time: number) => new Promise((resolve) => setTimeout(resolve, time));
      let called = false;
      let finished = false;
      const returnedValue = {};
      const myAsyncFunction = async () => {
        called = true;
        await wait(delay);
        finished = true;
        return returnedValue;
      };

      const { start, end, duration, output } = await measure(myAsyncFunction);

      expect(called).toBeTruthy();
      expect(finished).toBeTruthy();

      expect(start).toBeGreaterThanOrEqual(0);
      expect(end).toBeGreaterThanOrEqual(0);
      expect(end).toBeGreaterThan(start);

      expect(duration).toBe(end - start);
      const margin = 50;
      expect(duration).toBeLessThanOrEqual(delay + margin);
      expect(duration).toBeGreaterThanOrEqual(delay - margin);

      expect(output).toBe(output);
    });
  });

  describe('requestHTTP', () => {
    it('should send HTTP request and get raw response', async () => {
      const url = 'http://remote.dev/my/api';
      const method = 'GET';
      const headers = {
        'x-custom': 'custom',
      };
      const body = 'Hello';

      const rawResponse = await requestHTTP({ url, method, headers, body });

      expect(rawResponse.statusCode).toBe(200);
      expect(rawResponse.statusMessage).toBe('OK');
      expect(rawResponse.headers).toEqual({
        'content-type': 'application/json',
      });
      expect(JSON.parse((await readAll(rawResponse)).toString())).toEqual({
        url,
        method,
        headers,
        body,
        secure: false,
      });
    });
  });

  describe('requestHTTPS', () => {
    it('should send HTTPS request and get raw response', async () => {
      const hostname = 'remote.dev';
      const port = '9999';
      const path = '/my/api';
      const url = `https://${hostname}:${port}${path}`;

      const method = 'GET';
      const headers = {
        'x-custom': 'custom',
      };
      const body = 'Hello';

      const rawResponse = await requestHTTPS({ url, method, headers, body });

      expect(rawResponse.statusCode).toBe(200);
      expect(rawResponse.statusMessage).toBe('OK');
      expect(rawResponse.headers).toEqual({
        'content-type': 'application/json',
      });
      expect(JSON.parse((await readAll(rawResponse)).toString())).toEqual({
        method,
        headers,
        body,
        hostname,
        port,
        path,
        secure: true,
      });
    });
  });

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
          headers: { 'x-original': 'original' },
        } as unknown as IFetchedRequest,
      });

      expect(result.time).toBeGreaterThan(0);
      const sentRequest = JSON.parse(result.response.body.toString());
      expect(sentRequest.headers).toEqual({
        'x-original': 'original',
        'accept-encoding': 'identity',
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
          headers: { 'x-original': 'original' },
        } as unknown as IFetchedRequest,
      });

      expect(result.time).toBeGreaterThan(0);
      const sentRequest = JSON.parse(result.response.body.toString());
      expect(sentRequest.headers).toEqual({
        'x-original': 'original',
        'accept-encoding': 'identity',
      });
      expect(sentRequest.method).toEqual('post');
      expect(sentRequest.hostname).toEqual('target');
      expect(sentRequest.port).toEqual('5000');
      expect(sentRequest.path).toEqual('/original?original=original');
      expect(sentRequest.body).toEqual('Original');
      expect(sentRequest.secure).toBeTruthy();
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
          headers: { 'x-original': 'original' },
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
          headers: { 'x-original': 'original' },
        } as unknown as IFetchedRequest,
      });

      expect(result.time).toBeGreaterThan(0);
      const sentRequest = JSON.parse(result.response.body.toString());
      expect(sentRequest.headers).toEqual({
        'x-original': 'original',
        'accept-encoding': 'identity',
      });
      expect(sentRequest.method).toEqual('post');
      expect(sentRequest.url).toEqual('http://target/original?original=original');
      expect(sentRequest.body).toEqual('Original');
      expect(sentRequest.secure).toBeFalsy();
    });
  });
});
