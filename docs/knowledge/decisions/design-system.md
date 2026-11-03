---
type: decision
title: Closed Design System (approach C)
status: active
date: 2026-10-31
supersedes: [AD-032, AD-034, AD-035, AD-039, AD-041, AD-044]
enforced_by:
  - scripts/validate-ui-contracts.mjs#feature-raw-material-module-import
  - scripts/validate-ui-contracts.mjs#feature-raw-material-tag
  - scripts/validate-ui-contracts.mjs#feature-material-selector
  - scripts/validate-ui-contracts.mjs#documentation-component-usage
related:
  [
    tokens-and-theming.md,
    styling-rules.md,
    events-and-invites.md,
    ../gotchas/material-mdc-tokens-are-ignored.md,
  ]
---

# Closed Design System

Features build screens only from `Org*` components exported by `src/app/shared/ui/index.ts`. Angular Material is an implementation detail of the Design System and of the app shell (`src/app/app.*`); a feature never imports `@angular/material`, never writes a `<mat-*>` tag and never targets a `.mat-*` / `.mdc-*` class.

When a screen needs something the DS does not offer, add (or extend) a primitive first, document it in `DESIGN.md` with "Uso recomendado", then use it. Recent examples: `org-card-header`, `org-copy-button`, `org-loading-state`, `org-skeleton`, `org-expansion-panel`.

Feature SCSS is limited to layout of that feature (grid, gaps, sizes). Colour, typography, elevation and glass come from DS components and tokens.

Specs (`*.spec.ts`) may import Material to query internals; production code may not.

## Material customisation

Inside `shared/ui`, customise Material through its token API only:

- on the component element: `--mat-button-filled-container-shape: var(--org-radius-xl);`
- globally for overlays: `@include mat.select-overrides(...)` in `shared/ui/overlays/_org-overlays.scss`

Never with `!important` and never with `--mdc-*` (ignored since Material 19).

## Layout and shared primitives

- Pages: `org-page-layout` keeps 600px (`narrow`) and 960px (`default`) on phones and tablets, and
  takes 70% of the width (at most 1440px) from 1200px up. Every change is checked on desktop and phone.
- Drawers: the RSVP / collaborator drawer takes the whole phone screen and 480px on larger screens;
  the side edit drawer (`org-bottom-sheet placement="side"`) is 480px.
- `org-expansion-panel`: the summary keeps its own width and sits `--org-space-md` away from the
  chevron; the title ellipsizes before it overlaps.
- `org-filter-bar`: Material filter chips (check on, several at once, "Todos" alone by default).
- `org-badge`: status variants are filled; a category passes `[hue]` for a tinted, outlined tag.
- `org-theme-toggle`: the light / dark switch in the header; "Sistema" stays on the profile page.
- `org-button variant="attention"` is a soft amber fill without outline ("Eu levo").

## Destructive actions

- Every trash can is red: `org-icon-button` paints `delete` and `delete_outline` in the danger tone whatever `variant` it gets (`org-icon-button.component.spec.ts`).
- Cancelling or deleting asks first in an `OrgConfirmDialog` with the danger tone; the action buttons use `variant="danger"` or `"danger-text"`.
- Editing opens a side drawer (`org-bottom-sheet placement="side"`); dialogs are only for alerts and decisions that interrupt.
