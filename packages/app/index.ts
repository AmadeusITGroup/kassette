/**
 * To summarize, here is how it goes:
 *
 * - the CLI or user calls the bootstrap function defined in [`server/`](./server/)
 * - this function forwards the user configuration input to the main handler function defined in [`configuration/`](./configuration/) to get a single and full featured configuration object
 * - it then spawns the proxy server instance and delegates the request handling to [`mocking/`](./mocking/), passing to it nice wrappers around the request and the response
 *
 * [`logger/`](./logger/) is used to provide some basic user interface to the user.
 *
 * [`error/`](./error/) is used to make the application more consistent and robust.
 */

// Business
/** Bootstrap of the application & server business logic */
export * from './server';
/** Core business model and main user API */
export * from './mocking';
/** User configuration management */
export * from './configuration';

// UI
/** Application output logging */
export * from './logger';

// Technical, internal or generic
/** Error management & specific error types */
export * from './error';
