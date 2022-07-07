# Building

Run `npm run build` to build the project.

It uses `tsc` directly with a production configuration.

# Testing

## Unit tests

[Jest](https://jestjs.io/) is used as a testing framework, with the help of [ts-jest](https://github.com/kulshekhar/ts-jest) to allow writing tests in TypeScript directly.

To run the tests:

- `npm run ut` will run the unit tests once
- `npm run ut:watch` will run unit tests in watch mode
- `npm run ut:coverage` will run unit tests once with coverage report (console and files under `coverage` folder)

All files matching `*.spec.ts` under `src/` or deeper will be executed as tests.

## e2e

To run the tests, execute `npm run e2e`. It runs on the built code, so this command also does a build beforehand.

### Technical solution

A custom solution has been implemented to create, setup and run the end-to-end tests. This is due to the complexity of the use case, involving several different actors (backends, proxy, client).

Behind this, [Mocha](https://mochajs.org/) is used to run the process and therefore the tests, and [Chai](https://www.chaijs.com/) is used to perform the assertions.

For now, [playwright](https://playwright.dev) is used to manipulate a headless Chrome as a client to make the requests and gather the responses.

# Versioning

The project follows [semantic versioning](https://semver.org/).
