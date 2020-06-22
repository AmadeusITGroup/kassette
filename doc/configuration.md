<!-- TOC -->

- [Introduction](#introduction)
- [How to provide the configuration](#how-to-provide-the-configuration)
  - [Precedence](#precedence)
  - [From CLI](#from-cli)
  - [From file](#from-file)
  - [From API](#from-api)
- [Configuration properties](#configuration-properties)
  - [Server](#server)
  - [Global mock defaults](#global-mock-defaults)
  - [Hook](#hook)
  - [Others](#others)

<!-- /TOC -->





<a id="markdown-introduction" name="introduction"></a>
# Introduction

The configuration is the central piece of the tool: run alone, it can work but will likely not match your requirements.

The configuration is there to ease the customization of the behavior, no matter how it is run:

- from CLI only
- from CLI with a configuration file
- from API only
- from API with a configuration file

A configuration system will rarely cover all the use cases a user has in mind. However, by introducing hook functions, this brings a door more open to the internal mechanism. That's why we provide a `hook` function, which is in turn the central piece of the customization.

The `hook` function, if provided, is called upon every request, passing an API object (see [API documentation](./api.md#mock-instance)), before the `mock.process()` function is called.





<a id="markdown-how-to-provide-the-configuration" name="how-to-provide-the-configuration"></a>
# How to provide the configuration

<a id="markdown-precedence" name="precedence"></a>
## Precedence

As said in introduction, there are multiple ways to pass configuration properties and some combinations are possible, such as passing through the CLI and the configuration file for instance.

Here is the configuration sources precedence when a same configuration property is defined through multiple ways:

1. CLI
2. configuration file
3. <a id="footnote-source-1" name="footnote-source-1"></a>API <sup><a href="#footnote-1">[1]</a></sup>
4. default value

<a id="markdown-from-cli" name="from-cli"></a>
## From CLI

Check available options using `kassette --help` or `kassette -h`. To summarize, here are the possible options:

- `port`: `-p` • `--port`
- `remoteURL`: `-u` • `--url` • `--remote` • `--remote-url`
- `mocksFolder`: `-f` • `--folder` • `--mocks-folder`
- `mode`: `-m` • `--mode`
- `delay`: `-d` • `--delay`
- `skipLog`: `-q` • `--quiet` • `--skip-log`

All values which must be defined at runtime cannot be defined through the CLI — basically functions, or objects containing runtime values.

<a id="markdown-from-file" name="from-file"></a>
## From file

Pass the configuration file path using the CLI option `-c` • `--conf` • `--config` • `--configuration`. If relative, it is resolved against the current working directory.

The file must be executable, and if a compilation is necessary to make it load and run on Node.js, the required runtime loader must be loadable (using Node.js module resolution algorithm).
Example: to load a TypeScript configuration file, install [`ts-node`](https://www.npmjs.com/package/ts-node) inside your project, globally, or in any ancestor folder (less common).

The file must export a single asynchronous function named `getConfiguration`, which returns a `Promise` holding the configuration value. The method receives a single object parameter, with the following properties:

- `apiConfiguration`: the configuration coming from the `runFromAPI` call, if run from API, otherwise will just be an empty object for convenience
- `context`: a context value provided through `runFromAPI`, if run from API and if passed, otherwise is `undefined`
- `cliConfiguration`: the configuration coming from the CLI — for reference — if run from the CLI, otherwise an empty object for convenience

The returned configuration object can define all configuration values described below.

<a id="markdown-from-api" name="from-api"></a>
## From API

Pass them to `runFromAPI(options)`, using property `apiConfiguration` of `options`.

The passed configuration object can define all configuration values described below.





<a id="markdown-configuration-properties" name="configuration-properties"></a>
# Configuration properties

__All properties are optional__, not only because most of them have __suitable default values__ to make the proxy work properly already, but also because part of them are just default values for the mock instance used in the hook, so __any potentially missing and required values can be specified inside the hook__.

<a id="markdown-server" name="server"></a>
## Server

- `port`: the port on which the proxy should listen
  - if the port is not available, it will fail and stop the program; try again with another, available port
  - if `port` is set to `0`, the proxy will listen on a random port (actually depends on the OS implementation): use the callback `onListen` to catch its value
- `onListen`: callback called when the proxy is started and listening. Receives an object `{port}`, containing the port on which the proxy is listening.
- `onExit`: callback called when the proxy is programatically closed, using the callback returned from `runFromAPI`

<a id="markdown-global-mock-defaults" name="global-mock-defaults"></a>
## Global mock defaults

The properties here are just used as default values if the user does not specify them explicitly on the mock instance in the hook (and not through the CLI either).

See [mock API documentation](./api.md#mock-instance) for reference of each property.

Here is the list:

- `mode`
- `delay`
- `mocksFolder`
- `remoteURL`
- `skipLogs`

<a id="markdown-hook" name="hook"></a>
## Hook

Specified through `hook`.

It is an asynchronous function returning a `Promise` and receives a single object parameter with the following properties:

- `mock`: see [API documentation](./api.md#mock-instance)
- `console`: the console object as specified in the configuration (see below), otherwise it is the global console object (usually the one of the platform)

<a id="markdown-others" name="others"></a>
## Others

- `console`: a `console`-like object, with methods `log` and `error`, each receiving one single argument of any type. Useful to capture the logs of the application.

<br/>

----

1. <a id="footnote-1" name="footnote-1"></a>but you can access the API configuration inside the configuration file, so you can choose yourself the precedence by applying there the API configuration or not <a href="#footnote-source-1">↩︎</a>
