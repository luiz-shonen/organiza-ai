---
type: gotcha
title: Menus, selects, autocompletes and dialogs render outside component hosts
date: 2026-10-31
related: [../decisions/design-system.md]
---

# Overlays are global

Material overlays (menu, select and autocomplete panels, dialogs, snackbars, datepicker) are attached to the CDK overlay container at the end of `<body>`, not inside the component that opened them. Emulated component styles never reach them.

Style them once, globally, in `src/app/shared/ui/overlays/_org-overlays.scss`:

- colours, shapes and elevation through `mat.<component>-overrides(...)` inside the `tokens()` mixin (included on `html` in `styles.scss`);
- the few structural tweaks (backdrop blur, `overflow: hidden`) with selectors scoped to `.cdk-overlay-pane` / a `panelClass`.

Do not switch a component to `ViewEncapsulation.None` to reach its panel, and do not use `!important`.
