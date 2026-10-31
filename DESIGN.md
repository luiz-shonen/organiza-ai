# Organiza AI — Design System & Living Component Catalog

> **Version:** 2.0.0 (Consolidated)  
> **Status:** Production / Living Architecture  
> **Showcase Route:** `/design-system` _(Guarded by `superAdminGuard`)_  
> **Audience:** Core Developers, UX Designers, Feature Architects

---

## Table of Contents

1. [Brand Identity & Festive Narrative](#1-brand-identity--festive-narrative)
2. [Tokens](#2-tokens)
3. [Typography](#3-typography)
4. [Breakpoints, Glass and Elevation](#4-breakpoints-glass-and-elevation)
5. [Canonical Iconography](#5-canonical-iconography)
6. [Component Families & Public APIs](#6-component-families--public-apis)
7. [Seasonal Theming Architecture](#7-seasonal-theming-architecture)
8. [Architectural Principles & Quality Standards](#8-architectural-principles--quality-standards)
9. [DOs and DON'Ts](#9-dos-and-donts)

---

## 1. Brand Identity & Festive Narrative

Organiza AI is built on the **Modern Festive Planner** narrative: transforming event organization from a tedious administrative chore into a vibrant, communal celebration.

### Aesthetic Pillars

- **Vibrant Modernism:** Punchy primary accents, joyful animations, and celebratory confetti.
- **Glassmorphism:** Multi-layered depth via single-ring translucent backdrops with hardware-accelerated blur.
- **Bubbly Geometric Shapes:** Unapologetically rounded corners ($12\text{px}$ to $24\text{px}$, pill badges).
- **Canonical Warm Palette:** The signature **Pink $\rightarrow$ Orange $\rightarrow$ Yellow** progression.

---

## 2. Tokens

The source of truth is `src/app/shared/ui/tokens/`; this section only names the families. Rules and rationale: [docs/knowledge/decisions/tokens-and-theming.md](docs/knowledge/decisions/tokens-and-theming.md).

| Family            | Tokens                                                                                                                  | File                                                                                           |
| :---------------- | :---------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | ------------------------- | ----------------------------------------------------------------------------------------------------------------- | ------- | -------- | ------------------------------------- | ------- | ------ | ------------------ |
| Brand             | `--org-primary` (#FF4D94), `--org-secondary` (#FF8C42), `--org-tertiary` (#FFC837) and their `on-` / `-container` pairs | `_semantic.scss`                                                                               |
| Status            | `--org-error`, `--org-warning`, `--org-success`, `--org-info` (+ `on-` / `-container`)                                  | `_semantic.scss`                                                                               |
| Surfaces & text   | `--org-canvas`, `--org-surface`, `--org-surface-container-low                                                           | -                                                                                              | high`, `--org-surface-variant`, `--org-on-surface`, `--org-on-surface-variant`, `--org-on-surface-muted` | `_semantic.scss`          |
| Lines             | `--org-outline`, `--org-outline-variant`                                                                                | `_semantic.scss`                                                                               |
| States            | `--org-state-hover`, `--org-state-selected`, `--org-scrim`                                                              | `_semantic.scss`                                                                               |
| Glass & elevation | `--org-glass-bg                                                                                                         | -strong`, `--org-glass-blur`, `--org-glass-ring-color`, `--org-glass-shadow`, `--org-shadow-xs | sm                                                                                                       | md                        | lg                                                                                                                | overlay | primary` | `_semantic.scss` / `_foundation.scss` |
| Gradients         | `--org-gradient-primary`, `--org-gradient-border`, `--org-gradient-theme-*`                                             | `_semantic.scss`                                                                               |
| Categories        | `--org-cat-<categoria>-bg                                                                                               | color`                                                                                         | `_semantic.scss`                                                                                         |
| Typography        | `--org-font-body                                                                                                        | display                                                                                        | mono`, `--org-font-size-2xs…4xl                                                                          | heading                   | display`, `--org-font-weight-_`, `--org-line-height-_`, `--org-letter-spacing-\*`, composites `--org-text-display | heading | title    | body                                  | body-sm | label` | `_foundation.scss` |
| Spacing           | `--org-space-2xs` (2px) … `--org-space-3xl` (64px)                                                                      | `_foundation.scss`                                                                             |
| Radius            | `--org-radius-xs                                                                                                        | sm                                                                                             | md                                                                                                       | lg                        | xl                                                                                                                | full    | circle`  | `_foundation.scss`                    |
| Icons             | `--org-icon-size-sm                                                                                                     | md                                                                                             | lg                                                                                                       | xl` (16 / 20 / 24 / 40px) | `_foundation.scss`                                                                                                |
| Motion            | `--org-motion-fast                                                                                                      | base                                                                                           | slow`, `--org-motion-ease                                                                                | ease-emphasized`          | `_foundation.scss`                                                                                                |

Dark mode redefines the semantic roles on `html.dark`; seasonal themes (`html.theme-*`) are generated from the `$seasonal-themes` map in `_themes.scss`.

## 3. Typography

Plus Jakarta Sans for all UI text, Fraunces for display headings in the catalog, JetBrains Mono for code. Use the composite tokens with the `font` shorthand (`font: var(--org-text-title)`) or the individual scale tokens; literal values fail `npm run lint:contracts`.

## 4. Breakpoints, Glass and Elevation

- Breakpoints (mixins in `_semantic.scss`): `semantic.mobile` (< 600px), `semantic.tablet` (≥ 600px), `semantic.desktop` (≥ 900px), `semantic.wide` (≥ 1200px).
- Glass (`backdrop-filter: var(--org-glass-blur)` + 1.5px gradient ring) belongs to DS surfaces only: `org-surface`, drawers, dialogs, snackbars.
- Elevation through `--org-shadow-*` / `--org-glass-shadow`; radius through `--org-radius-*`.

## 5. Canonical Iconography

All system icons use **Material Icons** and are rendered via
`<org-icon [name]="iconName" [size]="'sm'|'md'|'lg'" [color]="colorString" />` or `<org-icon-button>`.
Features must use the typed `OrgIcon` API rather than placing raw Material icon markup (`<mat-icon>`) or local SVGs in templates.

### Supported Canonical Icons (45 Typed Names)

1. `check_circle` — Confirm / Success
2. `error` — Alert / Error state
3. `info` — Contextual information
4. `close` — Dismiss / Close action
5. `cancel` — Cancel operation
6. `menu` — Navigation hamburger trigger
7. `account_circle` — Avatar / User profile fallback
8. `group_add` — Add collaborator / guest
9. `how_to_reg` — RSVP presence confirmation
10. `share` — Share action
11. `content_copy` — Clipboard copy
12. `event` — Calendar / Event
13. `place` — Location pin
14. `schedule` — Time / Clock
15. `delete` / `delete_outline` — Remove / Delete action
16. `edit` / `edit_note` — Edit / Modify
17. `add` / `add_circle` — Create / Add
18. `search` — Filter / Search
19. `mail` — Email
20. `phone` — WhatsApp / Phone
21. `palette` — Theme / Design system
22. `dark_mode` / `light_mode` — Theme mode toggles
23. `logout` / `login` — Auth session actions
24. `link` — URL / Hyperlink
25. `block` / `lock` — Permission restriction
26. `send` — Send invitation
27. `arrow_back` / `arrow_forward` / `arrow_forward_ios` — Directional navigation
28. `save` — Save changes
29. `download` — File / CSV export
30. `print` — Print guest list
31. `checklist` — Item wishlist
32. `person` / `group` — User and attendee indicators
33. `notifications_active` — Imminent event alert
34. `verified_user` / `verified` — Super admin and confirmed badges
35. `admin_panel_settings` — Admin privileges
36. `qr_code_2` — Event QR Code share
37. `pix` — Pix payment / rachadinha
38. `diversity_3` — Family roster selector
39. `shopping_cart` — Unclaimed item indicator
40. `person_add` — RSVP attendee dialog
41. `expand_more` — Expandable accordion / details
42. `cloud_off` — Offline network banner

---

## 6. Component Families & Public APIs

Import only from `@shared/ui`. A feature owns layout and domain content; each `Org*` component owns its visual treatment, Material tokens, interaction states, density, focus, and responsive behavior. Do not recreate component styling in a feature stylesheet.

### OrgSurfaceComponent

Uso recomendado: `<org-surface variant="card" [atmosphere]="true">...</org-surface>`. Variants are `card`, `panel`, `drawer`, `dialog`, and `hero`; atmosphere is opt-in and token-driven.

### OrgPageLayoutComponent

Uso recomendado: `<org-page-layout maxWidth="wide">...</org-page-layout>`. Use it as the page-width boundary, never a feature-local width recipe.

### OrgPageHeaderComponent

Uso recomendado: `<org-page-header title="Meus eventos" icon="event" [gradient]="true" />`. Pass semantic title, subtitle, icon, and actions through its API.

### OrgSectionComponent

Uso recomendado: `<org-section title="Próximos eventos" icon="event">...</org-section>`. It provides one coherent section heading and rhythm.

### OrgButtonComponent

Uso recomendado: `<org-button label="Salvar" icon="check" variant="primary" [gradient]="true" (pressed)="save()" />`. Supported variants are `primary`, `secondary`, `danger`, and `text`; use `disabled` or `loading` instead of local state CSS.

### OrgIconButtonComponent

Uso recomendado: `<org-icon-button ariaLabel="Adicionar evento" icon="add" variant="primary" (pressed)="create()" />`. The accessible label is required.

### OrgChipComponent

Uso recomendado: `<org-chip label="Celebrativo" variant="accent" [selected]="selected()" (selectionChange)="toggle($event)" />`. Use it for compact selectable labels, not arbitrary button styling.

### OrgIconComponent

Uso recomendado: `<org-icon name="event" size="sm" />`. Use the typed icon map instead of a raw Material icon in feature markup.

### OrgTextFieldComponent

Uso recomendado: `<org-text-field label="Título do evento" [(value)]="title" hint="Como os convidados verão o evento." />`.

### OrgTextareaFieldComponent

Uso recomendado: `<org-textarea-field label="Mensagem" [rows]="3" [(value)]="message" />`.

### OrgSelectFieldComponent

Uso recomendado: `<org-select-field label="Formato" [options]="formatOptions" [(value)]="format" />`. Use only for a single choice with one to three options. Options are typed objects with `value`, `label`, and optional `disabled`.

### OrgAutocompleteFieldComponent

Uso recomendado: `<org-autocomplete-field label="Categoria" [options]="categoryOptions" [(value)]="category" />`. Use for a single choice with four or more options. It filters typed option labels without case or diacritic sensitivity and never accepts a free-text value.

### OrgDateFieldComponent

Uso recomendado: `<org-date-field label="Data" [(value)]="eventDate" />`. It owns the Material datepicker integration and normal field geometry.

### OrgTimeFieldComponent

Uso recomendado: `<org-time-field label="Horário" [(value)]="eventTime" [minuteStep]="5" [quickOptions]="timeOptions" min="08:00" max="22:00" />`. Ele possui um editor `HH:mm` próprio, com menu Material para ajuste e atalhos tipados. Não use `input[type=time]` nos campos de produto.

### OrgToggleComponent

Uso recomendado: `<org-toggle label="Enviar lembrete" [(checked)]="reminderEnabled" />`. Use a toggle for a setting that is immediately on or off.

### OrgCheckboxComponent

Uso recomendado: `<org-checkbox label="Permitir acompanhante" [(checked)]="companionAllowed" />`. Use checkboxes for independent or multiple choices.

### OrgRadioGroupComponent

Uso recomendado: `<org-radio-group label="Canal" [options]="channelOptions" [(value)]="channel" />`. Use it when exactly one option is selected.

### OrgTabsComponent

Uso recomendado: `<org-tabs [items]="tabs" [(selectedId)]="activeTab" [gradient]="true" />`. It owns tab borders and responsive overflow behavior.

### OrgStepComponent

Uso recomendado: `<org-step label="Informações">...</org-step>`. It is only used as projected content of `OrgStepperComponent`.

### OrgStepperComponent

Uso recomendado: `<org-stepper [orientation]="orientation()"><org-step label="Informações">...</org-step></org-stepper>`. The caller supplies semantic steps; the component owns compact mobile orientation.

### OrgMenuComponent

Uso recomendado: `<org-menu triggerLabel="Mais ações" [actions]="menuActions" (actionSelected)="act($event)" />`. Actions are typed and the component owns the Material overlay surface.

### OrgNavigationListComponent

Uso recomendado: `<org-navigation-list [items]="navigationItems" (selected)="navigate($event)" />`. Items are typed links with an id, label, href, and optional disabled state.

### OrgProgressComponent

Uso recomendado: `<org-progress [value]="67" ariaLabel="67% concluído" variant="primary" [gradient]="true" />`.

### OrgMetricCardComponent

Uso recomendado: `<org-metric-card label="Confirmações" value="42" trend="18% nesta semana" [atmosphere]="true" />`.

### OrgDataTableComponent

Uso recomendado: `<org-data-table [rows]="events" [columns]="eventColumns" [actionTemplate]="actions" (rowActivated)="open($event)" />`. A feature fornece apenas dados, colunas tipadas e o template de ações; o componente é o único proprietário da tabela Material e de seus tokens visuais.

### OrgBadgeComponent

Uso recomendado: `<org-badge label="Novo" variant="success" icon="check" />`. Variants are semantic and the gradient can be disabled per use.

### OrgConfirmDialogComponent

Uso recomendado: inject `OrgDialogService` and call `confirm({ title, message, confirmLabel, cancelLabel })`; do not open a feature-local Material dialog for confirmations.

### OrgEmptyStateComponent

Uso recomendado: `<org-empty-state icon="event" title="Nenhum evento" description="Crie o primeiro evento para começar." />`.

### OrgCardHeaderComponent

Uso recomendado: `<org-card-header icon="pix" tone="primary" heading="Rachadinha via Pix" subheading="Contribua com o evento!" />` at the top of every card; tones are `primary`, `primary-soft` (default), `tertiary` and `success`.

### OrgCopyButtonComponent

Uso recomendado: `<org-copy-button label="Copiar link" copiedMessage="Link copiado!" [value]="eventUrl()" />`; it owns the clipboard and the confirmation toast so presentational components stay service-free.

### OrgLoadingStateComponent

Uso recomendado: `<org-loading-state label="Carregando eventos..." />` for any region that waits on data; it renders the spinner and the announced message, so features never import `MatProgressSpinner`.

### OrgSkeletonComponent

Uso recomendado: `<org-skeleton class="dashboard__skeleton-title" />` (or `shape="circle"`) as a placeholder; the feature class only sets width and height, the pulse and colour belong to the component.

### OrgExpansionPanelComponent

Uso recomendado: `<org-expansion-panel heading="Adicionar Família?" icon="diversity_3" [(expanded)]="open"><span orgExpansionSummary>2 selecionados</span>…</org-expansion-panel>` for collapsible sections.

### FeedbackSnackbarComponent

Uso recomendado: inject `FeedbackService` and call `success`, `info`, `warning`, or `error`; the snackbar component is service-owned rather than placed in feature templates.

### OrgBannerComponent

Uso recomendado: `<org-banner variant="info" message="Convites enviados." />` for persistent contextual feedback.

### Component-first authoring contract

New work begins with a public `Org*` component. If the API is missing, add a standalone OnPush component in `shared/ui`, its focused unit test, a design-system preview, and this recommended usage before using it in a feature. The `/design-system` route is the live source for all documented APIs.

## APIs legadas de compatibilidade

Não usar em novo código. As diretivas de compatibilidade foram removidas: `OrgSurfaceDirective`, `OrgFormGridDirective`, `OrgFormFieldDirective`, `OrgFieldLabelDirective`, `OrgButtonDirective`, `OrgIconButtonDirective` e `OrgChipDirective`. `OrgSurfaceComponent`, os componentes de layout, campos, seleção e ações são a fonte única de estilo e comportamento; telas não aplicam diretivas visuais nem tokens internos do Material.

---

## 7. Seasonal Theming Architecture

`SeasonalThemeService` adds one class to `<html>`; each class only swaps the brand roles (`--org-primary`, `--org-secondary`, `--org-tertiary`, gradients, canvas and glass ring). Values live in the `$seasonal-themes` map in `src/app/shared/ui/tokens/_themes.scss`:

| Class             | Primary | Secondary | Tertiary |
| :---------------- | :------ | :-------- | :------- |
| (none) — padrão   | #FF4D94 | #FF8C42   | #FFC837  |
| `.theme-junina`   | #FF5722 | #FF8C42   | #FFB300  |
| `.theme-natal`    | #B84555 | #D77A61   | #DEB36A  |
| `.theme-pascoa`   | #7552A8 | #D2A060   | #F4D58E  |
| `.theme-ano-novo` | #B88A33 | #EAD9A5   | #8293B5  |

To add a theme, add one entry to the map and its id to the service.

---

## 8. Architectural Principles & Quality Standards

1. **Standalone Components Only:** All components use `standalone: true` (Angular 21+ default). No `NgModules`.
2. **ChangeDetectionStrategy.OnPush:** Mandatory on every component. State must flow through Angular Signals (`signal`, `computed`, `effect`, `input`, `output`, `model`).
3. **Template & Style Separation:** Every component has distinct `.ts`, `.html`, and `.scss` files. No inline templates or inline styles.
4. **SCSS BEM Architecture:** Class naming follows strictly `.org-[block]__[element]--[modifier]`.
5. **Zero Horizontal Overflow:** `document.documentElement.scrollWidth <= window.innerWidth + 1` across all viewports.
6. **WCAG 2.1 AA Accessibility:**
   - Interactive touch targets $\ge 48\text{px} \times 48\text{px}$.
   - All interactive controls have accessible `aria-label`, `aria-expanded`, `aria-current`, or `aria-live`.
   - Color contrast ratio $\ge 4.5:1$ for normal text, $\ge 3:1$ for large text and UI components.
7. **Strict TypeScript & Contracts:** `noImplicitAny: true`, zero `any` usage. Features must pass `node scripts/validate-ui-contracts.mjs --strict`.

---

## 9. DOs and DON'Ts

### DO

- Import UI components exclusively from `@shared/ui`.
- Use `<org-surface>` for card, panel, drawer, dialog, and hero containers.
- Use `--org-*` semantic tokens rather than hardcoded hex values in stylesheets.
- Use `<org-icon>` or `<org-icon-button>` with typed `OrgIconName` for all iconography.
- Test layouts with both Light and Dark themes and across $320\text{px}$, $600\text{px}$, and $1200\text{px}$ viewports.
- Use `FeedbackService` for user notifications and alerts.

### DON'T

- Do NOT write custom `.mat-mdc-*` CSS overrides in feature components.
- Do NOT use any `<mat-*>` tag or import anything from `@angular/material` in features; add an `Org*` primitive instead.
- Do NOT use `!important`, `--mdc-*` tokens, `.dark` selectors or literal font sizes/weights/durations; use `--org-*` tokens.
- Do NOT nest multiple glassmorphic borders creating double rings.
- Do NOT create buttons with touch targets smaller than $48\text{px} \times 48\text{px}$.
- Do NOT hardcode purple product palettes; follow the canonical **Pink-Orange-Yellow** brand triple.
- Do NOT use `ChangeDetectionStrategy.Default`.
- Do NOT introduce a new feature-local directive as a styling API when a standalone component can own the contract.
