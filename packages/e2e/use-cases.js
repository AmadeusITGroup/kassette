////////////////////////////////////////////////////////////////////////////////
//                                 DISCLAIMER
//
// This file is used in many contexts:
// - as a Common.js library on the backend side
// - as a UMD library on the client side
// - as a file exporting static data to be served as JSON by the backend
//
// Therefore, please don't use any module system here,
// pass all the APIs to the functions.
////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////
// Local library
////////////////////////////////////////////////////////////////////////////////

function fromPairs(pairs) {
  return pairs.reduce((output, [key, value]) => (output[key] = value, output), {});
}

async function readMock({folder}) {
  const path = require('path');
  const fs = require('fs').promises;

  const data = JSON.parse(await fs.readFile(path.join(folder, 'data.json')));
  const body = await fs.readFile(path.join(folder, data.bodyFileName));

  return {data, body};
}

async function getLocalMockInfo({folder}) {
  const {promises: fs} = require('fs');

    let files = [];
    try {
      files = await fs.readdir(folder)
    } catch (exception) {
      if (exception.code !== 'ENOENT') throw exception;
    }

    const mock = files.length === 0 ? null : await readMock({folder});

    return {files, mock};
}


////////////////////////////////////////////////////////////////////////////////
// Data
////////////////////////////////////////////////////////////////////////////////

const useCases = [
  //////////////////////////////////////////////////////////////////////////////
  // Example
  //////////////////////////////////////////////////////////////////////////////

  // {
  //   name: 'no-space-id-of-the-use-case',
  //   description: 'descriptive name, displayed by the test runner',
  //   iterations: 2, // number of times to execute this use case

  //   // executed in client context, either:
  //   // - an external browser, so a separate process
  //   request: async () => {
  //     const url = 'my/custom/path';
  //     return {
  //       // return options to perform the request (given to "fetch")
  //       request: {
  //         url,
  //         headers: {
  //           ...
  //         },
  //       },
  //       // and data to be used for tests assertions
  //       data: {url},
  //     }
  //   },

  //   // executed in backend context, either:
  //   // - the same process as the orchestrator (in "library" mode)
  //   // - a subprocess communicating with IPC (in "orchestrated process" mode)
  //   // - an isolated process (in "manual process" mode)
  //   serve: async ({response}) => {
  //     const status = 200;
  //     response.status = status;
  //     return {status}; // return any data you want to use for assertions
  //   },

  //   // executed in proxy context, either:
  //   // - the same process as the orchestrator (in "library" mode)
  //   // - a subprocess communicating with IPC (in "orchestrated process" mode)
  //   // - an isolated process (in "manual process" mode)
  //   proxy: async ({mock}) => {
  //     const status = 404;
  //     mock.response.setStatus({code: status});
  //     return {status}; // return any data you want to use for assertions
  //   },

  //   // executed in orchestrator context
  //   defineAssertions: ({describe, it, getData, expect}) => {
  //     describe('optional describe blocks', () => {
  //       it('should check something', async () => {
  //         const {data} = getData(0); // get data from given iteration
  //         expect(data.client.status).to.equal(data.proxy.status, 'with a meaningful error message');
  //       });
  //     });
  //   },
  // },



  //////////////////////////////////////////////////////////////////////////////
  // Headers management
  //////////////////////////////////////////////////////////////////////////////

  {
    name: 'headers',
    description: 'headers management',
    iterations: 2,

    request: async () => {
      const providedHeaders = [{name: 'x-custom-header-from-client', value: 'custom header from client'}];

      return {
        request: {
          headers: Object.assign(
            {
              'x-client-header-overridden-by-backend': 'from client, to be overridden by backend',
              'x-client-header-overridden-by-proxy': 'from client, to be overridden by proxy',
            },
            fromPairs(providedHeaders.map(({name, value}) => [name, value])),
          ),
        },
        data: {providedHeaders},
      };
    },

    serve: async ({response, request}) => {
      const providedHeaders = [{name: 'x-custom-header-from-backend', value: 'custom header from backend'}];
      const overriddenHeaders = [{name: 'x-client-header-overridden-by-backend', value: 'from client, overridden by backend'}];

      const headers = [
        'x-custom-header-from-client',
        'x-use-case-name',
        'x-use-case-iteration',
      ]
        .map(name => ({name, value: request.headers[name]}))
        .concat([
          ...providedHeaders,
          ...overriddenHeaders,
          {name: 'x-backend-header-overridden-by-proxy', value: 'from backend, to be overridden by proxy'},
        ])

      headers.forEach(({name, value}) => response.set(name, value));

      response.status = 200;

      return {providedHeaders, overriddenHeaders};
    },

    proxy: async ({mock}) => {
      const providedHeaders = [{name: 'x-custom-header-from-proxy', value: 'custom header from proxy'}];
      const overriddenHeaders = [
        {name: 'x-client-header-overridden-by-proxy', value: 'from client, overridden by proxy'},
        {name: 'x-backend-header-overridden-by-proxy', value: 'from backend, overridden by proxy'},
      ];

      const headers = [
        ...providedHeaders,
        ...overriddenHeaders,
      ];
      await mock.getPayloadAndFillResponse();
      mock.setMode('manual');
      mock.response.setHeaders(fromPairs(headers.map(({name, value}) => [name, value])));
      await mock.sendResponse();

      return {providedHeaders, overriddenHeaders};
    },

    defineAssertions: ({describe, it, getData, expect, useCase}) => {
      describe('headers feeding', () => {
        it('should have custom header from client', async () => {
          for (let iteration = 0; iteration < useCase.iterations; iteration++) {
            const {data} = getData(iteration);
            data.clientData.providedHeaders.forEach(({name, value}) =>
              expect(data.client.headers[name]).to.equal(value, 'Headers sent by the client should be added by the backend in the response and not dropped by the proxy in any direction (client <=> backend)')
            );
          }
        });

        it('should have custom header from backend', async () => {
          for (let iteration = 0; iteration < useCase.iterations; iteration++) {
            const {data} = getData(iteration);
            getData(0).data.backend.providedHeaders.forEach(({name, value}) =>
              expect(data.client.headers[name]).to.equal(value, 'Headers added to the response from the backend should not be dropped by the proxy')
            );
          }
        });

        it('should have custom header from proxy', async () => {
          for (let iteration = 0; iteration < useCase.iterations; iteration++) {
            const {data} = getData(iteration);
            data.proxy.providedHeaders.forEach(({name, value}) =>
              expect(data.client.headers[name]).to.equal(value, 'The proxy should be able to add headers')
            );
          }
        });
      });

      describe('headers overriding', () => {
        it('should receive headers overridden by backend', async () => {
          for (let iteration = 0; iteration < useCase.iterations; iteration++) {
            const {data} = getData(iteration);
            getData(0).data.backend.overriddenHeaders.forEach(({name, value}) =>
              expect(data.client.headers[name]).to.equal(value, 'Headers overridden by backend should not be dropped by the proxy')
            );
          }
        });

        it('should receive own header overridden by proxy', async () => {
          for (let iteration = 0; iteration < useCase.iterations; iteration++) {
            const {data} = getData(iteration);
            data.proxy.overriddenHeaders.forEach(({name, value}) =>
              expect(data.client.headers[name]).to.equal(value, 'The proxy should be able to override header coming from the backend')
            );
          }
        });
      });
    },
  },



  //////////////////////////////////////////////////////////////////////////////
  // Backend switching
  //////////////////////////////////////////////////////////////////////////////

  {
    name: 'switch-backend',
    description: 'backend switching',
    iterations: 1,

    alternativeServe: async ({response}) => {
      const output = {};
      response.body = output.body = 'from alternative backend';
      response.status = output.status = 200;
      return output;
    },

    serve: async ({response}) => {
      const output = {};
      response.body = output.body = 'from main backend';
      response.status = output.status = 404;
      return output;
    },

    proxy: async ({mock}, {context}) => {
      mock.setRemoteURL(context.alternativeRemoteURL);
    },

    defineAssertions: ({it, getData, expect}) => {
      it('should get the data from the alternative backend', async () => {
        const {data} = getData(0);
        expect(data.client.status.code).to.equal(data.alternativeBackend.status, 'Received status should be coming from the alternative backend, not the main one')
      });
    },
  },



  //////////////////////////////////////////////////////////////////////////////
  // Mock files generation
  //
  // Description of the iterations:
  //
  // - 1:
  //   - mode: remote
  //   - mocks present before: no
  //   - mocks present after: no
  //   - mocks updated: no
  //   - final response origin: remote
  // - 2
  //   - mode: local or download
  //   - mocks present before: no
  //   - mocks present after: yes
  //   - mocks updated: yes
  //   - final response origin: remote
  // - 3
  //   - mode: local or download
  //   - mocks present before: yes
  //   - mocks present after: yes
  //   - mocks updated: no
  //   - final response origin: local
  // - 4
  //   - mode: download
  //   - mocks present before: yes
  //   - mocks present after: yes
  //   - mocks updated: yes
  //   - final response origin: remote
  // - 5
  //   - mode: local
  //   - mocks present before: yes
  //   - mocks present after: yes
  //   - mocks updated: no
  //   - final response origin: local
  //////////////////////////////////////////////////////////////////////////////

  {
    name: 'generate-files',
    description: 'mock files generation',
    iterations: 5,

    request: async ({iteration}) => {
      return {request: {headers: {'x-iteration': iteration}}};
    },

    serve: async ({response, request}) => {
      const output = {};
      const iteration = request.headers['x-iteration'];
      response.body = output.body = `from backend: ${iteration}`;
      response.status = output.status = 200;
      return output;
    },

    proxy: async ({mock}, {iteration}) => {
      const filesRoot = mock.mockFolderFullPath;

      if (iteration === 0) {
        // mock.setMode('remote');
        // return {filesRoot};
        mock.setMode('remote');
        await mock.process();
        const wrappedPayload = mock.sourcePayload;
        return {filesRoot, wrappedPayload};
      } else if (iteration === 1) {
        mock.setMode('local_or_download');
        await mock.process();
        const wrappedPayload = mock.sourcePayload;
        return {
          filesRoot,
          wrappedPayload,
        };
      } else if (iteration === 2) {
        mock.setMode('local_or_download');

        await mock.process();
        const wrappedPayload = mock.sourcePayload;
        // TODO 2018-12-11T11:18:31+01:00
        // Alter the data read from the files to check it's feasible,
        // and then verify that the client side received the altered data
        return {
          filesRoot,
          wrappedPayload,
          // alteredData: ...,
        };
      } else if (iteration === 3) {
        mock.setMode('download');
        await mock.process();
        const wrappedPayload = mock.sourcePayload;
        return {filesRoot, wrappedPayload};
      } else if (iteration === 4) {
        mock.setMode('local');
        await mock.process();
        const wrappedPayload = mock.sourcePayload;
        return {filesRoot, wrappedPayload};
      }
    },

    postProcess: async ({data}) => {
      return getLocalMockInfo({folder: data.proxy.filesRoot});
    },

    defineAssertions: ({it, getData, expect}) => {
      it('should not persist any data if mode is remote', async () => {
        const {data} = getData(0);
        expect(data.postProcessing.files, 'When working in "remote" mode, the proxy should not create local files').to.be.empty;
        expect(data.proxy.wrappedPayload.origin).to.equal('remote');
      });

      it('should persist data in local or remote mode', async () => {
        const expectedBody = 'from backend: 1';
        let iterationData;

        iterationData = getData(1).data;
        expect(iterationData.postProcessing.files).to.have.lengthOf(6, 'When proxy works in "local_or_download" mode, it should create a set of local mock files');
        expect(iterationData.proxy.wrappedPayload.origin).to.equal('remote', 'Getting the current payload during the iteration where the proxy is creating the local files should indicate the payload comes from the "remote" source (the backend)');
        expect(iterationData.postProcessing.mock.body.toString()).to.equal(expectedBody, 'Mock content must come from iteration 1, when it was stored');
        expect(iterationData.client.body).to.equal(expectedBody, 'Received body must come from the mock stored at iteration 1');

        iterationData = getData(2).data;
        expect(iterationData.postProcessing.files).to.have.lengthOf(6, 'Files should remain present in subsequent iterations');
        expect(iterationData.proxy.wrappedPayload.origin).to.equal('local', 'Getting the current payload during the iteration where the proxy has already local files available should indicate the payload comes from the "local" source');
        expect(iterationData.postProcessing.mock.body.toString()).to.equal(expectedBody, 'Mock content must come from iteration 1, when it was stored');
        expect(iterationData.client.body).to.equal(expectedBody, 'Received body must come from the mock stored at iteration 1');
      });

      it('should update mock unconditionally in download mode', async () => {
        const expectedBody = 'from backend: 3';
        let iterationData;

        iterationData = getData(3).data;
        expect(iterationData.postProcessing.files).to.have.lengthOf(6, 'When proxy works in "download" mode, it should create/update a set of local mock files');
        expect(iterationData.proxy.wrappedPayload.origin).to.equal('remote', 'In "download" mode, the data forwarded to the client comes from the remote backend.');
        expect(iterationData.postProcessing.mock.body.toString()).to.equal(expectedBody, 'Mock content must come from iteration 4, when it was updated');
        expect(iterationData.client.body).to.equal(expectedBody, 'Received body must come from the mock updated at iteration 4');

        iterationData = getData(4).data;
        expect(iterationData.postProcessing.files).to.have.lengthOf(6, 'Files should remain present in subsequent iterations');
        expect(iterationData.proxy.wrappedPayload.origin).to.equal('local');
        expect(iterationData.postProcessing.mock.body.toString()).to.equal(expectedBody, 'Mock content must come from iteration 4, when it was updated');
        expect(iterationData.client.body).to.equal(expectedBody, 'Received body must come from the mock updated at iteration 4');
      });
    },
  },



  //////////////////////////////////////////////////////////////////////////////
  // Mode: local or remote
  //
  // To test that, we need one request with a mock, and one without.
  // First iteration should make request in "download" mode to get the mock.
  // Second and third iterations will test in mode "local_or_remote",
  // with one request targeting the mock and one not targeting it.
  // Again, use injected iteration number to test if data came from the mock or the backend.
  //////////////////////////////////////////////////////////////////////////////

  {
    name: 'mode-local-or-remote',
    description: 'mode: local or remote',
    iterations: 4,

    request: async ({iteration}) => {
      return {request: {headers: {
        'x-iteration': iteration,
        'x-variant': ['mocked', 'mocked', 'remote', 'remote'][iteration],
      }}};
    },

    serve: async ({response, request}) => {
      const output = {};
      const iteration = request.headers['x-iteration'];
      response.body = output.body = `from backend: ${iteration}`;
      response.status = output.status = 200;
      return output;
    },

    proxy: async ({mock}, {iteration}) => {
      mock.setLocalPath([mock.localPath, mock.request.headers['x-variant']]);
      const filesRoot = mock.mockFolderFullPath;

      mock.setMode(iteration === 0 ? 'download' : 'local_or_remote');
      await mock.process();
      const wrappedPayload = mock.sourcePayload;
      return {filesRoot, wrappedPayload};
    },

    postProcess: async ({data}) => {
      return getLocalMockInfo({folder: data.proxy.filesRoot});
    },

    defineAssertions: ({it, getData, expect}) => {
      it('should download the first time in download mode', async () => {
        const {data} = getData(0);
        expect(data.postProcessing.files).to.have.lengthOf(6);
      });

      it('should serve the mock when existing', async () => {
        const {data} = getData(1);
        expect(data.client.body).to.equal('from backend: 0');
      });

      it('should fetch from backend with no download when mock does not exist', async () => {
        const {data} = getData(2);
        expect(data.client.body).to.equal('from backend: 2');
        expect(data.postProcessing.files).to.have.lengthOf(0);
      });

      it('should fetch again from backend since mock was not recorded', async () => {
        const {data} = getData(3);
        expect(data.client.body).to.equal('from backend: 3');
        expect(data.postProcessing.files).to.have.lengthOf(0);
      });
    },
  },



  //////////////////////////////////////////////////////////////////////////////
  // Response sending delay
  //////////////////////////////////////////////////////////////////////////////

  {
    name: 'delay',
    description: 'response sending delay',
    iterations: 3,

    serve: async ({response}) => {
      const output = {};
      response.body = output.body = 'This comes from the backend and has no custom delay';
      response.status = output.status = 200;
      return output;
    },

    proxy: async ({mock}, {iteration}) => {
      const output = {};

      output.body = 'This comes from the proxy (local mock) and has a custom delay';
      if (await mock.readLocalPayloadAndFillResponse()) {
        mock.response.body = output.body;
      }

      let delay;
      if (iteration === 0) {
        delay = 2000;
      } else if (iteration === 1) {
        delay = 2000;
        output.recordedDelay = (await mock.readLocalPayload()).payload.data.time;
        // TODO 2018-12-12T15:17:51+01:00
        // if API allows it, update local mock to increase the delay,
        // and therefore have a relevant test for 3rd iteration where recorded delay is applied
        // however, if doing so, we should also verify before that the actual timing has been recorded the first time
        // so probably just add another iteration
      } else if (iteration === 2) {
        delay = 'recorded';
      }
      output.delay = delay;
      mock.setDelay(delay);

      return output;
    },

    defineAssertions: ({it, getData, expect}) => {
      it('should not apply custom delay when fetched from backend', async () => {
        const {data} = getData(0);
        expect(data.proxy.delay - data.client.time).to.be.at.least(1500, 'The delay is not applied when fetching the payload from the backend the first time. Therefore, the actual time spent by processing the request should be way lower than the custom delay we have set high on purpose.');
      });

      it('should apply custom delay when fetched locally', async () => {
        const {data} = getData(1);
        expect(data.client.time).to.be.closeTo(data.proxy.delay, 35, 'Timing is approximate, but it should be more or less corresponding to the custom delay time');
      });

      it('should apply recorded delay when fetched locally and configured so', async () => {
        const initialTime = getData(0).data.client.time;
        const {data} = getData(2);
        expect(data.client.time).to.be.closeTo(initialTime, 30, 'Timing is approximate, but it should be more or less corresponding to the initial time the request spent');
      });
    },
  },



  //////////////////////////////////////////////////////////////////////////////
  // Custom file extension
  //////////////////////////////////////////////////////////////////////////////

  {
    name: 'custom-file-extension',
    description: 'custom file extension',
    iterations: 1,

    request() {
      return {
        request: {
          method: 'POST',
          body: '- from client',
          headers: {
            'content-type': 'text/yaml',
          },
        },
        data: {
          extension: 'yaml',
        },
      };
    },

    serve: async ({response}) => {
      const output = {};
      response.type = output.extension = 'yaml';
      response.body = '- some yaml'
      response.status = 200;
      return output;
    },

    proxy: async ({mock}) => {
      mock.setMode('local_or_download');
      return {root: mock.mockFolderFullPath};
    },

    postProcess: async ({data}) => {
      const nodePath = require('path');
      const {promises: fs, constants: fsConstants} = require('fs');

      async function getBodyFilename(dataFileName) {
        return JSON.parse(
          await fs.readFile(nodePath.join(data.proxy.root, dataFileName)),
        ).bodyFileName;
      }

      async function fileExists(filename) {
        let exists;
        try {
          await fs.access(nodePath.join(data.proxy.root, filename), fsConstants.R_OK);
          exists = true;
        } catch (exception) {
          exists = false;
        }
        return exists;
      }

      async function getExtensionAndExistence(dataFileName) {
        const filename = await getBodyFilename(dataFileName);
        const exists = await fileExists(filename);
        const extension = nodePath.extname(filename).slice(1);
        return {extension, exists};
      }

      const mock = await getExtensionAndExistence('data.json');
      const inputRequest = await getExtensionAndExistence('input-request.json');
      const forwardedRequest = await getExtensionAndExistence('forwarded-request.json');

      return {mock, inputRequest, forwardedRequest};
    },

    defineAssertions: ({it, getData, expect}) => {
      it('should record and create the filename with the custom extension', async () => {
        const {data} = getData(0);

        expect(data.postProcessing.mock.extension).to.equal(data.backend.extension, 'The proxy determines the extension based on the returned content type, and should apply it to the file name used to store the body, filename itself stored in payload');
        expect(data.postProcessing.mock.exists).to.be.true;

        expect(data.postProcessing.inputRequest.extension).to.equal(data.clientData.extension);
        expect(data.postProcessing.inputRequest.exists).to.be.true;

        expect(data.postProcessing.forwardedRequest.extension).to.equal(data.clientData.extension);
        expect(data.postProcessing.forwardedRequest.exists).to.be.true;
      });
    },
  },



  //////////////////////////////////////////////////////////////////////////////
  // Local mode and no mock found
  //////////////////////////////////////////////////////////////////////////////

  {
    name: 'local-mode-404',
    description: 'return 404 when no mock is found in local mode',
    iterations: 1,

    proxy: async ({mock}) => {
      mock.setMode('local');
    },

    defineAssertions: ({it, getData, expect, useCase}) => {
      it('should receive 404 when no mock available', () => {
        const {data} = getData(0);
        expect(data.client.status.code).to.equal(404);
      });
    },
  },

  {
    name: 'local-mode-404-override',
    description: 'user should be able to detect missing mock and return custom one, as well as persist it',
    iterations: 2,

    proxy: async ({mock}) => {
      mock.setMode('local');

      if (await mock.hasNoLocalFiles()) {
        const payload = mock.createPayload({
          body: '...',
          data: {
            bodyFileName: 'body.txt',
            status: {
              code: 404,
            },
            time: 0,
          }
        });
        mock.setPayload(payload);
        await mock.persistPayload(payload);
      }
    },

    defineAssertions: ({it, getData, expect, useCase}) => {
      it('should be able to return a custom payload', () => {
        const {data} = getData(0);
        expect(data.client.body).to.equal('...');
        expect(data.client.status.code).to.equal(404);
      });
      it('should be able to persist this payload', () => {
        const {data} = getData(1);
        expect(data.client.body).to.equal('...');
        expect(data.client.status.code).to.equal(404);
      });
    },
  },



  //////////////////////////////////////////////////////////////////////////////
  //
  //////////////////////////////////////////////////////////////////////////////

  {
    name: 'create-on-not-found',
    description: 'create empty mock when content is not found on backend',
    iterations: 2,

    serve: async ({response}) => {
      response.status = 404;
    },

    proxy: async ({mock}) => {
      mock.setMode('local_or_download');
      const statusCode = 200;
      const body = '...';

      // we need to do it only if backend will be contacted
      if (await mock.hasNoLocalFiles()) {
        mock.setMode('manual');
        let finalPayload;
        const remotePayload = await mock.downloadPayload();
        if (remotePayload.payload.data.status.code === statusCode) {
          finalPayload = remotePayload;
        } else {
          const localPayload = mock.createPayload({
            body,
            data: {
              bodyFileName: 'body.txt',
              status: {
                code: statusCode,
              },
              time: 0,
            }
          });
          mock.setPayload(localPayload);
          finalPayload = localPayload;
        }
        await mock.persistPayload(finalPayload);
        mock.fillResponseFromPayload(finalPayload);
        await mock.sendResponse();
      }

      return {root: mock.mockFolderFullPath, statusCode, body};
    },

    postProcess: async ({data}) => {
      const nodePath = require('path');
      const {promises: fs} = require('fs');

      const mockData = JSON.parse(
        await fs.readFile(nodePath.join(data.proxy.root, 'data.json')),
      );

      return {
        statusCode: mockData.status.code,
        body: (await fs.readFile(nodePath.join(data.proxy.root, mockData.bodyFileName))).toString(),
      };
    },

    defineAssertions: ({it, getData, expect, useCase}) => {
      it('should receive a custom mock when status is not 200', async () => {
        for (let iteration = 0; iteration < useCase.iterations; iteration++) {
          const {data} = getData(iteration);
          expect(data.client.status.code).to.equal(data.proxy.statusCode);
          expect(data.client.body).to.equal(data.proxy.body);
        }
      });

      it('should record the custom mock when status is not 200', async () => {
        for (let iteration = 0; iteration < useCase.iterations; iteration++) {
          const {data} = getData(iteration);
          expect(data.postProcessing.statusCode).to.equal(data.proxy.statusCode);
          expect(data.postProcessing.body).to.equal(data.proxy.body);
        }
      });
    },
  },



  //////////////////////////////////////////////////////////////////////////////
  // Content encoding
  //////////////////////////////////////////////////////////////////////////////

  {
    name: 'content-compression',
    description: 'content compression should not be done by the backends respecting the given header',
    iterations: 1,

    serve: async ({request, response}) => {
      const gzip = require('util').promisify(require('zlib').gzip);

      const output = {};
      response.status = 200;
      let body = 'raw body';
      output.body = body;
      if (request.headers['accept-encoding'] !== 'identity') {
        response.set('content-encoding', 'gzip');
        body = await gzip(body);
      }
      response.body = body;
      return output;
    },

    proxy: async ({mock}, {iteration}) => {
      mock.setMode('local_or_download');
      const {payload: {body}} = await (iteration === 0 ? mock.fetchPayload() : mock.readLocalPayload());
      return {
        body: body.toString(),
        root: mock.mockFolderFullPath,
      };
    },

    postProcess: async ({data}) => {
      const nodePath = require('path');
      const {promises: fs} = require('fs');

      const mockData = JSON.parse(
        await fs.readFile(nodePath.join(data.proxy.root, 'data.json')),
      );

      return {
        body: (await fs.readFile(nodePath.join(data.proxy.root, mockData.bodyFileName))).toString(),
      };
    },

    defineAssertions: ({it, getData, expect, useCase}) => {
      it('should receive and store an uncompressed body', async () => {
        for (let iteration = 0; iteration < useCase.iterations; iteration++) {
          const {data} = getData(iteration);
          expect(data.proxy.body).to.equal(data.backend.body);
          expect(data.postProcessing.body).to.equal(data.backend.body);
          expect(data.client.headers['content-encoding']).to.be.undefined;
        }
      });
    },
  },



  //////////////////////////////////////////////////////////////////////////////
  // Checksum
  //////////////////////////////////////////////////////////////////////////////

  {
    name: 'checksum',
    description: 'should compute checksum and generate file',
    iterations: 2,

    request() {
      return {request: {
        url: '/pathname?query=value',
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          date: new Date(),
          constant: 'value',
        }),
      }};
    },

    proxy: async ({mock}) => {
      mock.setMode('local_or_download');
      const checksum = await mock.checksum({
        query: true,
        body: {
          filter(body) {
            const data = JSON.parse(body);
            delete data.date;
            return JSON.stringify(data);
          }
        }
      });
      mock.setLocalPath([mock.localPath, checksum]);

      return {
        root: mock.mockFolderFullPath,
        checksumContent: mock.checksumContent,
        checksum,
      };
    },

    postProcess: async ({data}) => {
      const nodePath = require('path');
      const {promises: fs} = require('fs');

      let exists;
      let content = null;
      try {
        content = await fs.readFile(nodePath.join(data.proxy.root, 'checksum'));
        content = content.toString();
        exists = true;
      } catch (error) {
        exists = false;
      }

      return {exists, content};
    },

    defineAssertions: ({it, getData, expect}) => {
      it('should have a checksum file with expected content', async () => {
        const {data} = getData(0);
        expect(data.postProcessing.exists).to.be.true;
        expect(data.postProcessing.content).to.be.equal(data.proxy.checksumContent);

        const {data:data2} = getData(1);
        expect(data2.proxy.root).to.be.equal(data.proxy.root);
      });
    },
  },

  {
    name: 'browser-proxy-https-cross-domain',
    description: 'should intercept an https cross-domain request',
    iterations: 1,
    browserProxy: true,
    request: async () => {
      return {
        request: {
          url: "https://www.example.org:8081/"
        }
      };
    },
    onProxyConnect: async (/** @type {import("../..").IProxyConnectAPI} */ request) => {
      request.setMode('intercept');
    },
    proxy: async (/** @type {import("../..").HookAPI} */ {mock}) => {
      mock.setMode('local');
      mock.setPayload(mock.createPayload({
        body: "myResponse",
        data: { headers: {"Access-Control-Allow-Origin": "*"} }
      }));
      return {
        connections: mock.request.connectionsStack,
        protocol: mock.request.protocol,
        hostname: mock.request.hostname,
        port: mock.request.port
      };
    },
    defineAssertions: ({it, getData, expect}) => {
      it('should return a custom payload', async () => {
        const {data} = getData(0);
        expect(data.client.body).to.be.equal("myResponse");
        expect(data.proxy.protocol).to.be.equal("https");
        expect(data.proxy.hostname).to.be.equal("www.example.org");
        expect(data.proxy.port).to.be.equal("8081");
        expect(data.proxy.connections.length).to.be.equal(2);
        expect(data.proxy.connections[0].protocol).to.be.equal("http");
        expect(data.proxy.connections[0].hostname).to.include("127.0.0.1");
        expect(data.proxy.connections[1].protocol).to.be.equal("https");
        expect(data.proxy.connections[1].hostname).to.be.equal("www.example.org");
        expect(data.proxy.connections[1].port).to.be.equal(8081);
      });
    }
  },

  {
    name: 'browser-proxy-forward-https-cross-domain',
    description: 'should forward an https cross-domain request',
    iterations: 1,
    browserProxy: true,
    request: async () => {
      return {
        request: {
          url: "https://www.example.org:8081/"
        }
      };
    },
    alternativeServe: async (/** @type {import("koa").Context} */{response}) => {
      response.body = 'alternativeResponse';
      response.set("Access-Control-Allow-Origin", "*");
      response.status = 200;
    },
    onProxyConnect: async (/** @type {import("../..").IProxyConnectAPI} */ request, {context}) => {
      const url = new URL(context.alternativeRemoteURL);
      request.setDestination(url.hostname, +url.port);
    },
    proxy: async (/** @type {import("../..").HookAPI} */ {mock}) => {
      // should not be called at all
      return {};
    },
    defineAssertions: ({it, getData, expect}) => {
      it('should return a custom payload', async () => {
        const {data} = getData(0);
        expect(data.proxy).to.be.undefined;
        expect(data.client.body).to.be.equal("alternativeResponse");
      });
    }
  },

  {
    name: 'browser-proxy-http-cross-domain',
    description: 'should intercept an http cross-domain request',
    iterations: 1,
    browserProxy: true,
    request: async () => {
      return {
        request: {
          url: "http://www.example.org:8082/"
        }
      };
    },
    proxy: async (/** @type {import("../..").HookAPI} */ {mock}) => {
      mock.setMode('local');
      mock.setPayload(mock.createPayload({
        body: "exampleResponse",
        data: { headers: {"Access-Control-Allow-Origin": "*"} }
      }));
      return {
        connections: mock.request.connectionsStack,
        protocol: mock.request.protocol,
        hostname: mock.request.hostname,
        port: mock.request.port
      };
    },
    defineAssertions: ({it, getData, expect}) => {
      it('should return a custom payload', async () => {
        const {data} = getData(0);
        expect(data.client.body).to.be.equal("exampleResponse");
        expect(data.proxy.protocol).to.be.equal("http");
        expect(data.proxy.hostname).to.be.equal("www.example.org");
        expect(data.proxy.port).to.be.equal("8082");
        expect(data.proxy.connections.length).to.be.equal(1);
        expect(data.proxy.connections[0].protocol).to.be.equal("http");
        expect(data.proxy.connections[0].hostname).to.include("127.0.0.1");
      });
    }
  },
];
exports.useCases = useCases;



////////////////////////////////////////////////////////////////////////////////
// Convenience
////////////////////////////////////////////////////////////////////////////////

const useCasesMap = fromPairs(useCases.map(useCase => [useCase.name, useCase]));
exports.useCasesMap = useCasesMap;
