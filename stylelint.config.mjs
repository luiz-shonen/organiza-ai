export default {
  extends: ['stylelint-config-standard-scss'],
  rules: {
    'declaration-no-important': true,
    'color-no-hex': true,
    'selector-class-pattern':
      '^[a-z][a-z0-9]*(?:-[a-z0-9]+)*(?:__[a-z0-9]+(?:-[a-z0-9]+)*)?(?:--[a-z0-9]+(?:-[a-z0-9]+)*)?$',
    'custom-property-pattern': '^(?:org|mat|mdc|mat-sys|showcase)-[a-z0-9-]+$',
    'scss/dollar-variable-pattern': '^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$',
    'scss/percent-placeholder-pattern': '^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$',
    'color-function-notation': null,
    'alpha-value-notation': null,
    'color-function-alias-notation': null,
    'scss/no-global-function-names': null,
    'scss/load-no-partial-leading-underscore': null,
  },
  overrides: [
    {
      files: ['src/styles.scss', 'src/app/shared/ui/tokens/**/*.scss'],
      rules: {
        'color-no-hex': null,
        'declaration-no-important': null,
        'selector-class-pattern': null,
      },
    },
  ],
};
