// ------------------------------------------------------------------------- 3rd

import chalk from 'chalk';
import { format as datefnsFormat } from 'date-fns';

// ---------------------------------------------------------------------- common

import { safeBuildString } from '../../lib/string';

// -------------------------------------------------------------------- internal

import { ConsoleSpec, LogPayload, ErrorLogPayload, StringChunk } from './model';

// ------------------------------------------------------------------------ conf

import CONF from './conf';

////////////////////////////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////////////////////////////

let userConsole: ConsoleSpec | null = null;
export function getConsole(): ConsoleSpec {
  return userConsole != null ? userConsole : console;
}

export function createGlobalLogger(console: ConsoleSpec) {
  userConsole = console;
}

////////////////////////////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////////////////////////////

/**
 * Logs a message and potentially — depending on the given input —
 * a timestamp,
 * some data to be highlighted,
 * a checked/unchecked mark,
 * an extra line.
 */
export function logInfo({ message, timestamp, data, checked, extraLine }: LogPayload) {
  getConsole().log(
    safeBuildString([
      !timestamp ? null : [getTimestamp(), ' - '],
      message,
      data == null ? null : [': ', chalk.bold(chalk.green(data))],
      checked == null ? null : [': ', chalk.bold(checked ? chalk.green('✓') : chalk.red('✗'))],
      !extraLine ? null : '\n',
    ]),
  );
}

/**
 * Logs an error message and possibly the given error.
 */
export function logError({ message, exception }: ErrorLogPayload) {
  getConsole().error(chalk.bold(chalk.red(message)));

  if (exception != null) {
    getConsole().error([exception.stack, exception.message].filter((value) => value != null)[0]);
  }
}

export const separator = {
  message: ['\n', '-'.repeat(CONF.separatorLength), '\n'].join(''),
};

/**
 * Logs a separator line, with extra lines before and after.
 */
export const logSeparator = () => logInfo(separator);

////////////////////////////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////////////////////////////

const _isChunk = (value: any): value is StringChunk =>
  value != null && value.hasOwnProperty('text');

/**
 * Formats a string made of several parts.
 *
 * `chunks` is an array of either:
 *
 * - values to be converted to strings
 * - `StringChunk` chunks to be formatted and converted to strings
 */
export function buildString(chunks: Array<any | StringChunk>): string {
  return chunks
    .map((chunk) => {
      if (!_isChunk(chunk)) {
        return chunk;
      }

      let { text } = chunk;
      if (chunk.color != null) {
        text = (chalk as any)[chunk.color](text);
        if (chunk.bright == null || chunk.bright) {
          text = chalk.bold(text);
        }
      }
      return text;
    })
    .join('');
}

/**
 * Returns a timestamp string, which is the current date-time formatted.
 */
export const getTimestamp = () => datefnsFormat(new Date(), CONF.timestampFormat);
