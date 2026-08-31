# Feature 21: CSS Design Token Unification & Component Architecture Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Spec**: `.specs/features/21-css-design-token-and-component-architecture/spec.md`  
**Design**: `.specs/features/21-css-design-token-and-component-architecture/design.md`  
**Status**: Draft

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec - confirm before Execute. Guidelines found: `AGENTS.md`, `DESIGN.md`.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Design Tokens & Styles | none | Build gate passes; token declarations verified | `src/styles.scss`, `src/app/shared/ui/tokens/_semantic.scss` | `npm run build` |
| Presentational Components | unit | `input()` changes update template, `output()` emits payloads, no service injection | `src/app/features/**/*.spec.ts` | `npm test -- --watch=false` |
| Container Components | unit | Orchestrates service calls upon child outputs; state signals update | `src/app/features/**/*.spec.ts` | `npm test -- --watch=false` |
| E2E Visual & Functional | e2e | All 15 suites pass; zero regression on screenshots | `e2e/specs/*.spec.ts` | `npx playwright test` |

## Gate Check Commands

> Generated from codebase - confirm before Execute.

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | After tasks with unit tests only | `npm test -- --watch=false` |
| Full | After tasks modifying components / templates | `npm test -- --watch=false && npm run build` |
| Build | After phase completion or style/token tasks | `npm run build && npm test -- --watch=false` |

---

## Execution Plan

Phases are ordered and run sequentially - each phase completes before the next begins, and tasks within a phase execute in order.

### Phase 1: Design Tokens & Global Styles (Foundation)

Consolidate single source of truth for design tokens, showcase spacing on `/design-system`, and purge orphan/duplicate styles.

```
T1 → T2 → T3 → T4
```

### Phase 2: Ubiquitous Color Purge, Font & Component SCSS Refactoring

Eliminate legacy purple palette, hardcoded hex values across all components, component `!important` flags, and adopt responsive mixins.

```
T5 → T6 → T7 → T8 → T9 → T10
```

### Phase 3: Smart/Dumb Architecture & Design System Migration

Decouple presentational components, migrate all feature templates to `Org*` components, and delete dead code.

```
T11 → T12 → T13
```

---

## Task Breakdown

### T1: Consolidate Design Tokens in Semantic SCSS (Org-Export Ready)

**What**: Declare all status tokens (`--org-danger`, `--org-on-danger`, `--org-warning`, `--org-on-warning`), typography tokens (`--org-text-primary`, `--org-text-secondary`, `--org-text-muted`), surface utility tokens (`--org-border`, `--org-primary-light`), standardized spacing scale tokens (`--org-space-2xs: 2px`, `--org-space-xs: 4px`, `--org-space-sm: 8px`, `--org-space-md: 16px`, `--org-space-lg: 24px`, `--org-space-xl: 32px`, `--org-space-2xl: 48px`, `--org-space-3xl: 64px`), and border radius tokens (`--org-radius-sm: 0.75rem`, `--org-radius-md: 1rem`, `--org-radius-lg: 1.25rem`, `--org-radius-full: 9999px`) in `_semantic.scss` for modular org-level export.  
**Where**: `src/app/shared/ui/tokens/_semantic.scss`  
**Depends on**: None  
**Reuses**: `DESIGN.md` §2, §4.2  
**Requirement**: CSS-01, CSS-03, CSS-04  

**Tools**:
- MCP: `filesystem`
- Skill: NONE

**Done when**:
- [x] All missing `--org-*` status, semantic, and typography tokens declared in `_semantic.scss`
- [x] Standardized spacing scale (`--org-space-2xs` through `--org-space-3xl`) and radius (`--org-radius-sm` through `--org-radius-full`) declared in `_semantic.scss`
- [x] Single source of truth established for glassmorphism, spacing, and semantic tokens
- [x] Gate check passes: `npm run build`

**Tests**: none  
**Gate**: Build  

---

### T2: Add Spacing & Dimensions Section to Design System Showcase Page

**What**: Add a dedicated "Espaçamento e dimensões" section (`id="spacing"`) in `design-system-showcase.container.html`, register the navigation item in `src/app/core/models/design-system-navigation.model.ts`, add visual spacing bars, radius chips, and code examples for layout gaps/margins.  
**Where**: `src/app/features/design-system/design-system-showcase.container.html`  
**Depends on**: T1  
**Reuses**: `_semantic.scss`, `DESIGN.md` §4.2  
**Requirement**: CSS-05  

**Tools**:
- MCP: `filesystem`
- Skill: NONE

**Done when**:
- [ ] Navigation item `spacing` registered in `design-system-navigation.model.ts` under `foundations` group
- [ ] Showcase renders `#spacing` section with visual bars for all 8 spacing scale tokens (`--org-space-2xs` through `--org-space-3xl`)
- [ ] Radius preview chips and copyable CSS grid/flex gap usage snippet render cleanly
- [ ] Gate check passes: `npm test -- --watch=false && npm run build`

**Tests**: unit  
**Gate**: Full  

---

### T3: Clean Global Stylesheet Tokens & Tailwind Remnants

**What**: Remove redundant `:root` token block from `styles.scss` (deferring to `_semantic.scss`) and delete Tailwind escape selector `&.\!rounded-full`.  
**Where**: `src/styles.scss`  
**Depends on**: T2  
**Reuses**: `_semantic.scss`  
**Requirement**: CSS-02, CSS-27  

**Tools**:
- MCP: `filesystem`
- Skill: NONE

**Done when**:
- [ ] Zero duplicate `:root` custom property definitions in `src/styles.scss`
- [ ] `&.\!rounded-full` removed from line 370
- [ ] Gate check passes: `npm run build && npm test -- --watch=false`

**Tests**: none  
**Gate**: Build  

---

### T4: Delete Orphan SCSS and Duplicate Drawer Styles

**What**: Delete orphan file `_org-surface.scss` and remove `.glass-drawer` duplicate block from `app.scss`.  
**Where**: `src/app/shared/ui/surface/_org-surface.scss`  
**Depends on**: T3  
**Reuses**: `src/styles.scss` `.app-sidenav-drawer`  
**Requirement**: CSS-23, CSS-26  

**Tools**:
- MCP: `filesystem`
- Skill: NONE

**Done when**:
- [ ] File `src/app/shared/ui/surface/_org-surface.scss` is deleted
- [ ] `.glass-drawer` removed from `src/app/app.scss`
- [ ] Gate check passes: `npm run build`

**Tests**: none  
**Gate**: Build  

---

### T5: Purge Purple Palette & Hardcoded Colors from Profile Components

**What**: Replace all instances of `#630ed4`, `#7c3aed`, `#ede0ff`, and hardcoded hex values in Profile components with `--org-*` tokens.  
**Where**: `src/app/features/profile/components/profile-info-card/profile-info-card.component.scss`  
**Depends on**: None  
**Reuses**: `_semantic.scss`  
**Requirement**: CSS-06, CSS-07  

**Tools**:
- MCP: `filesystem`
- Skill: NONE

**Done when**:
- [ ] Zero instances of purple hex or hardcoded colors in `profile-info-card.component.scss` and `profile.container.scss`
- [ ] Gate check passes: `npm test -- --watch=false`

**Tests**: unit  
**Gate**: Quick  

---

### T6: Purge Purple Palette & Fix Typography in Event Detail Components

**What**: Replace `#6366f1` and hardcoded colors in `family-selector`, `guest-form-dialog`, `rsvp-card`, and `event-detail.container` with `--org-*` tokens; fix font in `pix-card` to `var(--org-font-mono)` and inherit body font in `event-card`.  
**Where**: `src/app/features/event-detail/components/pix-card/pix-card.component.scss`  
**Depends on**: T5  
**Reuses**: `_semantic.scss`  
**Requirement**: CSS-06, CSS-07, CSS-08, CSS-09  

**Tools**:
- MCP: `filesystem`
- Skill: NONE

**Done when**:
- [ ] Zero instances of `#6366f1` or hardcoded hex in Event Detail stylesheets
- [ ] Monospace font uses `var(--org-font-mono)` in `pix-card.component.scss`
- [ ] Gate check passes: `npm test -- --watch=false`

**Tests**: unit  
**Gate**: Quick  

---

### T7: Ubiquitous Hex Color Purge Across All Feature Stylesheets

**What**: Perform a codebase-wide sweep across `src/app/**/*.scss` (including `login`, `home`, `event-filters`, `admin`, `shared`) replacing all hardcoded hex values with `--org-*` tokens.  
**Where**: `src/app/features/auth/login/login.container.scss`  
**Depends on**: T6  
**Reuses**: `_semantic.scss`  
**Requirement**: CSS-07  

**Tools**:
- MCP: `filesystem`
- Skill: NONE

**Done when**:
- [ ] `grep -rn '#[0-9a-fA-F]\{3,6\}' src/app/` returns zero hardcoded colors outside `_semantic.scss`
- [ ] Gate check passes: `npm test -- --watch=false`

**Tests**: unit  
**Gate**: Quick  

---

### T8: Eliminate Component-Level !important & Adopt Breakpoint Mixins

**What**: Refactor 28 component-level `!important` occurrences using proper specificity (BEM classes and `:host`), replace raw `@media` queries with `@include semantic.tablet`, `@include semantic.desktop`, `@include semantic.wide`, and standardize margins/gaps to `--org-space-*` tokens.  
**Where**: `src/app/features/admin/event-editor/event-editor.container.scss`  
**Depends on**: T7  
**Reuses**: `_semantic.scss` breakpoint mixins & spacing tokens  
**Requirement**: CSS-20, CSS-21, CSS-22  

**Tools**:
- MCP: `filesystem`
- Skill: `bem-css`

**Done when**:
- [ ] 0 `!important` flags in component SCSS files
- [ ] Zero raw `@media (min-width` in component SCSS files
- [ ] Non-standard breakpoints (`480px`, `640px`, `760px`, `768px`) standardized
- [ ] Gate check passes: `npm test -- --watch=false && npm run build`

**Tests**: unit  
**Gate**: Full  

---

### T9: Deduplicate CSS Selectors in Event Editor and Navigation Drawer

**What**: Remove duplicate `.editor__guest-actions`, `.editor__header-main`, and `.navigation-drawer__logout` blocks.  
**Where**: `src/app/shared/ui/drawer/navigation-drawer.component.scss`  
**Depends on**: T8  
**Reuses**: Existing BEM blocks  
**Requirement**: CSS-24, CSS-25  

**Tools**:
- MCP: `filesystem`
- Skill: `bem-css`

**Done when**:
- [ ] Duplicate selector declarations removed
- [ ] Gate check passes: `npm run build`

**Tests**: none  
**Gate**: Build  

---

### T10: Replace Template Inline Skeleton Styles with SCSS Classes

**What**: Replace 16 hardcoded `style="height: ...; width: ...;"` inline attributes in `dashboard.container.html` and `event-editor.container.html` with SCSS helper classes.  
**Where**: `src/app/features/admin/dashboard/dashboard.container.html`  
**Depends on**: T9  
**Reuses**: Design system skeleton patterns  
**Requirement**: CSS-28  

**Tools**:
- MCP: `filesystem`
- Skill: NONE

**Done when**:
- [ ] 0 inline `style="height:` attributes in `dashboard.container.html` and `event-editor.container.html`
- [ ] Skeletons render identically using SCSS classes
- [ ] Gate check passes: `npm test -- --watch=false`

**Tests**: unit  
**Gate**: Quick  

---

### T11: Refactor Presentational Dialogs & Drawers to Pure Smart/Dumb Pattern

**What**: Decouple `GuestFormDialogComponent` and `RsvpDrawerComponent` from `FamilyService`, emitting family member payloads via `output()` or dialog results to `EventDetailContainer`.  
**Where**: `src/app/features/event-detail/components/guest-form-dialog/guest-form-dialog.component.ts`  
**Depends on**: None  
**Reuses**: Angular Signals `output()` API  
**Requirement**: CSS-10, CSS-11, CSS-12, CSS-13, CSS-14, CSS-15  

**Tools**:
- MCP: `filesystem`
- Skill: `tdd`

**Done when**:
- [ ] `GuestFormDialogComponent` has 0 service injections
- [ ] `RsvpDrawerComponent` has 0 service injections
- [ ] `EventDetailContainer` handles the `FamilyService` write calls
- [ ] Unit test suites for all 3 files pass: `npm test -- --watch=false`

**Tests**: unit  
**Gate**: Full  

---

### T12: Complete Design System Migration Across All Feature Templates

**What**: Sweep all feature templates (`src/app/features/**/*.html`) and replace all raw Material tags (`mat-card`, `mat-button`, `mat-icon-button`, `mat-form-field`, `mat-chip-set`) with `<org-surface>`, `<org-button>`, `<org-icon-button>`, `<org-text-field>`, `<org-chip>`.  
**Where**: `src/app/features/admin/event-editor/event-editor.container.html`  
**Depends on**: T11  
**Reuses**: `@shared/ui` component library  
**Requirement**: CSS-16, CSS-17, CSS-18, CSS-19  

**Tools**:
- MCP: `filesystem`
- Skill: NONE

**Done when**:
- [ ] 0 raw `mat-card`, `mat-button`, `mat-icon-button`, `mat-chip-set`, or `mat-form-field` tags in any feature template
- [ ] UI contracts validator passes: `node scripts/validate-ui-contracts.mjs --strict`
- [ ] Gate check passes: `npm test -- --watch=false && npm run build`

**Tests**: unit  
**Gate**: Full  

---

### T13: Delete Dead Component Directories & Clean References

**What**: Delete unused legacy component directories (`confirm-dialog/`, `theme-toggle/`, `collaborator-invite-dialog/`, and `admin-form-drawer/`) and remove obsolete imports.  
**Where**: `src/app/shared/components/confirm-dialog/`  
**Depends on**: T12  
**Reuses**: `OrgConfirmDialogComponent` in `shared/ui/`  
**Requirement**: CSS-29, CSS-30, CSS-31, CSS-32  

**Tools**:
- MCP: `filesystem`
- Skill: NONE

**Done when**:
- [ ] The 4 directories are completely removed from disk
- [ ] `npm test -- --watch=false` passes (all unit tests green)
- [ ] `npm run build` succeeds with zero errors
- [ ] `npx playwright test` passes (all 15 E2E suites green)

**Tests**: unit  
**Gate**: Full    

---

## Phase Execution Map

```
Phase 1 → Phase 2 → Phase 3

Phase 1:  T1 ──→ T2 ──→ T3 ──→ T4
Phase 2:  T5 ──→ T6 ──→ T7 ──→ T8 ──→ T9 ──→ T10
Phase 3:  T11 ──→ T12 ──→ T13
```

---

## Task Granularity Check

| Task | Scope | Status |
| ---- | ----- | ------ |
| T1: Consolidate Design Tokens in Semantic SCSS | 1 file (`_semantic.scss`) | ✅ Granular |
| T2: Add Spacing Section to Showcase Page | 4 files (showcase template, TS, SCSS, nav model) | ✅ Granular |
| T3: Clean Global Stylesheet Tokens & Tailwind Remnants | 1 file (`styles.scss`) | ✅ Granular |
| T4: Delete Orphan SCSS and Duplicate Drawer Styles | 2 files (delete + modify `app.scss`) | ✅ Granular |
| T5: Purge Purple Palette & Hardcoded Colors from Profile | 2 files (profile styles) | ✅ Granular |
| T6: Purge Purple Palette & Fix Typography in Event Detail | 4 related component styles | ✅ Granular |
| T7: Ubiquitous Hex Color Purge Across All Stylesheets | Component styles across features | ✅ Granular |
| T8: Eliminate !important & Adopt Mixins | Component stylesheets | ✅ Granular |
| T9: Deduplicate CSS Selectors in Editor and Drawer | 2 component SCSS files | ✅ Granular |
| T10: Replace Template Inline Skeleton Styles | 2 HTML templates | ✅ Granular |
| T11: Refactor Dialogs & Drawers to Smart/Dumb | 2 dumb components + 1 container | ✅ Granular |
| T12: Complete Design System Migration Across All Templates | Feature templates | ✅ Granular |
| T13: Delete Dead Component Directories | 4 dead folders | ✅ Granular |

---

## Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
| ---- | ---------------------- | ------------- | ------ |
| T1 | None | Entry point | ✅ Match |
| T2 | T1 | T1 → T2 | ✅ Match |
| T3 | T2 | T2 → T3 | ✅ Match |
| T4 | T3 | T3 → T4 | ✅ Match |
| T5 | None | Entry point (Phase 2) | ✅ Match |
| T6 | T5 | T5 → T6 | ✅ Match |
| T7 | T6 | T6 → T7 | ✅ Match |
| T8 | T7 | T7 → T8 | ✅ Match |
| T9 | T8 | T8 → T9 | ✅ Match |
| T10 | T9 | T9 → T10 | ✅ Match |
| T11 | None | Entry point (Phase 3) | ✅ Match |
| T12 | T11 | T11 → T12 | ✅ Match |
| T13 | T12 | T12 → T13 | ✅ Match |

---

## Test Co-location Validation

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
| ---- | --------------------------- | --------------- | --------- | ------ |
| T1: Consolidate Design Tokens | Styles / Tokens | none (Build gate) | none | ✅ OK |
| T2: Add Spacing Section to Showcase | Presentational / Showcase | unit | unit | ✅ OK |
| T3: Clean Global Stylesheet Tokens | Styles / Global | none (Build gate) | none | ✅ OK |
| T4: Delete Orphan SCSS | Styles / Global | none (Build gate) | none | ✅ OK |
| T5: Purge Purple Palette Profile | Component SCSS | unit | unit | ✅ OK |
| T6: Purge Purple Palette Event Detail | Component SCSS | unit | unit | ✅ OK |
| T7: Ubiquitous Hex Color Purge | Component SCSS | unit | unit | ✅ OK |
| T8: Eliminate !important & Adopt Mixins | Component SCSS | unit | unit | ✅ OK |
| T9: Deduplicate CSS Selectors | Component SCSS | none (Build gate) | none | ✅ OK |
| T10: Replace Template Inline Skeleton | Templates | unit | unit | ✅ OK |
| T11: Refactor Dialogs to Smart/Dumb | Presentational Components | unit | unit | ✅ OK |
| T12: Complete Design System Migration | Templates | unit | unit | ✅ OK |
| T13: Delete Dead Component Directories | Dead Components | unit | unit | ✅ OK |
