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

Organiza AI is built on the **Branco Essencial + Usabilidade** direction (approved prototype: `docs/design-proposals/branco-essencial-ux.html`, third column, checkpoint `0ab2fc0`): white, neutral components on a calm canvas, with colour reserved for what matters.

### Aesthetic Pillars

- **Colour has a job:** lilac (`#7950F2`) only for actions, sky blue (`#1C9BEF`) for dates and info, leaf green (`#2F9E44`) for success and progress. Everything else is neutral (Von Restorff).
- **Flat surfaces:** solid white cards with a hairline `--org-outline-variant` border, `--org-radius-card` (18px) corners and a faint lilac ground shadow. No glass blur.
- **Friendly type:** Fredoka for titles, Plus Jakarta Sans for body text; pill-shaped buttons.
- **Goal gradient:** progress bars and the page-title highlight use the leaf gradient (`--org-gradient-highlight`).
- **Seven usability laws** guide every screen: Jakob (bottom bar on phones, no hamburger), Fitts (targets ≥ 44px, 48px standard), Hick (few choices at a time), Miller (group information), Von Restorff (one highlighted action), Zeigarnik (show what is left to finish) and the goal-gradient effect.

---

## 2. Tokens

The source of truth is `src/app/shared/ui/tokens/`; this section only names the families. Rules and rationale: [docs/knowledge/decisions/tokens-and-theming.md](docs/knowledge/decisions/tokens-and-theming.md).

| Family            | Tokens                                                                                                                                                                                                                                    | File                                                                                           |
| :---------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | ------------------------- | ----------------------------------------------------------------------------------------------------------------- | ------- | -------- | ------------------------------------- | ------- | ------ | ------------------ |
| Brand             | `--org-primary` (#7950F2 lilac), `--org-secondary` (#1C9BEF sky), `--org-tertiary` (#2F9E44 leaf) and their `on-` / `-container` pairs                                                                                                    | `_semantic.scss`                                                                               |
| Usability         | `--org-touch-min` (44px), `--org-touch` (48px), `--org-header-height`, `--org-bottom-nav-height`, `--org-progress-height`, `--org-radius-card` (18px), `--org-gradient-highlight`, `--org-progress-track`, `--org-nav-active-bg` / `-ink` | `_foundation.scss` / `_semantic.scss`                                                          |
| Status            | `--org-error`, `--org-warning`, `--org-success`, `--org-info` (+ `on-` / `-container`)                                                                                                                                                    | `_semantic.scss`                                                                               |
| Surfaces & text   | `--org-canvas`, `--org-surface`, `--org-surface-container-low                                                                                                                                                                             | -                                                                                              | high`, `--org-surface-variant`, `--org-on-surface`, `--org-on-surface-variant`, `--org-on-surface-muted` | `_semantic.scss`          |
| Lines             | `--org-outline`, `--org-outline-variant`                                                                                                                                                                                                  | `_semantic.scss`                                                                               |
| States            | `--org-state-hover`, `--org-state-selected`, `--org-scrim`                                                                                                                                                                                | `_semantic.scss`                                                                               |
| Glass & elevation | `--org-glass-bg                                                                                                                                                                                                                           | -strong`, `--org-glass-blur`, `--org-glass-ring-color`, `--org-glass-shadow`, `--org-shadow-xs | sm                                                                                                       | md                        | lg                                                                                                                | overlay | primary` | `_semantic.scss` / `_foundation.scss` |
| Gradients         | `--org-gradient-primary`, `--org-gradient-border`, `--org-gradient-theme-*`                                                                                                                                                               | `_semantic.scss`                                                                               |
| Categories        | `--org-cat-<categoria>-bg                                                                                                                                                                                                                 | color`                                                                                         | `_semantic.scss`                                                                                         |
| Typography        | `--org-font-body                                                                                                                                                                                                                          | display                                                                                        | mono`, `--org-font-size-2xs…4xl                                                                          | heading                   | display`, `--org-font-weight-_`, `--org-line-height-_`, `--org-letter-spacing-\*`, composites `--org-text-display | heading | title    | body                                  | body-sm | label` | `_foundation.scss` |
| Spacing           | `--org-space-2xs` (2px) … `--org-space-3xl` (64px)                                                                                                                                                                                        | `_foundation.scss`                                                                             |
| Radius            | `--org-radius-xs                                                                                                                                                                                                                          | sm                                                                                             | md                                                                                                       | lg                        | xl                                                                                                                | full    | circle`  | `_foundation.scss`                    |
| Icons             | `--org-icon-size-sm                                                                                                                                                                                                                       | md                                                                                             | lg                                                                                                       | xl` (16 / 20 / 24 / 40px) | `_foundation.scss`                                                                                                |
| Motion            | `--org-motion-fast                                                                                                                                                                                                                        | base                                                                                           | slow`, `--org-motion-ease                                                                                | ease-emphasized`          | `_foundation.scss`                                                                                                |

Dark mode redefines the semantic roles on `html.dark`; seasonal themes (`html.theme-*`) are generated from the `$seasonal-themes` map in `_themes.scss`.

## 3. Typography

Plus Jakarta Sans for all UI text, Fredoka (semibold) for titles (`--org-font-display`, used by `--org-text-display|heading|title`), JetBrains Mono for code. Use the composite tokens with the `font` shorthand (`font: var(--org-text-title)`) or the individual scale tokens; literal values fail `npm run lint:contracts`.

## 4. Breakpoints, Glass and Elevation

- Breakpoints (mixins in `_semantic.scss`): `semantic.mobile` (< 600px), `semantic.tablet` (≥ 600px), `semantic.desktop` (≥ 900px), `semantic.wide` (≥ 1200px).
- Surfaces are flat: the `--org-glass-*` names remain, but resolve to a solid surface, no blur and a 1px `--org-outline-variant` ring. They belong to DS surfaces only: `org-surface`, drawers, dialogs, snackbars.
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

Uso recomendado: `<org-surface variant="card" [atmosphere]="true">...</org-surface>`. Variants are `card`, `panel`, `drawer`, `dialog`, and `hero`; atmosphere is opt-in and token-driven. `[flush]="true"` drops the inner padding for cards made of full-width rows with dividers (event date/place, "Lista do evento", "Minha família").

### OrgPageLayoutComponent

Uso recomendado: `<org-page-layout maxWidth="wide">...</org-page-layout>`. Use it as the page-width boundary, never a feature-local width recipe. On screens of 1200px and up, `narrow` and `default` take 70% of the width (at most 1440px); phones and tablets keep 600px and 960px.

### OrgPageHeaderComponent

Uso recomendado: `<org-page-header title="Olá, " highlight="Jéssica" subtitle="…" />`. Fredoka title without icon (Branco Essencial); `highlight` paints the trailing words in the leaf-green gradient. Actions go in `[orgPageHeaderActions]` (full width on phones, right side from tablet up).

### OrgSectionComponent

Uso recomendado: `<org-section title="Próximos eventos" icon="event">...</org-section>`. It provides one coherent section heading and rhythm.

### OrgButtonComponent

Uso recomendado: `<org-button label="Salvar" icon="check" variant="primary" [gradient]="true" (pressed)="save()" />`. Supported variants are `primary`, `secondary`, `danger`, `text`, `tonal` (soft lilac: "Responder convite"), `attention` (soft amber fill, no outline: "Eu levo") and `danger-text` ("Sair da conta"); use `disabled` or `loading` instead of local state CSS. `compact` draws a 36px pill while Material keeps the 48px touch target around it. `tooltip` shows a Material tooltip (hover, focus, long press); never use a native `title`. A toggle passes `[ariaPressed]` (the "Fixa / Dividir" lock switches between `tonal` and `text`), and a button that reveals a hint passes `[ariaExpanded]`.

### OrgIconButtonComponent

Uso recomendado: `<org-icon-button ariaLabel="Adicionar evento" icon="add" variant="primary" (pressed)="create()" />`. The accessible label is required, and it is also shown as a Material tooltip, since an icon alone does not say what it does. `tooltip` overrides the text; `tooltip=""` turns it off. A trash can (`delete`, `delete_outline`) is always `danger` red, whatever `variant` says, because removing is destructive everywhere.

### OrgChipComponent

Uso recomendado: `<org-chip label="Celebrativo" variant="accent" [selected]="selected()" (selectionChange)="toggle($event)" />`. Use it for compact selectable labels, not arbitrary button styling.

### OrgThemeToggleComponent

Uso recomendado: `<org-theme-toggle [dark]="theme.isDark()" (darkChange)="theme.setMode($event ? 'dark' : 'light')" />`. The light / dark switch in the header, next to the avatar: a sun and a moon with a thumb that slides to the one in use. It holds no theme logic; the app's `ThemeService` saves the choice (and "Sistema" stays available on the profile page).

### OrgEditableChipComponent

Uso recomendado: `<org-editable-chip placeholder="Personalizar" [value]="custom()" [selected]="!!custom()" (valueChange)="set($event)" (cleared)="clear()" />`. A Material editable chip for a value typed in place, next to the ready-made `org-chip` options (the event category). A click, Enter or the pencil starts editing; Enter or leaving the chip commits. Escape, an empty edit or an unchanged one keeps the previous value, so an edit left half-way never wipes it; ✕ clears it. The page validates what is committed.

### OrgIconComponent

Uso recomendado: `<org-icon name="event" size="sm" />`. Use the typed icon map instead of a raw Material icon in feature markup.

### OrgTextFieldComponent

Uso recomendado: `<org-text-field label="Título do evento" [(value)]="title" hint="Como os convidados verão o evento." />`. With `[suffixAction]="true"`, projected `[orgFieldSuffix]` content sits inside the field end (the "Fixa / Dividir" `org-button` of the item quantity). `[mask]` reformats what is typed (`Phone.mask`, `Quantity.mask`), `[maxLength]` caps it and `inputMode="numeric"` opens the number keyboard. Type numbers as text with a mask instead of `type="number"`, whose browser spin arrows do not match the system.

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

Uso recomendado: `<org-progress [value]="67" ariaLabel="8 de 12 confirmados" variant="success" />`. The goal-gradient bar: 6px rounded track on `--org-progress-track`, leaf gradient fill (`success` + `gradient`, the default look for progress). Use the same bar for every progress in the app.

### OrgNavBarComponent

Uso recomendado: `<org-nav-bar layout="bottom" [items]="navItems" [activeRoute]="currentUrl()" />`. Primary navigation only, owned by the app shell: `bottom` is the fixed phone bar (Início, Meus eventos, Perfil), `header` the segmented pills in the centre of the desktop header. Items are typed `OrgNavBarItem` (`route`, `label`, `icon`, `testId`, optional `exact`); the active link gets `aria-current="page"`.

### OrgAvatarComponent

Uso recomendado: `<org-avatar [name]="user.displayName" [photoUrl]="user.photoURL" size="md" />`. Photo or initial on a neutral disc; wrap it in a link or button that carries the accessible name (the avatar itself is decorative). `highlighted` tints it lilac for the profile header.

### OrgLogoComponent

Uso recomendado: `<org-logo />` in the header, `<org-logo size="lg" />` on the login screen. Calendar mark plus the gradient wordmark; the surrounding link provides the accessible name. The mark is an inline SVG animated with CSS only: every 6s the calendar hops, the check is drawn and confetti bursts from it; `[animated]="false"` and `prefers-reduced-motion` keep it still. `public/icons/favicon.svg` is the same mark, and the PNG/ICO icons are rendered from it.

### OrgSegmentedControlComponent

Uso recomendado: `<org-segmented-control ariaLabel="Selecionar tema" [options]="themeOptions" [value]="mode()" (valueChange)="setMode($event)" />`. Two or three mutually exclusive choices shown side by side (Hick), e.g. the theme choice in Perfil. Options are typed `OrgSegmentedOption` with `value`, `label`, optional `icon` and `testId`.

### OrgDateBadgeComponent

Uso recomendado: `<org-date-badge [date]="event.date" />`. Sky-blue month/day block at the top right of every event card (Início and Meus eventos). Announces the full date to screen readers.

### OrgFilterBarComponent

Uso recomendado: `<org-filter-bar ariaLabel="Filtrar eventos" [options]="filters()" [values]="activeFilters()" (valuesChange)="activeFilters.set($event)" />`. Filter chips above a list, on Material's chip listbox: the chips that are on show a check, and several can be on at once. "Todos" (`ORG_FILTER_ALL`) is on by default and alone; picking another chip turns it off, and turning the last one off (or picking "Todos") brings it back. The page shows every event any chip on matches. Used on Início (Todos, Pendentes, Confirmados, Recusados, Realizados) and Meus eventos (Todos, Em breve, Agendados, Realizados, Cancelados). `OrgFilterOption.count` shows a counter, `attention` paints it amber.

### OrgSplitProgressComponent

Uso recomendado: `<org-split-progress [total]="10" [segments]="[{ label: 'Ana', value: 4 }]" ariaLabel="Bolo de milho: 4 de 10" />`. Goal-gradient bar split by person in four leaf greens, with matching name chips below (`showLegend`). `size="md"` is the 10px "Itens completos" bar; `muted` fades completed items.

### OrgQuantityStepperComponent

Uso recomendado: `<org-quantity-stepper [(value)]="quantity" [max]="remaining" unit="un." />`. − / + with 48px targets for picking how many of an item someone brings.

### OrgBottomSheetComponent

Uso recomendado: `<org-bottom-sheet ariaLabel="Eu levo" [open]="open()" (closed)="open.set(false)">…</org-bottom-sheet>`. Slides up from the bottom on phones, centred card from tablet up; traps focus and closes on Escape or scrim tap. The page owns the content and the open state. `placement="side"` turns it into a right-hand drawer from tablet up (phones keep the bottom sheet): use it for editing (an item, a family member) and keep the centred card for a quick choice such as "Eu levo". The side drawer is 480px wide. Dialogs are only for decisions that interrupt, such as confirming a removal.

### OrgInsightCardComponent

Uso recomendado: `<org-insight-card tone="warning">Faltam 3 dias! <strong>2 itens</strong> estão sem responsável.<org-button orgInsightAction … /></org-insight-card>`. "Dica do Organiza AI" with the AI sparkle; `warning` (orange) when the event is close and something is missing, `info` (blue) otherwise.

### OrgMetricCardComponent

Uso recomendado: `<org-metric-card label="Confirmações" value="42" trend="18% nesta semana" [atmosphere]="true" />`.

### OrgDataTableComponent

Uso recomendado: `<org-data-table [rows]="events" [columns]="eventColumns" [actionTemplate]="actions" (rowActivated)="open($event)" />`. A feature fornece apenas dados, colunas tipadas e o template de ações; o componente é o único proprietário da tabela Material e de seus tokens visuais.

### OrgBadgeComponent

Uso recomendado: `<org-badge label="Novo" variant="success" icon="check" />`. Variants are semantic and the gradient can be disabled per use. Status tags are uppercase and filled (Confirmado green, Pendente amber, Recusado and Cancelado red). A category tag takes `[hue]="getCategoryHue(category)"`: a tint, text and thin outline in that category's own colour, never the exact green, amber or red of the status tags. `[pill]="true"` gives a sentence-case counter.

### OrgConfirmDialogComponent

Uso recomendado: inject `OrgDialogService` and call `confirm({ title, message, confirmLabel, cancelLabel })`; do not open a feature-local Material dialog for confirmations. Anything that deletes, removes or cancels passes `tone: 'danger'` (red top edge, red badge, red confirm button) and asks first: cancelling an event or an RSVP, and removing an item, a family member, a collaborator or an admin. `icon` picks the badge (`delete_outline` by default, `cancel`, `block`); `cancelLabel` names what staying means ("Manter evento", "Continuo indo"), defaulting to "Voltar" so it never reads like the cancel action itself. On phones the buttons stack full width with the confirm on top.

### OrgEmptyStateComponent

Uso recomendado: `<org-empty-state icon="event" title="Nenhum evento" description="Crie o primeiro evento para começar." />`.

### OrgCardHeaderComponent

Uso recomendado: `<org-card-header icon="pix" tone="primary" heading="Rachadinha via Pix" subheading="Contribua com o evento!" />` at the top of every card; tones are `info` (default, sky blue), `primary`, `primary-soft`, `tertiary` and `success`. Keep lilac tones for cards whose header is itself the call to action.

### OrgCopyButtonComponent

Uso recomendado: `<org-copy-button label="Copiar link" copiedMessage="Link copiado!" [value]="eventUrl()" />`; it owns the clipboard and the confirmation toast so presentational components stay service-free. When the browser refuses clipboard access (in-app webviews), it shows `failedMessage` as an error toast and does not emit `copied`.

### OrgLoadingStateComponent

Uso recomendado: `<org-loading-state label="Carregando eventos..." />` for any region that waits on data; it renders the spinner and the announced message, so features never import `MatProgressSpinner`.

### OrgSkeletonComponent

Uso recomendado: `<org-skeleton class="dashboard__skeleton-title" />` (or `shape="circle"`) as a placeholder; the feature class only sets width and height, the pulse and colour belong to the component.

### OrgExpansionPanelComponent

Uso recomendado: `<org-expansion-panel heading="Família leva 2 itens" icon="assignment" [(expanded)]="open"><span orgExpansionSummary>1/2 comprados</span>…</org-expansion-panel>` for collapsible summaries inside a card (Miller: details stay one tap away). Outline only, leaf-green icon and summary. The summary keeps its own width, sits `--org-space-md` away from the chevron, and a long heading ends in an ellipsis, so they never overlap in a narrow drawer; keep the summary short ("Nenhum", "2 selecionados", "+2 · 3 itens").

### OrgTooltipComponent

Uso recomendado: `<org-tooltip [text]="event().location"><p class="ellipsis">{{ event().location }}</p></org-tooltip>`. Material tooltip over any content, e.g. the full text of a line cut with an ellipsis. Buttons use their own `tooltip` input instead. Features never use the native `title` attribute (`feature-native-tooltip`) nor a native `<button>` (`feature-raw-button`).

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

`SeasonalThemeService` adds one class to `<html>`; each class only tints the page background (`--org-canvas`, light and dark). Actions, dates and progress keep the app palette so every screen stays consistent. Without a seasonal theme the shell shows a faint confetti pattern (`public/icons/confetti.svg`) in the three palette colours. Values live in the `$seasonal-themes` map in `src/app/shared/ui/tokens/_themes.scss`:

| Class             | Canvas (light) | Canvas (dark) |
| :---------------- | :------------- | :------------ |
| (none) — padrão   | #FFFFFF        | #181429       |
| `.theme-junina`   | #FFF6DF        | #1F1712       |
| `.theme-natal`    | #FFF5F1        | #1F1416       |
| `.theme-pascoa`   | #FAF6FF        | #18142A       |
| `.theme-ano-novo` | #FFFBED        | #17161C       |

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
- Do NOT paint non-actions lilac; lilac means "tap here". Dates and info are sky blue, progress and success are leaf green.
- Do NOT add a hamburger menu or side drawer for app navigation; destinations live in the bottom bar (phone) and header (desktop), account settings in Perfil.
- Do NOT use `ChangeDetectionStrategy.Default`.
- Do NOT introduce a new feature-local directive as a styling API when a standalone component can own the contract.
