# Material Seasonal Design System Design

## Decision

The showcase remains a single standalone container at `src/app/features/design-system/`. It uses Angular Material modules directly and limits project-specific styling to token-driven presentation wrappers. The existing route and super-admin guard are retained.

## Structure

```text
DesignSystemShowcaseContainer
├── Material sidenav: anchor links for every family
├── Control bar: Material button toggle + select
├── Overview: composed Material event briefing
├── Foundations: token and seasonal swatches
├── Buttons and actions: raised, stroked, text, icon, FAB
├── Inputs: form fields, select, datepicker, textarea
├── Selection: chips, checkboxes, radio, slide toggle
├── Navigation: tabs, list, menu
├── Data display: cards, list, badges, divider
├── Feedback: progress, snackbar, dialog
└── Seasonal themes: four themes and usage guidance
```

## Token contract

Global tokens remain on `:root` and each `html.theme-*` class overrides the same contract:

| Token family | Purpose |
| --- | --- |
| `--org-primary`, `--org-secondary`, `--org-tertiary` | Material semantic colors |
| `--org-gradient-primary`, `--org-gradient-border` | active seasonal actions and rings |
| `--org-canvas-start`, `--org-canvas-end` | ambient page canvas |
| `--org-glass-bg`, `--org-glass-shadow` | translucent surface treatment |

Páscoa uses resurrection-focused labels and a violet, dawn-gold, and olive palette. Natal uses ruby, evergreen, and gold. Festa Junina uses ember, corn, and blue. Ano Novo uses gold, midnight blue, and silver.

## Interactions

- Sidenav items are standard anchor links. Clicking them sets the active signal and lets the browser move to the matching section.
- The light/dark control calls the existing `ThemeService`.
- Seasonal selection changes only the root seasonal class, then updates the local selected signal.
- Snackbar and dialog examples are intentionally local demonstrations. They do not change application data.

## Risks

| Risk | Mitigation |
| --- | --- |
| Global Material overrides mask showcase styling | Scope showcase styles to `.org-material-showcase` and use Material system tokens before selectors. |
| Seasonal switch conflicts with the automatic seasonal service | The showcase follows the existing root-class convention and is explicitly a manual preview. |
| Narrow screens overflow from controls | Use mobile-first single columns, wrapping action groups, and a horizontally scrollable tab strip. |
