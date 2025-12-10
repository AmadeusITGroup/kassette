// @ts-check

import eslint from '@eslint/js';
import jsdoc from 'eslint-plugin-jsdoc';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier/flat';

export default defineConfig(
  eslint.configs.recommended,
  tseslint.configs.recommendedTypeChecked,
  eslintConfigPrettier,
  jsdoc.configs['flat/logical-typescript'],
  {
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ['*.js', 'bin/*.js', '*.mjs'],
        },
      },
    },
  },
  {
    rules: {
      '@typescript-eslint/await-thenable': ['off'],
      '@typescript-eslint/no-empty-object-type': ['off'],
      '@typescript-eslint/no-explicit-any': ['off'],
      '@typescript-eslint/no-floating-promises': ['off'],
      '@typescript-eslint/no-misused-promises': ['off'],
      '@typescript-eslint/no-redundant-type-constituents': ['off'],
      '@typescript-eslint/no-unsafe-argument': ['off'],
      '@typescript-eslint/no-unsafe-assignment': ['off'],
      '@typescript-eslint/no-unsafe-call': ['off'],
      '@typescript-eslint/no-unsafe-function-type': ['off'],
      '@typescript-eslint/no-unsafe-member-access': ['off'],
      '@typescript-eslint/no-unsafe-return': ['off'],
      '@typescript-eslint/no-wrapper-object-types': ['off'],
      '@typescript-eslint/require-await': ['off'],
      '@typescript-eslint/restrict-plus-operands': ['off'],
      '@typescript-eslint/unbound-method': ['off'],
      'no-control-regex': ['off'],
      'no-empty': ['off'],
      'no-new-wrappers': ['error'],
      'jsdoc/check-tag-names': ['error', { definedTags: ['remarks', 'packageDocumentation'] }],
    },
  },
  {
    files: ['**/*.js'],
    languageOptions: {
      globals: {
        module: 'readonly',
        require: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/no-require-imports': ['off'],
    },
  },
  {
    ignores: ['build/**', 'dist/**', 'packages/**/*.js'],
  },
);
