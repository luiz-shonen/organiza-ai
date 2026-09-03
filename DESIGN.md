# Organiza AI — Design System & Living Component Catalog

> **Version:** 2.0.0 (Consolidated)  
> **Status:** Production / Living Architecture  
> **Showcase Route:** `/design-system` _(Guarded by `superAdminGuard`)_  
> **Audience:** Core Developers, UX Designers, Feature Architects

---

## Table of Contents

1. [Brand Identity & Festive Narrative](#1-brand-identity--festive-narrative)
2. [Color Palette & Semantic Tokens](#2-color-palette--semantic-tokens)
3. [Typography Hierarchy](#3-typography-hierarchy)
4. [Spacing, Breakpoints & Glassmorphism](#4-spacing-breakpoints--glassmorphism)
5. [Canonical Iconography](#5-canonical-iconography)
6. [Component Families & Public APIs](#6-component-families--public-apis)
   - [Surfaces (`orgSurface`)](#61-surfaces-orgsurface)
   - [Buttons & Links (`orgButton`)](#62-buttons--links-orgbutton)
   - [Chips & Badges (`orgChip`)](#63-chips--badges-orgchip)
   - [Forms & Fields (`orgFormField`, `orgFieldLabel`)](#64-forms--fields-orgformfield-orgfieldlabel)
   - [Layout Primitives (`org-page-layout`, `org-page-header`, `org-section`, `orgFormGrid`)](#65-layout-primitives)
   - [Feedback & Alerts (`org-empty-state`, `org-banner`, `FeedbackService`)](#66-feedback--alerts)
   - [Navigation (`app-navigation-drawer`)](#67-navigation)
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

## 2. Color Palette & Semantic Tokens

### 2.1 Canonical Brand Triple

| Token      | CSS Variable                             | Hex       | Usage                                                                |
| :--------- | :--------------------------------------- | :-------- | :------------------------------------------------------------------- |
| **Pink**   | `--org-brand-pink` / `--org-primary`     | `#FF4D94` | Primary brand accent, primary CTA, hero gradients, active highlights |
| **Orange** | `--org-brand-orange` / `--org-secondary` | `#FF8C42` | Secondary accent, gradient mid-point, decorative highlights          |
| **Yellow** | `--org-brand-yellow` / `--org-tertiary`  | `#FFC837` | Warm festive accents, countdown badges, highlights                   |

### 2.2 Semantic Colors (Light & Dark Mode)

```scss
// Light Theme Defaults
--org-surface: #fff8f8;
--org-surface-card: rgba(255, 255, 255, 0.72);
--org-surface-glass: rgba(255, 255, 255, 0.45);
--org-surface-panel: rgba(255, 255, 255, 0.85);
--org-on-surface: #2a101f;
--org-on-surface-variant: #4a4455;
--org-primary-container: rgba(255, 77, 148, 0.12);
--org-secondary-container: rgba(255, 140, 66, 0.14);
--org-glass-ring-color: rgba(255, 77, 148, 0.18);
--org-glass-border-width: 1px;

// Category Chip Semantic Tokens (Light)
--org-cat-aniversario-bg: rgba(255, 77, 148, 0.12);
--org-cat-aniversario-color: #d81b60;
--org-cat-casamento-bg: rgba(156, 39, 176, 0.12);
--org-cat-casamento-color: #8e24aa;
--org-cat-festa-bg: rgba(255, 140, 66, 0.14);
--org-cat-festa-color: #e65100;
--org-cat-churrasco-bg: rgba(244, 67, 54, 0.12);
--org-cat-churrasco-color: #c62828;
--org-cat-happy-bg: rgba(255, 200, 55, 0.18);
--org-cat-happy-color: #b78103;
--org-cat-formatura-bg: rgba(33, 150, 243, 0.12);
--org-cat-formatura-color: #1565c0;
--org-cat-outros-bg: rgba(158, 158, 158, 0.14);
--org-cat-outros-color: #616161;

// Dark Theme Overrides (.dark)
--org-surface: #120816;
--org-surface-card: rgba(30, 15, 38, 0.75);
--org-surface-glass: rgba(25, 10, 32, 0.55);
--org-surface-panel: rgba(38, 20, 48, 0.85);
--org-on-surface: #f8edf6;
--org-on-surface-variant: #d4c5d6;
--org-primary-container: rgba(255, 77, 148, 0.22);
--org-secondary-container: rgba(255, 140, 66, 0.24);
--org-glass-ring-color: rgba(255, 77, 148, 0.28);

// Category Chip Semantic Tokens (Dark)
--org-cat-aniversario-bg: rgba(255, 77, 148, 0.22);
--org-cat-aniversario-color: #ff80ab;
--org-cat-casamento-bg: rgba(186, 104, 200, 0.22);
--org-cat-casamento-color: #ce93d8;
--org-cat-festa-bg: rgba(255, 140, 66, 0.22);
--org-cat-festa-color: #ffb74d;
--org-cat-churrasco-bg: rgba(239, 83, 80, 0.22);
--org-cat-churrasco-color: #ef9a9a;
--org-cat-happy-bg: rgba(255, 200, 55, 0.22);
--org-cat-happy-color: #ffe082;
--org-cat-formatura-bg: rgba(66, 165, 245, 0.22);
--org-cat-formatura-color: #90caf9;
--org-cat-outros-bg: rgba(189, 189, 189, 0.22);
--org-cat-outros-color: #e0e0e0;
```

### 2.3 Status & Functional Tokens

- **Success:** `--org-success: #10B981`, `--org-on-success: #FFFFFF`
- **Warning:** `--org-warning: #F59E0B`, `--org-on-warning: #000000`
- **Danger / Error:** `--org-danger: #EF4444`, `--org-on-danger: #FFFFFF`
- **Info:** `--org-info: #3B82F6`, `--org-on-info: #FFFFFF`

---

## 3. Typography Hierarchy

The design system has three explicit type roles. **Plus Jakarta Sans** is the
default for every interactive and informational interface element. **Fraunces**
is reserved for editorial display headings and hero calls. **JetBrains Mono** is
reserved for tokens, code examples, and technical labels in the catalog. Do not
use a fourth family or a feature-local fallback.

| Role          | CSS variable         | Intended use                                           |
| :------------ | :------------------- | :----------------------------------------------------- |
| **Interface** | `--org-font-body`    | Text, actions, fields, navigation, tables, and metrics |
| **Display**   | `--org-font-display` | Hero titles, page displays, and editorial calls        |
| **Mono**      | `--org-font-mono`    | Tokens, source examples, and technical annotations     |

| Level               | Size                     | Weight         | Line Height | Letter Spacing | CSS Class                 |
| :------------------ | :----------------------- | :------------- | :---------- | :------------- | :------------------------ |
| **Display Large**   | `clamp(36px, 5vw, 72px)` | 600 (SemiBold) | 1.03        | `-0.02em`      | `--org-type-display-size` |
| **Headline Medium** | `clamp(26px, 3vw, 40px)` | 600 (SemiBold) | 1.12        | `-0.01em`      | `--org-type-heading-size` |
| **Headline Small**  | `24px`                   | 700 (Bold)     | 1.3         | `normal`       | `.org-headline-sm`        |
| **Title Medium**    | `20px`                   | 600 (SemiBold) | 1.4         | `normal`       | `.org-title-md`           |
| **Body Large**      | `18px`                   | 500 (Medium)   | 1.6         | `normal`       | `.org-body-lg`            |
| **Body Medium**     | `16px`                   | 400 (Regular)  | 1.6         | `normal`       | `.org-body-md`            |
| **Body Small**      | `14px`                   | 400 (Regular)  | 1.5         | `normal`       | `.org-body-sm`            |
| **Label Bold**      | `14px`                   | 700 (Bold)     | 1.2         | `0.05em`       | `.org-label-bold`         |
| **Label Small**     | `12px`                   | 600 (SemiBold) | 1.2         | `0.04em`       | `.org-label-sm`           |

---

## 4. Spacing, Breakpoints & Glassmorphism

### 4.1 Standardized Breakpoints

- **Mobile (`< 600px`):** Single-column fluid stacking, `12px-16px` container padding, touch targets $\ge 48\text{px}$.
- **Tablet (`600px - 899px`):** 2-column grids, `20px-24px` padding, hybrid navigation.
- **Desktop (`900px - 1199px`):** Multi-column grids, sticky sidebar navigation, `24px-32px` padding.
- **Wide (`≥ 1200px`):** Max content constraint ($1200\text{px}$ default, $840\text{px}$ compact), `32px-40px` padding.

### 4.2 Spacing Scale

- `2xs: 2px` | `xs: 4px` | `sm: 8px` | `md: 16px` | `lg: 24px` | `xl: 32px` | `2xl: 48px` | `3xl: 64px`

### 4.3 Single-Ring Glassmorphism Standard

To prevent visual artifacts, multiple overlapping borders, or nested outlines, all glass surfaces adhere to the **Single-Ring Contract**:

```scss
// Applied via [orgSurface]
backdrop-filter: blur(24px);
-webkit-backdrop-filter: blur(24px);
border: 1px solid var(--org-glass-ring-color);
background-clip: padding-box;
box-shadow: 0 8px 32px 0 rgba(255, 77, 148, 0.08);
```

### 4.4 Standardized Elevation & Box Shadows

All box shadows must use standardized tokens. Hardcoded pixel/color shadows in component stylesheets are strictly forbidden and enforced by `npm run lint:contracts`:

- `--org-shadow-xs`: `0 1px 2px rgba(0, 0, 0, 0.05)` (Subtle pill, badges, chip elements)
- `--org-shadow-sm`: `0 2px 6px rgba(0, 0, 0, 0.08)` (Cards, small popups, subtle elevations)
- `--org-shadow-md`: `0 4px 12px rgba(0, 0, 0, 0.12)` (Hover lifts, active chips, dialogs)
- `--org-shadow-lg`: `var(--org-glass-shadow)` (Menus, modal sheets, drawer surfaces)
- `--org-shadow-text`: `0 2px 8px rgba(0, 0, 0, 0.4)` (Hero text, overlay titles)

### 4.5 Standardized Border Radii

- `--org-radius-xs`: `0.375rem` (6px) — Micro controls, links
- `--org-radius-sm`: `0.75rem` (12px) — Badges, small inputs
- `--org-radius-md`: `1rem` (16px) — Cards, text fields, menu containers
- `--org-radius-lg`: `1.25rem` (20px) — Dialogs, bottom sheets
- `--org-radius-xl`: `1.75rem` (28px) — Large modal containers
- `--org-radius-pill`: `9999px` — Badges, filter chips, pill buttons
- `--org-radius-circle`: `50%` — Avatars, circular icon action badges

---

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

The application supports dynamic seasonal overrides on top of the base theme via root class tokens:

- `.theme-padrao`: Standard Vibrant Festive theme.
- `.theme-junina`: Warm amber, straw, and festive checkered warmth (`#FF9F1C`).
- `.theme-natal`: Holiday ruby red and evergreen accents (`#E63946`, `#2A9D8F`).
- `.theme-pascoa`: Soft pastel lilac, spring green, and blush tones (`#A8DADC`).
- `.theme-ano-novo`: Celebratory gold and silver champagne shimmer (`#D4AF37`).

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
- Do NOT use raw `<mat-icon>`, `<mat-chip>`, `<button mat-button>` or import `MatIconModule`, `MatButtonModule`, `MatChipsModule` in features.
- Do NOT nest multiple glassmorphic borders creating double rings.
- Do NOT create buttons with touch targets smaller than $48\text{px} \times 48\text{px}$.
- Do NOT hardcode purple product palettes; follow the canonical **Pink-Orange-Yellow** brand triple.
- Do NOT use `ChangeDetectionStrategy.Default`.
- Do NOT introduce a new feature-local directive as a styling API when a standalone component can own the contract.
