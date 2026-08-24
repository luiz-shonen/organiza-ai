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

All components are imported from `@shared/ui` (or `src/app/shared/ui/index.ts`).

### 6.1 Surfaces (`orgSurface`)
Direct attribute directive applicable to native HTML elements (`article`, `section`, `div`, `mat-card`) or via `<org-surface>`.
```typescript
import { OrgSurfaceDirective, OrgSurfaceComponent } from '@shared/ui';
```
#### Usage
```html
<article [orgSurface]="'card'" [glow]="true" [active]="false">
  <h3>Card Title</h3>
</article>
```
#### Variants
- `'card'`: Standard container glass with $16\text{px}$ radius.
- `'panel'`: Denser background opacity for nested forms.
- `'glass'`: High transparency for floating overlays.
- `'hero'`: Prominent top-of-page container with $24\text{px}$ radius.
- `'sunken'`: Inset background with subtle inner shadow.
- `'elevated'`: High elevation with vibrant glow border.

---

### 6.2 Buttons & Links (`orgButton`)
Directive enhancing native `<button>` and `<a>` elements with WCAG 2.1 AA $\ge 48\text{px}$ touch targets, ripple animations, and loading states.
```typescript
import { OrgButtonDirective } from '@shared/ui';
```
#### Usage
```html
<button orgButton="primary" [orgButtonLoading]="isLoading()" (click)="save()">
  <org-icon name="check" size="sm" color="var(--org-on-primary)" />
  Salvar Alterações
</button>
```
#### Variants
- `'primary'`: Vibrant pink-orange gradient with white text.
- `'secondary'`: Translucent glass with primary border.
- `'tertiary'`: Soft yellow/amber accent.
- `'danger'`: Red gradient/fill for destructive actions.
- `'ghost'`: Borderless interactive button with hover highlight.

---

### 6.3 Chips & Badges (`orgChip`)
Directive enhancing Material `<mat-chip-option>`, `<mat-chip-row>`, and `<button>` with pill styling and touch target compliance.
```typescript
import { OrgChipDirective } from '@shared/ui';
```
#### Usage
```html
<mat-chip-option [orgChip]="'primary'" [selected]="isSelected()" (selectionChange)="toggle()">
  Festa
</mat-chip-option>
```
#### Variants: `'default'`, `'primary'`, `'accent'`, `'warn'`, `'outline'`

---

### 6.4 Forms & Fields (`orgFormField`, `orgFieldLabel`)
Material form-field token integration providing coherent single-color focus outlines, floating labels, and accessible error messaging.
```typescript
import { OrgFormFieldDirective, OrgFieldLabelDirective } from '@shared/ui';
```
#### Usage
```html
<mat-form-field orgFormField appearance="outline">
  <mat-label orgFieldLabel>Nome do Evento</mat-label>
  <input matInput [formControl]="nameCtrl" placeholder="Ex: Aniversário" />
  @if (nameCtrl.invalid && nameCtrl.touched) {
    <mat-error>Nome é obrigatório</mat-error>
  }
</mat-form-field>
```

---

### 6.5 Layout Primitives
```typescript
import {
  OrgPageLayoutComponent,
  OrgPageHeaderComponent,
  OrgSectionComponent,
  OrgFormGridDirective,
} from '@shared/ui';
```
#### Usage
```html
<org-page-layout maxWidth="default">
  <org-page-header
    title="Meus Eventos"
    subtitle="Gerencie seus eventos e convidados"
    icon="event"
    [gradient]="true"
  >
    <button orgButton="primary" headerActions routerLink="/evento/novo">
      <org-icon name="add" size="sm" color="var(--org-on-primary)" />
      Novo Evento
    </button>
  </org-page-header>

  <org-section title="Próximos Eventos" icon="event" [count]="events().length">
    <div orgFormGrid="2col">
      <!-- Responsive Form or Event Cards -->
    </div>
  </org-section>
</org-page-layout>
```

---

### 6.6 Feedback & Alerts
```typescript
import {
  OrgEmptyStateComponent,
  OrgBannerComponent,
  FeedbackService,
  FeedbackSnackbarComponent,
} from '@shared/ui';
```
#### Usage
```html
<!-- Empty State -->
<org-empty-state
  icon="event"
  title="Nenhum evento cadastrado"
  description="Clique abaixo para criar seu primeiro evento."
>
  <button orgButton="primary" orgEmptyStateAction routerLink="/evento/novo">
    Criar Evento
  </button>
</org-empty-state>

<!-- Inline Banner -->
<org-banner
  variant="warning"
  message="Verifique os itens pendentes antes de confirmar."
/>
```
#### Programmatic Feedback Service
```typescript
@Injectable()
export class MyFeatureComponent {
  private readonly feedback = inject(FeedbackService);

  onSuccess(): void {
    this.feedback.success('Operação realizada com sucesso!');
  }

  onError(): void {
    this.feedback.error('Ocorreu um erro ao processar sua solicitação.');
  }

  onInfo(): void {
    this.feedback.info('Você recebeu um novo convite.');
  }
}
```

---

### 6.7 Navigation
```typescript
import { NavigationDrawerComponent } from '@shared/ui';
```
Responsive slide-over navigation drawer displaying authenticated user profile, route navigation (`/`, `/meus-eventos`, `/perfil`, `/admin`, `/design-system`), and theme switchers.

### 6.8 Component-First Authoring Contract

When creating a new screen or feature, use the documented standalone components from `@shared/ui` as the public authoring API. The living catalog at `/design-system` contains a rendered preview and a copyable Angular example for each supported component.

```typescript
import {
  OrgBannerComponent,
  OrgPageHeaderComponent,
  OrgPageLayoutComponent,
  OrgSurfaceComponent,
} from '@shared/ui';
```

- Prefer `<org-page-layout>`, `<org-page-header>`, `<org-section>`, `<org-surface>`, `<org-banner>`, and `<org-empty-state>` over feature-local layout and feedback markup.
- Directives remain compatibility infrastructure for existing screens; they are not the default public API for new feature work.
- Do not recreate a component API with ad hoc classes, Material overrides, or copied SCSS. Add or extend a standalone shared component first, then document its preview and usage in `/design-system`.

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
