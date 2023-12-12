import { Response } from '../server';

import { Mock } from './impl';

////////////////////////////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////////////////////////////

describe('mocking', () => {
  describe('options', () => {
    it('should use global options or user set value', () => {
      const globalRemoteURL = 'http://localhost:4242';
      const mock = new Mock({
        options: {
          userConfiguration: {
            mode: { value: 'remote' },
            remoteURL: { value: globalRemoteURL },
          },
        },
      } as any);

      expect(mock.remoteURL).toEqual(globalRemoteURL);
      const newRemoteURL = 'http://localhost:5656';
      mock.setRemoteURL(newRemoteURL);
      expect(mock.remoteURL).toEqual(newRemoteURL);
      mock.setRemoteURL(null);
      expect(mock.remoteURL).toEqual(globalRemoteURL);

      expect(mock.mode).toEqual('remote');
      mock.setMode('local');
      expect(mock.mode).toEqual('local');
      mock.setMode(null);
      expect(mock.mode).toEqual('remote');
    });
  });

  describe('delay', () => {
    it('should work', () => {
      const mock = new Mock({
        options: {
          userConfiguration: {
            delay: { value: 65 },
          },
        },
      } as any);

      expect(mock.delay).toEqual(65);

      mock.setDelay(70);
      expect(mock.delay).toEqual(70);

      mock.setDelay(null);
      expect(mock.delay).toEqual(65);

      mock.setDelay('recorded');
      expect(mock.delay).toEqual(50);

      // FIXME 2019-01-16T17:18:14+01:00
      // I dont know how to set the local payload without manually setting a
      // private attribute
      // expect(mock.delay).toEqual(75);
    });
  });

  describe('paths', () => {
    function clean(path: string) {
      return path.replace(/\\/g, '/');
    }

    it('should work', () => {
      const mock = new Mock({
        options: {
          root: 'root',
          userConfiguration: {
            mocksFolder: { value: 'mocks-root' },
          },
        },
        request: {
          url: { pathname: '/url/path' },
          method: 'post',
        },
      } as any);

      expect(clean(mock.mocksFolder)).toEqual('root/mocks-root');
      mock.setMocksFolder('alt-mocks-root');
      expect(clean(mock.mocksFolder)).toEqual('root/alt-mocks-root');
      mock.setMocksFolder(null);
      expect(clean(mock.mocksFolder)).toEqual('root/mocks-root');

      expect(clean(mock.defaultLocalPath)).toEqual('url/path/post');
      expect(clean(mock.localPath)).toEqual(mock.defaultLocalPath);
      expect(clean(mock.mockFolderFullPath)).toEqual('root/mocks-root/url/path/post');

      mock.setLocalPath(['mock-path', '', null, [undefined, 'get'], '']);
      expect(clean(mock.localPath)).toEqual('mock-path/get/');
      expect(clean(mock.mockFolderFullPath)).toEqual('root/mocks-root/mock-path/get/');
    });
  });

  describe('payloads', () => {
    describe('createPayload', () => {
      it('should work', () => {
        const mock = new Mock({} as any);

        const payload = {
          body: 'hello',
          data: {
            creationDateTime: new Date(),
            headers: { 'x-custom': 'custom' },
            status: { code: 204, message: 'custom message' },
            ignoredHeaders: {},
            bodyFileName: 'dummy',
            time: 0,
          },
        };
        expect(mock.createPayload(payload)).toEqual({
          origin: 'user',
          payload,
        });
      });
    });

    describe('fillResponseFromPayload', () => {
      it('should work', () => {
        const response = new Response(null as any);
        const mock = new Mock({ response } as any);

        const headers = { 'x-custom': 'custom' };
        const status = { code: 204, message: 'custom message' };
        mock.fillResponseFromPayload(
          mock.createPayload({
            body: 'hello',
            data: {
              creationDateTime: new Date(),
              headers,
              status,
              ignoredHeaders: {},
              bodyFileName: 'dummy',
              time: 0,
            },
          }),
        );

        expect(response.headers).toEqual(headers);
        expect(response.status).toEqual(status);
      });
    });

    describe('harMimeTypesParseJson', () => {
      it('should be able to be overridden', () => {
        const mock = new Mock({
          options: {
            root: 'root',
            userConfiguration: {},
          },
          request: {
            url: { pathname: '/url/path' },
            method: 'post',
          },
        } as any);
        mock.setHarMimeTypesParseJson(['application/json']);
        expect(mock.harMimeTypesParseJson).toEqual(['application/json']);
      });
    });
  });
});
