import picocolors from 'picocolors';

import {
  getConsole,
  createGlobalLogger,
  logInfo,
  logError,
  logSeparator,
  buildString,
  getTimestamp,
} from './impl';

////////////////////////////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////////////////////////////

function createLogger() {
  const output: { message: any; type: 'log' | 'error' }[] = [];
  const console = {
    log: (message: any) => output.push({ message, type: 'log' }),
    error: (message: any) => output.push({ message, type: 'error' }),
  };
  createGlobalLogger(console);
  const clear = () => (output.length = 0);
  return { output, clear };
}

const TIMESTAMP_REGEXP = /\d{4,}\/\d{2}\/\d{2} \d{2}\:\d{2}\:\d{2}[ap]m [\+\-]\d{2}\:\d{2}/;

////////////////////////////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////////////////////////////

describe('logger', () => {
  describe('global console', () => {
    it('should return the global console by default', () => {
      expect(getConsole()).toBe(global.console);
    });

    it('should store and return the globally set console', () => {
      const console = { log: () => {}, error: () => {} };
      createGlobalLogger(console);
      expect(getConsole()).toBe(console);
    });
  });

  describe('logInfo', () => {
    it('should log simple message', () => {
      const { output } = createLogger();
      logInfo({ message: 'hello' });
      expect(output).toEqual([{ message: 'hello', type: 'log' }]);
    });

    it('should log data', () => {
      const { output } = createLogger();
      logInfo({ message: 'boolean', data: false });
      expect(output).toEqual([
        { message: `boolean: ${picocolors.bold(picocolors.green('false'))}`, type: 'log' },
      ]);
    });

    it('should log boolean', () => {
      const { output, clear } = createLogger();

      logInfo({ message: 'boolean', checked: true });
      expect(output).toEqual([
        { message: `boolean: ${picocolors.bold(picocolors.green('✓'))}`, type: 'log' },
      ]);
      clear();

      logInfo({ message: 'boolean', checked: false });
      expect(output).toEqual([
        { message: `boolean: ${picocolors.bold(picocolors.red('✗'))}`, type: 'log' },
      ]);
      clear();
    });

    it('should be able to add extra line', () => {
      const { output } = createLogger();

      logInfo({ message: 'header', extraLine: true });
      expect(output).toEqual([{ message: 'header\n', type: 'log' }]);
    });

    it('should be able to add timestamp', () => {
      const { output } = createLogger();

      logInfo({ message: 'header', timestamp: true });
      expect(output).toEqual([
        {
          message: expect.stringMatching(new RegExp(TIMESTAMP_REGEXP.source + / \- header/.source)),
          type: 'log',
        },
      ]);
    });
  });

  describe('logError', () => {
    it('should log simple message', () => {
      const { output } = createLogger();
      logError({ message: 'hello' });
      expect(output).toEqual([
        { message: picocolors.bold(picocolors.red('hello')), type: 'error' },
      ]);
    });

    it('should log exception', () => {
      const { output } = createLogger();
      const exception = new Error('dummy');
      logError({ message: 'hello', exception });
      expect(output).toEqual([
        { message: picocolors.bold(picocolors.red('hello')), type: 'error' },
        { message: exception.stack || exception.message, type: 'error' },
      ]);
    });
  });

  describe('logSeparator', () => {
    it('should log a separator', () => {
      const { output } = createLogger();
      logSeparator();
      expect(output).toEqual([
        {
          message: expect.stringMatching(/\n\-{40,100}\n/),
          type: 'log',
        },
      ]);
    });
  });

  describe('getTimestamp', () => {
    it('should return a timestamp', () => {
      expect(getTimestamp()).toEqual(expect.stringMatching(new RegExp(TIMESTAMP_REGEXP.source)));
    });
  });

  describe('buildString', () => {
    it('should join simple sequence', () => {
      expect(buildString(['hello', ' ', 'world'])).toEqual('hello world');
    });

    it('should convert values to string', () => {
      expect(buildString([2, ' ', 'persons'])).toEqual('2 persons');
    });

    describe('styling', () => {
      it('should convert non-string values', () => {
        expect(buildString([{ text: 2, color: 'green', bright: false }, ' ', 'persons'])).toEqual(
          `${picocolors.green('2')} persons`,
        );
      });

      it('should be able to disable bright colors', () => {
        expect(buildString([{ text: 2, color: 'green', bright: false }, ' ', 'persons'])).toEqual(
          `${picocolors.green('2')} persons`,
        );
      });

      it('colors should be bright by default', () => {
        expect(buildString([{ text: 2, color: 'green' }, ' ', 'persons'])).toEqual(
          `${picocolors.bold(picocolors.green('2'))} persons`,
        );
      });

      it('colors should be bright explicitly', () => {
        expect(buildString([{ text: 2, color: 'green', bright: true }, ' ', 'persons'])).toEqual(
          `${picocolors.bold(picocolors.green('2'))} persons`,
        );
      });
    });
  });
});
