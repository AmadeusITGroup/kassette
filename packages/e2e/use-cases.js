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
  return pairs.reduce((output, [key, value]) => ((output[key] = value), output), {});
}

async function readMock({ folder }) {
  const path = require('path');
  const fs = require('fs').promises;

  const data = JSON.parse(await fs.readFile(path.join(folder, 'data.json')));
  const body = await fs.readFile(path.join(folder, data.bodyFileName));

  return { data, body };
}

async function getLocalMockInfo({ folder }) {
  const { promises: fs } = require('fs');

  let files = [];
  try {
    files = await fs.readdir(folder);
  } catch (exception) {
    if (exception.code !== 'ENOENT') throw exception;
  }

  const mock = files.length === 0 ? null : await readMock({ folder });

  return { files, mock };
}

async function copyFile(source, destination) {
  const { promises: fs } = require('fs');
  await fs.copyFile(source, destination);
}

async function mkParentDirectory(filePath) {
  const path = require('path');
  const { promises: fs } = require('fs');
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

async function getHarFile({ file }) {
  const { promises: fs } = require('fs');
  try {
    const fileContent = await fs.readFile(file);
    return {
      harFile: JSON.parse(fileContent.toString('utf8')),
    };
  } catch (exception) {
    if (exception.code !== 'ENOENT') throw exception;
    return null;
  }
}

async function getHarYamlFile({ file }) {
  const { promises: fs } = require('fs');
  try {
    const fileContent = await fs.readFile(file);
    return {
      harFile: require('yaml').parse(fileContent.toString('utf8')),
    };
  } catch (exception) {
    if (exception.code !== 'ENOENT') throw exception;
    return null;
  }
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
      const providedHeaders = [
        { name: 'x-custom-header-from-client', value: 'custom header from client' },
      ];

      return {
        request: {
          headers: Object.assign(
            {
              'x-client-header-overridden-by-backend': 'from client, to be overridden by backend',
              'x-client-header-overridden-by-proxy': 'from client, to be overridden by proxy',
            },
            fromPairs(providedHeaders.map(({ name, value }) => [name, value])),
          ),
        },
        data: { providedHeaders },
      };
    },

    serve: async ({ response, request }) => {
      const providedHeaders = [
        { name: 'x-custom-header-from-backend', value: 'custom header from backend' },
      ];
      const overriddenHeaders = [
        {
          name: 'x-client-header-overridden-by-backend',
          value: 'from client, overridden by backend',
        },
      ];

      const headers = ['x-custom-header-from-client', 'x-use-case-name', 'x-use-case-iteration']
        .map((name) => ({ name, value: request.headers[name] }))
        .concat([
          ...providedHeaders,
          ...overriddenHeaders,
          {
            name: 'x-backend-header-overridden-by-proxy',
            value: 'from backend, to be overridden by proxy',
          },
        ]);

      headers.forEach(({ name, value }) => response.set(name, value));

      response.status = 200;

      return { providedHeaders, overriddenHeaders };
    },

    proxy: async ({ mock }) => {
      const providedHeaders = [
        { name: 'x-custom-header-from-proxy', value: 'custom header from proxy' },
      ];
      const overriddenHeaders = [
        { name: 'x-client-header-overridden-by-proxy', value: 'from client, overridden by proxy' },
        {
          name: 'x-backend-header-overridden-by-proxy',
          value: 'from backend, overridden by proxy',
        },
      ];

      const headers = [...providedHeaders, ...overriddenHeaders];
      await mock.getPayloadAndFillResponse();
      mock.setMode('manual');
      mock.response.setHeaders(fromPairs(headers.map(({ name, value }) => [name, value])));
      await mock.sendResponse();

      return { providedHeaders, overriddenHeaders };
    },

    defineAssertions: ({ describe, it, getData, expect, useCase }) => {
      describe('headers feeding', () => {
        it('should have custom header from client', async () => {
          for (let iteration = 0; iteration < useCase.iterations; iteration++) {
            const { data } = getData(iteration);
            data.clientData.providedHeaders.forEach(({ name, value }) =>
              expect(data.client.headers[name]).to.equal(
                value,
                'Headers sent by the client should be added by the backend in the response and not dropped by the proxy in any direction (client <=> backend)',
              ),
            );
          }
        });

        it('should have custom header from backend', async () => {
          for (let iteration = 0; iteration < useCase.iterations; iteration++) {
            const { data } = getData(iteration);
            getData(0).data.backend.providedHeaders.forEach(({ name, value }) =>
              expect(data.client.headers[name]).to.equal(
                value,
                'Headers added to the response from the backend should not be dropped by the proxy',
              ),
            );
          }
        });

        it('should have custom header from proxy', async () => {
          for (let iteration = 0; iteration < useCase.iterations; iteration++) {
            const { data } = getData(iteration);
            data.proxy.providedHeaders.forEach(({ name, value }) =>
              expect(data.client.headers[name]).to.equal(
                value,
                'The proxy should be able to add headers',
              ),
            );
          }
        });
      });

      describe('headers overriding', () => {
        it('should receive headers overridden by backend', async () => {
          for (let iteration = 0; iteration < useCase.iterations; iteration++) {
            const { data } = getData(iteration);
            getData(0).data.backend.overriddenHeaders.forEach(({ name, value }) =>
              expect(data.client.headers[name]).to.equal(
                value,
                'Headers overridden by backend should not be dropped by the proxy',
              ),
            );
          }
        });

        it('should receive own header overridden by proxy', async () => {
          for (let iteration = 0; iteration < useCase.iterations; iteration++) {
            const { data } = getData(iteration);
            data.proxy.overriddenHeaders.forEach(({ name, value }) =>
              expect(data.client.headers[name]).to.equal(
                value,
                'The proxy should be able to override header coming from the backend',
              ),
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

    alternativeServe: async ({ response }) => {
      const output = {};
      response.body = output.body = 'from alternative backend';
      response.status = output.status = 200;
      return output;
    },

    serve: async ({ response }) => {
      const output = {};
      response.body = output.body = 'from main backend';
      response.status = output.status = 404;
      return output;
    },

    proxy: async ({ mock }, { context }) => {
      mock.setRemoteURL(context.alternativeRemoteURL);
    },

    defineAssertions: ({ it, getData, expect }) => {
      it('should get the data from the alternative backend', async () => {
        const { data } = getData(0);
        expect(data.client.status.code).to.equal(
          data.alternativeBackend.status,
          'Received status should be coming from the alternative backend, not the main one',
        );
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

    request: async ({ iteration }) => {
      return { request: { headers: { 'x-iteration': iteration } } };
    },

    serve: async ({ response, request }) => {
      const output = {};
      const iteration = request.headers['x-iteration'];
      response.body = output.body = `from backend: ${iteration}`;
      response.status = output.status = 200;
      return output;
    },

    proxy: async ({ mock }, { iteration }) => {
      const filesRoot = mock.mockFolderFullPath;

      if (iteration === 0) {
        // mock.setMode('remote');
        // return {filesRoot};
        mock.setMode('remote');
        await mock.process();
        const wrappedPayload = mock.sourcePayload;
        return { filesRoot, wrappedPayload };
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
        return { filesRoot, wrappedPayload };
      } else if (iteration === 4) {
        mock.setMode('local');
        await mock.process();
        const wrappedPayload = mock.sourcePayload;
        return { filesRoot, wrappedPayload };
      }
    },

    postProcess: async ({ data }) => {
      return getLocalMockInfo({ folder: data.proxy.filesRoot });
    },

    defineAssertions: ({ it, getData, expect }) => {
      it('should not persist any data if mode is remote', async () => {
        const { data } = getData(0);
        expect(
          data.postProcessing.files,
          'When working in "remote" mode, the proxy should not create local files',
        ).to.be.empty;
        expect(data.proxy.wrappedPayload.origin).to.equal('remote');
      });

      it('should persist data in local or remote mode', async () => {
        const expectedBody = 'from backend: 1';
        let iterationData;

        iterationData = getData(1).data;
        expect(iterationData.postProcessing.files).to.have.lengthOf(
          6,
          'When proxy works in "local_or_download" mode, it should create a set of local mock files',
        );
        expect(iterationData.proxy.wrappedPayload.origin).to.equal(
          'remote',
          'Getting the current payload during the iteration where the proxy is creating the local files should indicate the payload comes from the "remote" source (the backend)',
        );
        expect(iterationData.postProcessing.mock.body.toString()).to.equal(
          expectedBody,
          'Mock content must come from iteration 1, when it was stored',
        );
        expect(iterationData.client.body).to.equal(
          expectedBody,
          'Received body must come from the mock stored at iteration 1',
        );

        iterationData = getData(2).data;
        expect(iterationData.postProcessing.files).to.have.lengthOf(
          6,
          'Files should remain present in subsequent iterations',
        );
        expect(iterationData.proxy.wrappedPayload.origin).to.equal(
          'local',
          'Getting the current payload during the iteration where the proxy has already local files available should indicate the payload comes from the "local" source',
        );
        expect(iterationData.postProcessing.mock.body.toString()).to.equal(
          expectedBody,
          'Mock content must come from iteration 1, when it was stored',
        );
        expect(iterationData.client.body).to.equal(
          expectedBody,
          'Received body must come from the mock stored at iteration 1',
        );
      });

      it('should update mock unconditionally in download mode', async () => {
        const expectedBody = 'from backend: 3';
        let iterationData;

        iterationData = getData(3).data;
        expect(iterationData.postProcessing.files).to.have.lengthOf(
          6,
          'When proxy works in "download" mode, it should create/update a set of local mock files',
        );
        expect(iterationData.proxy.wrappedPayload.origin).to.equal(
          'remote',
          'In "download" mode, the data forwarded to the client comes from the remote backend.',
        );
        expect(iterationData.postProcessing.mock.body.toString()).to.equal(
          expectedBody,
          'Mock content must come from iteration 4, when it was updated',
        );
        expect(iterationData.client.body).to.equal(
          expectedBody,
          'Received body must come from the mock updated at iteration 4',
        );

        iterationData = getData(4).data;
        expect(iterationData.postProcessing.files).to.have.lengthOf(
          6,
          'Files should remain present in subsequent iterations',
        );
        expect(iterationData.proxy.wrappedPayload.origin).to.equal('local');
        expect(iterationData.postProcessing.mock.body.toString()).to.equal(
          expectedBody,
          'Mock content must come from iteration 4, when it was updated',
        );
        expect(iterationData.client.body).to.equal(
          expectedBody,
          'Received body must come from the mock updated at iteration 4',
        );
      });
    },
  },

  //////////////////////////////////////////////////////////////////////////////
  // Mock files generation with har files
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
  // For iterations 6 and 7, which are similar to iterations 5 and 4, the har file is copied
  // to a new location and loaded from there (to test the har file loading process).
  // - 6
  //   - mode: local
  //   - mocks present before: yes
  //   - mocks present after: yes
  //   - mocks updated: no
  //   - final response origin: local
  // - 7
  //   - mode: download
  //   - mocks present before: yes
  //   - mocks present after: yes
  //   - mocks updated: yes
  //   - final response origin: remote
  //////////////////////////////////////////////////////////////////////////////

  {
    name: 'generate-files-har',
    description: 'mock har files generation',
    iterations: 7,

    request: async ({ iteration }) => {
      return { request: { headers: { 'x-iteration': iteration } } };
    },

    serve: async ({ response, request }) => {
      const output = {};
      const iteration = request.headers['x-iteration'];
      response.body = output.body = `from backend: ${iteration}`;
      response.status = output.status = 200;
      return output;
    },

    proxy: async ({ mock }, { iteration }) => {
      mock.setMocksFormat('har');
      mock.setMocksHarFile([mock.mockFolderFullPath, 'mocks.har']);
      if (iteration >= 5) {
        // from the 6th iteration, copy the har file to a new location to force testing the loading process:
        const oldMockFile = mock.mocksHarFile;
        mock.setMocksHarFile(oldMockFile.replace(/mocks\.har$/, `iteration-${iteration}.har`));
        await copyFile(oldMockFile, mock.mocksHarFile);
      }
      const harFile = mock.mocksHarFile;

      if (iteration === 0) {
        mock.setMode('remote');
        await mock.process();
        const wrappedPayload = mock.sourcePayload;
        return { harFile, wrappedPayload };
      } else if (iteration === 1) {
        mock.setMode('local_or_download');
        await mock.process();
        const wrappedPayload = mock.sourcePayload;
        return {
          harFile,
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
          harFile,
          wrappedPayload,
          // alteredData: ...,
        };
      } else if (iteration === 3) {
        mock.setMode('download');
        await mock.process();
        const wrappedPayload = mock.sourcePayload;
        return { harFile, wrappedPayload };
      } else if (iteration === 4) {
        mock.setMode('local');
        await mock.process();
        const wrappedPayload = mock.sourcePayload;
        return { harFile, wrappedPayload };
      } else if (iteration === 5) {
        mock.setMode('local');
        await mock.process();
        const wrappedPayload = mock.sourcePayload;
        return { harFile, wrappedPayload };
      } else if (iteration === 6) {
        mock.setMode('download');
        await mock.process();
        const wrappedPayload = mock.sourcePayload;
        return { harFile, wrappedPayload };
      }
    },

    postProcess: async ({ data }) => {
      return getHarFile({ file: data.proxy.harFile });
    },

    defineAssertions: ({ it, getData, expect }) => {
      it('should not persist any data if mode is remote', async () => {
        const { data } = getData(0);
        expect(
          data.postProcessing.harFile,
          'When working in "remote" mode, the proxy should not create local files',
        ).to.be.undefined;
        expect(data.proxy.wrappedPayload.origin).to.equal('remote');
      });

      it('should persist data in local or remote mode', async () => {
        const expectedBody = 'from backend: 1';
        let iterationData;

        iterationData = getData(1).data;
        expect(iterationData.postProcessing.harFile.log.entries).to.have.lengthOf(
          1,
          'When proxy works in "local_or_download" mode, it should create an entry in the har mock file',
        );
        expect(iterationData.proxy.wrappedPayload.origin).to.equal(
          'remote',
          'Getting the current payload during the iteration where the proxy is creating the local files should indicate the payload comes from the "remote" source (the backend)',
        );
        expect(iterationData.postProcessing.harFile.log.entries[0].response.content.text).to.equal(
          expectedBody,
          'Mock content must come from iteration 1, when it was stored',
        );
        expect(iterationData.client.body).to.equal(
          expectedBody,
          'Received body must come from the mock stored at iteration 1',
        );

        iterationData = getData(2).data;
        expect(iterationData.postProcessing.harFile.log.entries).to.have.lengthOf(
          1,
          'Entry in the har mock file should remain present in subsequent iterations',
        );
        expect(iterationData.proxy.wrappedPayload.origin).to.equal(
          'local',
          'Getting the current payload during the iteration where the proxy has already local files available should indicate the payload comes from the "local" source',
        );
        expect(iterationData.postProcessing.harFile.log.entries[0].response.content.text).to.equal(
          expectedBody,
          'Mock content must come from iteration 1, when it was stored',
        );
        expect(iterationData.client.body).to.equal(
          expectedBody,
          'Received body must come from the mock stored at iteration 1',
        );
      });

      it('should update mock unconditionally in download mode', async () => {
        let expectedBody = 'from backend: 3';
        let iterationData;

        iterationData = getData(3).data;
        expect(iterationData.postProcessing.harFile.log.entries).to.have.lengthOf(
          1,
          'When proxy works in "download" mode, it should create/update an entry in the har mock file',
        );
        expect(iterationData.proxy.wrappedPayload.origin).to.equal(
          'remote',
          'In "download" mode, the data forwarded to the client comes from the remote backend.',
        );
        expect(iterationData.postProcessing.harFile.log.entries[0].response.content.text).to.equal(
          expectedBody,
          'Mock content must come from iteration 4, when it was updated',
        );
        expect(iterationData.client.body).to.equal(
          expectedBody,
          'Received body must come from the mock updated at iteration 4',
        );

        iterationData = getData(4).data;
        expect(iterationData.postProcessing.harFile.log.entries).to.have.lengthOf(
          1,
          'Entry in the har mock file should remain present in subsequent iterations',
        );
        expect(iterationData.proxy.wrappedPayload.origin).to.equal('local');
        expect(iterationData.postProcessing.harFile.log.entries[0].response.content.text).to.equal(
          expectedBody,
          'Mock content must come from iteration 4, when it was updated',
        );
        expect(iterationData.client.body).to.equal(
          expectedBody,
          'Received body must come from the mock updated at iteration 4',
        );

        iterationData = getData(5).data;
        expect(iterationData.proxy.harFile).to.include('iteration-5.har');
        expect(iterationData.postProcessing.harFile.log.entries).to.have.lengthOf(
          1,
          'Entry in the har mock file should remain present in subsequent iterations',
        );
        expect(iterationData.proxy.wrappedPayload.origin).to.equal('local');
        expect(iterationData.postProcessing.harFile.log.entries[0].response.content.text).to.equal(
          expectedBody,
          'Mock content must come from iteration 4, when it was updated',
        );
        expect(iterationData.client.body).to.equal(
          expectedBody,
          'Received body must come from the mock updated at iteration 4',
        );

        expectedBody = 'from backend: 6';
        iterationData = getData(6).data;
        expect(iterationData.proxy.harFile).to.include('iteration-6.har');
        expect(iterationData.postProcessing.harFile.log.entries).to.have.lengthOf(
          1,
          'When proxy works in "download" mode, it should create/update an entry in the har mock file',
        );
        expect(iterationData.proxy.wrappedPayload.origin).to.equal(
          'remote',
          'In "download" mode, the data forwarded to the client comes from the remote backend.',
        );
        expect(iterationData.postProcessing.harFile.log.entries[0].response.content.text).to.equal(
          expectedBody,
          'Mock content must come from iteration 6, when it was updated',
        );
        expect(iterationData.client.body).to.equal(
          expectedBody,
          'Received body must come from the mock updated at iteration 6',
        );
      });
    },
  },

  {
    name: 'generate-files-har-yaml',
    description: 'mock har files generation in yaml format',
    iterations: 7,

    request: async ({ iteration }) => {
      return { request: { headers: { 'x-iteration': iteration } } };
    },

    serve: async ({ response, request }) => {
      const output = {};
      const iteration = request.headers['x-iteration'];
      response.body = output.body = `from backend: ${iteration}`;
      response.status = output.status = 200;
      return output;
    },

    proxy: async ({ mock }, { iteration }) => {
      mock.setMocksFormat('har');
      mock.setMocksHarFile([mock.mockFolderFullPath, 'mocks.har.yaml']);
      if (iteration >= 5) {
        // from the 6th iteration, copy the har file to a new location to force testing the loading process:
        const oldMockFile = mock.mocksHarFile;
        mock.setMocksHarFile(
          oldMockFile.replace(/mocks\.har\.yaml$/, `iteration-${iteration}.har.yaml`),
        );
        await copyFile(oldMockFile, mock.mocksHarFile);
      }
      const harFile = mock.mocksHarFile;

      if (iteration === 0) {
        mock.setMode('remote');
        await mock.process();
        const wrappedPayload = mock.sourcePayload;
        return { harFile, wrappedPayload };
      } else if (iteration === 1) {
        mock.setMode('local_or_download');
        await mock.process();
        const wrappedPayload = mock.sourcePayload;
        return {
          harFile,
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
          harFile,
          wrappedPayload,
          // alteredData: ...,
        };
      } else if (iteration === 3) {
        mock.setMode('download');
        await mock.process();
        const wrappedPayload = mock.sourcePayload;
        return { harFile, wrappedPayload };
      } else if (iteration === 4) {
        mock.setMode('local');
        await mock.process();
        const wrappedPayload = mock.sourcePayload;
        return { harFile, wrappedPayload };
      } else if (iteration === 5) {
        mock.setMode('local');
        await mock.process();
        const wrappedPayload = mock.sourcePayload;
        return { harFile, wrappedPayload };
      } else if (iteration === 6) {
        mock.setMode('download');
        await mock.process();
        const wrappedPayload = mock.sourcePayload;
        return { harFile, wrappedPayload };
      }
    },

    postProcess: async ({ data }) => {
      return getHarYamlFile({ file: data.proxy.harFile });
    },

    defineAssertions: ({ it, getData, expect }) => {
      it('should not persist any data if mode is remote', async () => {
        const { data } = getData(0);
        expect(
          data.postProcessing.harFile,
          'When working in "remote" mode, the proxy should not create local files',
        ).to.be.undefined;
        expect(data.proxy.wrappedPayload.origin).to.equal('remote');
      });

      it('should persist data in local or remote mode', async () => {
        const expectedBody = 'from backend: 1';
        let iterationData;

        iterationData = getData(1).data;
        expect(iterationData.postProcessing.harFile.log.entries).to.have.lengthOf(
          1,
          'When proxy works in "local_or_download" mode, it should create an entry in the har mock file',
        );
        expect(iterationData.proxy.wrappedPayload.origin).to.equal(
          'remote',
          'Getting the current payload during the iteration where the proxy is creating the local files should indicate the payload comes from the "remote" source (the backend)',
        );
        expect(iterationData.postProcessing.harFile.log.entries[0].response.content.text).to.equal(
          expectedBody,
          'Mock content must come from iteration 1, when it was stored',
        );
        expect(iterationData.client.body).to.equal(
          expectedBody,
          'Received body must come from the mock stored at iteration 1',
        );

        iterationData = getData(2).data;
        expect(iterationData.postProcessing.harFile.log.entries).to.have.lengthOf(
          1,
          'Entry in the har mock file should remain present in subsequent iterations',
        );
        expect(iterationData.proxy.wrappedPayload.origin).to.equal(
          'local',
          'Getting the current payload during the iteration where the proxy has already local files available should indicate the payload comes from the "local" source',
        );
        expect(iterationData.postProcessing.harFile.log.entries[0].response.content.text).to.equal(
          expectedBody,
          'Mock content must come from iteration 1, when it was stored',
        );
        expect(iterationData.client.body).to.equal(
          expectedBody,
          'Received body must come from the mock stored at iteration 1',
        );
      });

      it('should update mock unconditionally in download mode', async () => {
        let expectedBody = 'from backend: 3';
        let iterationData;

        iterationData = getData(3).data;
        expect(iterationData.postProcessing.harFile.log.entries).to.have.lengthOf(
          1,
          'When proxy works in "download" mode, it should create/update an entry in the har mock file',
        );
        expect(iterationData.proxy.wrappedPayload.origin).to.equal(
          'remote',
          'In "download" mode, the data forwarded to the client comes from the remote backend.',
        );
        expect(iterationData.postProcessing.harFile.log.entries[0].response.content.text).to.equal(
          expectedBody,
          'Mock content must come from iteration 4, when it was updated',
        );
        expect(iterationData.client.body).to.equal(
          expectedBody,
          'Received body must come from the mock updated at iteration 4',
        );

        iterationData = getData(4).data;
        expect(iterationData.postProcessing.harFile.log.entries).to.have.lengthOf(
          1,
          'Entry in the har mock file should remain present in subsequent iterations',
        );
        expect(iterationData.proxy.wrappedPayload.origin).to.equal('local');
        expect(iterationData.postProcessing.harFile.log.entries[0].response.content.text).to.equal(
          expectedBody,
          'Mock content must come from iteration 4, when it was updated',
        );
        expect(iterationData.client.body).to.equal(
          expectedBody,
          'Received body must come from the mock updated at iteration 4',
        );

        iterationData = getData(5).data;
        expect(iterationData.proxy.harFile).to.include('iteration-5.har');
        expect(iterationData.postProcessing.harFile.log.entries).to.have.lengthOf(
          1,
          'Entry in the har mock file should remain present in subsequent iterations',
        );
        expect(iterationData.proxy.wrappedPayload.origin).to.equal('local');
        expect(iterationData.postProcessing.harFile.log.entries[0].response.content.text).to.equal(
          expectedBody,
          'Mock content must come from iteration 4, when it was updated',
        );
        expect(iterationData.client.body).to.equal(
          expectedBody,
          'Received body must come from the mock updated at iteration 4',
        );

        expectedBody = 'from backend: 6';
        iterationData = getData(6).data;
        expect(iterationData.proxy.harFile).to.include('iteration-6.har');
        expect(iterationData.postProcessing.harFile.log.entries).to.have.lengthOf(
          1,
          'When proxy works in "download" mode, it should create/update an entry in the har mock file',
        );
        expect(iterationData.proxy.wrappedPayload.origin).to.equal(
          'remote',
          'In "download" mode, the data forwarded to the client comes from the remote backend.',
        );
        expect(iterationData.postProcessing.harFile.log.entries[0].response.content.text).to.equal(
          expectedBody,
          'Mock content must come from iteration 6, when it was updated',
        );
        expect(iterationData.client.body).to.equal(
          expectedBody,
          'Received body must come from the mock updated at iteration 6',
        );
      });
    },
  },

  {
    name: 'har-file-from-playwright',
    description: 'use a har file produced by playwright',
    iterations: 2,
    browserProxy: true,

    request: async ({ backendPort, iteration }) => {
      return {
        request: {
          url: `http://127.0.0.1:${backendPort}/${iteration}`,
        },
      };
    },

    serve: async ({ response, request }) => {
      const output = {};
      const url = request.url;
      response.body = output.body =
        url === '/0'
          ? 'hello from server!'
          : Buffer.from('AAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8gZWZnaGlqa2xtbm9w', 'base64');
      response.status = output.status = 200;
      response.set('Access-Control-Allow-Origin', '*');
      response.set('Content-Type', url === '/0' ? 'text/plain' : 'application/octet-stream');
      return output;
    },

    proxy: async ({ mock }, { iteration }) => {
      mock.setMocksHarFile([mock.mockFolderFullPath, `mocks-${iteration}.har`]);
      mock.setMode('local');
      mock.setMocksFormat('har');
      const harFile = mock.mocksHarFile;
      await mkParentDirectory(harFile);
      const playwright = require('playwright');
      const browser = await playwright.chromium.launch();
      let body;
      try {
        const context = await browser.newContext({
          recordHar: {
            path: harFile,
          },
        });
        const page = await context.newPage();
        body = await page.evaluate(async (url) => {
          const response = await fetch(url);
          const body = await response.text();
          return body;
        }, mock.request.url.href);
        await context.close();
      } finally {
        await browser.close();
      }
      await mock.process();
      return { harFile, body };
    },

    postProcess: async ({ data }) => {
      return getHarFile({ file: data.proxy.harFile });
    },

    defineAssertions: ({ it, getData, expect }) => {
      it('should use the response from har file (text content)', () => {
        const data = getData(0).data;
        expect(data.proxy.body).to.equal('hello from server!');
        expect(data.client.body).to.equal('hello from server!');
        expect(data.client.status.code).to.equal(200);
        expect(data.postProcessing.harFile.log.creator.name).to.equal('Playwright'); // used har file produced by playwright
        expect(data.postProcessing.harFile.log.entries[0].response.content.text).to.equal(
          'hello from server!',
        );
        expect(data.postProcessing.harFile.log.entries[0].response.content.encoding).not.to.be.a(
          'string',
        );
      });

      it('should use the response from har file (binary content)', () => {
        const expectedBodyBase64 = 'AAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8gZWZnaGlqa2xtbm9w';
        const expectedBody = Buffer.from(expectedBodyBase64, 'base64').toString('binary');
        const data = getData(1).data;
        expect(data.proxy.body).to.equal(expectedBody);
        expect(data.client.body).to.equal(expectedBody);
        expect(data.client.status.code).to.equal(200);
        expect(data.postProcessing.harFile.log.creator.name).to.equal('Playwright'); // used har file produced by playwright
        expect(data.postProcessing.harFile.log.entries[0].response.content.text).to.equal(
          expectedBodyBase64,
        );
        expect(data.postProcessing.harFile.log.entries[0].response.content.encoding).to.equal(
          'base64',
        );
      });
    },
  },

  {
    name: 'har-file-to-playwright',
    description: 'use a har file produced by kassette in playwright',
    iterations: 2,
    browserProxy: true,

    request: async ({ backendPort, iteration }) => {
      return {
        request: {
          url: `http://127.0.0.1:${backendPort}/${iteration}`,
        },
      };
    },

    serve: async ({ response, request }) => {
      const output = {};
      const url = request.url;
      response.body = output.body =
        url === '/0'
          ? 'hello from server!'
          : Buffer.from('AAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8gZWZnaGlqa2xtbm9w', 'base64');
      response.status = output.status = 200;
      response.set('Access-Control-Allow-Origin', '*');
      response.set('Content-Type', url === '/0' ? 'text/plain' : 'application/octet-stream');
      return output;
    },

    proxy: async ({ mock }) => {
      mock.setMocksHarFile([mock.mockFolderFullPath, 'mocks.har']);
      mock.setMode('download');
      mock.setMocksFormat('har');
      const harFile = mock.mocksHarFile;
      await mock.process();
      return { harFile };
    },

    postProcess: async ({ data }) => {
      return getHarFile({ file: data.proxy.harFile });
    },

    defineAssertions: ({ it, getData, expect }) => {
      it('should use the response from har file (text content)', async () => {
        const expectedBody = 'hello from server!';
        const data = getData(0).data;
        expect(data.client.body).to.equal(expectedBody);
        expect(data.client.status.code).to.equal(200);
        expect(data.postProcessing.harFile.log.creator.name).to.equal('kassette'); // used har file produced by playwright
        expect(data.postProcessing.harFile.log.entries[0].response.content.text).to.equal(
          expectedBody,
        );
        expect(data.postProcessing.harFile.log.entries[0].response.content.encoding).not.to.be.a(
          'string',
        );
        const url = data.postProcessing.harFile.log.entries[0].request.url;
        const harFile = data.proxy.harFile;
        const playwright = require('playwright');
        const browser = await playwright.chromium.launch({});
        try {
          const context = await browser.newContext();
          await context.routeFromHAR(harFile);
          const page = await context.newPage();
          const body = await page.evaluate(async (url) => {
            const response = await fetch(url);
            const body = await response.text();
            return body;
          }, url);
          expect(body.toString('utf8')).to.equal(expectedBody);
          await context.close();
        } finally {
          await browser.close();
        }
      });

      it('should use the response from har file (binary content)', async () => {
        const expectedBodyBase64 = 'AAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8gZWZnaGlqa2xtbm9w';
        const expectedBody = Buffer.from(expectedBodyBase64, 'base64').toString('binary');
        const data = getData(1).data;
        expect(data.client.body).to.equal(expectedBody);
        expect(data.client.status.code).to.equal(200);
        expect(data.postProcessing.harFile.log.creator.name).to.equal('kassette'); // used har file produced by playwright
        expect(data.postProcessing.harFile.log.entries[1].response.content.text).to.equal(
          expectedBodyBase64,
        );
        expect(data.postProcessing.harFile.log.entries[1].response.content.encoding).to.equal(
          'base64',
        );
        const url = data.postProcessing.harFile.log.entries[1].request.url;
        const harFile = data.proxy.harFile;
        const playwright = require('playwright');
        const browser = await playwright.chromium.launch({});
        try {
          const context = await browser.newContext();
          await context.routeFromHAR(harFile);
          const page = await context.newPage();
          const body = await page.evaluate(async (url) => {
            const response = await fetch(url);
            const body = await response.text();
            return body;
          }, url);
          expect(body.toString('utf8')).to.equal(expectedBody);
          await context.close();
        } finally {
          await browser.close();
        }
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

    request: async ({ iteration }) => {
      return {
        request: {
          headers: {
            'x-iteration': iteration,
            'x-variant': ['mocked', 'mocked', 'remote', 'remote'][iteration],
          },
        },
      };
    },

    serve: async ({ response, request }) => {
      const output = {};
      const iteration = request.headers['x-iteration'];
      response.body = output.body = `from backend: ${iteration}`;
      response.status = output.status = 200;
      return output;
    },

    proxy: async ({ mock }, { iteration }) => {
      mock.setLocalPath([mock.localPath, mock.request.headers['x-variant']]);
      const filesRoot = mock.mockFolderFullPath;

      mock.setMode(iteration === 0 ? 'download' : 'local_or_remote');
      await mock.process();
      const wrappedPayload = mock.sourcePayload;
      return { filesRoot, wrappedPayload };
    },

    postProcess: async ({ data }) => {
      return getLocalMockInfo({ folder: data.proxy.filesRoot });
    },

    defineAssertions: ({ it, getData, expect }) => {
      it('should download the first time in download mode', async () => {
        const { data } = getData(0);
        expect(data.postProcessing.files).to.have.lengthOf(6);
      });

      it('should serve the mock when existing', async () => {
        const { data } = getData(1);
        expect(data.client.body).to.equal('from backend: 0');
      });

      it('should fetch from backend with no download when mock does not exist', async () => {
        const { data } = getData(2);
        expect(data.client.body).to.equal('from backend: 2');
        expect(data.postProcessing.files).to.have.lengthOf(0);
      });

      it('should fetch again from backend since mock was not recorded', async () => {
        const { data } = getData(3);
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

    serve: async ({ response }) => {
      const output = {};
      response.body = output.body = 'This comes from the backend and has no custom delay';
      response.status = output.status = 200;
      return output;
    },

    proxy: async ({ mock }, { iteration }) => {
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

    defineAssertions: ({ it, getData, expect }) => {
      it('should not apply custom delay when fetched from backend', async () => {
        const { data } = getData(0);
        expect(data.proxy.delay - data.client.time).to.be.at.least(
          1500,
          'The delay is not applied when fetching the payload from the backend the first time. Therefore, the actual time spent by processing the request should be way lower than the custom delay we have set high on purpose.',
        );
      });

      it('should apply custom delay when fetched locally', async () => {
        const { data } = getData(1);
        expect(data.client.time).to.be.closeTo(
          data.proxy.delay,
          35,
          'Timing is approximate, but it should be more or less corresponding to the custom delay time',
        );
      });

      it('should apply recorded delay when fetched locally and configured so', async () => {
        const initialTime = getData(0).data.client.time;
        const { data } = getData(2);
        expect(data.client.time).to.be.closeTo(
          initialTime,
          30,
          'Timing is approximate, but it should be more or less corresponding to the initial time the request spent',
        );
      });
    },
  },

  {
    name: 'raw-headers',
    description: 'check headers case and multiple headers behavior',
    iterations: 1,

    async nodeRequest({ proxyPort }) {
      const http = require('http');
      const request = http.get(`http://127.0.0.1:${proxyPort}`, {
        headers: {
          'Check-Request-Header-With-UPPER-CASE': 'value-1',
          'Check-Request-Header-Duplicate': ['line-1', 'line-2'],
        },
      });
      /** @type {import("http").IncomingMessage} */
      const response = await new Promise((resolve) => request.on('response', resolve));
      let data = '';
      response.on('data', (chunk) => (data += chunk.toString('utf8')));
      await new Promise((resolve) => response.on('end', resolve));
      return {
        data,
        rawHeaders: response.rawHeaders,
      };
    },

    serve: async ({ req, response }) => {
      const output = {};
      output.rawHeaders = req.rawHeaders;
      response.set('Check-Response-Header-With-UPPER-CASE', ['value-2']);
      response.set('Check-Response-Header-Duplicate', ['line-1', 'line-2']);
      response.status = 200;
      response.body = 'ok';
      return output;
    },

    proxy: async ({ mock }) => {
      mock.setMode('remote');
    },

    defineAssertions: ({ it, getData, expect }) => {
      it('checks request headers', () => {
        const { data } = getData(0);
        expect(data.backend.rawHeaders[0]).to.equal('Check-Request-Header-With-UPPER-CASE');
        expect(data.backend.rawHeaders[1]).to.equal('value-1');
        expect(data.backend.rawHeaders[2]).to.equal('Check-Request-Header-Duplicate');
        expect(data.backend.rawHeaders[3]).to.equal('line-1');
        expect(data.backend.rawHeaders[4]).to.equal('Check-Request-Header-Duplicate');
        expect(data.backend.rawHeaders[5]).to.equal('line-2');
      });

      it('checks response headers', () => {
        const { data } = getData(0);
        expect(data.client.data).to.equal('ok');
        expect(data.client.rawHeaders[0]).to.equal('Check-Response-Header-With-UPPER-CASE');
        expect(data.client.rawHeaders[1]).to.equal('value-2');
        expect(data.client.rawHeaders[2]).to.equal('Check-Response-Header-Duplicate');
        expect(data.client.rawHeaders[3]).to.equal('line-1');
        expect(data.client.rawHeaders[4]).to.equal('Check-Response-Header-Duplicate');
        expect(data.client.rawHeaders[5]).to.equal('line-2');
      });
    },
  },

  {
    name: 'http2-client',
    description: 'http2 client test',
    iterations: 3,

    request: async ({ proxyPort }) => {
      return {
        request: {
          url: `https://127.0.0.1:${proxyPort}`,
        },
      };
    },

    http2Serve: async ({ req, response }) => {
      const output = {};
      response.body = output.body = `from http2 backend with http version = ${req.httpVersion}`;
      response.status = output.status = 200;
      response.set('my-response-header', 'my-value');
      response.set('Access-Control-Allow-Origin', '*');
      response.set('Access-Control-Expose-Headers', '*');
      return output;
    },

    proxy: async (/** @type {import("..").HookAPI} */ { mock }, { context, iteration }) => {
      mock.setRemoteURL(context.http2RemoteURL);
      mock.setMocksFormat('har');
      mock.setMocksHarFile([mock.mockFolderFullPath, 'mocks.har']);
      if (iteration <= 1) {
        mock.setMode('download');
      } else {
        mock.setMode('local');
      }
      mock.setSaveForwardedRequestData(true);
      return { harFile: mock.mocksHarFile };
    },

    postProcess: async ({ data }) => {
      return getHarFile({ file: data.proxy.harFile });
    },

    defineAssertions: ({ it, getData, expect }) => {
      for (let iteration = 0; iteration < 3; iteration++) {
        it(`should get the data from the http2 backend (iteration ${iteration})`, async () => {
          const { data } = getData(iteration);
          expect(data.client.status.code).to.equal(200);
          expect(data.client.body).to.equal('from http2 backend with http version = 2.0');
          expect(data.client.headers['my-response-header']).to.equal('my-value');
          /** @type import("..").HarFormatEntry */
          const entry = data.postProcessing.harFile.log.entries[0];
          expect(entry.response.httpVersion).to.equal('HTTP/2.0');
          expect(entry._kassetteForwardedRequest.httpVersion).to.equal('HTTP/2.0');
          expect(entry.response.headers).to.deep.contain({ name: ':status', value: '200' });
          if (iteration === 0) {
            // the first time, there is no existing connection:
            expect(entry.timings.connect).to.be.above(0);
            expect(entry.timings.ssl).to.be.above(0);
            expect(entry.timings.ssl).to.be.below(entry.timings.connect);
            expect(entry.time).to.equal(
              entry.timings.wait +
                entry.timings.connect +
                entry.timings.send +
                entry.timings.blocked +
                entry.timings.receive,
            );
          } else {
            // the second time, the first connection is reused,
            // so there is no need to connect and do the SSL handshake:
            expect(entry.timings.connect).to.equal(-1);
            expect(entry.timings.ssl).to.equal(-1);
            expect(entry.time).to.equal(
              entry.timings.wait +
                entry.timings.send +
                entry.timings.blocked +
                entry.timings.receive,
            );
          }
        });
      }
    },
  },

  {
    name: 'do-not-upgrade-to-http2',
    description: 'http1 request from client should reach the server as http1',
    iterations: 1,

    http2Serve: async ({ req, response }) => {
      const output = {
        body: `using http ${req.httpVersion}`,
        statusCode: 200,
      };
      response.status = output.statusCode;
      response.body = output.body;
      return output;
    },

    async nodeRequest({ proxyPort }) {
      const https = require('https');
      const request = https.get(`https://localhost:${proxyPort}`, { rejectUnauthorized: false });
      const response = await new Promise((resolve) => request.on('response', resolve));
      let body = '';
      response.on('data', (chunk) => (body += chunk.toString('utf8')));
      await new Promise((resolve) => response.on('end', resolve));
      return {
        body,
        statusCode: response.statusCode,
      };
    },

    proxy: async (/** @type {import("..").HookAPI} */ { mock }, { context }) => {
      mock.setMode('remote');
      mock.setRemoteURL(context.http2RemoteURL);
    },

    defineAssertions: ({ it, getData, expect }) => {
      it('should use http/1.1 when connecting to the server', () => {
        const { data } = getData(0);
        expect(data.http2Backend.statusCode).to.equal(200);
        expect(data.http2Backend.body).to.equal('using http 1.1');
        expect(data.client.statusCode).to.equal(200);
        expect(data.client.body).to.equal('using http 1.1');
      });
    },
  },

  {
    name: 'http2-server',
    description: 'check http2 server',
    iterations: 2,

    async nodeRequest({ proxyPort, iteration }) {
      const http2 = require('http2');
      const connection = http2.connect(
        `http${iteration === 0 ? '' : 's'}://localhost:${proxyPort}`,
        { rejectUnauthorized: false },
      );
      const request = connection.request({
        [http2.constants.HTTP2_HEADER_METHOD]: 'GET',
        [http2.constants.HTTP2_HEADER_PATH]: '/',
        'check-request-header': 'value-1',
      });
      request.end();
      const response = await new Promise((resolve) => request.on('response', resolve));
      let data = '';
      request.on('data', (chunk) => (data += chunk.toString('utf8')));
      await new Promise((resolve) => request.on('end', resolve));
      await new Promise((resolve) => connection.close(resolve));
      return {
        proxyPort,
        data,
        headers: response,
      };
    },

    serve: async ({ req, response }) => {
      const output = {};
      output.headers = req.headers;
      response.set('check-response-header', 'value-2');
      response.status = 200;
      response.body = 'ok';
      return output;
    },

    proxy: async (/** @type {import("..").HookAPI} */ { mock }, { iteration }) => {
      mock.setMode('remote');
      mock.setMocksFormat('har');
      mock.setMocksHarFile([mock.mockFolderFullPath, `mocks-${iteration}.har`]);
      mock.setMode('download');
      return { harFile: mock.mocksHarFile };
    },

    postProcess: async ({ data }) => {
      return getHarFile({ file: data.proxy.harFile });
    },

    defineAssertions: ({ it, getData, expect }) => {
      for (const iteration of [0, 1]) {
        it(`checks for iteration ${iteration}`, () => {
          const { data } = getData(iteration);
          expect(data.backend.headers['check-request-header']).to.equal('value-1');

          /** @type import("..").HarFormatEntry */
          const entry = data.postProcessing.harFile.log.entries[0];
          expect(entry.request.httpVersion).to.equal('HTTP/2.0');
          expect(entry.request.headers).to.deep.contain({
            name: 'check-request-header',
            value: 'value-1',
          });
          expect(entry.request.headers).to.deep.contain({
            name: ':method',
            value: 'GET',
          });
          expect(entry.request.headers).to.deep.contain({
            name: ':scheme',
            value: iteration === 0 ? 'http' : 'https',
          });
          expect(entry.request.headers).to.deep.contain({
            name: ':authority',
            value: `localhost:${data.client.proxyPort}`,
          });
          expect(entry.request.headers).to.deep.contain({
            name: ':path',
            value: '/',
          });

          expect(data.client.data).to.equal('ok');
          expect(data.client.headers['check-response-header']).to.equal('value-2');
        });
      }
    },
  },

  {
    name: 'http2-proxy-server',
    description: 'check http2 proxy server',
    iterations: 4,

    async nodeRequest({ proxyPort, backendPort, alternativeBackendPort, iteration }) {
      const http2 = require('http2');
      const connection = http2.connect(
        `http${iteration === 0 ? '' : 's'}://localhost:${proxyPort}`,
        { rejectUnauthorized: false },
      );
      const request = connection.request({
        [http2.constants.HTTP2_HEADER_SCHEME]: iteration < 2 ? 'http' : 'https',
        [http2.constants.HTTP2_HEADER_AUTHORITY]:
          iteration < 2 ? `localhost:${backendPort}` : `localhost:${alternativeBackendPort}`,
        [http2.constants.HTTP2_HEADER_METHOD]: 'GET',
        [http2.constants.HTTP2_HEADER_PATH]: '/',
        'check-request-header': 'value-1',
      });
      request.end();
      const response = await new Promise((resolve) => request.on('response', resolve));
      let data = '';
      request.on('data', (chunk) => (data += chunk.toString('utf8')));
      await new Promise((resolve) => request.on('end', resolve));
      await new Promise((resolve) => connection.close(resolve));
      return {
        backendPort,
        alternativeBackendPort,
        data,
        headers: response,
      };
    },

    serve: async ({ req, response }) => {
      const output = {};
      output.headers = req.headers;
      response.set('check-response-header', 'value-2');
      response.status = 200;
      response.body = 'server-ok';
      return output;
    },

    alternativeServe: async ({ req, response }) => {
      const output = {};
      output.headers = req.headers;
      response.set('check-response-header', 'value-2');
      response.status = 200;
      response.body = 'alt-server-ok';
      return output;
    },

    proxy: async (/** @type {import("..").HookAPI} */ { mock }, { iteration }) => {
      mock.setRemoteURL('*');
      mock.setMocksFormat('har');
      mock.setMocksHarFile([mock.mockFolderFullPath, `mocks-${iteration}.har`]);
      mock.setMode('download');
      return { harFile: mock.mocksHarFile };
    },

    postProcess: async ({ data }) => {
      return getHarFile({ file: data.proxy.harFile });
    },

    defineAssertions: ({ it, getData, expect }) => {
      for (let iteration = 0; iteration < 4; iteration++) {
        it(`checks for iteration ${iteration}`, () => {
          const { data } = getData(iteration);
          if (iteration < 2) {
            expect(data.backend.headers['check-request-header']).to.equal('value-1');
          } else {
            expect(data.alternativeBackend.headers['check-request-header']).to.equal('value-1');
          }

          /** @type import("..").HarFormatEntry */
          const entry = data.postProcessing.harFile.log.entries[0];
          expect(entry.request.httpVersion).to.equal('HTTP/2.0');
          expect(entry.request.headers).to.deep.contain({
            name: 'check-request-header',
            value: 'value-1',
          });
          expect(entry.request.headers).to.deep.contain({
            name: ':method',
            value: 'GET',
          });
          expect(entry.request.headers).to.deep.contain({
            name: ':scheme',
            value: iteration < 2 ? 'http' : 'https',
          });
          expect(entry.request.headers).to.deep.contain({
            name: ':authority',
            value:
              iteration < 2
                ? `localhost:${data.client.backendPort}`
                : `localhost:${data.client.alternativeBackendPort}`,
          });
          expect(entry.request.headers).to.deep.contain({
            name: ':path',
            value: '/',
          });

          expect(data.client.data).to.equal(iteration < 2 ? 'server-ok' : 'alt-server-ok');
          expect(data.client.headers['check-response-header']).to.equal('value-2');
        });
      }
    },
  },

  {
    name: 'http2-connect-method-intercept',
    description: 'check http2 connect method with intercept mode',
    iterations: 1,

    async nodeRequest({ proxyPort, alternativeBackendPort }) {
      const { request } = require('https');
      const http2 = require('http2-wrapper');

      const agent = new http2.proxies.HttpsOverHttp2({
        proxyOptions: {
          url: `https://localhost:${proxyPort}`,
          rejectUnauthorized: false,
        },
      });

      /** @type {import("http").IncomingMessage} */
      const response = await new Promise((resolve, reject) =>
        request(
          `https://localhost:${alternativeBackendPort}`,
          {
            agent,
            rejectUnauthorized: false,
          },
          resolve,
        )
          .on('error', reject)
          .end(),
      );
      let data = '';
      response.on('data', (chunk) => (data += chunk.toString('utf8')));
      await new Promise((resolve) => response.on('end', resolve));
      agent.destroy();
      http2.globalAgent.destroy();
      return {
        code: response.statusCode,
        data,
        headers: response.headers,
      };
    },

    alternativeServe: async ({ response }) => {
      const output = {};
      response.body = output.body = 'from https server';
      response.status = output.status = 200;
      response.set('my-resp-header', 'my-value');
      return output;
    },

    proxy: async (/** @type {import("..").HookAPI} */ { mock }) => {
      mock.setMode('remote');
      mock.setRemoteURL('*');
    },

    onProxyConnect: async (/** @type {import("..").IProxyConnectAPI} */ request) => {
      request.setMode('intercept');
    },

    defineAssertions: ({ it, getData, expect }) => {
      it('checks response', () => {
        const { data } = getData(0);
        expect(data.client.code).to.equal(200);
        expect(data.client.data).to.equal('from https server');
        expect(data.client.headers['my-resp-header']).to.equal('my-value');
      });
    },
  },

  {
    name: 'http2-connect-method-error',
    description: 'check http2 connect method leading to an error',
    iterations: 2,

    async nodeRequest({ proxyPort }) {
      const { request } = require('https');
      const http2 = require('http2-wrapper');

      const agent = new http2.proxies.HttpsOverHttp2({
        proxyOptions: {
          url: `https://localhost:${proxyPort}`,
          rejectUnauthorized: false,
        },
      });

      try {
        /** @type {import("http").IncomingMessage} */
        await new Promise((resolve, reject) =>
          request(
            // invalid url (port 1 is supposed not to be used):
            `https://localhost:1`,
            {
              agent,
              rejectUnauthorized: false,
            },
            resolve,
          )
            .on('error', reject)
            .end(),
        );
      } catch (error) {
        agent.destroy();
        http2.globalAgent.destroy();
        return {
          error,
        };
      }
      return {};
    },

    onProxyConnect: async (/** @type {import("..").IProxyConnectAPI} */ request, { iteration }) => {
      if (iteration === 0) {
        request.setMode('forward');
      } else {
        request.setMode('close');
      }
    },

    defineAssertions: ({ it, getData, expect }) => {
      for (const iteration of [0, 1]) {
        it(`checks error for iteration ${iteration}`, () => {
          const { data } = getData(iteration);
          expect(data.client.error.code).to.equal('ERR_HTTP2_STREAM_ERROR');
          expect(data.client.error.message).to.contain('NGHTTP2_CONNECT_ERROR');
        });
      }
    },
  },

  {
    name: 'save-request-parts-folder',
    description: 'checks the behavior of setSaveXXX',
    iterations: 8,

    request() {
      return {
        request: {
          url: '/',
          method: 'POST',
          headers: {
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            hello: 'ok',
          }),
        },
      };
    },

    serve: async ({ response }) => {
      response.status = 200;
      response.body = 'ok';
    },

    proxy: async (/** @type {import("..").HookAPI} */ { mock }, { iteration }) => {
      mock.setMode('download');
      mock.setLocalPath([
        mock.localPath,
        `iteration-${iteration}`,
        await mock.checksum({ body: true, query: false }),
      ]);
      mock.setSaveChecksumContent(iteration !== 0);
      mock.setSaveDetailedTimings(iteration !== 1);
      mock.setSaveForwardedRequestData(iteration !== 2 && iteration !== 3);
      mock.setSaveForwardedRequestBody(iteration !== 3 && iteration !== 4);
      mock.setSaveInputRequestData(iteration !== 5 && iteration !== 6);
      mock.setSaveInputRequestBody(iteration !== 6 && iteration !== 7);
      return { filesRoot: mock.mockFolderFullPath };
    },

    postProcess: async ({ data }) => {
      const { readFile } = require('fs/promises');
      const { join } = require('path');
      const folder = data.proxy.filesRoot;
      const result = await getLocalMockInfo({ folder });
      result.filesContent = {};
      for (const fileName of result.files) {
        result.filesContent[fileName] = await readFile(join(folder, fileName), 'utf8');
      }
      return result;
    },

    defineAssertions: ({ it, getData, expect }) => {
      it('should respect setSaveXXX options', () => {
        for (let iteration = 0; iteration < 8; iteration++) {
          const data = getData(iteration).data.postProcessing;
          /** @type import("..").MockData */
          const entry = data.mock.data;
          const files = data.filesContent;
          // setSaveChecksumContent
          if (iteration !== 0) {
            expect(files.checksum).to.equal(
              'method\n\npathname\n\nbody\n{"hello":"ok"}\n\nquery\n\nheaders\n\ncustom data\n',
            );
          } else {
            expect(files.checksum).to.be.undefined;
          }
          // setSaveDetailedTimings
          if (iteration !== 1) {
            expect(entry.timings.dns).to.equal(-1);
            expect(entry.timings.ssl).to.equal(-1);
            expect(entry.timings.wait).to.be.above(0);
            expect(entry.timings.connect).to.be.above(0);
            expect(entry.timings.send).to.be.above(0);
            expect(entry.timings.blocked).to.be.above(0);
            expect(entry.timings.receive).to.be.above(0);
            expect(entry.time).to.equal(
              entry.timings.wait +
                entry.timings.connect +
                entry.timings.send +
                entry.timings.blocked +
                entry.timings.receive,
            );
          } else {
            expect(entry.timings).to.be.undefined;
          }
          // setSaveForwardedRequestData
          if (iteration !== 2 && iteration !== 3) {
            expect(JSON.parse(files['forwarded-request.json']).method).to.equal('post');
          } else {
            expect(files['forwarded-request.json']).to.be.undefined;
          }
          // setSaveForwardedRequestBody
          if (iteration !== 3 && iteration !== 4) {
            expect(files['forwarded-request-body.json']).to.equal('{"hello":"ok"}');
          } else {
            expect(files['forwarded-request-body.json']).to.be.undefined;
          }
          // setSaveInputRequestData
          if (iteration !== 5 && iteration !== 6) {
            expect(JSON.parse(files['input-request.json']).method).to.equal('post');
          } else {
            expect(files['input-request.json']).to.be.undefined;
          }
          // setSaveInputRequestBody
          if (iteration !== 6 && iteration !== 7) {
            expect(files['input-request-body.json']).to.equal('{"hello":"ok"}');
          } else {
            expect(files['input-request-body.json']).to.be.undefined;
          }
        }
      });
    },
  },

  {
    name: 'save-request-parts-har',
    description: 'checks the behavior of setSaveXXX',
    iterations: 8,

    request() {
      return {
        request: {
          url: '/',
          method: 'POST',
          headers: {
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            hello: 'ok',
          }),
        },
      };
    },

    serve: async ({ response }) => {
      response.status = 200;
      response.body = 'ok';
    },

    proxy: async (/** @type {import("..").HookAPI} */ { mock }, { iteration }) => {
      mock.setMode('download');
      mock.setMocksFormat('har');
      mock.setMocksHarFile([mock.mockFolderFullPath, `mocks-${iteration}.har`]);
      mock.setMockHarKey([await mock.checksum({ body: true, query: false })]);
      mock.setSaveChecksumContent(iteration !== 0);
      mock.setSaveDetailedTimings(iteration !== 1);
      mock.setSaveForwardedRequestData(iteration !== 2 && iteration !== 3);
      mock.setSaveForwardedRequestBody(iteration !== 3 && iteration !== 4);
      mock.setSaveInputRequestData(iteration !== 5 && iteration !== 6);
      mock.setSaveInputRequestBody(iteration !== 6 && iteration !== 7);
      return { harFile: mock.mocksHarFile };
    },

    postProcess: async ({ data }) => {
      return getHarFile({ file: data.proxy.harFile });
    },

    defineAssertions: ({ it, getData, expect }) => {
      it('should respect setSaveXXX options', () => {
        for (let iteration = 0; iteration < 8; iteration++) {
          /** @type import("..").HarFormatEntry */
          const entry = getData(iteration).data.postProcessing.harFile.log.entries[0];
          // setSaveChecksumContent
          if (iteration !== 0) {
            expect(entry._kassetteChecksumContent).to.equal(
              'method\n\npathname\n\nbody\n{"hello":"ok"}\n\nquery\n\nheaders\n\ncustom data\n',
            );
          } else {
            expect(entry._kassetteChecksumContent).to.be.undefined;
          }
          // setSaveDetailedTimings
          if (iteration !== 1) {
            expect(entry.timings.dns).to.equal(-1);
            expect(entry.timings.ssl).to.equal(-1);
            expect(entry.timings.wait).to.be.above(0);
            expect(entry.timings.connect).to.be.above(0);
            expect(entry.timings.send).to.be.above(0);
            expect(entry.timings.blocked).to.be.above(0);
            expect(entry.timings.receive).to.be.above(0);
            expect(entry.time).to.equal(
              entry.timings.wait +
                entry.timings.connect +
                entry.timings.send +
                entry.timings.blocked +
                entry.timings.receive,
            );
          } else {
            expect(entry.timings).to.be.undefined;
          }
          // setSaveForwardedRequestData
          if (iteration !== 2 && iteration !== 3) {
            expect(entry._kassetteForwardedRequest.method).to.equal('POST');
          } else {
            expect(entry._kassetteForwardedRequest?.method).to.be.undefined;
          }
          // setSaveForwardedRequestBody
          if (iteration !== 3 && iteration !== 4) {
            expect(entry._kassetteForwardedRequest.postData.text).to.equal('{"hello":"ok"}');
          } else {
            expect(entry._kassetteForwardedRequest?.postData).to.be.undefined;
          }
          if (iteration === 3) {
            expect(entry._kassetteForwardedRequest).to.be.undefined;
          }
          // setSaveInputRequestData
          if (iteration !== 5 && iteration !== 6) {
            expect(entry.request.method).to.equal('POST');
          } else {
            expect(entry.request?.method).to.be.undefined;
          }
          // setSaveInputRequestBody
          if (iteration !== 6 && iteration !== 7) {
            expect(entry.request.postData.text).to.equal('{"hello":"ok"}');
          } else {
            expect(entry.request?.postData).to.be.undefined;
          }
          if (iteration === 6) {
            expect(entry.request).to.be.undefined;
          }
        }
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

    serve: async ({ response }) => {
      const output = {};
      response.type = output.extension = 'yaml';
      response.body = '- some yaml';
      response.status = 200;
      return output;
    },

    proxy: async ({ mock }) => {
      mock.setMode('local_or_download');
      return { root: mock.mockFolderFullPath };
    },

    postProcess: async ({ data }) => {
      const nodePath = require('path');
      const { promises: fs, constants: fsConstants } = require('fs');

      async function getBodyFilename(dataFileName) {
        return JSON.parse(await fs.readFile(nodePath.join(data.proxy.root, dataFileName)))
          .bodyFileName;
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
        return { extension, exists };
      }

      const mock = await getExtensionAndExistence('data.json');
      const inputRequest = await getExtensionAndExistence('input-request.json');
      const forwardedRequest = await getExtensionAndExistence('forwarded-request.json');

      return { mock, inputRequest, forwardedRequest };
    },

    defineAssertions: ({ it, getData, expect }) => {
      it('should record and create the filename with the custom extension', async () => {
        const { data } = getData(0);

        expect(data.postProcessing.mock.extension).to.equal(
          data.backend.extension,
          'The proxy determines the extension based on the returned content type, and should apply it to the file name used to store the body, filename itself stored in payload',
        );
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

    proxy: async ({ mock }) => {
      mock.setMode('local');
    },

    defineAssertions: ({ it, getData, expect, useCase }) => {
      it('should receive 404 when no mock available', () => {
        const { data } = getData(0);
        expect(data.client.status.code).to.equal(404);
      });
    },
  },

  {
    name: 'local-mode-404-override',
    description:
      'user should be able to detect missing mock and return custom one, as well as persist it',
    iterations: 2,

    proxy: async (/** @type {import("..").HookAPI} */ { mock }) => {
      mock.setMode('local');

      const hasNoLocalFiles = await mock.hasNoLocalFiles();
      if (hasNoLocalFiles) {
        const payload = mock.createPayload({
          body: '...',
          data: {
            bodyFileName: 'body.txt',
            status: {
              code: 404,
            },
            time: 0,
          },
        });
        mock.setPayload(payload);
        await mock.persistPayload(payload);
      }
      return { hasNoLocalFiles };
    },

    defineAssertions: ({ it, getData, expect, useCase }) => {
      it('should be able to return a custom payload', () => {
        const { data } = getData(0);
        expect(data.client.body).to.equal('...');
        expect(data.client.status.code).to.equal(404);
        expect(data.proxy.hasNoLocalFiles).to.equal(true);
      });
      it('should be able to persist this payload', () => {
        const { data } = getData(1);
        expect(data.client.body).to.equal('...');
        expect(data.client.status.code).to.equal(404);
        expect(data.proxy.hasNoLocalFiles).to.equal(false);
      });
    },
  },

  {
    name: 'local-mode-404-override-har',
    description:
      'user should be able to detect missing mock and return custom one, as well as persist it',
    iterations: 2,

    proxy: async (/** @type {import("..").HookAPI} */ { mock }) => {
      mock.setMode('local');
      mock.setMocksFormat('har');
      mock.setMocksHarFile([mock.mockFolderFullPath, 'mocks.har']);

      const hasNoLocalMock = await mock.hasNoLocalMock();
      if (hasNoLocalMock) {
        const payload = mock.createPayload({
          body: '...',
          data: {
            bodyFileName: 'body.txt',
            status: {
              code: 404,
            },
            time: 0,
          },
        });
        mock.setPayload(payload);
        await mock.persistPayload(payload);
      }
      await mock.process();
      return { harFile: mock.mocksHarFile, hasNoLocalMock };
    },

    postProcess: async ({ data }) => {
      return getHarFile({ file: data.proxy.harFile });
    },

    defineAssertions: ({ it, getData, expect, useCase }) => {
      it('should be able to return a custom payload', () => {
        const { data } = getData(0);
        expect(data.client.body).to.equal('...');
        expect(data.client.status.code).to.equal(404);
        expect(data.proxy.hasNoLocalMock).to.equal(true);
        expect(data.postProcessing.harFile.log.entries.length).to.equal(1);
      });
      it('should be able to persist this payload', () => {
        const { data } = getData(1);
        expect(data.client.body).to.equal('...');
        expect(data.client.status.code).to.equal(404);
        expect(data.proxy.hasNoLocalMock).to.equal(false);
        expect(data.postProcessing.harFile.log.entries.length).to.equal(1);
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

    serve: async ({ response }) => {
      response.status = 404;
    },

    proxy: async ({ mock }) => {
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
            },
          });
          mock.setPayload(localPayload);
          finalPayload = localPayload;
        }
        await mock.persistPayload(finalPayload);
        mock.fillResponseFromPayload(finalPayload);
        await mock.sendResponse();
      }

      return { root: mock.mockFolderFullPath, statusCode, body };
    },

    postProcess: async ({ data }) => {
      const nodePath = require('path');
      const { promises: fs } = require('fs');

      const mockData = JSON.parse(await fs.readFile(nodePath.join(data.proxy.root, 'data.json')));

      return {
        statusCode: mockData.status.code,
        body: (await fs.readFile(nodePath.join(data.proxy.root, mockData.bodyFileName))).toString(),
      };
    },

    defineAssertions: ({ it, getData, expect, useCase }) => {
      it('should receive a custom mock when status is not 200', async () => {
        for (let iteration = 0; iteration < useCase.iterations; iteration++) {
          const { data } = getData(iteration);
          expect(data.client.status.code).to.equal(data.proxy.statusCode);
          expect(data.client.body).to.equal(data.proxy.body);
        }
      });

      it('should record the custom mock when status is not 200', async () => {
        for (let iteration = 0; iteration < useCase.iterations; iteration++) {
          const { data } = getData(iteration);
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
    description:
      'content compression should not be done by the backends respecting the given header',
    iterations: 1,

    serve: async ({ request, response }) => {
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

    proxy: async ({ mock }, { iteration }) => {
      mock.setMode('local_or_download');
      const {
        payload: { body },
      } = await (iteration === 0 ? mock.fetchPayload() : mock.readLocalPayload());
      return {
        body: body.toString(),
        root: mock.mockFolderFullPath,
      };
    },

    postProcess: async ({ data }) => {
      const nodePath = require('path');
      const { promises: fs } = require('fs');

      const mockData = JSON.parse(await fs.readFile(nodePath.join(data.proxy.root, 'data.json')));

      return {
        body: (await fs.readFile(nodePath.join(data.proxy.root, mockData.bodyFileName))).toString(),
      };
    },

    defineAssertions: ({ it, getData, expect, useCase }) => {
      it('should receive and store an uncompressed body', async () => {
        for (let iteration = 0; iteration < useCase.iterations; iteration++) {
          const { data } = getData(iteration);
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
      return {
        request: {
          url: '/pathname?query=value',
          method: 'POST',
          headers: {
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            date: new Date(),
            constant: 'value',
          }),
        },
      };
    },

    proxy: async ({ mock }) => {
      mock.setMode('local_or_download');
      const checksum = await mock.checksum({
        query: true,
        body: {
          filter(body) {
            const data = JSON.parse(body);
            delete data.date;
            return JSON.stringify(data);
          },
        },
      });
      mock.setLocalPath([mock.localPath, checksum]);

      return {
        root: mock.mockFolderFullPath,
        checksumContent: mock.checksumContent,
        checksum,
      };
    },

    postProcess: async ({ data }) => {
      const nodePath = require('path');
      const { promises: fs } = require('fs');

      let exists;
      let content = null;
      try {
        content = await fs.readFile(nodePath.join(data.proxy.root, 'checksum'));
        content = content.toString();
        exists = true;
      } catch (error) {
        exists = false;
      }

      return { exists, content };
    },

    defineAssertions: ({ it, getData, expect }) => {
      it('should have a checksum file with expected content', async () => {
        const { data } = getData(0);
        expect(data.postProcessing.exists).to.be.true;
        expect(data.postProcessing.content).to.be.equal(data.proxy.checksumContent);

        const { data: data2 } = getData(1);
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
          url: 'https://www.example.org:8081/',
        },
      };
    },
    onProxyConnect: async (/** @type {import("../..").IProxyConnectAPI} */ request) => {
      request.setMode('intercept');
    },
    proxy: async (/** @type {import("../..").HookAPI} */ { mock }) => {
      mock.setMode('local');
      mock.setPayload(
        mock.createPayload({
          body: 'myResponse',
          data: { headers: { 'Access-Control-Allow-Origin': '*' } },
        }),
      );
      return {
        connections: mock.request.connectionsStack,
        protocol: mock.request.protocol,
        hostname: mock.request.hostname,
        port: mock.request.port,
      };
    },
    defineAssertions: ({ it, getData, expect }) => {
      it('should return a custom payload', async () => {
        const { data } = getData(0);
        expect(data.client.body).to.be.equal('myResponse');
        expect(data.proxy.protocol).to.be.equal('https');
        expect(data.proxy.hostname).to.be.equal('www.example.org');
        expect(data.proxy.port).to.be.equal('8081');
        expect(data.proxy.connections.length).to.be.equal(2);
        expect(data.proxy.connections[0].protocol).to.be.equal('http');
        expect(data.proxy.connections[0].hostname).to.include('127.0.0.1');
        expect(data.proxy.connections[1].protocol).to.be.equal('https');
        expect(data.proxy.connections[1].hostname).to.be.equal('www.example.org');
        expect(data.proxy.connections[1].port).to.be.equal(8081);
      });
    },
  },

  {
    name: 'browser-proxy-forward-https-cross-domain',
    description: 'should forward an https cross-domain request',
    iterations: 1,
    browserProxy: true,
    request: async () => {
      return {
        request: {
          url: 'https://www.example.org:8081/',
        },
      };
    },
    alternativeServe: async (/** @type {import("koa").Context} */ { response }) => {
      response.body = 'alternativeResponse';
      response.set('Access-Control-Allow-Origin', '*');
      response.status = 200;
    },
    onProxyConnect: async (
      /** @type {import("../..").IProxyConnectAPI} */ request,
      { context },
    ) => {
      const url = new URL(context.alternativeRemoteURL);
      request.setDestination(url.hostname, +url.port);
    },
    proxy: async (/** @type {import("../..").HookAPI} */ { mock }) => {
      // should not be called at all
      return {};
    },
    defineAssertions: ({ it, getData, expect }) => {
      it('should return a custom payload', async () => {
        const { data } = getData(0);
        expect(data.proxy).to.be.undefined;
        expect(data.client.body).to.be.equal('alternativeResponse');
      });
    },
  },

  {
    name: 'browser-proxy-http-cross-domain',
    description: 'should intercept an http cross-domain request',
    iterations: 1,
    browserProxy: true,
    request: async () => {
      return {
        request: {
          url: 'http://www.example.org:8082/',
        },
      };
    },
    proxy: async (/** @type {import("../..").HookAPI} */ { mock }) => {
      mock.setMode('local');
      mock.setPayload(
        mock.createPayload({
          body: 'exampleResponse',
          data: { headers: { 'Access-Control-Allow-Origin': '*' } },
        }),
      );
      return {
        connections: mock.request.connectionsStack,
        protocol: mock.request.protocol,
        hostname: mock.request.hostname,
        port: mock.request.port,
      };
    },
    defineAssertions: ({ it, getData, expect }) => {
      it('should return a custom payload', async () => {
        const { data } = getData(0);
        expect(data.client.body).to.be.equal('exampleResponse');
        expect(data.proxy.protocol).to.be.equal('http');
        expect(data.proxy.hostname).to.be.equal('www.example.org');
        expect(data.proxy.port).to.be.equal('8082');
        expect(data.proxy.connections.length).to.be.equal(1);
        expect(data.proxy.connections[0].protocol).to.be.equal('http');
        expect(data.proxy.connections[0].hostname).to.include('127.0.0.1');
      });
    },
  },
];
exports.useCases = useCases;

////////////////////////////////////////////////////////////////////////////////
// Convenience
////////////////////////////////////////////////////////////////////////////////

const useCasesMap = fromPairs(useCases.map((useCase) => [useCase.name, useCase]));
exports.useCasesMap = useCasesMap;
