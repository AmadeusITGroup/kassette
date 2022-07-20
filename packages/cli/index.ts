// ------------------------------------------------------------------------- 3rd

import * as yargs from 'yargs';

// ------------------------------------------------------------------------- app

import { runFromCLI, Mode, ProxyConnectMode, MocksFormat } from '..';

////////////////////////////////////////////////////////////////////////////////
// XXX 2019-01-09T16:24:12+01:00 IMPORTANT
// Specifying default values below is tempting and would seem correct regarding
// documentation too.
// But the truth is there are NO DEFAULT VALUES for CLI options:
// if not specified, they are undefined.
// Configuration processing is more complex and involves more sources,
// and eventually there are default values, but not from the CLI.
// If the CLI sets default values, it will take precedence over values
// specified in file configuration for instance, making them useless.
////////////////////////////////////////////////////////////////////////////////

const { version } = require('../../package.json');

(async () => {
  const options = await yargs
    .scriptName('kassette')
    .wrap(null)
    .usage(`$0 version ${version}`)
    .example('$0 -c proxy.config.js', 'Start proxy with configuration file proxy.config.js')
    .epilogue(
      'Please visit repository for more information: https://github.com/AmadeusITGroup/kassette',
    )
    .help('h')
    .alias('h', 'help')
    .version(version)
    .alias('v', 'version')
    .option('c', {
      alias: ['conf', 'config', 'configuration'],
      describe: 'path to configuration file',
    })
    .option('q', {
      alias: ['quiet', 'skip-logs'],
      describe: 'skip logs',
      type: 'boolean',
      // default: false,
    })
    .option('hostname', {
      alias: ['host'],
      describe: 'hostname on which to run the server',
      type: 'string',
      // default: '127.0.0.1'
    })
    .option('p', {
      alias: ['port'],
      describe: 'port on which to run the server',
      type: 'number',
      // default: 8080,
    })
    .option('u', {
      alias: ['url', 'remote', 'remote-url'],
      describe: 'remote server url',
      string: true,
    })
    .option('http2', {
      alias: ['h2'],
      describe:
        'enables http/2.0 in the kassette server (enabled by default, use --no-h2 to disable)',
      type: 'boolean',
    })
    .option('f', {
      alias: ['folder', 'mocks-folder'],
      describe: 'path to mocks base folder (if mocks-format is "folder")',
      string: true,
      // default: './mocks',
    })
    .options('har-file', {
      alias: ['mocks-har-file'],
      describe: 'path to the har file containing mocks (if mocks-format is "har")',
      string: true,
    })
    .options('har-file-cache-time', {
      describe:
        'time in milliseconds during which a har file is kept in memory after its last usage',
      number: true,
    })
    .options('mocks-format', {
      choices: ['folder', 'har'],
      describe: 'mocks file format',
      string: true,
    })
    .options('save-checksum-content', {
      boolean: true,
      describe:
        'save the content used to create a checksum when creating a new mock with a checksum',
    })
    .options('save-detailed-timings', {
      boolean: true,
      describe:
        'save detailed timings (blocked, dns, connect, send, wait, receive, ssl) when creating a new mock',
    })
    .options('save-input-request-data', {
      boolean: true,
      describe: 'save the input request data (headers, method, URL) when creating a new mock',
    })
    .options('save-input-request-body', {
      boolean: true,
      describe: 'save the content of the input request body when creating a new mock',
    })
    .options('save-forwarded-request-data', {
      boolean: true,
      describe: 'save the forwarded request data (headers, method, URL) when creating a new mock',
    })
    .options('save-forwarded-request-body', {
      boolean: true,
      describe: 'save the forwarded request body when creating a new mock',
    })
    .option('m', {
      alias: 'mode',
      describe: 'server mode',
      choices: ['download', 'local_or_download', 'local_or_remote', 'local', 'remote', 'manual'],
      // default: 'local_or_download',
    })
    .option('x', {
      alias: 'proxy-connect-mode',
      describe: 'proxy connect mode',
      choices: ['close', 'intercept', 'forward', 'manual'],
      // default: 'intercept',
    })
    .option('k', {
      alias: 'tls-ca-key',
      describe: 'path to a PEM-encoded CA certificate and key file, created if it does not exist.',
      string: true,
    })
    .option('tls-key-size', {
      describe: 'size in bits of generated RSA keys.',
      type: 'number',
    })
    .option('d', {
      alias: ['delay'],
      describe: 'mock response artificial delay',
      // default: 'recorded',
    }).argv;

  let { d: delay } = options;
  if (delay != null && delay !== 'recorded') {
    delay = parseInt(delay as string, 10);
  }

  await runFromCLI({
    cliConfiguration: {
      remoteURL: options.u,
      http2: options.http2,
      hostname: options.hostname,
      port: options.p,
      delay: delay as number | undefined,
      mode: options.m as Mode,
      mocksFormat: options.mocksFormat as MocksFormat,
      proxyConnectMode: options.x as ProxyConnectMode,
      mocksHarFile: options.harFile,
      harFileCacheTime: options.harFileCacheTime,
      mocksFolder: options.f,
      saveChecksumContent: options.saveChecksumContent,
      saveDetailedTimings: options.saveDetailedTimings,
      saveInputRequestData: options.saveInputRequestData,
      saveInputRequestBody: options.saveInputRequestBody,
      saveForwardedRequestData: options.saveForwardedRequestData,
      saveForwardedRequestBody: options.saveForwardedRequestBody,
      skipLog: options.q,
      tlsCAKeyPath: options.k,
      tlsKeySize: options.tlsKeySize,
    },
    configurationPath: options.c as string,
  });
})();
