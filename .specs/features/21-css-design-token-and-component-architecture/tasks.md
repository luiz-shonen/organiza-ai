# Feature 21: CSS Design Token Unification & Component Architecture Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Spec**: `.specs/features/21-css-design-token-and-component-architecture/spec.md`  
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

Consolidate single source of truth for design tokens and purge orphan/duplicate styles.

```
T1 → T2 → T3
```

### Phase 2: Ubiquitous Color Purge, Font & Component SCSS Refactoring

Eliminate legacy purple palette, hardcoded hex values across all components, component `!important` flags, and adopt responsive mixins.

```
T4 → T5 → T6 → T7 → T8 → T9
```

### Phase 3: Smart/Dumb Architecture & Design System Migration

Decouple presentational components, migrate all feature templates to `Org*` components, and delete dead code.

```
T10 → T11 → T12
```

---

## Task Breakdown

### T1: Consolidate Design Tokens in Semantic SCSS (Org-Export Ready)

**What**: Declare all missing tokens (`--org-danger`, `--org-on-danger`, `--org-warning`, `--org-on-warning`, `--org-text-primary`, `--org-text-secondary`, `--org-text-muted`, `--org-border`, `--org-primary-light`) and align token values in `_semantic.scss` for modular org-level export.  
**Where**: `src/app/shared/ui/tokens/_semantic.scss`  
**Depends on**: None  
**Reuses**: `DESIGN.md` §2  
**Requirement**: CSS-01, CSS-03  

**Tools**:
- MCP: `filesystem`
- Skill: NONE

**Done when**:
- [ ] All missing `--org-*` tokens declared in `_semantic.scss`
- [ ] Single source of truth established for glassmorphism and semantic tokens
- [ ] Gate check passes: `npm run build`

**Tests**: none  
**Gate**: Build  

---

### T2: Clean Global Stylesheet Tokens & Tailwind Remnants

**What**: Remove redundant `:root` token block from `styles.scss` (deferring to `_semantic.scss`) and delete Tailwind escape selector `&.\!rounded-full`.  
**Where**: `src/styles.scss`  
**Depends on**: T1  
**Reuses**: `_semantic.scss`  
**Requirement**: CSS-02, CSS-17  

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

### T3: Delete Orphan SCSS and Duplicate Drawer Styles

**What**: Delete orphan file `_org-surface.scss` and remove `.glass-drawer` duplicate block from `app.scss`.  
**Where**: `src/app/shared/ui/surface/_org-surface.scss`  
**Depends on**: T2  
**Reuses**: `src/styles.scss` `.app-sidenav-drawer`  
**Requirement**: CSS-11, CSS-24  

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

### T4: Purge Purple Palette & Hardcoded Colors from Profile Components

**What**: Replace all instances of `#630ed4`, `#7c3aed`, `#ede0ff`, and hardcoded hex values in Profile components with `--org-*` tokens.  
**Where**: `src/app/features/profile/components/profile-info-card/profile-info-card.component.scss`  
**Depends on**: None  
**Reuses**: `_semantic.scss`  
**Requirement**: CSS-04, CSS-05  

**Tools**:
- MCP: `filesystem`
- Skill: NONE

**Done when**:
- [ ] Zero instances of purple hex or hardcoded colors in `profile-info-card.component.scss` and `profile.container.scss`
- [ ] Gate check passes: `npm test -- --watch=false`

**Tests**: unit  
**Gate**: Quick  

---

### T5: Purge Purple Palette & Fix Typography in Event Detail Components

**What**: Replace `#6366f1` and hardcoded colors in `family-selector`, `guest-form-dialog`, `rsvp-card`, and `event-detail.container` with `--org-*` tokens; fix font in `pix-card` to `var(--org-font-mono)` and inherit body font in `event-card`.  
**Where**: `src/app/features/event-detail/components/pix-card/pix-card.component.scss`  
**Depends on**: T4  
**Reuses**: `_semantic.scss`  
**Requirement**: CSS-04, CSS-05, CSS-06, CSS-07  

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

### T6: Ubiquitous Hex Color Purge Across All Feature Stylesheets

**What**: Perform a codebase-wide sweep across `src/app/**/*.scss` (including `login`, `home`, `event-filters`, `admin`, `shared`) replacing all hardcoded hex values with `--org-*` tokens.  
**Where**: `src/app/features/auth/login/login.container.scss`  
**Depends on**: T5  
**Reuses**: `_semantic.scss`  
**Requirement**: CSS-05  

**Tools**:
- MCP: `filesystem`
- Skill: NONE

**Done when**:
- [ ] `grep -rn '#[0-9a-fA-F]\{3,6\}' src/app/` returns zero hardcoded colors outside `_semantic.scss`
- [ ] Gate check passes: `npm test -- --watch=false`

**Tests**: unit  
**Gate**: Quick  

---

### T7: Eliminate Component-Level !important & Adopt Breakpoint Mixins

**What**: Refactor 28 component-level `!important` occurrences using proper specificity (BEM classes and `:host`), and replace raw `@media` queries with `@include semantic.tablet`, `@include semantic.desktop`, `@include semantic.wide`.  
**Where**: `src/app/features/admin/event-editor/event-editor.container.scss`  
**Depends on**: T6  
**Reuses**: `_semantic.scss` breakpoint mixins  
**Requirement**: CSS-08, CSS-09, CSS-10, CSS-18, CSS-19, CSS-20  

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

### T8: Deduplicate CSS Selectors in Event Editor and Navigation Drawer

**What**: Remove duplicate `.editor__guest-actions`, `.editor__header-main`, and `.navigation-drawer__logout` blocks.  
**Where**: `src/app/shared/ui/drawer/navigation-drawer.component.scss`  
**Depends on**: T7  
**Reuses**: Existing BEM blocks  
**Requirement**: CSS-12, CSS-13, CSS-22, CSS-23  

**Tools**:
- MCP: `filesystem`
- Skill: `bem-css`

**Done when**:
- [ ] Duplicate selector declarations removed
- [ ] Gate check passes: `npm run build`

**Tests**: none  
**Gate**: Build  

---

### T9: Replace Template Inline Skeleton Styles with SCSS Classes

**What**: Replace 16 hardcoded `style="height: ...; width: ...;"` inline attributes in `dashboard.container.html` and `event-editor.container.html` with SCSS helper classes.  
**Where**: `src/app/features/admin/dashboard/dashboard.container.html`  
**Depends on**: T8  
**Reuses**: Design system skeleton patterns  
**Requirement**: CSS-15, CSS-16, CSS-26  

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

### T10: Refactor Presentational Dialogs & Drawers to Pure Smart/Dumb Pattern

**What**: Decouple `GuestFormDialogComponent` and `RsvpDrawerComponent` from `FamilyService`, emitting family member payloads via `output()` or dialog results to `EventDetailContainer`.  
**Where**: `src/app/features/event-detail/components/guest-form-dialog/guest-form-dialog.component.ts`  
**Depends on**: None  
**Reuses**: Angular Signals `output()` API  
**Requirement**: CSS-09, CSS-10, CSS-12, CSS-13  

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

### T11: Complete Design System Migration Across All Feature Templates

**What**: Sweep all feature templates (`src/app/features/**/*.html`) and replace all raw Material tags (`mat-card`, `mat-button`, `mat-icon-button`, `mat-form-field`, `mat-chip-set`) with `<org-surface>`, `<org-button>`, `<org-icon-button>`, `<org-text-field>`, `<org-chip>`.  
**Where**: `src/app/features/admin/event-editor/event-editor.container.html`  
**Depends on**: T10  
**Reuses**: `@shared/ui` component library  
**Requirement**: CSS-14, CSS-15, CSS-16, CSS-17, CSS-21, CSS-22, CSS-23, CSS-24  

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

### T12: Delete Dead Component Directories & Clean References

**What**: Delete unused legacy component directories (`confirm-dialog/`, `theme-toggle/`, `collaborator-invite-dialog/`, and `admin-form-drawer/`) and remove obsolete imports.  
**Where**: `src/app/shared/components/confirm-dialog/`  
**Depends on**: T11  
**Reuses**: `OrgConfirmDialogComponent` in `shared/ui/`  
**Requirement**: CSS-25, CSS-26, CSS-27, CSS-28, CSS-29, CSS-30  

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

Phase 1:  T1 ──→ T2 ──→ T3
Phase 2:  T4 ──→ T5 ──→ T6 ──→ T7 ──→ T8 ──→ T9
Phase 3:  T10 ──→ T11 ──→ T12
```

---

## Task Granularity Check

| Task | Scope | Status |
| ---- | ----- | ------ |
| T1: Consolidate Design Tokens in Semantic SCSS | 1 file (`_semantic.scss`) | ✅ Granular |
| T2: Clean Global Stylesheet Tokens & Tailwind Remnants | 1 file (`styles.scss`) | ✅ Granular |
| T3: Delete Orphan SCSS and Duplicate Drawer Styles | 2 files (delete + modify `app.scss`) | ✅ Granular |
| T4: Purge Purple Palette & Hardcoded Colors from Profile | 2 files (profile styles) | ✅ Granular |
| T5: Purge Purple Palette & Fix Typography in Event Detail | 4 related component styles | ✅ Granular |
| T6: Ubiquitous Hex Color Purge Across All Stylesheets | Component styles across features | ✅ Granular |
| T7: Eliminate !important & Adopt Mixins | Component stylesheets | ✅ Granular |
| T8: Deduplicate CSS Selectors in Editor and Drawer | 2 component SCSS files | ✅ Granular |
| T9: Replace Template Inline Skeleton Styles | 2 HTML templates | ✅ Granular |
| T10: Refactor Dialogs & Drawers to Smart/Dumb | 2 dumb components + 1 container | ✅ Granular |
| T11: Complete Design System Migration Across All Templates | Feature templates | ✅ Granular |
| T12: Delete Dead Component Directories | 4 dead folders | ✅ Granular |

---

## Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
| ---- | ---------------------- | ------------- | ------ |
| T1 | None | Entry point | ✅ Match |
| T2 | T1 | T1 → T2 | ✅ Match |
| T3 | T2 | T2 → T3 | ✅ Match |
| T4 | None | Entry point (Phase 2) | ✅ Match |
| T5 | T4 | T4 → T5 | ✅ Match |
| T6 | T5 | T5 → T6 | ✅ Match |
| T7 | T6 | T6 → T7 | ✅ Match |
| T8 | T7 | T7 → T8 | ✅ Match |
| T9 | T8 | T8 → T9 | ✅ Match |
| T10 | None | Entry point (Phase 3) | ✅ Match |
| T11 | T10 | T10 → T11 | ✅ Match |
| T12 | T11 | T11 → T12 | ✅ Match |

---

## Test Co-location Validation

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
| ---- | --------------------------- | --------------- | --------- | ------ |
| T1: Consolidate Design Tokens | Styles / Tokens | none (Build gate) | none | ✅ OK |
| T2: Clean Global Stylesheet Tokens | Styles / Global | none (Build gate) | none | ✅ OK |
| T3: Delete Orphan SCSS | Styles / Global | none (Build gate) | none | ✅ OK |
| T4: Purge Purple Palette Profile | Component SCSS | unit | unit | ✅ OK |
| T5: Purge Purple Palette Event Detail | Component SCSS | unit | unit | ✅ OK |
| T6: Ubiquitous Hex Color Purge | Component SCSS | unit | unit | ✅ OK |
| T7: Eliminate !important & Adopt Mixins | Component SCSS | unit | unit | ✅ OK |
| T8: Deduplicate CSS Selectors | Component SCSS | none (Build gate) | none | ✅ OK |
| T9: Replace Template Inline Skeleton | Templates | unit | unit | ✅ OK |
| T10: Refactor Dialogs to Smart/Dumb | Presentational Components | unit | unit | ✅ OK |
| T11: Complete Design System Migration | Templates | unit | unit | ✅ OK |
| T12: Delete Dead Component Directories | Dead Components | unit | unit | ✅ OK |
