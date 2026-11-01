---
type: gotcha
title: Angular Material 19+ ignores --mdc-* custom properties
date: 2026-10-31
enforced_by:
  - scripts/validate-ui-contracts.mjs#dead-mdc-token
related: [../decisions/design-system.md]
---

# Angular Material ignores `--mdc-*`

Since Angular Material 19 the components read only `--mat-*` tokens (for example `--mat-form-field-outlined-focus-outline-color`, `--mat-button-filled-container-shape`). Declarations such as `--mdc-outlined-text-field-outline-color` compile, show up in DevTools and do nothing.

The project had 55 of them; some tests even asserted their values, so the tests passed while the declarations had no effect. Look up the real name in `node_modules/@angular/material/fesm2022/<component>.mjs` (search for `--mat-<component>-`) or use the `mat.<component>-overrides(...)` mixin, which fails the build on an unknown key.
