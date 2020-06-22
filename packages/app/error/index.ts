/**
 * Application custom errors.
 */

////////////////////////////////////////////////////////////////////////////////
// Main
////////////////////////////////////////////////////////////////////////////////

/** The id of the error type. */
export type TYPE = 'file_configuration' | 'server_error' | 'missing_remote_url';

/**
 * The base type for all custom application errors;
 * stores the `original` error, if any (otherwise returns `null`).
 */
export class AppError extends Error {
  constructor(public readonly original: Error | null, public readonly type: TYPE, message: string) {
    super(message);
  }
}

/**
 * Tells if the given value is an application error.
 */
export const isAppError = (error: any): error is AppError => error instanceof AppError;

////////////////////////////////////////////////////////////////////////////////
// Specific
////////////////////////////////////////////////////////////////////////////////

/**
 * @param original The original file access error
 * @param path The path of the configuration file
 */
export class FileConfigurationError extends AppError {
  constructor(
    original: Error,
    public readonly path: string,
  ) {
    super(original, 'file_configuration', `File configuration could not be loaded: ${path}`);
    this.name = 'FileConfigurationError';
  }
}

/**
 * @param original The original error thrown when starting the server.
 */
export class ServerError extends AppError {
  constructor(
    original: Error,
  ) {
    super(original, 'server_error', 'File Configuration could not be loaded');
    this.name = 'ServerError';
  }
}

export class MissingRemoteURLError extends AppError {
  constructor(
  ) {
    super(null, 'missing_remote_url', 'Remote URL is not specified, cannot forward the request to the backend');
    this.name = 'MissingRemoteURLError';
  }
}
