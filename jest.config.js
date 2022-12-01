/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  coverageDirectory: 'coverage',
  collectCoverageFrom: ['none'], // prevent instrumentation from jest
  transform: {
    'packages[\\/\\\\].*\\.ts$': [
      '<rootDir>/packages/jestTransform.js',
      { tsconfig: 'packages/tsconfig.json' },
    ],
  },
  testRegex: 'packages[\\/\\\\].*\\.spec\\.ts$',
  moduleFileExtensions: ['ts', 'js'],
};
