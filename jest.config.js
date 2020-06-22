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
      tsConfig: 'packages/tsconfig.json',
    },
  },
  'testRegex': 'packages[\\/\\\\].*\\.spec\\.ts$',
  'moduleFileExtensions': [
    'ts',
    'js',
  ],
};
