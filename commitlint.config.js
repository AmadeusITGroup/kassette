module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [2, 'always', [
      'cli',
      'feat', 'fix',
      'test',
      'docs',
      'style', 'refactor', 'perf',
      'build', 'ci', 'chore', 'revert',
    ]],
    'scope-empty': [0],
    'scope-enum': [0],
    'header-max-length': [2, 'always', 100],
  }
};
