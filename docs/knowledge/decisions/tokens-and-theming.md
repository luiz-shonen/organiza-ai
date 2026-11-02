---
type: decision
title: Token layers, dark mode and seasonal themes
status: active
date: 2026-11-01
supersedes: [AD-033, AD-036, AD-040]
enforced_by:
  - scripts/validate-ui-contracts.mjs#undefined-token
  - scripts/validate-ui-contracts.mjs#dark-mode-selector
  - e2e/specs/design-system-showcase.spec.ts#seasonal-theme-token-contract
related: [styling-rules.md, ../gotchas/undefined-token-renders-nothing.md]
---

# Token layers, dark mode and seasonal themes

All tokens live in `src/app/shared/ui/tokens/`, in three files:

| File               | Holds                                                                         | Example                                                          |
| ------------------ | ----------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `_foundation.scss` | scales: font sizes, weights, line heights, spacing, radii, icon sizes, motion | `--org-font-size-sm`, `--org-motion-fast`                        |
| `_semantic.scss`   | roles in Material 3 vocabulary, light on `:root`, dark on `html.dark`         | `--org-on-surface`, `--org-outline-variant`, `--org-state-hover` |
| `_themes.scss`     | seasonal canvas tints as a SCSS map (light and dark)                          | `html.theme-natal { --org-canvas: … }`                           |

`styles.scss` bridges `--mat-sys-*` to the semantic layer, so Material follows every theme without overrides.

## Rules

- Use semantic roles in components; there is one name per role. Removed synonyms: `--org-text-primary` → `--org-on-surface`, `--org-text-secondary` → `--org-on-surface-variant`, `--org-text-muted` → `--org-on-surface-muted`, `--org-border` → `--org-outline-variant`, `--org-radius-pill` → `--org-radius-full`, `--org-danger` → `--org-error`.
- Dark mode is a token swap inside `tokens/`. Components never write `.dark &` or `:host-context(.dark)`; if a value must differ in dark, add a semantic token with both values.
- A new seasonal theme is one entry in `$seasonal-themes` (`_themes.scss`) plus its id in `SeasonalThemeService`. Seasonal themes only tint `--org-canvas`; the palette (lilac actions, sky-blue info, leaf-green progress) is the same on every screen and season (Branco Essencial + Usabilidade, 2026-11-01).
- Every referenced `var(--org-*)` must exist. A `var()` with a fallback is an optional component hook and is allowed.
- `--mat-sys-*` is read only by the bridge and the DS; features read `--org-*`.
