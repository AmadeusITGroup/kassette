# Specifications

The mock server is required during the application development in order to serve data and simulate a REST server.

The purpose of this document is to describe the needs and cases usually met by the developers.

## Manage different configurations

For now, the configuration contains these attributes:

- `mode`: set the way kassette fetches the data, can be `'static'`, `'live'` or `'both'`
  - `'static'`:
    - the local target name is computed
    - if the file exists, the served function is called and the response sent back to the client
    - if the file doesn't exist, it is created with an empty JSON for further customization, then sent back to the client
  - `'live'`:
    - the request is relayed to the live server, then the response sent back to the client
  - `'both'`:
    - if the static file exists, it is served
    - if the static file doesn't exist, the request is relayed to the live server, the response recorded in the static file and sent back to the client
- `staticFolder`: set the root directory where the static files will be recorded
- `liveurl`: the real development server for the REST API
- `customNameFn(req, params, body, baseName, hash)`: an optional function to target a different static file than the generated one. The function returns the target name to use.

kassette is able to start with a specific configuration, for example: `node kassette.js -c test` will load `config.test.js`. It's useful to isolate test or dev mocks.

## Act as a proxy

kassette must be able to relay requests to the real server. The purpose is to add the cross-origin headers, so that the development server doesn't have to care about it.

## Act as a static server

When the mock server mode is set to `'static'`, it must be able to send back the response with headers and JSON recorded locally in the repository. If these files don't exist, they are created and can be edited.

## Act as a record/replay

When the mock server mode is set to `'both'`, it acts as a record/replay: if the file exists, it is served. If it doesn't exist, the request is relayed to the development server, uncompressed (if needed) and recorded in the local file.

The response is sent back to the client without compression (it is not implemented in the current development, but it may be a feature to add in the future), so the `content-encoded` header must be removed.

## Be able to customize the recorded name

The static target name is calculated automatically by the mock server, based on the URL, the query parameters (GET) and the request body (POST). But the configuration must allow choosing a custom name if needed. It can be useful, for example:

- to send back different responses with the same URL (for instance a list of items which changes after an item creation)
- to send back a restricted set of responses (for instance one or two lists of items on a search regardless the query parameters)

## Logging

Served files, creation, requested URL, targeted files name, etc. are logged in the console to ease the debugging.
