---
type: gotcha
title: An undefined custom property silently drops the declaration
date: 2026-10-31
enforced_by:
  - scripts/validate-ui-contracts.mjs#undefined-token
related: [../decisions/tokens-and-theming.md]
---

# An undefined token renders nothing

`border: 1px solid var(--org-outline)` with `--org-outline` undefined is "invalid at computed-value time": the browser drops the whole declaration and uses the initial value (no border), with no console error.

The project referenced 18 undefined tokens (`--org-outline` 26 times, `--org-surface-container`, `--org-typography-title-medium`, an invented `--org-spacing-1..6`). Defining them later would suddenly change the UI, so the 2026-10-31 cleanup removed the declarations that had never rendered instead of activating them.

When adding a token reference, make sure the token exists in `shared/ui/tokens/`; `npm run lint:contracts` reports any that do not. Use a fallback (`var(--x, 1rem)`) only for an intentional optional hook.
