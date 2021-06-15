/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    "<rootDir>/packages/app/**/*.ts",
    "<rootDir>/packages/lib/**/*.ts",
  ],
  transform: {
    'packages[\\/\\\\].*\\.ts$': 'ts-jest',
  },
  globals: {
    'ts-jest': {
      tsconfig: 'packages/tsconfig.json',
    },
  },
  'testRegex': 'packages[\\/\\\\].*\\.spec\\.ts$',
  'moduleFileExtensions': [
    'ts',
    'js',
  ],
};
