/**
 * Defines the interface of a response received from a server after sending a request.
 * In Node.js, it's still an `IncomingMessage`, as for incoming requests, but it has a few differences regarding the values of its properties.
 * And from our usage perspective, the wrapper focuses on different kind of properties.
 */

export * from './impl';
export * from './model';
