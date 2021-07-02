<div
  style='font-weight: bold; width: 100%; font-size: 2em; border: 1px solid black; border-radius: 0.25em; height: 5em; position: relative;'
><span
  style='position: absolute; top: 50%; transform: translateY(-50%) translateX(-50%); left: 50%'
>WIP</span></div>

Table of contents:

<!-- TOC -->

- [Properties](#properties)
- [Methods](#methods)

<!-- /TOC -->

<a id="markdown-properties" name="properties"></a>

# Properties

They follow this design:

- all properties have a sensible default value
- the set of default values should be consistent, even if less useful (for instance, since we can't guess a default remote backend URL, default `mode` is `'local'`)
- the default values can be:
  - hard coded: something static
  - computed from the input data: request, local mock, etc.
  - taken from the global configuration object: so it is user provided
- all properties can be changed from the API, per request instance
- some properties can be updated as long as the process didn't reach a certain state, after which their value is frozen
  - example: setting the path used to store the local mock can't be changed after it has been accessed or updated

<a id="markdown-methods" name="methods"></a>

# Methods

Methods allow to apply processing, and follow this design:

- never do a processing twice if not needed or if critical, therefore data is cached as most as possible
  - example: forwarding the request to the backend should functionally be done once, so no matter how the API is used it will be called only once at most
- freeze some data depending on the state of the process
