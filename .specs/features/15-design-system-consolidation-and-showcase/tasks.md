# Feature 15 Tasks — Organiza AI Design System — Consolidation & Showcase

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Design**: `.specs/features/15-design-system-consolidation-and-showcase/design.md`  
**Status**: Ready for Review

---

## Test Coverage Matrix

> Generated from `AGENTS.md`, `DESIGN.md`, `README.md`, `package.json`, `playwright.config.ts`, existing Vitest component specs, and existing Playwright POM/spec patterns. Existing project quality rules require a spec for every feature, OnPush components, WCAG AA compliance, atomic E2E tests, zero horizontal overflow, and 48px touch targets.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| --- | --- | --- | --- | --- |
| Shared UI Surface & Layout Primitives | unit | 1:1 API, variants, host class bindings, fallback values, responsive styling | `src/app/shared/ui/**/*.spec.ts` | `npm test -- --watch=false` |
| Shared UI Actions, Forms & Feedback | unit | Variant styling, loading/disabled states, MDC tokens, accessible labels | `src/app/shared/ui/**/*.spec.ts` | `npm test -- --watch=false` |
| Feature Presentational & Container Views | unit | Template rendering, input/output binding, migration to shared primitives | `src/app/features/**/*.spec.ts` | `npm test -- --watch=false` |
| Application Router & Security Guards | unit | Route definitions, `superAdminGuard` activation, unauthorized redirect | `src/app/app.spec.ts` | `npm test -- --watch=false` |
| Design System Showcase Page | unit + e2e | 14 sections rendering, theme toggle, live previews, zero horizontal overflow | `src/app/features/design-system/*.spec.ts`, `e2e/specs/design-system-showcase.spec.ts` | `npm test -- --watch=false && npm run test:e2e` |
| Visual Regression & Accessibility Suite | e2e | Desktop and Mobile viewports, light/dark themes, WCAG AA, 48px touch targets | `e2e/specs/*.spec.ts` | `npm run test:e2e` |
| Global Styles & Tokens | unit | Zero legacy classes, canonical 600/900/1200 breakpoints, Pink-Orange-Yellow tokens | `src/styles.scss`, `src/app/shared/ui/tokens/_semantic.scss` | `npm test -- --watch=false` |
| Living Usage Catalog | unit | Selector contracts, usage rules, code examples, CSS variables API in DESIGN.md | `DESIGN.md` | `npm test -- --watch=false` |

## Gate Check Commands

> Generated from codebase (`package.json` scripts) — confirm before Execute.

| Gate Level | When to Use | Command |
| --- | --- | --- |
| Quick | After tasks with unit tests only (primitives, services, containers, stylesheets) | `npm test -- --watch=false` |
| Full | After tasks with E2E tests or route/integration slices | `npm test -- --watch=false && npm run test:e2e` |
| Build | After phase completion, catalog updates, or final verification | `npm run build && npm test -- --watch=false` |

---

## Execution Plan

Phases are ordered and run sequentially — each phase completes before the next begins, and tasks within a phase execute in order.

### Phase 1: Core Surface & Layout Primitives

Foundational composition primitives: `OrgSurfaceDirective`, `OrgPageLayoutComponent`, `OrgPageHeaderComponent`, `OrgSectionComponent`, `OrgFormGridDirective`, `OrgEmptyStateComponent`, and shared UI exports.

```
T1 -> T2 -> T3 -> T4 -> T5 -> T6 -> T7
```

### Phase 2: Total Legacy Removal & Styles Cleanup

Eliminating all dead styling debt, legacy classes, obsolete colors, manual backdrop-filters, and standardizing breakpoints.

```
T8 -> T9 -> T10 -> T11 -> T12
```

### Phase 3: Full Feature Views Migration

Migrating all application views (Home, Organizer Dashboard, Event Editor, Event Detail, Profile, Family Roster, Auth Login) to canonical primitives.

```
T13 -> T14 -> T15 -> T16 -> T17 -> T18
```

### Phase 4: Design System Showcase Page

Building the Super Admin showcase catalog (`/design-system`) inspired by `https://design.freelaw.ai` with sticky sidebar navigation, component specimen cards ("Quando usar" / "Quando NÃO usar", live state previews, copyable code snippets, property tables), Light/Dark and Seasonal theme switchers, route guarding, and navigation drawer integration.

```
T19 -> T20 -> T21 -> T22 -> T23
```

### Phase 5: Living Usage Catalog & E2E Validation

Updating `DESIGN.md` into a living usage catalog and running the complete automated visual regression and zero-horizontal-overflow test suite.

```
T24 -> T25
```

---

## Task Breakdown

### Phase 1: Core Surface & Layout Primitives

### T1: Create OrgSurfaceDirective and styling rules

**What**: Create standalone `OrgSurfaceDirective` (`[orgSurface]`) supporting `card`, `panel`, `hero`, `drawer`, `dialog` variants with single-ring glassmorphism, responsive padding, and CSS custom property theming API (`--org-glass-bg`, `--org-glass-blur`, `--org-glass-shadow`, `--org-gradient-border`, `--org-glass-ring-width`, `--org-radius-lg`).
**Where**: `src/app/shared/ui/surface/org-surface.directive.ts`
**Depends on**: None
**Reuses**: Existing `--org-glass-*` design tokens, `_org-surface.scss`, and OnPush host binding patterns.
**Requirement**: DSC-01, DSC-02, DSC-03
**Tools**:
- MCP: NONE
- Skill: NONE
**Done when**:
- [ ] `OrgSurfaceDirective` created with `'card'`, `'panel'`, `'hero'`, `'drawer'`, `'dialog'` variant host class bindings
- [ ] Unit tests verify default `'card'` variant, fallback behavior, and CSS class bindings in `src/app/shared/ui/surface/org-surface.directive.spec.ts`
- [ ] Gate check passes: `npm test -- --watch=false`
- [ ] Test count: 54 test suites, 342 tests pass (no silent deletions)
**Tests**: unit
**Gate**: quick
**Commit**: `feat(ui): add single-owner surface directive primitive`

---

### T2: Create OrgPageLayoutComponent

**What**: Create OnPush standalone `OrgPageLayoutComponent` (`<org-page-layout>`) with `role="main"` landmark semantics, responsive inline padding (`16px 12px` mobile to `32px 16px` desktop), and `maxWidth` constraints (`narrow`, `default`, `wide`, `full`).
**Where**: `src/app/shared/ui/layout/org-page-layout.component.ts`
**Depends on**: T1
**Reuses**: Container maxWidth tokens and responsive padding patterns from `AGENTS.md`.
**Requirement**: DSC-04
**Tools**:
- MCP: NONE
- Skill: NONE
**Done when**:
- [ ] `OrgPageLayoutComponent` implements `maxWidth` input with default `'default'` (960px) and sets `role="main"` on host
- [ ] Unit tests verify container maxWidth classes, fallback on invalid maxWidth, and projected content in `src/app/shared/ui/layout/org-page-layout.component.spec.ts`
- [ ] Gate check passes: `npm test -- --watch=false`
- [ ] Test count: 55 test suites, 348 tests pass (no silent deletions)
**Tests**: unit
**Gate**: quick
**Commit**: `feat(ui): add page layout structural primitive`

---

### T3: Create OrgPageHeaderComponent

**What**: Create OnPush standalone `OrgPageHeaderComponent` (`<org-page-header>`) rendering semantic `<header>` with `<h1>` title, optional subtitle, optional leading `OrgIconComponent`, optional brand gradient text styling (`[gradient]="true"`), and `[orgPageHeaderActions]` projected action slot.
**Where**: `src/app/shared/ui/layout/org-page-header.component.ts`
**Depends on**: T2
**Reuses**: `OrgIconComponent`, `org-gradient-text` utility class, and typography tokens.
**Requirement**: DSC-05
**Tools**:
- MCP: NONE
- Skill: NONE
**Done when**:
- [ ] `OrgPageHeaderComponent` renders title in `<h1>`, optional subtitle in `<p>`, optional icon, and projects `[orgPageHeaderActions]`
- [ ] Unit tests verify title, subtitle, icon, gradient class, and projected actions in `src/app/shared/ui/layout/org-page-header.component.spec.ts`
- [ ] Gate check passes: `npm test -- --watch=false`
- [ ] Test count: 56 test suites, 354 tests pass (no silent deletions)
**Tests**: unit
**Gate**: quick
**Commit**: `feat(ui): add page header component primitive`

---

### T4: Create OrgSectionComponent

**What**: Create OnPush standalone `OrgSectionComponent` (`<org-section>`) rendering semantic `<section>` with `<h2>` title, optional icon, optional count badge, 24px content gap, standardized 48px `:host + :host` top margin, and `[orgSectionActions]` projected action slot.
**Where**: `src/app/shared/ui/layout/org-section.component.ts`
**Depends on**: T3
**Reuses**: `OrgIconComponent` and section heading typography tokens.
**Requirement**: DSC-06
**Tools**:
- MCP: NONE
- Skill: NONE
**Done when**:
- [ ] `OrgSectionComponent` renders `<h2>` title, optional count badge, optional icon, and projects `[orgSectionActions]` and default body content
- [ ] Unit tests verify title, badge, icon, and actions slot in `src/app/shared/ui/layout/org-section.component.spec.ts`
- [ ] Gate check passes: `npm test -- --watch=false`
- [ ] Test count: 57 test suites, 360 tests pass (no silent deletions)
**Tests**: unit
**Gate**: quick
**Commit**: `feat(ui): add section layout component primitive`

---

### T5: Create OrgFormGridDirective

**What**: Create standalone `OrgFormGridDirective` (`[orgFormGrid]`) that enforces responsive mobile-first CSS grid layout (1 column on < 600px, multi-column desktop grid with 12px/24px gaps via `--org-form-grid-cols`).
**Where**: `src/app/shared/ui/layout/org-form-grid.directive.ts`
**Depends on**: T4
**Reuses**: Mobile-first responsive grid patterns from `AGENTS.md` and `DESIGN.md`.
**Requirement**: DSC-07
**Tools**:
- MCP: NONE
- Skill: NONE
**Done when**:
- [ ] `OrgFormGridDirective` binds `.org-form-grid` class and applies `--org-form-grid-cols` custom property from `columns` input
- [ ] Unit tests verify default `'1fr 1fr'` grid, custom grid templates, and host bindings in `src/app/shared/ui/layout/org-form-grid.directive.spec.ts`
- [ ] Gate check passes: `npm test -- --watch=false`
- [ ] Test count: 58 test suites, 365 tests pass (no silent deletions)
**Tests**: unit
**Gate**: quick
**Commit**: `feat(ui): add form grid layout directive`

---

### T6: Create OrgEmptyStateComponent

**What**: Create OnPush standalone `OrgEmptyStateComponent` (`<org-empty-state>`) rendering centered glassmorphic card with icon, title, description, and optional `[orgEmptyStateAction]` projected CTA slot.
**Where**: `src/app/shared/ui/feedback/org-empty-state.component.ts`
**Depends on**: T5
**Reuses**: `OrgSurfaceDirective`, `OrgIconComponent`, and feedback typography tokens.
**Requirement**: DSC-08
**Tools**:
- MCP: NONE
- Skill: NONE
**Done when**:
- [ ] `OrgEmptyStateComponent` renders glassmorphic card surface with icon, title, description, and projected action slot
- [ ] Unit tests verify default `'info'` icon fallback, title, description, and action projection in `src/app/shared/ui/feedback/org-empty-state.component.spec.ts`
- [ ] Gate check passes: `npm test -- --watch=false`
- [ ] Test count: 59 test suites, 371 tests pass (no silent deletions)
**Tests**: unit
**Gate**: quick
**Commit**: `feat(ui): add empty state feedback component`

---

### T7: Update Shared UI Barrel Exports

**What**: Export all 6 new composition primitives and their associated types in `src/app/shared/ui/index.ts` and update index tests.
**Where**: `src/app/shared/ui/index.ts`
**Depends on**: T6
**Reuses**: Existing barrel export conventions and `src/app/shared/ui/index.spec.ts`.
**Requirement**: DSC-01, DSC-04, DSC-05, DSC-06, DSC-07, DSC-08
**Tools**:
- MCP: NONE
- Skill: NONE
**Done when**:
- [ ] `OrgSurfaceDirective`, `OrgPageLayoutComponent`, `OrgPageHeaderComponent`, `OrgSectionComponent`, `OrgFormGridDirective`, `OrgEmptyStateComponent`, and types are exported
- [ ] Unit tests in `src/app/shared/ui/index.spec.ts` verify all exports are defined
- [ ] Gate check passes: `npm test -- --watch=false`
- [ ] Test count: 59 test suites, 372 tests pass (no silent deletions)
**Tests**: unit
**Gate**: quick
**Commit**: `chore(ui): export consolidated primitives from shared ui barrel`

---

### Phase 2: Total Legacy Removal & Styles Cleanup

### T8: Remove legacy classes and utility rules from styles.scss

**What**: Delete `.glass-card`, `.org-glass`, `.org-legacy-form-field`, `.glass-input`, and leftover Tailwind utility classes (`.h-4`, `.h-5`, `.h-6`, `.h-10`, `.h-14`, `.h-28`, `.w-10`, `.w-16`, `.w-20`, `.w-24`, `.w-32`, `.w-40`, `.w-48`, `.w-full`, `.rounded-full`, `.items-center`, `.mb-2`, `.mt-2`, `.flex`, `.gap-2`) from `src/styles.scss`.
**Where**: `src/styles.scss`
**Depends on**: T7
**Reuses**: Clean SCSS token variables and MDC Material 3 token rules.
**Requirement**: DSC-09, DSC-10
**Tools**:
- MCP: NONE
- Skill: NONE
**Done when**:
- [ ] Zero occurrences of deleted legacy classes and Tailwind utilities exist in `src/styles.scss`
- [ ] Existing component tests pass without broken global styles
- [ ] Gate check passes: `npm test -- --watch=false`
- [ ] Test count: 59 test suites, 372 tests pass (no silent deletions)
**Tests**: unit
**Gate**: quick
**Commit**: `refactor(styles): remove legacy glass and tailwind classes`

---

### T9: Standardize responsive breakpoints across tokens

**What**: Standardize all media query variables and token definitions in `src/app/shared/ui/tokens/_semantic.scss` to canonical 600px (tablet/mobile boundary), 900px (desktop), and 1200px (wide) breakpoints.
**Where**: `src/app/shared/ui/tokens/_semantic.scss`
**Depends on**: T8
**Reuses**: AD-036 breakpoint standard and theme token structure.
**Requirement**: DSC-15
**Tools**:
- MCP: NONE
- Skill: NONE
**Done when**:
- [ ] Breakpoint tokens enforce 600px / 900px / 1200px standard with zero ad-hoc thresholds (640px, 768px, 960px, 1024px)
- [ ] Unit tests for theme tokens and responsive layouts pass
- [ ] Gate check passes: `npm test -- --watch=false`
- [ ] Test count: 59 test suites, 372 tests pass (no silent deletions)
**Tests**: unit
**Gate**: quick
**Commit**: `refactor(tokens): standardize responsive breakpoints to 600-900-1200`

---

### T10: Eliminate obsolete color fallbacks across feature stylesheets

**What**: Scan and replace outdated purple/cyan/teal color fallbacks (`#630ed4`, `#6366f1`, `#38bdf8`, `#00bfa5`) with canonical brand tokens Pink (`#ff4d94`), Orange (`#ff8c42`), Yellow (`#ffc837`), and `--org-primary` in `src/app/features/admin/event-editor/event-editor.container.scss`.
**Where**: `src/app/features/admin/event-editor/event-editor.container.scss`
**Depends on**: T9
**Reuses**: Brand color tokens from `src/app/shared/ui/tokens/_semantic.scss`.
**Requirement**: DSC-14
**Tools**:
- MCP: NONE
- Skill: NONE
**Done when**:
- [ ] Outdated hex colors replaced with `--org-primary` and canonical Pink/Orange/Yellow tokens
- [ ] Event editor container unit tests pass
- [ ] Gate check passes: `npm test -- --watch=false`
- [ ] Test count: 59 test suites, 372 tests pass (no silent deletions)
**Tests**: unit
**Gate**: quick
**Commit**: `refactor(styles): replace obsolete color fallbacks with brand tokens`

---

### T11: Remove manual backdrop-filter overrides in feature stylesheets

**What**: Remove manual `backdrop-filter: blur(...)` and duplicated glassmorphism declarations from `src/app/features/auth/login/login.container.scss`, delegating surface effects to `[orgSurface]`.
**Where**: `src/app/features/auth/login/login.container.scss`
**Depends on**: T10
**Reuses**: `OrgSurfaceDirective` styling rules from `_org-surface.scss`.
**Requirement**: DSC-11
**Tools**:
- MCP: NONE
- Skill: NONE
**Done when**:
- [ ] Manual backdrop-filter and split border declarations removed from login stylesheet
- [ ] Login container unit tests pass
- [ ] Gate check passes: `npm test -- --watch=false`
- [ ] Test count: 59 test suites, 372 tests pass (no silent deletions)
**Tests**: unit
**Gate**: quick
**Commit**: `refactor(login): delegate glass surface effects to orgSurface directive`

---

### T12: Apply orgFormField to dialogs and selector controls

**What**: Apply `orgFormField` directive to all outlined `mat-form-field` instances in `src/app/features/event-detail/components/guest-form-dialog/guest-form-dialog.component.html` (and collaborator/family dialogs) to ensure unified MDC token styling.
**Where**: `src/app/features/event-detail/components/guest-form-dialog/guest-form-dialog.component.html`
**Depends on**: T11
**Reuses**: `OrgFormFieldDirective` and `OrgFieldLabelDirective`.
**Requirement**: DSC-12
**Tools**:
- MCP: NONE
- Skill: NONE
**Done when**:
- [ ] All `mat-form-field` controls in dialog templates apply `orgFormField`
- [ ] Guest form dialog unit tests pass
- [ ] Gate check passes: `npm test -- --watch=false`
- [ ] Test count: 59 test suites, 372 tests pass (no silent deletions)
**Tests**: unit
**Gate**: quick
**Commit**: `fix(dialogs): apply orgFormField directive to guest and collaborator inputs`

---

### Phase 3: Full Feature Views Migration

### T13: Migrate Home view to canonical layout, surface, and empty state primitives

**What**: Refactor `src/app/features/home/home.container.html` to use `<org-page-layout maxWidth="default">`, `<org-page-header title="..." [gradient]="true">`, `<org-section title="...">`, `<article [orgSurface]="'card'">`, and `<org-empty-state>`.
**Where**: `src/app/features/home/home.container.html`
**Depends on**: T12
**Reuses**: `OrgPageLayoutComponent`, `OrgPageHeaderComponent`, `OrgSectionComponent`, `OrgSurfaceDirective`, `OrgEmptyStateComponent`.
**Requirement**: DSC-13
**Tools**:
- MCP: NONE
- Skill: NONE
**Done when**:
- [ ] Home view template completely migrates to shared layout and surface primitives
- [ ] Unit tests in `src/app/features/home/home.container.spec.ts` pass with updated selectors
- [ ] Gate check passes: `npm test -- --watch=false`
- [ ] Test count: 59 test suites, 372 tests pass (no silent deletions)
**Tests**: unit
**Gate**: quick
**Commit**: `refactor(home): migrate view to canonical layout and surface primitives`

---

### T14: Migrate Organizer Dashboard view to canonical layout and surface primitives

**What**: Refactor `src/app/features/admin/dashboard/dashboard.container.html` to use `<org-page-layout maxWidth="wide">`, `<org-page-header title="Meus Eventos">`, `<section [orgSurface]="'panel'">`, and `<org-empty-state>`.
**Where**: `src/app/features/admin/dashboard/dashboard.container.html`
**Depends on**: T13
**Reuses**: `OrgPageLayoutComponent`, `OrgPageHeaderComponent`, `OrgSurfaceDirective`, `OrgEmptyStateComponent`, `OrgButtonDirective`.
**Requirement**: DSC-13
**Tools**:
- MCP: NONE
- Skill: NONE
**Done when**:
- [ ] Dashboard template migrates to `org-page-layout`, `org-page-header`, `[orgSurface]`, and `org-empty-state`
- [ ] Unit tests in `src/app/features/admin/dashboard/dashboard.container.spec.ts` pass
- [ ] Gate check passes: `npm test -- --watch=false`
- [ ] Test count: 59 test suites, 372 tests pass (no silent deletions)
**Tests**: unit
**Gate**: quick
**Commit**: `refactor(dashboard): migrate view to canonical layout and surface primitives`

---

### T15: Migrate Event Editor view to canonical layout, surface, and form grid primitives

**What**: Refactor `src/app/features/admin/event-editor/event-editor.container.html` to use `<org-page-layout maxWidth="default">`, `<mat-card [orgSurface]="'card'">`, `<div [orgFormGrid]="'2fr 1fr'">`, `<div [orgFormGrid]="'1fr 1fr 1fr'">`, and `orgFormField`.
**Where**: `src/app/features/admin/event-editor/event-editor.container.html`
**Depends on**: T14
**Reuses**: `OrgPageLayoutComponent`, `OrgSurfaceDirective`, `OrgFormGridDirective`, `OrgFormFieldDirective`.
**Requirement**: DSC-13
**Tools**:
- MCP: NONE
- Skill: NONE
**Done when**:
- [ ] Event Editor template migrates to `org-page-layout`, `[orgSurface]`, `[orgFormGrid]`, and `orgFormField`
- [ ] Unit tests in `src/app/features/admin/event-editor/event-editor.container.spec.ts` pass
- [ ] Gate check passes: `npm test -- --watch=false`
- [ ] Test count: 59 test suites, 372 tests pass (no silent deletions)
**Tests**: unit
**Gate**: quick
**Commit**: `refactor(editor): migrate form layout and cards to ui primitives`

---

### T16: Migrate Event Detail cards and drawer to canonical layout and surface primitives

**What**: Refactor `src/app/features/event-detail/event-detail.container.html` (and child card components `EventCardComponent`, `RsvpCardComponent`, `PixCardComponent`, `ItemListCardComponent`, `RsvpDrawerComponent`) to use `<org-page-layout maxWidth="default">` and `[orgSurface]="'card'"`.
**Where**: `src/app/features/event-detail/event-detail.container.html`
**Depends on**: T15
**Reuses**: `OrgPageLayoutComponent`, `OrgSurfaceDirective`, `OrgFormFieldDirective`, `OrgButtonDirective`.
**Requirement**: DSC-13
**Tools**:
- MCP: NONE
- Skill: NONE
**Done when**:
- [ ] Event Detail container and child cards use `org-page-layout` and `[orgSurface]`
- [ ] Unit tests in `src/app/features/event-detail/event-detail.container.spec.ts` pass
- [ ] Gate check passes: `npm test -- --watch=false`
- [ ] Test count: 59 test suites, 372 tests pass (no silent deletions)
**Tests**: unit
**Gate**: quick
**Commit**: `refactor(event-detail): migrate view and cards to ui primitives`

---

### T17: Migrate Profile and Family Roster views to canonical layout and section primitives

**What**: Refactor `src/app/features/profile/profile.container.html` and `src/app/features/profile/components/family-roster-manager/family-roster-manager.component.html` to use `<org-page-layout maxWidth="default">`, `<org-section title="Minha Família">`, and `[orgSurface]="'card'"`.
**Where**: `src/app/features/profile/profile.container.html`
**Depends on**: T16
**Reuses**: `OrgPageLayoutComponent`, `OrgSectionComponent`, `OrgSurfaceDirective`, `OrgButtonDirective`.
**Requirement**: DSC-13
**Tools**:
- MCP: NONE
- Skill: NONE
**Done when**:
- [ ] Profile container and Family Roster components use `org-page-layout`, `org-section`, and `[orgSurface]`
- [ ] Unit tests in `src/app/features/profile/profile.container.spec.ts` pass
- [ ] Gate check passes: `npm test -- --watch=false`
- [ ] Test count: 59 test suites, 372 tests pass (no silent deletions)
**Tests**: unit
**Gate**: quick
**Commit**: `refactor(profile): migrate profile and family roster to ui primitives`

---

### T18: Migrate Auth Login view to canonical layout and surface primitives

**What**: Refactor `src/app/features/auth/login/login.container.html` to use `<org-page-layout maxWidth="narrow">`, `<div [orgSurface]="'card'" class="login__card">`, and `orgFormField` on email and password inputs.
**Where**: `src/app/features/auth/login/login.container.html`
**Depends on**: T17
**Reuses**: `OrgPageLayoutComponent`, `OrgSurfaceDirective`, `OrgFormFieldDirective`, `OrgButtonDirective`.
**Requirement**: DSC-13
**Tools**:
- MCP: NONE
- Skill: NONE
**Done when**:
- [ ] Login container template uses `org-page-layout`, `[orgSurface]`, and `orgFormField`
- [ ] Unit tests in `src/app/features/auth/login/login.container.spec.ts` pass
- [ ] Gate check passes: `npm test -- --watch=false`
- [ ] Test count: 59 test suites, 372 tests pass (no silent deletions)
**Tests**: unit
**Gate**: quick
**Commit**: `refactor(login): migrate login card to page layout and surface directives`

---

### Phase 4: Design System Showcase Page

### T19: Create Showcase page container layout and sidebar structure

**What**: Create OnPush standalone `DesignSystemShowcaseContainer` in `src/app/features/design-system/design-system-showcase.container.ts` with sticky sidebar (`aside.org-ds-sidebar`) containing categorized navigation (Brand, Fundações, Componentes, Regras), live search filter, and main canvas header with Light/Dark and Seasonal theme switchers.
**Where**: `src/app/features/design-system/design-system-showcase.container.ts`
**Depends on**: T18
**Reuses**: `ThemeService`, `FeedbackService`, `AppDrawerService`, and all shared UI primitives.
**Requirement**: DSC-18, DSC-20, DSC-21
**Tools**:
- MCP: NONE
- Skill: NONE
**Done when**:
- [ ] `DesignSystemShowcaseContainer` class implements category signals (Brand, Fundações, Componentes, Regras), search filter signal, sticky sidebar state, and theme/seasonal switcher handlers
- [ ] Unit tests in `src/app/features/design-system/design-system-showcase.container.spec.ts` verify category navigation, search filtering, and theme switching logic
- [ ] Gate check passes: `npm test -- --watch=false`
- [ ] Test count: 60 test suites, 378 tests pass (no silent deletions)
**Tests**: unit
**Gate**: quick
**Commit**: `feat(showcase): create showcase container with sticky sidebar and theme switchers`

---

### T20: Implement Component Specimen Card architecture and styles

**What**: Implement the Component Specimen Card architecture (`.org-ds-specimen-card`) in `src/app/features/design-system/design-system-showcase.container.scss` with header, import path, "Código" toggle/copy button, "Quando usar" / "Quando NÃO usar" guidance, live variant/size/state specimen galleries, code box drawer, and properties/tokens table.
**Where**: `src/app/features/design-system/design-system-showcase.container.scss`
**Depends on**: T19
**Reuses**: `_org-surface.scss`, `--org-*` design tokens, Plus Jakarta Sans typography, and DO/DON'T guidance rules.
**Requirement**: DSC-18, DSC-20, DSC-21
**Tools**:
- MCP: NONE
- Skill: NONE
**Done when**:
- [ ] Component Specimen Card styles (`.org-ds-specimen-card`, `.org-ds-rule--do`, `.org-ds-rule--dont`, `.org-ds-code-box`, `.org-ds-table`) implemented cleanly with responsive mobile-first rules
- [ ] Unit tests in `src/app/features/design-system/design-system-showcase.container.spec.ts` verify specimen card styling rules compile without errors
- [ ] Gate check passes: `npm test -- --watch=false`
- [ ] Test count: 60 test suites, 380 tests pass (no silent deletions)
**Tests**: unit
**Gate**: quick
**Commit**: `feat(showcase): implement component specimen card styling architecture`

---

### T21: Populate 14 visual showcase sections in showcase template

**What**: Populate all 14 visual showcase sections across Brand (Visão Geral, Cores, Tipografia, Iconografia), Fundações (Tokens, Fundamentos), Componentes (Surfaces, Botões, Formulários, Chips, Layout, Feedback, Navegação/Modais), and Regras (DOs/DON'Ts) with interactive specimen cards and copyable code snippets in `src/app/features/design-system/design-system-showcase.container.html`.
**Where**: `src/app/features/design-system/design-system-showcase.container.html`
**Depends on**: T20
**Reuses**: All 14 `shared/ui` component and directive contracts, `ORG_ICON_MAP`, and Angular `@for` / `@if` control flow.
**Requirement**: DSC-19, DSC-22
**Tools**:
- MCP: NONE
- Skill: NONE
**Done when**:
- [ ] All 14 visual sections rendered with structured specimen cards (header + import, DO/DON'T guidance, live canvas, code box with copy button, API property tables)
- [ ] Template unit tests in `src/app/features/design-system/design-system-showcase.container.spec.ts` verify all 14 sections and interactive controls render
- [ ] Gate check passes: `npm test -- --watch=false`
- [ ] Test count: 60 test suites, 384 tests pass (no silent deletions)
**Tests**: unit
**Gate**: quick
**Commit**: `feat(showcase): populate 14 visual showcase sections with specimen cards and snippets`

---

### T22: Wire /design-system route with superAdminGuard and navigation drawer entry

**What**: Register `/design-system` route under `src/app/app.routes.ts` with `superAdminGuard` and add navigation drawer entry when authenticated as superadmin.
**Where**: `src/app/app.routes.ts`
**Depends on**: T21
**Reuses**: `superAdminGuard`, `NavigationDrawerComponent`, and Angular lazy route loading syntax.
**Requirement**: DSC-16, DSC-17
**Tools**:
- MCP: NONE
- Skill: NONE
**Done when**:
- [ ] `/design-system` route registered with `superAdminGuard` and drawer entry configured for superadmin users
- [ ] App routing unit tests verify guard protection, route lazy loading, and redirect in `src/app/app.routes.spec.ts`
- [ ] Gate check passes: `npm test -- --watch=false`
- [ ] Test count: 60 test suites, 386 tests pass (no silent deletions)
**Tests**: unit
**Gate**: quick
**Commit**: `feat(router): wire guarded design system route and navigation entry`

---

### T23: Create component and E2E visual tests for Design System Showcase

**What**: Create component and E2E visual tests in `e2e/specs/design-system-showcase.spec.ts` testing sidebar navigation, theme toggling (Light/Dark and Seasonal), specimen card interaction, code box copying, superadmin guard redirect, and zero horizontal overflow.
**Where**: `e2e/specs/design-system-showcase.spec.ts`
**Depends on**: T22
**Reuses**: `assertNoHorizontalOverflow`, `assertMinTouchTarget`, Page Objects, and auth mock helpers.
**Requirement**: DSC-16, DSC-17, DSC-18, DSC-19, DSC-22
**Tools**:
- MCP: NONE
- Skill: NONE
**Done when**:
- [ ] E2E tests verify Super Admin access, unauthorized redirect, sticky sidebar navigation, theme switchers, specimen interactions, clipboard copying, and zero-overflow across Desktop Chromium and Mobile Chrome
- [ ] Gate check passes: `npm test -- --watch=false && npm run test:e2e`
- [ ] Test count: 60 unit test suites (386 unit tests) and 14 E2E test suites (155 E2E tests) pass (no silent deletions)
**Tests**: e2e
**Gate**: full
**Commit**: `test(e2e): add design system showcase interaction and visual tests`

---

### Phase 5: Living Usage Catalog & E2E Validation

### T24: Update DESIGN.md into comprehensive Living Usage Catalog

**What**: Update `DESIGN.md` with complete documentation for all 14 UI primitives: selectors, "When to use", "When NOT to use", inputs/outputs, ready-to-use HTML code examples, CSS variables theming APIs, canonical Pink-Orange-Yellow palette, and 600px/900px/1200px breakpoints.
**Where**: `DESIGN.md`
**Depends on**: T23
**Reuses**: Component contracts and design decisions from `design.md`.
**Requirement**: DSC-23, DSC-24, DSC-25
**Tools**:
- MCP: NONE
- Skill: NONE
**Done when**:
- [ ] `DESIGN.md` documents all 14 UI primitives with complete usage guidelines, code examples, and CSS variable theming APIs
- [ ] Build and unit test gate check passes: `npm run build && npm test -- --watch=false`
- [ ] Test count: 60 test suites, 386 tests pass (no silent deletions)
**Tests**: unit
**Gate**: build
**Commit**: `docs(design): update DESIGN.md into comprehensive living usage catalog`

---

### T25: Run full E2E visual regression and zero-horizontal-overflow verification

**What**: Update and execute the full visual regression and zero-horizontal-overflow test suite in `e2e/specs/visual-regression.spec.ts` across Desktop Chromium and Mobile Chrome, asserting design system consolidation compliance.
**Where**: `e2e/specs/visual-regression.spec.ts`
**Depends on**: T24
**Reuses**: Existing visual regression scenarios and Playwright test harness.
**Requirement**: DSC-22
**Tools**:
- MCP: NONE
- Skill: NONE
**Done when**:
- [ ] Visual regression test suite passes 100% with zero horizontal overflow across all pages and viewports
- [ ] Gate check passes: `npm run build && npm test -- --watch=false && npm run test:e2e`
- [ ] Test count: 60 unit test suites (386 unit tests) and 14 E2E test suites (155 E2E tests) pass (no silent deletions)
**Tests**: e2e
**Gate**: full
**Commit**: `test(visual): verify consolidated design system zero-regression baseline`

---

## Phase Execution Map

```
Phase 1 -> Phase 2 -> Phase 3 -> Phase 4 -> Phase 5

Phase 1: T1 -> T2 -> T3 -> T4 -> T5 -> T6 -> T7
Phase 2: T8 -> T9 -> T10 -> T11 -> T12
Phase 3: T13 -> T14 -> T15 -> T16 -> T17 -> T18
Phase 4: T19 -> T20 -> T21 -> T22 -> T23
Phase 5: T24 -> T25
```

---

## Task Granularity Check

| Task | Scope | Status |
| --- | --- | --- |
| T1: Create OrgSurfaceDirective and styling rules | 1 directive | ✅ Granular |
| T2: Create OrgPageLayoutComponent | 1 component | ✅ Granular |
| T3: Create OrgPageHeaderComponent | 1 component | ✅ Granular |
| T4: Create OrgSectionComponent | 1 component | ✅ Granular |
| T5: Create OrgFormGridDirective | 1 directive | ✅ Granular |
| T6: Create OrgEmptyStateComponent | 1 component | ✅ Granular |
| T7: Update Shared UI Barrel Exports | 1 barrel index file | ✅ Granular |
| T8: Remove legacy classes and utility rules from styles.scss | 1 stylesheet | ✅ Granular |
| T9: Standardize responsive breakpoints across tokens | 1 token file | ✅ Granular |
| T10: Eliminate obsolete color fallbacks across feature stylesheets | 1 stylesheet | ✅ Granular |
| T11: Remove manual backdrop-filter overrides in feature stylesheets | 1 stylesheet | ✅ Granular |
| T12: Apply orgFormField to dialogs and selector controls | 1 template | ✅ Granular |
| T13: Migrate Home view to canonical layout, surface, and empty state primitives | 1 template | ✅ Granular |
| T14: Migrate Organizer Dashboard view to canonical layout and surface primitives | 1 template | ✅ Granular |
| T15: Migrate Event Editor view to canonical layout, surface, and form grid primitives | 1 template | ✅ Granular |
| T16: Migrate Event Detail cards and drawer to canonical layout and surface primitives | 1 template | ✅ Granular |
| T17: Migrate Profile and Family Roster views to canonical layout and section primitives | 1 template | ✅ Granular |
| T18: Migrate Auth Login view to canonical layout and surface primitives | 1 template | ✅ Granular |
| T19: Create Showcase page container layout and sidebar structure | 1 component | ✅ Granular |
| T20: Implement Component Specimen Card architecture and styles | 1 stylesheet | ✅ Granular |
| T21: Populate 14 visual showcase sections in showcase template | 1 template | ✅ Granular |
| T22: Wire /design-system route with superAdminGuard and navigation drawer entry | 1 route file | ✅ Granular |
| T23: Create component and E2E visual tests for Design System Showcase | 1 E2E spec | ✅ Granular |
| T24: Update DESIGN.md into comprehensive Living Usage Catalog | 1 documentation catalog | ✅ Granular |
| T25: Run full E2E visual regression and zero-horizontal-overflow verification | 1 E2E spec | ✅ Granular |

---

## Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
| --- | --- | --- | --- |
| T1 | None | None | ✅ Match |
| T2 | T1 | T1 | ✅ Match |
| T3 | T2 | T2 | ✅ Match |
| T4 | T3 | T3 | ✅ Match |
| T5 | T4 | T4 | ✅ Match |
| T6 | T5 | T5 | ✅ Match |
| T7 | T6 | T6 | ✅ Match |
| T8 | T7 | T7 (Cross-phase: Phase 1 -> Phase 2) | ✅ Match |
| T9 | T8 | T8 | ✅ Match |
| T10 | T9 | T9 | ✅ Match |
| T11 | T10 | T10 | ✅ Match |
| T12 | T11 | T11 | ✅ Match |
| T13 | T12 | T12 (Cross-phase: Phase 2 -> Phase 3) | ✅ Match |
| T14 | T13 | T13 | ✅ Match |
| T15 | T14 | T14 | ✅ Match |
| T16 | T15 | T15 | ✅ Match |
| T17 | T16 | T16 | ✅ Match |
| T18 | T17 | T17 | ✅ Match |
| T19 | T18 | T18 (Cross-phase: Phase 3 -> Phase 4) | ✅ Match |
| T20 | T19 | T19 | ✅ Match |
| T21 | T20 | T20 | ✅ Match |
| T22 | T21 | T21 | ✅ Match |
| T23 | T22 | T22 | ✅ Match |
| T24 | T23 | T23 (Cross-phase: Phase 4 -> Phase 5) | ✅ Match |
| T25 | T24 | T24 | ✅ Match |

---

## Test Co-location Validation

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
| --- | --- | --- | --- | --- |
| T1: Create OrgSurfaceDirective and styling rules | Shared UI Directive | unit | unit | ✅ OK |
| T2: Create OrgPageLayoutComponent | Shared UI Component | unit | unit | ✅ OK |
| T3: Create OrgPageHeaderComponent | Shared UI Component | unit | unit | ✅ OK |
| T4: Create OrgSectionComponent | Shared UI Component | unit | unit | ✅ OK |
| T5: Create OrgFormGridDirective | Shared UI Directive | unit | unit | ✅ OK |
| T6: Create OrgEmptyStateComponent | Shared UI Component | unit | unit | ✅ OK |
| T7: Update Shared UI Barrel Exports | Shared UI Barrel Index | unit | unit | ✅ OK |
| T8: Remove legacy classes and utility rules from styles.scss | Global Stylesheet | unit | unit | ✅ OK |
| T9: Standardize responsive breakpoints across tokens | Design Tokens | unit | unit | ✅ OK |
| T10: Eliminate obsolete color fallbacks across feature stylesheets | Feature Stylesheet | unit | unit | ✅ OK |
| T11: Remove manual backdrop-filter overrides in feature stylesheets | Feature Stylesheet | unit | unit | ✅ OK |
| T12: Apply orgFormField to dialogs and selector controls | Feature Presentational Template | unit | unit | ✅ OK |
| T13: Migrate Home view to canonical layout, surface, and empty state primitives | Feature Container Template | unit | unit | ✅ OK |
| T14: Migrate Organizer Dashboard view to canonical layout and surface primitives | Feature Container Template | unit | unit | ✅ OK |
| T15: Migrate Event Editor view to canonical layout, surface, and form grid primitives | Feature Container Template | unit | unit | ✅ OK |
| T16: Migrate Event Detail cards and drawer to canonical layout and surface primitives | Feature Container Template | unit | unit | ✅ OK |
| T17: Migrate Profile and Family Roster views to canonical layout and section primitives | Feature Container Template | unit | unit | ✅ OK |
| T18: Migrate Auth Login view to canonical layout and surface primitives | Feature Container Template | unit | unit | ✅ OK |
| T19: Create Showcase page container layout and sidebar structure | Feature Container Component | unit | unit | ✅ OK |
| T20: Implement Component Specimen Card architecture and styles | Feature Stylesheet | unit | unit | ✅ OK |
| T21: Populate 14 visual showcase sections in showcase template | Feature Container Template | unit | unit | ✅ OK |
| T22: Wire /design-system route with superAdminGuard and navigation drawer entry | Application Router | unit | unit | ✅ OK |
| T23: Create component and E2E visual tests for Design System Showcase | E2E Integration Suite | e2e | e2e | ✅ OK |
| T24: Update DESIGN.md into comprehensive Living Usage Catalog | Documentation Catalog | unit | unit | ✅ OK |
| T25: Run full E2E visual regression and zero-horizontal-overflow verification | E2E Visual Suite | e2e | e2e | ✅ OK |
