# kassette

kassette is a development server, used mainly for testing, which proxies requests and is able to easily manage local mocks.

To use it:

- install with `npm install kassette`
- add this command to your `package.json` scripts: `kassette -c kassette.config.js`
- and create the configuration file `kassette.config.js`:

```javascript
exports.getConfiguration = () => {
  return {
    port: 4200,
    mocksFolder: './mocks-folder',
    remoteURL: 'http://127.0.0.1:3000',
    mode: 'local_or_download',

    hook: async ({mock}) => {
      if (!mock.request.pathname.startsWith('/api/')) {
        mock.setMode('remote');
        return;
      }

      mock.setLocalPath([
        mock.request.pathname.split('/').slice(1),
        mock.request.method,
      ]);
    }
  };
}
```

Now run your script to launch the proxy!

With this configuration, input requests targeting URLs starting with `/api/` will get processed, and local mocks will be used if present, otherwise data will be downloaded from `http://127.0.0.1:3000` with a forwarded request, persisted and used for future input requests.

Check [_Getting started_](./doc/getting-started.md) to learn more.


## Main features

- optionally forward requests to a remote backend
- record backend responses for later use
- easily computed and set local mock path
- fill response to client from backend response, downloaded or persisted
- modify response to client manually
- integrates nicely into your editor and source control: a simple hierarchy of files is generated in a clean way for inspection, edition, diffing, etc.



## Installation

This is a Node.js project using npm for dependency management, so ensure you have those two properly installed. Node.js LTS onwards is supported.

With npm, you can install it in two locations:

- locally inside your project and run it the usual way (__using a npm script__ or accessing the path explicitly `node_modules/.bin/kassette`)
- or install it globally and run it using the command `kassette` (not advised for self-contained projects)

Besides where it is installed, you have at least two ways to install it:

- from the npm registry: package's name is `kassette`
- from a git clone (see below)

### Installing from a git clone

Clone this repository, and run `npm link` to install it globally on your computer.

If you want to use it globally only, then there is nothing more to do.

If you want to install it locally though, you need to add one more step. You won't be able to use a `package.json` dependency, but you can install it manually using `npm link kassette` from inside your project.





## User documentation

It is advised to start with the [_Getting started_](./doc/getting-started.md) article which describes a few practical usage examples, then check the reference for the [configuration](./doc/configuration.md) and the [API](./doc/api.md).





## Developing / Contributing

See [developer guide](./DEVELOPER.md) for details.
