---
type: gotcha
title: A fluid font size (clamp, min) fails the typography contract unless it is a custom property
date: 2026-11-23
enforced_by:
  - scripts/validate-ui-contracts.mjs#raw-typography
related: [../decisions/styling-rules.md]
---

# Fluid type needs a custom property

`lint:contracts` accepts `font-size`, `font-weight`, `line-height` and `letter-spacing` only when
the value starts with `var(` or `calc(var(`. A screen-sized size such as
`clamp(var(--org-font-size-md), 0.75rem + 1.1vmin, 1.375rem)` or `min(var(--org-font-size-md), 3.9vw)`
is reported as raw typography (one report per file, so fixing one may reveal the next).

Keep the tokens as the bounds and move the expression into a local custom property:

```scss
.reveal__paper-text {
  --reveal-size: clamp(var(--org-font-size-md), 0.75rem + 1.1vmin, 1.375rem);

  font-size: var(--reveal-size);
}
```

Plain numbers (`line-height: 1`) are raw too: use `var(--org-line-height-tight)`.
