////////////////////////////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////////////////////////////

/**
 * Console with logging methods.
 * @public
 */
export interface ConsoleSpec {
  /**
   * Logs a message.
   * @param message - message to log
   */
  log(message: any): void;

  /**
   * Logs an error message.
   * @param message - error message to log
   */
  error(message: any): void;
}

////////////////////////////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////////////////////////////

export interface LogPayload {
  /** The message to display, or a header/property if using `checked` or `data`. */
  readonly message: any;
  /** A boolean to activate or not the display of the timestamp. */
  readonly timestamp?: boolean;
  /** Some data to be displayed highlighted, as the value of `message`. */
  readonly data?: any;
  /** A boolean indicating if the statement (`message`) is "checked". */
  readonly checked?: boolean;
  /** A boolean to insert an extra line after the log. */
  readonly extraLine?: boolean;
}

export interface ErrorLogPayload {
  /** The message to display. */
  readonly message: string;
  /** The exception to display after the message. */
  readonly exception?: Error;
}

////////////////////////////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////////////////////////////

export interface StringChunk {
  /** The text to format. */
  readonly text: any;
  /** The color to apply on the text. */
  readonly color?: string;
  /** A boolean to activate bright style or not. */
  readonly bright?: boolean;
}
