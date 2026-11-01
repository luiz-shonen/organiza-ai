---
type: decision
title: Styling rules
status: active
supersedes: [AD-007, AD-028, AD-031]
enforced_by:
  - stylelint.config.mjs#selector-class-pattern
  - stylelint.config.mjs#declaration-no-important
  - stylelint.config.mjs#color-no-hex
  - scripts/validate-ui-contracts.mjs#raw-typography
  - scripts/validate-ui-contracts.mjs#raw-motion
  - scripts/validate-ui-contracts.mjs#feature-raw-box-shadow
  - scripts/validate-ui-contracts.mjs#feature-raw-border-radius
  - scripts/validate-ui-contracts.mjs#dead-mdc-token
  - e2e/helpers/design-tokens.helper.ts#assertNoHorizontalOverflow
related: [tokens-and-theming.md, design-system.md]
---

# Styling rules

- SCSS with strict BEM, one block per component. No Tailwind, no `!important`, no hex colours outside `tokens/`.
- Typography: `font-size`, `font-weight`, `line-height` and `letter-spacing` only through `--org-*` tokens; the `font` shorthand only with a composite `--org-text-*` token or `inherit`.
- Motion: transition durations only through `--org-motion-fast|base|slow`.
- Shadows through `--org-shadow-*` / `--org-glass-shadow`; radii through `--org-radius-*`.
- Glass (`backdrop-filter`) only inside DS components (`org-surface`, drawers, dialogs).
- Mobile first: base styles for `< 600px`, then `@include semantic.tablet` (≥ 600px) / `semantic.desktop` (≥ 900px). Every page keeps `scrollWidth <= innerWidth + 1`.
- Touch targets ≥ 48px.
- `styles.scss` contains only the Material theme, the token bridge, the body reset and two global partials (`overlays`, `typography`). Anything else belongs to the component that owns it.
