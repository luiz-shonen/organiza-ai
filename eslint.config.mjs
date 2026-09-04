// @ts-check
import tseslint from 'typescript-eslint';
import angular from 'angular-eslint';
import playwright from 'eslint-plugin-playwright';
import eslintConfigPrettier from 'eslint-config-prettier';
import globals from 'globals';

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      '.angular/**',
      'node_modules/**',
      'coverage/**',
      'e2e/screenshots/**',
      'graphify-out/**',
      '**/*.min.*',
    ],
  },
  {
    files: ['scripts/**/*.mjs', '*.mjs'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node,
      },
    },
    rules: {
      'no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      'no-undef': 'error',
      'no-console': 'off',
    },
  },
  {
    files: ['src/**/*.ts'],
    extends: [
      ...tseslint.configs.recommended,
      ...tseslint.configs.stylistic,
      ...angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          prefix: ['app', 'org'],
          style: 'camelCase',
        },
      ],
      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'element',
          prefix: ['app', 'org'],
          style: 'kebab-case',
        },
      ],
      '@angular-eslint/prefer-on-push-component-change-detection': 'error',
      '@angular-eslint/prefer-standalone': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
    },
  },
  {
    files: ['src/**/*.spec.ts', 'src/**/*.mock.ts', 'src/app/testing/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@angular-eslint/prefer-on-push-component-change-detection': 'off',
    },
  },
  {
    files: ['e2e/**/*.ts'],
    extends: [...tseslint.configs.recommended],
    ...playwright.configs['flat/recommended'],
    languageOptions: {
      parser: tseslint.parser,
    },
    rules: {
      ...playwright.configs['flat/recommended'].rules,
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      'playwright/no-standalone-expect': 'off',
      'playwright/no-wait-for-timeout': 'warn',
      'playwright/prefer-web-first-assertions': 'warn',
      'playwright/prefer-to-have-count': 'warn',
      'playwright/no-element-handle': 'warn',
      'playwright/no-eval': 'warn',
      'playwright/no-conditional-in-test': 'warn',
      'playwright/no-focused-test': 'error',
      'playwright/expect-expect': 'warn',
      'playwright/no-force-option': 'warn',
    },
  },
  {
    files: ['src/**/*.html'],
    extends: [...angular.configs.templateRecommended, ...angular.configs.templateAccessibility],
    rules: {
      '@angular-eslint/template/alt-text': 'warn',
      '@angular-eslint/template/label-has-associated-control': 'warn',
      '@angular-eslint/template/click-events-have-key-events': 'warn',
      '@angular-eslint/template/interactive-supports-focus': 'warn',
      '@angular-eslint/template/prefer-control-flow': 'error',
    },
  },
  eslintConfigPrettier,
);
