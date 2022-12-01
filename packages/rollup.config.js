const path = require('path');
const pkg = require('../package.json');
const dependencies = Object.keys(pkg.dependencies);
const typescript = require('@rollup/plugin-typescript');
const replace = require('@rollup/plugin-replace');

module.exports = [
  {
    output: [
      {
        file: path.join(__dirname, '../dist/index.js'),
        format: 'cjs',
        dynamicImportInCjs: false,
      },
    ],
    input: path.join(__dirname, './index.ts'),
    external: dependencies.concat([
      'crypto',
      'events',
      'fs',
      'http',
      'http2',
      'https',
      'net',
      'path',
      'perf_hooks',
      'tls',
      'url',
    ]),
    plugins: [
      replace({
        'process.env.KASSETTE_VERSION': JSON.stringify(pkg.version),
        preventAssignment: true,
      }),
      typescript({
        tsconfig: path.join(__dirname, 'tsconfig.rollup.json'),
      }),
    ],
  },
  {
    output: [
      {
        file: path.join(__dirname, '../dist/cli/index.js'),
        format: 'cjs',
      },
    ],
    input: path.join(__dirname, './cli/index.ts'),
    external: dependencies.concat(['..']),
    plugins: [
      typescript({
        tsconfig: path.join(__dirname, 'tsconfig.rollup.json'),
      }),
    ],
  },
];
