# Feature 15 — Design System Consolidation & Showcase Specification

## Problem Statement

While Feature 14 introduced core UI primitives and tokens, the frontend still contains legacy styling debt: obsolete utility classes (`.glass-card`, `.org-glass`, `.org-legacy-form-field`, `.flex`, `.h-4`, `.w-10`), manual `backdrop-filter` overrides scattered across feature SCSS files, unadorned `mat-form-field` instances lacking design system directives, and outdated purple/cyan color fallbacks (`#630ed4`, `#6366f1`, `#38bdf8`, `#00bfa5`).

Furthermore, developers lack structural layout primitives (`OrgPageLayoutComponent`, `OrgPageHeaderComponent`, `OrgSectionComponent`, `OrgFormGridDirective`, `OrgEmptyStateComponent`), `OrgSurfaceComponent` introduces unnecessary wrapper DOM nesting compared to an attribute directive (`[orgSurface]`), and there is no interactive showcase catalog or comprehensive documentation route (such as `https://design.freelaw.ai`) where developers and maintainers can audit component specimen cards, read "Quando usar" / "Quando não usar" guidance, test live variants and states, inspect property/token tables, copy Angular template snippets, and test dynamic Light/Dark/Seasonal theme controls.

## Goals

- [ ] Provide unified composition and surface primitives: `OrgSurfaceDirective` (`[orgSurface]`), `OrgPageLayoutComponent` (`<org-page-layout>`), `OrgPageHeaderComponent` (`<org-page-header>`), `OrgSectionComponent` (`<org-section>`), `OrgFormGridDirective` (`[orgFormGrid]`), and `OrgEmptyStateComponent` (`<org-empty-state>`).
- [ ] Eliminate all legacy style overrides and utility classes (`.glass-card`, `.org-glass`, `.org-legacy-form-field`, leftover Tailwind classes) from `src/styles.scss` and feature SCSS files.
- [ ] Migrate all feature views (Home, Organizer Dashboard, Event Editor, Event Detail, Profile, Family Roster, Auth Login) to use canonical UI primitives and standardized responsive breakpoints (600px / 900px / 1200px).
- [ ] Replace all outdated color fallbacks with the canonical product palette: Pink (`#ff4d94`), Orange (`#ff8c42`), and Yellow (`#ffc837`).
- [ ] Implement an interactive, superadmin-guarded Showcase page (`/design-system`) inspired by `https://design.freelaw.ai`, featuring:
  - Sticky Sidebar Navigation categorized into Brand/Visão Geral (Cores, Tipografia, Iconografia), Fundações (Tokens, Fundamentos), Componentes (Surfaces, Botões, Campos, Chips, Layout, Feedback, Modais/Drawers), and Regras/Diretrizes.
  - Component Specimen Cards containing Card Header (Name + import path `src/app/shared/ui/` + "Código" copy/toggle button), Guidance Text ("Quando usar", "Quando não usar", and design guidelines), Live Interactive Previews (Variants, Sizes, States: Default, Hover/Focus, Loading, Disabled, and Theming), Code Box (expandable/copyable clean Angular template snippet), and Properties/Tokens Table (Inputs, outputs, and `--org-*` CSS custom properties).
  - Interactive Theme Controls in the header supporting Light/Dark mode switching and Seasonal theme previewing (Valentine, Christmas, Carnaval, etc.).
- [ ] Update `DESIGN.md` into a living usage catalog documenting selectors, usage rules, variants, code examples, and CSS custom property theming APIs.

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
| --- | --- |
| External npm packaging / standalone library release | Organiza AI is currently a single-application repository; UI primitives live in `src/app/shared/ui/` until a second consumer app exists. |
| Rebranding or new visual aesthetic | The established Vibrant Celebration identity (Pink, Orange, Yellow accents, Plus Jakarta Sans, single-border glassmorphism) remains canonical. |
| Changes to authentication, authorization, or Firebase rules | Authentication and role-based access rules (AD-005, AD-016, AD-017, AD-024) remain unchanged; `/design-system` uses existing `superAdminGuard`. |
| Modifying business logic or Firestore data schemas | This feature is purely visual, architectural, and component-governance focused. |
| Storybook or third-party documentation tooling | The showcase is natively built within Angular at `/design-system` using OnPush standalone components and local mock datasets. |

---

## Assumptions & Open Questions

Every ambiguity is resolved or recorded here - nothing is left silently unclear.

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --- | --- | --- | --- |
| Surface primitive architecture | Replace `OrgSurfaceComponent` with `OrgSurfaceDirective` (`[orgSurface]`) applied to any host element (`div`, `mat-card`, `section`, `dialog`, `drawer`). | Directives eliminate superfluous DOM container wrappers, preserve semantic tags, and apply glassmorphic styles cleanly via host classes and CSS variables. | Yes |
| Showcase route access control & layout architecture | Protect `/design-system` with `superAdminGuard`, lazy-load under `app.routes.ts`, and structure the UI as a documentation catalog inspired by `https://design.freelaw.ai` (sticky sidebar with Brand, Fundações, Componentes, and Regras; specimen cards with import headers, 'Quando usar'/'Quando não usar' guidance, interactive state previews, copyable code box, and tokens table; interactive Light/Dark & Seasonal header controls). | Provides a living, centralized design system catalog for developers and maintainers to inspect, test, and copy component usage patterns without guessing. | Yes |
| Breakpoint standardization | Enforce exactly three canonical breakpoints across all stylesheets and layout components: Mobile (< 600px), Tablet (600px - 899px), Desktop (900px - 1199px), and Wide (>= 1200px). | Consolidates disparate media queries (640px, 768px, 960px, 1024px) into a consistent 600px/900px/1200px responsive rhythm. | Yes |
| Legacy class elimination | Completely remove `.glass-card`, `.org-glass`, `.org-legacy-form-field`, and Tailwind leftovers from `styles.scss` without maintaining deprecation aliases. | Zero tolerance for legacy dead code prevents styling divergence and enforces 100% adoption of `shared/ui` primitives. | Yes |
| Page layout container semantics | `OrgPageLayoutComponent` renders a semantic container with `role="main"` and responsive inline padding (`16px 12px` mobile -> `32px 16px` desktop). | Enforces WCAG landmark requirements and guarantees the zero-horizontal-overflow invariant across all screen sizes. | Yes |
| Empty state composition | `OrgEmptyStateComponent` renders an icon, title, description, and an optional projected action slot (`[orgEmptyStateAction]`). | Standardizes zero-data messaging across feeds, rosters, collaborator lists, and search results. | Yes |

**Open questions:** none - all resolved or logged above (required before the spec is confirmed).

---

## Implicit-Requirement Dimensions Sweep

Covering all 9 architectural dimensions:

| Dimension | Resolution / Explicit Requirement |
| --- | --- |
| Input validation & bounds | `OrgPageLayoutComponent` validates `maxWidth` against `'narrow' \| 'default' \| 'wide' \| 'full'` (defaulting to `'default'`). `OrgSurfaceDirective` validates `orgSurface` variant against `'card' \| 'panel' \| 'hero' \| 'drawer' \| 'dialog'` (defaulting to `'card'`). `OrgSectionComponent` validates non-negative `count` values. |
| Failure / partial-failure states | IF an invalid icon name or variant string is supplied THEN the system SHALL render a safe fallback (default icon / card variant) without throwing runtime template errors. |
| Idempotency / retry / duplicate handling | Surface and layout directives apply idempotent host class bindings and CSS custom properties; repeatedly binding or toggling inputs SHALL produce deterministic styling without side effects. |
| Auth boundaries & rate limits | The `/design-system` route is guarded strictly by `superAdminGuard`. IF an unauthenticated or non-superadmin user attempts navigation THEN the system SHALL redirect to `/login` or `/` without exposing showcase components. |
| Concurrency / ordering | Showcase component state (active sidebar category, code box expansion, interactive specimen controls) is signal-driven and strictly local; theme switches reactively synchronize with `ThemeService` signals without session race conditions. |
| Data lifecycle / expiry | N/A because Design System primitives and the showcase page are purely stateless presentational components with no persistent database lifecycle. |
| Observability | All components and directives SHALL maintain accessible DOM attributes (`role`, `aria-label`, `aria-busy`, `aria-disabled`), and the showcase suite SHALL be covered by automated unit and E2E visual tests. |
| External-dependency failure | All design tokens, icons (`ORG_ICON_MAP`), and typography (`Plus Jakarta Sans`) are bundled locally; the system SHALL have zero runtime dependency on external CDNs or unverified third-party libraries. |
| State-transition integrity | Theme toggling (Light / Dark / Seasonal) SHALL smoothly transition CSS custom properties across specimen cards without causing layout shifts, scrollbar flicker, or double-border artifacts. |

---

## User Stories

### P1: Composition and Surface Primitives ⭐ MVP

**User Story**: As a developer and user, I want standard layout and surface primitives (`[orgSurface]`, `<org-page-layout>`, `<org-page-header>`, `<org-section>`, `[orgFormGrid]`, `<org-empty-state>`) so that every page in the application has a consistent, responsive, accessible, and high-fidelity structure.

**Why P1**: Developers currently hand-craft wrapper `<div>`s, section titles, headers, and grid layouts with inconsistent margins, padding, and border radii, leading to visual fragmentation.

**Acceptance Criteria**:

1. The system SHALL provide `OrgSurfaceDirective` (`[orgSurface]`) supporting variants `'card'`, `'panel'`, `'hero'`, `'drawer'`, and `'dialog'`, defaulting to `'card'`. <!-- ubiquitous -->
2. WHEN an element applies `[orgSurface]` THEN the system SHALL bind `.org-surface` and the corresponding variant class, applying single-ring glassmorphism, `--org-gradient-border`, and `--org-glass-blur`. <!-- event-driven -->
3. The system SHALL expose a CSS custom property theming API on `OrgSurfaceDirective` supporting `--org-glass-bg`, `--org-glass-blur`, `--org-glass-shadow`, `--org-gradient-border`, `--org-glass-ring-width`, and `--org-radius-lg`. <!-- ubiquitous -->
4. WHEN `OrgPageLayoutComponent` (`<org-page-layout>`) is rendered THEN the system SHALL set `role="main"`, enforce the specified `maxWidth` (`'narrow'` @ 600px, `'default'` @ 960px, `'wide'` @ 1200px, or `'full'` @ 100%), and apply responsive padding (`16px 12px` on mobile < 600px, `32px 16px` on desktop >= 600px). <!-- event-driven -->
5. WHEN `OrgPageHeaderComponent` (`<org-page-header>`) is rendered THEN the system SHALL render a semantic `<header>` with an `<h1>` title, optional subtitle, optional `OrgIconComponent`, optional `.org-gradient-text` styling when `gradient="true"`, and a projected action slot `[orgPageHeaderActions]`. <!-- event-driven -->
6. WHEN `OrgSectionComponent` (`<org-section>`) is rendered THEN the system SHALL render a semantic `<section>` with an `<h2>` title, optional icon, optional count badge, a `24px` content gap, and a `:host + :host` top margin of `48px`. <!-- event-driven -->
7. WHEN `OrgFormGridDirective` (`[orgFormGrid]`) is applied to a container THEN the system SHALL layout child controls in a single column (`1fr`) on viewports < 600px and expand to multi-column grid layouts on viewports >= 600px with a `12px` mobile / `24px` desktop gap. <!-- event-driven -->
8. WHEN `OrgEmptyStateComponent` (`<org-empty-state>`) is rendered THEN the system SHALL display a centered glassmorphic card with the specified `icon`, `title`, `description`, and an optional projected action slot `[orgEmptyStateAction]`. <!-- event-driven -->

**Independent Test**: Mount each primitive in isolated Vitest component tests and verify DOM classes, computed styles, slots, variant attributes, and responsive media query bindings.

---

### P1: Total Legacy Removal and Zero-Inconsistency Migration ⭐ MVP

**User Story**: As a user, I want all legacy stylesheets, duplicated borders, leftover utility classes, and mismatched input outlines completely removed so that the UI is 100% compliant with the canonical design system.

**Why P1**: Leftover classes (`.glass-card`, `.org-glass`, `.org-legacy-form-field`, `.flex`, `.h-4`) and manual `backdrop-filter` declarations create styling conflicts, split borders, and maintenance confusion.

**Acceptance Criteria**:

1. The system SHALL completely remove `.glass-card`, `.org-glass`, and `.org-legacy-form-field` class definitions from `src/styles.scss`. <!-- ubiquitous -->
2. The system SHALL completely remove all leftover Tailwind utility classes (`.h-4`, `.h-5`, `.h-6`, `.h-10`, `.h-14`, `.h-28`, `.w-10`, `.w-16`, `.w-20`, `.w-24`, `.w-32`, `.w-40`, `.w-48`, `.w-full`, `.rounded-full`, `.items-center`, `.mb-2`, `.mt-2`, `.flex`, `.gap-2`) from `src/styles.scss`. <!-- ubiquitous -->
3. The system SHALL remove all manual `backdrop-filter` declarations from feature SCSS files (`login.container.scss`, `rsvp-drawer.component.scss`, `home.container.scss`, `event-filters.component.scss`, `profile.container.scss`, `app.scss`), delegating surface glassmorphism entirely to `[orgSurface]`. <!-- ubiquitous -->
4. WHEN an outlined `mat-form-field` is rendered in `login`, `guest-form-dialog`, `collaborator-invite-dialog`, or `family-selector` THEN the system SHALL apply `orgFormField` to ensure unified Material 3 MDC token styling. <!-- event-driven -->
5. The system SHALL migrate all page containers and surface cards across Home, Organizer Dashboard, Event Editor, Event Detail, Profile, and Family Roster to use `OrgPageLayoutComponent`, `OrgPageHeaderComponent`, `OrgSectionComponent`, `OrgSurfaceDirective`, and `OrgFormGridDirective`. <!-- ubiquitous -->
6. WHEN any component or stylesheet references brand colors THEN the system SHALL use canonical tokens Pink (`#ff4d94`), Orange (`#ff8c42`), and Yellow (`#ffc837`), and SHALL NOT contain outdated fallbacks (`#630ed4`, `#6366f1`, `#38bdf8`, `#00bfa5`). <!-- event-driven -->
7. The system SHALL standardize all media queries across the codebase to canonical breakpoints: 600px (tablet/mobile boundary), 900px (desktop), and 1200px (wide). <!-- ubiquitous -->

**Independent Test**: Execute ripgrep scans verifying zero occurrences of deleted legacy classes and obsolete hex color codes; run existing unit and Playwright test suites to ensure zero layout regressions.

---

### P1: Interactive Showcase Page (`/design-system`) ⭐ MVP

**User Story**: As a super administrator and frontend developer, I want an interactive showcase catalog at `/design-system` inspired by `https://design.freelaw.ai` featuring sticky sidebar navigation, structured component specimen cards ("Quando usar", "Quando não usar", live state previews, copyable Angular code, properties/tokens tables), and interactive Light/Dark and Seasonal theme switchers so that I can inspect, test, and reference every token and UI primitive in live execution.

**Why P1**: A living visual showcase catalog serves as both an automated integration playground and a definitive design reference, preventing token drift, visual regressions, and copy-paste styling errors.

**Acceptance Criteria**:

1. WHEN a Super Admin navigates to `/design-system` THEN the system SHALL lazy-load `DesignSystemShowcaseContainer` protected by `superAdminGuard`. <!-- event-driven -->
2. IF an unauthenticated user or non-superadmin navigates to `/design-system` THEN the system SHALL redirect the user away and deny access. <!-- unwanted-behavior -->
3. The system SHALL render a sticky sidebar navigation catalog inspired by `https://design.freelaw.ai`, structured into: Brand/Visão Geral (Cores, Tipografia, Iconografia), Fundações (Tokens, Fundamentos), Componentes (Surfaces, Botões, Campos, Chips, Layout, Feedback, Modais/Drawers), and Regras/Diretrizes. <!-- ubiquitous -->
4. WHEN the user toggles the theme or seasonal controls in the showcase header THEN the system SHALL dynamically switch between Light/Dark themes and preview seasonal theme accents (e.g. Valentine, Christmas, Carnaval) across all specimen cards in real time. <!-- event-driven -->
5. The system SHALL present each component within a structured specimen card containing a Card Header with component name, import path (`src/app/shared/ui/`), and code toggle/copy action; Guidance Text with "Quando usar", "Quando não usar", and design rules; Live Interactive Previews grouped by Variants, Sizes, States (Default, Hover/Focus, Loading, Disabled), and Theming; and an expandable/copyable clean Angular template snippet. <!-- ubiquitous -->
6. The system SHALL display structured properties and tokens tables within each specimen card documenting component inputs, outputs, default values, and `--org-*` CSS custom property theming hooks. <!-- ubiquitous -->
7. The showcase page SHALL satisfy the zero-horizontal-overflow invariant (`scrollWidth <= innerWidth + 1`) and maintain WCAG 2.1 AA accessibility standards on desktop and mobile viewports. <!-- ubiquitous -->

**Independent Test**: Navigate to `/design-system` as superadmin via Playwright; assert sidebar navigation categories render, interact with buttons, toggles, form inputs, code expansion drawers, and theme switchers, and verify zero accessibility or overflow errors.

---

### P1: Living Usage Catalog in DESIGN.md ⭐ MVP

**User Story**: As a developer and AI agent, I want `DESIGN.md` to be a comprehensive, up-to-date usage catalog so that every future feature correctly implements the design system primitives without guessing.

**Why P1**: Clear written documentation with when-to-use / when-not-to-use rules and copy-paste examples prevents recurring styling errors.

**Acceptance Criteria**:

1. The system documentation in `DESIGN.md` SHALL provide a complete catalog of all `src/app/shared/ui/` primitives: `OrgSurfaceDirective`, `OrgPageLayoutComponent`, `OrgPageHeaderComponent`, `OrgSectionComponent`, `OrgFormGridDirective`, `OrgEmptyStateComponent`, `OrgButtonDirective`, `OrgIconButtonDirective`, `OrgChipDirective`, `OrgIconComponent`, `OrgFormFieldDirective`, `OrgFieldLabelDirective`, `FeedbackService`, and `OrgBannerComponent`. <!-- ubiquitous -->
2. For every UI primitive, `DESIGN.md` SHALL document the Angular selector, "When to use", "When NOT to use", supported variants and inputs, ready-to-use HTML code examples, and CSS variable theming APIs. <!-- ubiquitous -->
3. The documentation in `DESIGN.md` SHALL reflect the canonical Pink-Orange-Yellow color palette and 600px / 900px / 1200px breakpoint standard. <!-- ubiquitous -->

**Independent Test**: Review `DESIGN.md` content to verify all 14 primitives are documented with complete usage contracts and code snippets.

---

## Edge Cases

- IF an invalid `maxWidth` value is passed to `OrgPageLayoutComponent` THEN the system SHALL fallback gracefully to `'default'` (960px).
- IF an unknown variant string is passed to `[orgSurface]` THEN the system SHALL fallback to the `'card'` variant.
- IF an unknown icon name is passed to `OrgIconComponent` or `OrgEmptyStateComponent` THEN the system SHALL render a fallback `'help_outline'` icon without throwing errors.
- IF a form grid is placed inside a narrow dialog or drawer (< 400px width) THEN the system SHALL keep fields stacked in a single column (`1fr`) without horizontal clipping.
- IF text content in `OrgPageHeaderComponent` or `OrgEmptyStateComponent` is exceptionally long THEN the system SHALL wrap text naturally and SHALL NOT cause page horizontal overflow.
- WHILE dark theme is active, all showcase code snippets and preview containers SHALL maintain minimum WCAG AA contrast ratios (4.5:1 for body text, 3:1 for large headlines).
- IF the showcase viewport is resized to mobile (< 600px) THEN the system SHALL collapse the sticky sidebar into a responsive drawer or header navigation menu while preserving specimen card accessibility.
- WHEN a user clicks the "Código" copy button on any component specimen card THEN the system SHALL copy the clean Angular template code snippet to the clipboard and show a confirmation toast without throwing errors.

---

## Requirement Traceability

| Requirement ID | Story | Task | Status |
| --- | --- | --- | --- |
| DSC-01 | P1: Composition and Surface Primitives | T1, T7 | Pending |
| DSC-02 | P1: Composition and Surface Primitives | T1 | Pending |
| DSC-03 | P1: Composition and Surface Primitives | T1 | Pending |
| DSC-04 | P1: Composition and Surface Primitives | T2, T7 | Pending |
| DSC-05 | P1: Composition and Surface Primitives | T3, T7 | Pending |
| DSC-06 | P1: Composition and Surface Primitives | T4, T7 | Pending |
| DSC-07 | P1: Composition and Surface Primitives | T5, T7 | Pending |
| DSC-08 | P1: Composition and Surface Primitives | T6, T7 | Pending |
| DSC-09 | P1: Total Legacy Removal and Zero-Inconsistency Migration | T8 | Pending |
| DSC-10 | P1: Total Legacy Removal and Zero-Inconsistency Migration | T8 | Pending |
| DSC-11 | P1: Total Legacy Removal and Zero-Inconsistency Migration | T11 | Pending |
| DSC-12 | P1: Total Legacy Removal and Zero-Inconsistency Migration | T12 | Pending |
| DSC-13 | P1: Total Legacy Removal and Zero-Inconsistency Migration | T13, T14, T15, T16, T17, T18 | Pending |
| DSC-14 | P1: Total Legacy Removal and Zero-Inconsistency Migration | T10 | Pending |
| DSC-15 | P1: Total Legacy Removal and Zero-Inconsistency Migration | T9 | Pending |
| DSC-16 | P1: Interactive Showcase Page (`/design-system`) | T22, T23 | Pending |
| DSC-17 | P1: Interactive Showcase Page (`/design-system`) | T22, T23 | Pending |
| DSC-18 | P1: Interactive Showcase Page (`/design-system`) | T19, T20, T23 | Pending |
| DSC-19 | P1: Interactive Showcase Page (`/design-system`) | T21, T23 | Pending |
| DSC-20 | P1: Interactive Showcase Page (`/design-system`) | T19, T20 | Pending |
| DSC-21 | P1: Interactive Showcase Page (`/design-system`) | T19, T20 | Pending |
| DSC-22 | P1: Interactive Showcase Page (`/design-system`) | T21, T23, T25 | Pending |
| DSC-23 | P1: Living Usage Catalog in DESIGN.md | T24 | Pending |
| DSC-24 | P1: Living Usage Catalog in DESIGN.md | T24 | Pending |
| DSC-25 | P1: Living Usage Catalog in DESIGN.md | T24 | Pending |

**Coverage:** 25 total, 25 mapped to tasks, 0 unmapped.

---

## Success Criteria

- [ ] All 6 new composition and layout primitives (`OrgSurfaceDirective`, `OrgPageLayoutComponent`, `OrgPageHeaderComponent`, `OrgSectionComponent`, `OrgFormGridDirective`, `OrgEmptyStateComponent`) are implemented and exported via `src/app/shared/ui/index.ts`.
- [ ] Zero occurrences of `.glass-card`, `.org-glass`, `.org-legacy-form-field`, and Tailwind utility classes exist in `src/styles.scss` or feature SCSS.
- [ ] All `mat-form-field` instances across the codebase use `orgFormField`.
- [ ] All views (Home, Dashboard, Event Editor, Event Detail, Profile, Family Roster, Auth Login) use canonical layout components and surface directives.
- [ ] The `/design-system` showcase route renders the documentation catalog inspired by `https://design.freelaw.ai` with sticky sidebar navigation, specimen cards ("Quando usar" / "Quando não usar", interactive previews, copyable code, property tables), and Light/Dark + Seasonal theme controls for Super Admins.
- [ ] `DESIGN.md` contains comprehensive usage guidelines, code snippets, and CSS variable theming APIs for all shared UI primitives.
- [ ] Vitest unit tests (100% passing) and Playwright E2E tests verify responsive zero-horizontal-overflow, WCAG AA accessibility, and 48px touch targets.
