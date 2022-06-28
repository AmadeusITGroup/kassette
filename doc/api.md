<a id="markdown-mock-instance" name="mock-instance"></a>

# Mock instance

This is the instance passed to the `hook` function, under property `mock` of the single argument object — <code>hook: ({<b>mock</b>}) => {...}</code>.

<a id="markdown-managing-paths" name="managing-paths"></a>

## Mocks format

- `mocksFormat`: the format to use to store mocks
- `setMocksFormat(value)` set the `mocksFormat` value

kassette can store mocks in two different formats: `folder` or `har`.

The default value of the global `mocksFormat` setting is `folder`, except in the following case: if the global `mocksHarFile` setting is defined and the global `mocksFolder` setting is not defined, then the default value of the global `mocksFormat` setting is `har`.

### `folder` format

When `mocksFormat` is `folder`, kassette stores each request with its response in one folder containing up to 7 files, as described below.

In below file names, `[ext]` is an extension computed based on the actual type of the content in the file. If no extension could be determined, the file will actual drop the `.[ext]` part.

Mock files:

- `data.json`: headers, status code and message, request time, creation date and body file name
- `body.[ext]`: the content of the body of the backend response

Input request (from client to proxy), for debug:

- `input-request-data.json`: headers, method, URL and body file name
- `input-request-body.[ext]`: the content of the body

Forwarded request (from proxy to backend), for debug:

- `forwarded-request-data.json`: headers, method, URL, whether body was eventually a `string` or a `Buffer` and body file name
- `forwarded-request-body.[ext]`: the content of the body

Checksum: as described in dedicated section, if a checksum was computed, the content generated to compute it will be output in a file named `checkum`.

Apart from the two first files from this list (`data.json` and `body.[ext]`), which are mandatory to be able to replay mocks, the generation of all the other files is mostly only useful to debug and can be disabled with the following settings:

- `saveInputRequestData`
- `saveInputRequestBody`
- `saveForwardedRequestData`
- `saveForwardedRequestBody`
- `saveChecksumContent`

Also, the `saveDetailedTimings` setting can be used to control whether detailed timings (`blocked`, `dns`, `connect`, `send`, `wait`, `receive`, `ssl`) are stored in the `timings` field in the `data.json` file (in addition to the global `time` field).

#### Mocks root path

You likely won't have to change that, since most of the time you will want to keep your mocks under a same root folder, the distinction being made by calling `setLocalPath` instead (see below).

- `mocksFolder`: the root folder of all mocks
- `setMocksFolder(value)`: set `mocksFolder` value by providing any combination of arrays of path parts, as for `setLocalPath`. You can pass an absolute path, or a relative one which will be resolved against `options.root`.

#### Instance path

- `mockFolderFullPath`: the full, absolute path of the mock, built from `localPath`/`defaultLocalPath`, `mocksFolder` and possibly `options.root` ([see below](#accessing-global-configuration)) if `mocksFolder` is not absolute
- `localPath`: the local path of the mock, relative to `mocksFolder`. Can be set by the user, otherwise will be the default value `defaultLocalPath`
- `defaultLocalPath`: the default local path of the mock, relative to `mocksFolder`. It uses the URL pathname to build an equivalent folders hierarchy, and appends the HTTP method as a leaf folder.
- `setLocalPath(value)`: set `localPath` by providing any combination of arrays of path parts.

  Examples:

  - `setLocalPath([mock.request.method, mock.request.pathname])` will use the HTTP method followed by the URL pathname
  - `setLocalPath([prefix, mock.request.pathname.split('/').slice(2), addSuffix ? [suffix, '-static-suffix'] : null])` will concatenate
    - `prefix`
    - all portions of the URL pathname except the first one (also excluding the very first one which is empty since `pathname` has a leading slash)
    - optionally a suffix sequence depending on a boolean

### `har` format

When `mocksFormat` is `har`, kassette can store several requests/responses in the same har file.

kassette mostly follows the [har format specification](http://www.softwareishard.com/blog/har-12-spec/).

Some parts of the specification are not implemented and some custom fields are added, as described in the [API reference](https://amadeusitgroup.github.io/kassette/kassette.harformatentry.html).

As with the `folder` format, it is possible to control what is included in the har file through the following settings:

- `saveInputRequestData`
- `saveInputRequestBody`
- `saveForwardedRequestData`
- `saveForwardedRequestBody`
- `saveChecksumContent`
- `saveDetailedTimings`

#### har file location

- `mocksHarFile`: contains the full path to the har file to use
- `setMocksHarFile(value)`: sets the `mocksHarFile` value by providing any combination of arrays of path parts, as for `setMocksFolder`. You can pass an absolute path, or a relative one which will be resolved against `options.root`.

#### key inside the har file

- `mockHarKey`: key under which the entry will be read or written in the har file. Can be set by the user, otherwise will be the default value `defaultMockHarKey`. How the key is stored in the har file depends on the har key manager.
- `defaultMockHarKey`: specifies the default mock har key to use in case `setMockHarKey` is not called with a non-null value. It is computed by calling the har key manager with the current request. With the default har key manager, it is the concatenation of the HTTP method with the full URL, separated by a forward slash.
- `setMockHarKey(value)`: sets the `mockHarKey` value. If an array is set (which can be nested), it is flattened with null items removed, and joined with forward slashes to produce a string.

#### har key manager

Each entry in a har file is supposed to have a corresponding unique key (a string). The har key manager is both a getter and a setter for the key of an entry.

The har key manager is a function that is called either to get the key of an entry (when the key parameter is undefined) or to set it (when the key parameter is defined).

Here is the default har key manager:

```ts
export const defaultHarKeyManager: HarKeyManager = (entry: HarFormatEntry, key?: string) => {
  const defaultKey = joinPath(
    entry._kassetteMockKey ?? [entry.request?.method, entry.request?.url],
  );
  if (key && key !== defaultKey) {
    entry._kassetteMockKey = key;
    return key;
  }
  return defaultKey;
};
```

The har key manager should not modify the entry when the key parameter is undefined.

When the key parameter is defined, the har key manager is supposed to change the provided entry, in order to store the key in it, because after the call, the entry will be persisted in the har file. In this case, the key parameter either comes from a call to `setMockHarKey`, or from `defaultMockHarKey`.

In order to compute the `defaultMockHarKey` property, the har key manager is called with an entry that includes the request but not the response (and with an undefined key parameter).

In all cases, the har key manager is expected to return the key of the entry. If an array is returned (which can be nested), it is flattened with null items removed, and joined with forward slashes to produce a string.

The default har key manager is expected to work fine for most use cases, especially when working with a har file recorded with kassette. With the default har key manager, if a key is set with `setMockHarKey`, it is stored in the `_kassetteMockKey` field. Otherwise, the default key is the concatenation of the request method and url, with a separating forward slash. It can be useful to replace the default har key manager with a custom one especially when working with har files that are produced by other applications than kassette, if the default key is not convenient.

- `mocksHarKeyManager`: contains the mocks har key manager to use for this request
- `setMocksHarKeyManager(value)`: sets the `mocksHarKeyManager` value

### Checksum

#### Introduction

`checksum({type?, format?, method?, pathname?, body?, query?, headers?, customData?})`: **compute a checksum using content from the request**. See details below.

It is semantically equivalent to choosing what matters to differentiate a request to another. Thanks to the computed checksum, you will be able to add it to the path of the mock and that way use different mocks for semantically different requests.

But it is difficult to predict what will actually be relevant or not for you, and that's why we provide many options to include/exclude data.

But first of all, a few properties related to how to output the checksum:

- `type`: customize the checksum type. Check Node.js API for more information: [`crypto.createHash(type)`](https://nodejs.org/api/crypto.html#crypto_crypto_createhash_algorithm_options). Default value is `sha256`.
- `format`: customize the output format. Check Node.js API for more information: [`hash.digest(format)`](https://nodejs.org/api/crypto.html#crypto_hash_digest_encoding). Default value is `hex`.

#### Content options

To include or exclude data, not every kind of data has the same complexity. For instance, the HTTP method is simple: use it or don't use it. But for things like query parameters, headers, body: you might want to select/filter.

Here are the options you can give:

- `protocol`:
  - content: protocol (normalized to lower case) such as `http` or `https`, without the trailing `:`
  - possible values:
    - `true` to include it, `false` to exclude it
    - an object `{include: true|false}` which has the same meaning as above (provided for consistency with other options below)
  - default value: `false`
- `hostname`:
  - content: host name (normalized to lower case)
  - possible values:
    - `true` to include it, `false` to exclude it
    - an object with properties:
      - `include`: `true` or `false`, same meaning as above
      - `filter(hostname: string) => string`: a function used to filter the content of the hostname
  - default value: `false`
- `port`:
  - content: port number or an empty string when using the default port for the protocol
  - possible values:
    - `true` to include it, `false` to exclude it
    - an object `{include: true|false}` which has the same meaning as above (provided for consistency with other options below)
  - default value: `false`
- `method`:
  - content: HTTP method (normalized to lower case)
  - possible values:
    - `true` to include it, `false` to exclude it
    - an object `{include: true|false}` which has the same meaning as above (provided for consistency with other options below)
  - default value: `false` (since method is in default mock's path)
- `pathname`:
  - content: URL's pathname
  - possible values:
    - `true` to include it, `false` to exclude it
    - an object with properties:
      - `include`: `true` or `false`, same meaning as above
      - `filter(pathname: string) => string`: a function used to filter the content of the pathname
  - default is `false` (since pathname is in default mock's path)
- `body`:
  - content: body/payload
  - possible values:
    - `true` to include it, `false` to exclude it
    - an object with properties:
      - `include`: `true` or `false`, same meaning as above
      - `filter(body: Buffer) => Buffer | string`: a function used to filter the content of the body
  - default is `true`, including the whole body without filtering
- `query`:
  - content: query parameters
  - possible values:
    - `true` to include it, `false` to exclude it. Also, the `caseSensitive` option described below is used with its default value in this case.
    - an object with properties:
      - `include`: `true` or `false`, same meaning as above
      - `filter(parameters: object) => object`: a function used to filter the query parameters. **Note that if filter is provided, the options following below are ignored**, that would be duplicate.
      - `caseSensitive`: whether keys should be treated case sensitive or not. `true` by default. When set to `false`, output object contains lower cased keys.
      - whitelist/blacklist options:
        - `mode`: `'whitelist'` (default) or `'blacklist'`
        - `keys`: a list of keys to keep if in `whitelist` mode or to reject if in `blacklist` mode. If `caseSensitive` is `false`, comparison of keys is not case sensitive.
  - default is `true`, including all the query parameters
- `headers`, same as for `query`, except:
  - content: HTTP headers
  - default value: `false`, because otherwise it would include all headers, and some might be always different (like dates for instance)
  - `caseSensitive` is `false` by default
- `customData`: any custom value which can be JSON stringified

Note that all given filtering functions can be synchronous or asynchronous.

Also note that if you provide one of the options, giving a configuration object but omitting the `include` property: it will be `true` by default. That makes sense because if you configure the way one piece of content is included, you might want it to be included by default. Having `include` is a way to easily enable/disable a piece of content using a variable, while for instance having a generic filter along with it.

Example:

```javascript
const checksum = await mock.checksum({
  type: 'MD5',
  format: 'binary',

  method: true, // equivalent to {include: true}
  protocol: true,
  hostname: true,
  port: true,
  pathname: {
    // but not necessary, we will omit it for other properties
    include: true,
    // remove first part of pathname (pathname starts with leading slash)
    filter: pathname => [''].concat(pathname.split('/').slice(2)).join('/'),
  },
  body: {
    // remove all occurrences of given id pattern
    filter: body => body.toString().replace(/.../g, '...'),
  },
  query: {
    include: queryRelevant, // would be a boolean variable
    mode: 'blacklist',
    keys: ['id'], // would keep all except "id" parameter
  },

  headers: {
    // would remove all headers which are dates (using a fictive function "isDate")
    filter: headers => {
      const output = {};
      for (const [key, value] of Object.entries(headers)) {
        if (!isDate(value)) output[key] = value;
      }
      return output;
    }
  },

  customData: ..., // because we never want to block the users of our APIs
})
```

#### Output

The method returns the actual checksum value, that you can then use for instance to add to the mock's path.

It also stores the computed content in property `checksumContent` (in the `mock` object), as a string. It is built according to your options and the request's data and used to compute the checksum. This can be handy for debugging.

Note that we designed the API so that it is usually not needed to call the `checksum` method more than once for a given request/mock.

Also, checksum data is persisted, so that you can debug more easily, especially by committing it into your SCM to analyze changes across versions of your code. File is along with the other files of the mock under file name `checksum`.

<a id="markdown-managing-behavior" name="managing-behavior"></a>

## Managing behavior

### Delay

The delay that will be used to send the response to the client when the data is taken from the local mock is computed like this:

- default value is taken from the global user configuration, and resolution continues as described below
- if value is a number it will be used directly
- if value is `'recorded'`:
  - if the local mock has been read already, will return the value recorded in it
  - if the local mock has not been read or doesn't exist, will return the value used for empty/default mocks

API:

- `delay`: get the currently computed delay, either from explicitly set input or from the default value from the global configuration
- `setDelay(delay)`: set the delay, any value as described above (`'recorded'` or a number), or pass `null` to unset it and use the default value

### Mode

The mode drives how `getPayloadAndFillResponse()` and `process()` will behave:

- `'manual'`: don't do anything, leaving the responsibility to the user to call proper APIs to manage local files and/or backend querying, and response filling
- `'remote'`: forward the request to the remote backend and never touch the local mock
- `'download'`: get payload from remote backend by forwarding request, create the local mock from this payload, and fill the response with it
- `'local_or_remote'`:
  - if local mock exists, read it and fill the response with it
  - if local mock doesn't exist, do as for `'remote'` mode
  - typical use case: play with backend while basing part of the API on mocks
- `'local_or_download'`:
  - if local mock exists, read it and fill the response with it
  - if local mock doesn't exist, do as for `'download'` mode
  - typical use case: complete missing mocks but keep existing ones intact
- `'local'`:
  - if local mock exists, read it and fill the response with it
  - if local mock doesn't exist, create a minimal payload with a 404 status code, do not persist it and fill the response with it

API:

- `mode`: get the current mode, either explicitly set or the default value from the global configuration
- `setMode(mode)`: set the mode, any value as described above (`'manual'`, `'remote'`, `'local_or_download'`, `'local'`), or pass `null` to unset it and use the default value

### Remote backend

The URL of the remote backend, from which only **protocol**, **hostname** and **port** are used.

The default value is the special `"*"` value, which means reading from the request the remote backend to target. This is useful when using kassette as a browser proxy.

Can be set to `null` or `""`, in which case anything leading to sending the request to the remote backend will trigger an exception and stop the program.

API:

- `remoteURL`: get the current remote URL, either explicitly set or the default value from the global configuration, which can be `null`
- `setRemoteURL(url)`: set the remote URL, or pass `null` to unset it and use the default value

<a id="markdown-the-payload-model" name="the-payload-model"></a>

## The Payload model

The payload represents the content of a response from the backend, no matter if it actually comes from it or if it was created manually.

From the payload, response to the client can be filled.

The payload can also be persisted and read, to avoid contacting the backend later on.

### Properties

A payload is considered read-only, so all of the properties below are read-only. When creating the payload manually, you need to specify all the properties.

- `data`
  - `headers`: map of registered headers, excluding the ignored headers
  - `ignoredHeaders`: map of ignored headers
    - `'content-length'`: because the modification of the response body will change the content length anyways
  - `status`: an object `{code, message}`, containing the status code as a number and the status message as a string
  - `bodyFileName`: the path to the file containing the `body` content, relative to the mock's `mockFolderFullPath`
  - `time`: the time it took to receive the response from the backend, in milliseconds
- `body`: the body content, as a `Buffer` or a string

### Payload with origin

Most of the APIs accept and return a wrapped payload, which has the following properties:

- `payload`: the actual payload as described above
- `origin`: the source of the payload, which can have these values:
  - `'local'`: if the payload was read from local mock
  - `'remote'`: if the payload was fetched from the remote backend by forwarding the request
  - `'user'`: if the payload has been created from the user, manually using `createPayload(payload)`
  - `'proxy'`: if the payload has been created from kassette itself, especially for `404 Not found` errors (in `'local'` mode) and `502 Bad Gateway` errors (when kassette cannot reach the remote server)

### Creating payloads

- for persisted payload (local files), see below the section ["Managing local files"](#managing-local-files)
- `async fetchPayload(): wrappedPayload`: forward the client request to the remote backend and get a wrapped payload from the response in output
- `createPayload(payload): wrappedPayload`: create a wrapped payload from the given payload data
- `setPayload(payload)`: set the current local payload, with a custom one you would have created

### Filling the response with a payload

- `fillResponseFromPayload(wrappedPayload)`: use data present in given wrapped payload to fill in the response
- `sourcePayload`: as soon as response is filled with a payload, holds the reference to this payload's wrapper (wrapper is useful here to know where does the payload used for the response come from); before that it is `undefined`

<a id="markdown-managing-local-files" name="managing-local-files"></a>

## Managing local mocks

### Existence

- `async hasLocalMock()`: returns `true` if there is a local mock for the current request, or `false` otherwise
- `async hasNoLocalMock()`: the opposite of `hasLocalMock`, for convenience

### Read/Write

- `async readLocalPayload()`: returns a wrapped payload built from data persisted in local mock. If no local mock is present, returns `undefined`
- `async persistPayload(wrappedPayload)`: takes the given wrapped payload and persists it in a local mock

<a id="markdown-processing" name="processing"></a>

## Processing

### Convenient methods

- `async downloadPayload(): wrappedPayload`: combine `fetchPayload()` and `persistPayload(wrappedPayload)` and return the wrapped payload
- `async readOrDownloadPayload(): wrappedPayload`: return the wrapped local payload if exists using `readLocalPayload()`, otherwise use `downloadPayload()` and return this wrapped payload
- `async readOrFetchPayload(): wrappedPayload`: return the wrapped local payload if exists using `readLocalPayload()`, otherwise use `fetchPayload()` and return this wrapped payload
- `async readLocalPayloadAndFillResponse()`: combine `readLocalPayload()` and `fillResponseFromPayload(wrappedPayload)` if there is a local payload, returning `true`, otherwise do nothing and return `false`
- `async getPayloadAndFillResponse()`: depending on the `mode`, get the payload (remote / local / default) and use `fillResponseFromPayload(wrappedPayload)` with that payload. If mode is `'manual'` do nothing.

### Main processing

**`process()` is automatically called AFTER the user hook function is executed**. See description to know how to prevent this.

- `async sendResponse()`: send the response back to the client, with the previously specified delay if payload is not remote
- `async process()`: combine `getPayloadAndFillResponse()` and `sendResponse()`
  - if mode is `'manual'` do nothing. That's the way to prevent anything useless or not wanted to be done automatically for you after the hook has finished executing.
  - it uses a private guard to make sure it is executed only once. Therefore, if you call it in the hook, the automatic call made for you after the hook execution will actually not do anything (same if you call it yourself multiple times).

<a id="markdown-getting-request-information" name="getting-request-information"></a>

## Getting request information

The mock instance contains a property `request`, with the API described below.

### Main

- `original`: the original Node.js object representing the request. Use it if you can't do what you want with this current wrapper.

### URL

- `url`: the URL as a Node.js `URL` object
- `protocol`: the protocol part of the URL such as `http` or `https`, without the trailing `:`
- `hostname`: the hostname part of the URL (not including the port number, if any)
- `port`: the port part of the URL (if different from the default port for the protocol)
- `pathname`: the path part of the URL, including the leading `/` (but not including the anchor/hash nor the query/search)
- `queryParameters`: the query/search parameters taken from the URL, as a read-only map of strings

### Others

- `headers`: the headers, as defined on the `original` request object
- `method`: the HTTP method, in lower case
- `body`: the body content, as a `Buffer`
- `connectionsStack`: an array of objects `{protocol, hostname, port}` describing the stack of connections. The first element in the array is the initial connection to the port kassette is listening to. A new object is added for each intercepted call to the HTTP [`CONNECT`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/CONNECT) method, with the corresponding hostname/port specified in the parameter of `CONNECT`. The protocol can be `http` or `https`. Usually, `connectionsStack` will contain two items when kassette is used as a browser proxy and intercepting a connection to a secure website (https), and only one item in other cases. It is however possible to use kassette for more advanced scenarios with multiple layers of proxy servers, and in that case `connectionsStack` reflects the corresponding layers of proxy servers.
- `connection`: a shortcut to the last item in `connectionsStack`

<a id="markdown-setting-response-data" name="setting-response-data"></a>

## Setting response data

The mock instance contains a property `response`, with the API described below.

The idea is to store the data, be able to alter it as much as wanted, without never applying it to the actual response object. It is processed only when needed to send the response.

### Main

- `original`: the original Node.js object representing the response. Use it if you can't do what you want with this current wrapper.
- `async send()`: send the response, applying the data previously given

### Body

- `body`: the body of the response.
  - if `json` is explicitly set to `true`, it will be serialized into JSON (and `content-type` header will be set to `application/json`)
  - it will also be if `json` is not explicitly set but the `body` value is not a string, not a `Buffer`, and not `null` either
  - after that, the result will eventually be converted to a `Buffer` to be sent
- `setData(data)`: a convenient method to set the `body` value and set `json` to `true`
- `json`:
  - when set: explicitly set its value
  - when read: return the current value of `json`, either explicitly set by the user or computed as described above for `body`

### Headers

- `setHeaders(headers)`: merge given `headers` map with the previously set headers (initial set is an empty map)
  - a header value can be a number, a string, or an array of strings
  - put a `null` value to suppress a header
- `headers`: the currently set headers

### Status

- `status`: an object `{code, message}`, where each property is optional. If `code` is never given, a default value of `200` is applied.

<a id="markdown-accessing-global-configuration" name="accessing-global-configuration"></a>

## Accessing global configuration

_DISCLAIMER: As a user, you are not likely to need using any of this here._

The mock instance contains a property `options`, with:

- the `root` path used to resolve relative paths in the application
- the `userConfiguration` object, containing the processed user configuration (merged from all configuration inputs)
  - each property is wrapped in an object `{origin, value}`, where `origin` tells where the value comes from and `value` is the value of the property
  - origins can be: `'cli'`, `'file'`, `'api'`, `'default'`
  - configuration properties are described in [configuration documentation](./configuration.md#configuration-properties)

<a id="markdown-miscellaneous" name="miscellaneous"></a>

## Miscellaneous

- `skipLogs`: if `true`, will simplify the logging output for this request handling iteration, logging only the one line when the request is received but nothing else afterwards

<a id="markdown-launching-the-proxy" name="launching-the-proxy"></a>

# Launching the proxy

The package exports the following function to launch the proxy programmatically:

- `async runFromAPI(options)`
  - `options`:
    - `apiConfiguration`: the configuration object, as described in [configuration documentation](./configuration.md). Has the least precedence, behind the CLI and the configuration file. However, this object is forwarded to the configuration file's <code>getConfiguration({<b>apiConfiguration</b>})</code> method, as `apiConfiguration`, so you can apply your own logic to determine what configuration to actually use
    - `configurationPath`, _optional_: the path to a configuration file, so you can reuse one nicely
    - `fileConfigurationContext`, _optional_: can be any value; is forwarded to the configuration file's <code>getConfiguration({<b>context</b>})</code> method, as `context`
  - returns a callback that can be used to shutdown the proxy, calling the `onExit` callback defined in configuration (if provided)
