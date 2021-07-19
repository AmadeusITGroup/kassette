kassette is a customizable proxy server, focused on handling mocking and persistence of requests made to one or more backends.

Table of contents:

<!-- TOC -->

- [Usage by examples](#usage-by-examples)
  - [Run with a simple configuration file](#run-with-a-simple-configuration-file)
  - [Run with a simple hook](#run-with-a-simple-hook)
  - [Run with an advanced hook](#run-with-an-advanced-hook)
  - [Override configuration file options with CLI options](#override-configuration-file-options-with-cli-options)
  - [Run as a browser proxy](#run-as-a-browser-proxy)
  - [Filter TLS connections to intercept as a browser proxy](#filter-tls-connections-to-intercept-as-a-browser-proxy)
  - [Get help in the terminal](#get-help-in-the-terminal)
  - [Run with no option](#run-with-no-option)
- [Configuration](#configuration)
- [Learn more](#learn-more)

<!-- /TOC -->

<a id="markdown-usage-by-examples" name="usage-by-examples"></a>

# Usage by examples

<a id="markdown-run-with-a-simple-configuration-file" name="run-with-a-simple-configuration-file"></a>

## Run with a simple configuration file

Run `kassette -c kassette.config.js` with `kassette.config.js` file:

```javascript
/**
 * @return { import("@amadeus-it-group/kassette").ConfigurationSpec }
 */
exports.getConfiguration = () => {
  return {
    port: 4200,
    mocksFolder: './mocks-folder',
    remoteURL: 'http://127.0.0.1:3000',
    mode: 'local_or_download',
  };
};
```

The option `-c` is used to specify the configuration file. The configuration file is an executable file which must export a `getConfiguration` function, which can be asynchronous if needed, and returns the configuration object.

This will:

- run the proxy on port `4200`
- store local mock files under the tree `./mocks-folder`
- serve data persisted in the local files if present, otherwise will forward request to a backend accessible at `http://127.0.0.1:3000`, persist the response for next requests and serve it

Thanks to default behavior it will also:

- use a local path built with the URL pathname followed by the HTTP method of the input request

<a id="markdown-run-with-a-simple-hook" name="run-with-a-simple-hook"></a>

## Run with a simple hook

Run `kassette -c kassette.config.js` with `kassette.config.js` file:

```javascript
/**
 * @return { import("@amadeus-it-group/kassette").ConfigurationSpec }
 */
exports.getConfiguration = () => {
  return {
    port: 4200,
    mocksFolder: './mocks-folder',
    remoteURL: 'http://127.0.0.1:3000',
    mode: 'local_or_download',

    hook: async ({ mock }) => {
      if (!mock.request.pathname.startsWith('/api/')) {
        mock.setMode('remote');
        return;
      }

      mock.setLocalPath([mock.request.pathname.split('/').slice(1), mock.request.method]);
    },
  };
};
```

The `hook` property is the new thing here, and constitutes the core of the tool: it is called for every input request, and allows to handle it as well as its associated mock, by tweaking configuration for this instance and/or using APIs to interact with it and its data.

This will:

- run the proxy on port `4200`
- store local mock files under the tree `./mocks-folder`
- **by default** serve data persisted in the local files if present, otherwise will forward request to a backend accessible at `http://127.0.0.1:3000`, persist the response for next requests and serve it
- **except for** requests whose pathname starts with `/api/`, in which case the proxy acts a a pass-through
- use a mock local path built with the significant URL pathname (without the common leading `/api`) followed by the HTTP method of the input request
  <a id="markdown-run-with-an-advanced-hook" name="run-with-an-advanced-hook"></a>

## Run with an advanced hook

Run `kassette -c kassette.config.js` with `kassette.config.js` file:

```javascript
/**
 * @return { import("@amadeus-it-group/kassette").ConfigurationSpec }
 */
exports.getConfiguration = async () => {
  return {
    // default properties for the "mock" instance
    port: 4200,
    mocksFolder: './mocks-folder',
    remoteURL: 'http://127.0.0.1:3000',
    mode: 'local_or_download',

    // hook
    hook: async ({mock}) => {
      //////////////////////////////////////////////////////////////////////////
      // Ignore requests not related to your API (e.g. statics)
      // and serve them normally by setting the mode to 'remote'
      //////////////////////////////////////////////////////////////////////////

      if (!mock.request.pathname.startsWith('/api/')) {
        mock.setMode('remote');
        return;
      }



      //////////////////////////////////////////////////////////////////////////
      // Change the local path of the mock for the current request,
      // by removing the first part of the URL pathname,
      // which would always contain "api" here,
      // and append the HTTP method at the end.
      // Also, by joining the parts, make sure there's a flat structure instead
      // of a tree of folders
      //////////////////////////////////////////////////////////////////////////

      mock.setLocalPath([
        ...mock.request.pathname.split('/').slice(1),
        mock.request.method,
      ].join('-'));



      //////////////////////////////////////////////////////////////////////////
      // If local files are matching this request
      // (i.e. local files are present under the path you just computed),
      // serve them.
      // Otherwise, download the payload from the remote backend
      // to record it and serve it.
      // The reason to do this "manually" using the API is to handle the case
      // of a 404 response. In this case an empty mock is generated
      // (you can later on fill/alter its manually if you will)
      //////////////////////////////////////////////////////////////////////////

      if (await mock.hasLocalFiles()) { return; }

      mock.setMode('manual');
      let wrappedPayload = await mock.downloadPayload();
      if (wrappedPayload.payload.data.status.code === 404) {
        wrappedPayload = mock.createPayload({
          data: {
            headers: {
              'content-type': 'application/json',
            },
            ignoredHeaders: {}
            status: {
              code: '200',
              message: 'OK',
            },
            bodyFileName: 'body.json'
            time: 20,
          }
          body: '{}',
        });
        await mock.persistPayload(wrappedPayload);
      }
      mock.fillResponseFromPayload(wrappedPayload);
      await mock.sendResponse();
    }
  };
}
```

Besides the basic properties already explained for previous use cases, this will also:

- simply forward any request whose URL is not starting with `/api/`
- customize the path of the local files to have a flat hierarchy based on the request URL and HTTP method, using a dash (`-`) as a separator
- replace any remote payload having a status code `404` by a custom empty payload (persisting it for subsequent requests and serving it)

<a id="markdown-override-configuration-file-options-with-cli-options" name="override-configuration-file-options-with-cli-options"></a>

## Override configuration file options with CLI options

Run `kassette -c kassette.config.js -p 8000 --folder ./snapshots` with `kassette.config.js` file:

```javascript
/**
 * @return { import("@amadeus-it-group/kassette").ConfigurationSpec }
 */
exports.getConfiguration = async () => {
  return {
    // overridden by command line, will be 8000 eventually
    port: 4200,
    remoteURL: 'http://127.0.0.1:3000',
    mode: 'local_or_download',
    // mocksFolder not specified, since specified in command line
  };
};
```

- `port` gets overridden by command line
- `mocksFolder` gets specified by command line

<a id="markdown-run-as-a-browser-proxy" name="run-as-a-browser-proxy"></a>

## Run as a browser proxy

Run: `kassette -u '*' -m remote`

This starts kassette as a browser proxy. Using kassette as the browser proxy allows to easily intercept all requests made by the browser without having to change any URL.

The `-u '*'` argument means that kassette will read from each request which remote server to target for that request (as it is transmitted when using a browser proxy).

The `-m remote` argument means kassette will transfer the requests to the remote server and will not store anything locally.

Once kassette is started, you have to configure your browser to use kassette as its proxy. For example, if you use [playwright](https://playwright.dev), you can run start it with the `--proxy-server` argument, and also with the `--ignore-https-errors` argument to allow kassette to intercept https communications with its own self-signed root certificate without warnings from the browser:

```sh
# you can also use ff (Firefox) or wk (WebKit) instead of cr (Chromium) below:
npx playwright cr --proxy-server=http://127.0.0.1:8080 --ignore-https-errors
```

<a id="markdown-filter-tls-connections-to-intercept-as-a-browser-proxy" name="filter-tls-connections-to-intercept-as-a-browser-proxy"></a>

## Filter TLS connections to intercept as a browser proxy

Run `kassette -c kassette.config.js` with `kassette.config.js` file:

```javascript
/**
 * @return { import("@amadeus-it-group/kassette").ConfigurationSpec }
 */
exports.getConfiguration = () => {
  return {
    port: 4200,
    mocksFolder: './mocks-folder',
    remoteURL: '*',
    proxyConnectMode: 'forward',
    mode: 'local_or_download',

    onProxyConnect: async (request) => {
      if (request.hostname.endsWith('.mydomain.com') && request.port === 443) {
        // override the config to intercept TLS connections to *.mydomain.com
        // those requests will pass through the hook method
        request.setMode('intercept');
      }
      // otherwise, proxyConnectMode: 'forward' will be used (as defined in the config)
      // those requests will go without decryption directly to the destination server,
      // so they will not pass through the hook method
    },

    hook: async ({ mock }) => {
      mock.setLocalPath([
        // include the protocol, hostname and port in the local path
        mock.request.protocol,
        mock.request.hostname,
        mock.request.port,
        mock.request.pathname.split('/'),
        mock.request.method,
      ]);
    },
  };
};
```

<a id="markdown-get-help-in-the-terminal" name="get-help-in-the-terminal"></a>

## Get help in the terminal

Run `kassette -h` or `kassette --help` to get help in the terminal.

Example output:

```
kassette version 1.0.1

Options:
  -h, --help                             Show help  [boolean]
  -c, --conf, --config, --configuration  path to configuration file
  -q, --quiet, --skip-logs               skip logs  [boolean]
      --hostname, --host                 hostname on which to run the server  [string]
  -p, --port                             port on which to run the server  [number]
  -u, --url, --remote, --remote-url      remote server url  [string]
  -f, --folder, --mocks-folder           path to mocks base folder  [string]
  -m, --mode                             server mode  [choices: "download", "local_or_download", "local_or_remote", "local", "remote", "manual"]
  -x, --proxy-connect-mode               proxy connect mode  [choices: "close", "intercept", "forward", "manual"]
  -k, --tls-ca-key                       path to a PEM-encoded CA certificate and key file, created if it does not exist.  [string]
  -d, --delay                            mock response artificial delay
  -v, --version                          Show version number  [boolean]

Examples:
  kassette -c proxy.config.js  Start proxy with configuration file proxy.config.js

Please visit repository for more information: https://github.com/AmadeusITGroup/kassette
```

<a id="markdown-run-with-no-option" name="run-with-no-option"></a>

## Run with no option

It is also possible to run `kassette` with no option, but besides checking that the product properly runs, this won't be useful for real usage.

We are trying to set sensible and consistent default options, but the goal of the tool is also to work in different modes for different development stages, so at some point you will be setting specific options.

<a id="markdown-configuration" name="configuration"></a>

# Configuration

The central piece of customization is a [configuration system](./configuration.md), and its most important element is the `hook` function, which is called upon incoming requests, and is controlling the behavior of the proxy to react to each request.

<a id="markdown-learn-more" name="learn-more"></a>

# Learn more

- [configuration](./configuration.md): to learn about the customization
- [API](./api.md): to learn mainly how to use the `hook` or how to use the proxy from the API
- [philosophy](./philosophy.md): if you want to know more about the design principles of the tool and its API/usage
