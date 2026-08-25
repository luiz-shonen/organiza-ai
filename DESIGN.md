# Organiza AI — Design System & Living Component Catalog

> **Version:** 2.0.0 (Consolidated)  
> **Status:** Production / Living Architecture  
> **Showcase Route:** `/design-system` *(Guarded by `superAdminGuard`)*  
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
| Token | CSS Variable | Hex | Usage |
| :--- | :--- | :--- | :--- |
| **Pink** | `--org-brand-pink` / `--org-primary` | `#FF4D94` | Primary brand accent, primary CTA, hero gradients, active highlights |
| **Orange** | `--org-brand-orange` / `--org-secondary` | `#FF8C42` | Secondary accent, gradient mid-point, decorative highlights |
| **Yellow** | `--org-brand-yellow` / `--org-tertiary` | `#FFC837` | Warm festive accents, countdown badges, highlights |

### 2.2 Semantic Colors (Light & Dark Mode)
```scss
// Light Theme Defaults
--org-surface: #FFF8F8;
--org-surface-card: rgba(255, 255, 255, 0.72);
--org-surface-glass: rgba(255, 255, 255, 0.45);
--org-surface-panel: rgba(255, 255, 255, 0.85);
--org-on-surface: #2A101F;
--org-on-surface-variant: #4A4455;
--org-glass-ring-color: rgba(255, 77, 148, 0.18);
--org-glass-border-width: 1px;

// Dark Theme Overrides (.dark)
--org-surface: #120816;
--org-surface-card: rgba(30, 15, 38, 0.75);
--org-surface-glass: rgba(25, 10, 32, 0.55);
--org-surface-panel: rgba(38, 20, 48, 0.85);
--org-on-surface: #F8EDF6;
--org-on-surface-variant: #D4C5D6;
--org-glass-ring-color: rgba(255, 77, 148, 0.28);
```

### 2.3 Status & Functional Tokens
- **Success:** `--org-success: #10B981`, `--org-on-success: #FFFFFF`
- **Warning:** `--org-warning: #F59E0B`, `--org-on-warning: #000000`
- **Danger / Error:** `--org-danger: #EF4444`, `--org-on-danger: #FFFFFF`
- **Info:** `--org-info: #3B82F6`, `--org-on-info: #FFFFFF`

---

## 3. Typography Hierarchy

The design system exclusively utilizes **Plus Jakarta Sans** across all roles, paired with bold weights for a welcoming, high-impact aesthetic.

| Level | Size | Weight | Line Height | Letter Spacing | CSS Class |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Display Large** | `48px` (Mobile: `36px`) | 800 (ExtraBold) | 1.1 | `-0.02em` | `.org-display-lg` |
| **Headline Medium** | `32px` | 700 (Bold) | 1.2 | `-0.01em` | `.org-headline-md` |
| **Headline Small** | `24px` | 700 (Bold) | 1.3 | `normal` | `.org-headline-sm` |
| **Title Medium** | `20px` | 600 (SemiBold) | 1.4 | `normal` | `.org-title-md` |
| **Body Large** | `18px` | 500 (Medium) | 1.6 | `normal` | `.org-body-lg` |
| **Body Medium** | `16px` | 400 (Regular) | 1.6 | `normal` | `.org-body-md` |
| **Body Small** | `14px` | 400 (Regular) | 1.5 | `normal` | `.org-body-sm` |
| **Label Bold** | `14px` | 700 (Bold) | 1.2 | `0.05em` | `.org-label-bold` |
| **Label Small** | `12px` | 600 (SemiBold) | 1.2 | `0.04em` | `.org-label-sm` |

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

---

## 5. Canonical Iconography

All system icons are rendered via `<org-icon [name]="iconName" [size]="'sm'|'md'|'lg'" [color]="colorString" />`.

### Supported Canonical Icons (23 Names)
1. `event` — Calendar / Event
2. `schedule` — Time / Clock
3. `place` — Location pin
4. `person` — User / Profile
5. `people` — Guests / Attendees
6. `add` — Add / Create
7. `edit` — Edit / Modify
8. `delete` — Remove / Delete
9. `close` — Dismiss / Close
10. `check` — Confirm / Success
11. `share` — Share action
12. `search` — Filter / Search
13. `favorite` — Saved / Favorite
14. `arrow_back` — Back navigation
15. `arrow_forward` — Forward navigation
16. `celebration` — Festive / Confetti
17. `light_mode` — Light theme
18. `dark_mode` — Dark theme
19. `palette` — Design System / Themes
20. `notifications` — Push notifications
21. `content_copy` — Clipboard copy
22. `account_circle` — Avatar fallback
23. `admin_panel_settings` — Superadmin dashboard

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

Uso recomendado: `<org-select-field label="Formato" [options]="formatOptions" [(value)]="format" />`. Options are typed objects with `value`, `label`, and optional `disabled`.

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
7. **Strict TypeScript:** `noImplicitAny: true`, zero `any` usage.

---

## 9. DOs and DON'Ts

### DO
-  Import UI components from `@shared/ui`.
-  Use `<org-surface>` for card, panel, drawer, dialog, and hero containers.
-  Use `--org-*` semantic tokens rather than hardcoded hex values in stylesheets.
-  Test layouts with both Light and Dark themes and across $320\text{px}$, $600\text{px}$, and $1200\text{px}$ viewports.
-  Use `FeedbackService` for user notifications and alerts.

### DON'T
-  Do NOT write custom `.mat-mdc-*` CSS overrides in feature components.
-  Do NOT nest multiple glassmorphic borders creating double rings.
-  Do NOT create buttons with touch targets smaller than $48\text{px} \times 48\text{px}$.
-  Do NOT hardcode purple product palettes; follow the canonical **Pink-Orange-Yellow** brand triple.
-  Do NOT use `ChangeDetectionStrategy.Default`.
-  Do NOT introduce a new feature-local directive as a styling API when a standalone component can own the contract.
