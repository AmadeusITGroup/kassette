# kassette

[![npm](https://img.shields.io/npm/v/@amadeus-it-group/kassette)](https://www.npmjs.com/package/@amadeus-it-group/kassette)
[![codecov](https://codecov.io/gh/AmadeusITGroup/kassette/branch/master/graph/badge.svg)](https://codecov.io/gh/AmadeusITGroup/kassette)

<p align="center">
  <img src="doc/assets/images/kassette-logo.png" alt="kassette-logo" width="200px" height="90px"/>
  <br>
  <i>kassette is a development server, used mainly for testing, which proxies requests and
    <br>is able to easily manage local mocks.</i>
  <br>
</p>

To use it:

- install with `npm install @amadeus-it-group/kassette`
- add this command to your `package.json` scripts: `kassette -c kassette.config.js`
- and create the configuration file `kassette.config.js`:

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

Now run your script to launch the proxy!

With this configuration, input requests targeting URLs starting with `/api/` will get processed, and local mocks will be used if present, otherwise data will be downloaded from `http://127.0.0.1:3000` with a forwarded request, persisted and used for future input requests.

Note that kassette can also be configured to run as a browser proxy, reading the target URL from the request, and intercepting HTTPS communications.

Check [_Getting started_](./doc/getting-started.md) to learn more.

## Main features

- optionally forward requests to a remote backend
- record backend responses for later use
- easily computed and set local mock path
- fill response to client from backend response, downloaded or persisted
- modify response to client manually
- can optionally act as the browser proxy
- generate TLS certificates on the fly to intercept HTTPS communications (as a man-in-the-middle)
- integrates nicely into your editor and source control: a simple hierarchy of files is generated in a clean way for inspection, edition, diffing, etc.
- supports the [HAR format](http://www.softwareishard.com/blog/har-12-spec/) to record and replay mocks, either in JSON or in YAML
- supports HTTP/1.x and HTTP/2.0 both in client and server

## Installation

This is a Node.js project using npm for dependency management, so ensure you have those two properly installed. Node.js LTS onwards is supported.

With npm, you can install it in two locations:

- locally inside your project and run it the usual way (**using a npm script** or accessing the path explicitly `node_modules/.bin/kassette`)
- or install it globally and run it using the command `kassette` (not advised for self-contained projects)

Besides where it is installed, you have at least two ways to install it:

- from the npm registry: package's name is `@amadeus-it-group/kassette`
- from a git clone (see below)

### Installing from a git clone

Clone this repository, and run `npm link` to install it globally on your computer.

If you want to use it globally only, then there is nothing more to do.

If you want to install it locally though, you need to add one more step. You won't be able to use a `package.json` dependency, but you can install it manually using `npm link @amadeus-it-group/kassette` from inside your project.

## User documentation

It is advised to start with the [_Getting started_](./doc/getting-started.md) article which describes a few practical usage examples, then check the [configuration guide](./doc/configuration.md) and the [API guide](./doc/api.md). The [API reference](https://amadeusitgroup.github.io/kassette/kassette.html) is also available.

## Developing / Contributing

See [developer guide](./DEVELOPER.md) for details.
