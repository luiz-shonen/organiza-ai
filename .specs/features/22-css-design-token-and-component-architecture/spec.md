# Feature 22: CSS Design Token Unification & Component Architecture

## Problem Statement

The Organiza AI Angular project has severe CSS/SCSS technical debt and component architecture violations. A comprehensive audit identified: 100% token duplication between `styles.scss` and `_semantic.scss` with divergent values, usage of legacy hardcoded purple hex colors (`#630ed4`, `#7c3aed`, `#6366f1`) when the canonical brand is Pink-Orange-Yellow, 12+ missing token declarations consumed by components but never defined, 28 `!important` flags in component SCSS (110+ in globals), breakpoint mixins defined but at 0% adoption, and 16 inline styles in templates. Additionally, 3 presentational components violate the smart/dumb pattern (AD-011) by injecting services and executing Firebase mutations, 4 templates bypass the design system with raw Angular Material elements, and 4 dead/orphaned components remain on disk.

## Goals

- [ ] Single source of truth for all CSS design tokens in `_semantic.scss`
- [ ] Zero hardcoded hex colors in component SCSS (all using `--org-*` tokens)
- [ ] Zero legacy purple palette colors anywhere in the codebase
- [ ] Zero `!important` in component-level SCSS files
- [ ] 100% breakpoint mixin adoption (zero raw `@media` in component SCSS)
- [ ] All 3 smart/dumb violations fixed (presentational components emit, containers orchestrate)
- [ ] All 4 templates migrated from raw Material to design system components
- [ ] All 4 dead components deleted

## Out of Scope

| Feature | Reason |
|---|---|
| Installing linting tools (ESLint, Stylelint, Prettier) | Feature 21 scope |
| Creating shared utility functions or extracting duplicated logic | Feature 23 scope |
| Updating documentation files (AGENTS.md, README.md, CONTEXT.md) | Feature 23 scope |
| Route restructuring (`/admin` vs `/meus-eventos`) | Feature 23 scope |
| Eliminating `any` types in TypeScript | Feature 23 scope |
| Reducing `!important` in global `styles.scss` Material overrides | Requires careful incremental work; global overrides often need `!important` to beat Material specificity |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
|---|---|---|---|
| Canonical brand colors (Pink `#ff4d94`, Orange `#ff8c42`, Yellow `#ffc837`) replace all legacy purple | yes | AD-033, AD-038, AD-039, DESIGN.md §2.1 | y |
| `_semantic.scss` becomes the single token source; `styles.scss` `:root` block is removed | yes | Eliminates dual-source divergence | y |
| `org-surface`, `org-button`, `org-text-field`, `org-icon-button`, `org-chip` are production-ready | yes | Audit confirms 32 Org* components in `shared/ui/` | y |
| Smart/dumb refactoring uses `output()` signals (not legacy `@Output` decorators) | yes | AD-003 mandates Signals | y |
| Global `styles.scss` `!important` overrides for Material are out of scope | yes | They often need `!important` to beat Material internal specificity; defer to incremental cleanup | y |
| Non-standard breakpoints (`480px`, `640px`, `760px`, `768px`) standardize to canonical (`600px`, `900px`, `1200px`) | yes | `_semantic.scss` defines `@mixin mobile/tablet/desktop/wide` at these breakpoints | y |
| Dead component `AdminFormDrawerComponent` (retired AD-021) is deleted | yes | User confirmed deletion of all 4 dead components | y |

**Open questions:** none — all resolved or logged above.

---

## User Stories

### P1: Token Source of Truth Unification ⭐ MVP

**User Story**: As a developer, I want a single source of truth for design tokens so that styling is consistent and there are no conflicting values.

**Why P1**: The dual-source (`styles.scss` vs `_semantic.scss`) causes silent divergence — `--org-glass-blur` has two different values today.

**Acceptance Criteria**:

1. The system SHALL define all `--org-*` CSS custom properties exclusively in `src/app/shared/ui/tokens/_semantic.scss`. <!-- ubiquitous -->
2. The `src/styles.scss` file SHALL NOT contain any `:root` block that declares `--org-*` CSS custom properties. <!-- ubiquitous -->
3. The `_semantic.scss` file SHALL declare the following currently-missing tokens: `--org-danger`, `--org-on-danger`, `--org-warning`, `--org-on-warning`, `--org-text-primary`, `--org-text-secondary`, `--org-text-muted`, `--org-border`, and `--org-primary-light`. <!-- ubiquitous -->

**Independent Test**: `grep -r '^\s*--org-' src/styles.scss` returns zero `:root`-level declarations; `grep -r '--org-danger' src/app/shared/ui/tokens/_semantic.scss` returns the declaration.

---

### P1: Hardcoded Color Purge & Purple Palette Removal ⭐ MVP

**User Story**: As a designer, I want all components to use canonical brand tokens so that the app matches the Pink-Orange-Yellow identity.

**Why P1**: Legacy purple (`#630ed4`) creates visual inconsistency with the current brand (Pink `#ff4d94`).

**Acceptance Criteria**:

4. The system SHALL NOT contain the hex strings `#630ed4`, `#7c3aed`, or `#6366f1` in any SCSS file. <!-- ubiquitous -->
5. The system SHALL NOT contain hardcoded hex color values in `profile-info-card.component.scss`, `profile.container.scss`, `family-selector.component.scss`, `guest-form-dialog.component.scss`, `rsvp-card.component.scss`, `login.container.scss`, `event-detail.container.scss`, `pix-card.component.scss`, `home.container.scss`, `event-filters.component.scss`, or `admin-form-drawer.component.scss` — all color values SHALL reference `--org-*` CSS custom properties. <!-- ubiquitous -->
6. The `pix-card.component.scss` file SHALL use `var(--org-font-mono)` for its monospace `font-family` property instead of `'Roboto Mono', monospace`. <!-- ubiquitous -->
7. The `event-card.component.scss` file SHALL NOT contain the hardcoded string `'Plus Jakarta Sans', sans-serif` — it SHALL inherit or use `var(--org-font-body)`. <!-- ubiquitous -->

**Independent Test**: `grep -rn '#630ed4\|#7c3aed\|#6366f1\|Roboto Mono' src/ --include='*.scss'` returns zero results.

---

### P1: Smart/Dumb Pattern Compliance ⭐ MVP

**User Story**: As an architect, I want all presentational components to be pure (inputs in, outputs out) so that business logic is fully decoupled from presentation.

**Why P1**: Three components violate AD-011 by directly calling Firebase services from presentational components.

**Acceptance Criteria**:

8. The `AdminFormDrawerComponent` SHALL NOT inject `AuthService`, `DrawerService`, `MatSnackBar`, or `OrgDialogService`. It SHALL accept admin data via `input()` and emit `addAdmin` and `removeAdmin` events via `output()`. <!-- ubiquitous -->
9. The `GuestFormDialogComponent` SHALL NOT inject `FamilyService`. It SHALL emit family member payloads via the dialog result to the parent container. <!-- ubiquitous -->
10. The `RsvpDrawerComponent` SHALL NOT inject `FamilyService`. It SHALL emit family member payloads via `output()` to the parent container. <!-- ubiquitous -->
11. WHEN `AdminFormDrawerComponent` emits an `addAdmin` or `removeAdmin` event THEN `DashboardContainer` SHALL handle the `AuthService` call and error feedback. <!-- event-driven -->
12. WHEN `GuestFormDialogComponent` returns a family member payload THEN `EventDetailContainer` SHALL execute `FamilyService.addFamilyMember()`. <!-- event-driven -->
13. WHEN `RsvpDrawerComponent` emits a family member payload THEN `EventDetailContainer` SHALL execute `FamilyService.addFamilyMember()`. <!-- event-driven -->

**Independent Test**: `grep -n 'inject(AuthService\|inject(FamilyService' src/app/features/**/components/**/*.component.ts` in the 3 targeted files returns zero results.

---

### P2: Raw Material → Design System Migration

**User Story**: As a developer, I want all templates to use Org* design system components instead of raw Angular Material so that visual consistency and the component-first contract are maintained.

**Why P2**: 4 templates bypass the design system with raw `mat-button`, `mat-card`, `mat-form-field`.

**Acceptance Criteria**:

14. The `admin-form-drawer.component.html` SHALL use `<org-icon-button>`, `<org-button>`, `<org-text-field>`, and `<org-chip>` instead of raw `<button mat-icon-button>`, `<button mat-flat-button>`, `<mat-form-field>`, and `<mat-chip-set>`. <!-- ubiquitous -->
15. The `collaborator-drawer.component.html` SHALL use `<org-icon-button>` and `<org-button>` instead of raw `<button mat-icon-button>` and `<button mat-flat-button>`. <!-- ubiquitous -->
16. The `event-editor.container.html` SHALL use `<org-surface>` instead of `<mat-card class="editor__card" appearance="outlined">` for all 4 card instances. <!-- ubiquitous -->
17. The `dashboard.container.html` SHALL use `<org-surface>` instead of `<mat-card>` for skeleton placeholder cards. <!-- ubiquitous -->

**Independent Test**: `grep -n 'mat-icon-button\|mat-flat-button\|mat-card\|mat-chip-set\|mat-form-field' ` in the 4 targeted template files returns zero results.

---

### P2: Breakpoint Mixin Adoption & `!important` Elimination

**User Story**: As a developer, I want responsive designs to use canonical SCSS mixins and zero `!important` in component SCSS so that breakpoints are consistent and specificity is clean.

**Why P2**: Breakpoint mixins exist at 0% adoption; 28 component-level `!important` overrides.

**Acceptance Criteria**:

18. All component-level SCSS files SHALL use `@include semantic.tablet`, `@include semantic.desktop`, or `@include semantic.wide` for responsive media queries instead of raw `@media (min-width: ...)` declarations. <!-- ubiquitous -->
19. The system SHALL NOT contain `!important` in any component-level `.component.scss` or `.container.scss` file. <!-- ubiquitous -->
20. The system SHALL NOT use non-standard breakpoint values (`480px`, `640px`, `760px`, `768px`) in any SCSS file — only the canonical `600px`, `900px`, `1200px` breakpoints (via mixins) SHALL be used. <!-- ubiquitous -->

**Independent Test**: `grep -rn '!important' src/ --include='*.component.scss' --include='*.container.scss'` returns zero results.

---

### P2: Duplicate CSS & Dead Code Cleanup

**User Story**: As a maintainer, I want all dead code, duplicated CSS blocks, inline styles, and orphaned files removed to reduce maintenance overhead.

**Why P2**: Reduces confusion and prevents future contributors from copying wrong patterns.

**Acceptance Criteria**:

21. The `src/app/app.scss` file SHALL NOT contain the `.glass-drawer` selector block (duplicate of `styles.scss` `.app-sidenav-drawer`). <!-- ubiquitous -->
22. The `event-editor.container.scss` file SHALL NOT contain duplicate `.editor__guest-actions` or `.editor__header-main` selector blocks. <!-- ubiquitous -->
23. The `navigation-drawer.component.scss` file SHALL NOT contain duplicate `.navigation-drawer__logout` declarations. <!-- ubiquitous -->
24. The file `src/app/shared/ui/surface/_org-surface.scss` SHALL NOT exist (orphan partial, never imported). <!-- ubiquitous -->
25. The `styles.scss` file SHALL NOT contain the Tailwind remnant `&.\!rounded-full`. <!-- ubiquitous -->
26. The `dashboard.container.html` and `event-editor.container.html` files SHALL NOT contain `style="height:` inline style attributes — skeleton dimensions SHALL use SCSS utility classes. <!-- ubiquitous -->
27. The directory `src/app/shared/components/confirm-dialog/` SHALL NOT exist (superseded by `OrgConfirmDialogComponent`). <!-- ubiquitous -->
28. The directory `src/app/shared/components/theme-toggle/` SHALL NOT exist (unused in runtime). <!-- ubiquitous -->
29. The directory `src/app/features/organizer/event-editor/components/collaborator-invite-dialog/` SHALL NOT exist (superseded by `CollaboratorDrawerComponent`). <!-- ubiquitous -->
30. The directory `src/app/features/admin/dashboard/components/admin-form-drawer/` SHALL NOT exist (retired by AD-021). <!-- ubiquitous -->

**Independent Test**: `test -d src/app/shared/components/confirm-dialog && echo FAIL || echo PASS` returns PASS for each deleted directory.

---

## Edge Cases

- IF a third-party Angular Material component requires `!important` to override its encapsulated styles THEN the override SHALL be placed in a global overrides section of `styles.scss` with a comment explaining why, not in a component SCSS file. <!-- unwanted-behavior -->
- IF extracting `AuthService` from `AdminFormDrawerComponent` causes cascading test failures in `DashboardContainer` specs THEN the container spec SHALL be updated to mock the new `output()` events. <!-- unwanted-behavior -->
- IF a component uses a `var(--org-primary, #630ed4)` fallback pattern THEN the fallback SHALL be updated to `var(--org-primary)` with no hardcoded fallback (the token is always declared). <!-- unwanted-behavior -->

---

## Requirement Traceability

| Requirement ID | Story | AC# | Status |
|---|---|---|---|
| CSS-01 | P1: Token Unification | AC-1 | Pending |
| CSS-02 | P1: Token Unification | AC-2 | Pending |
| CSS-03 | P1: Token Unification | AC-3 | Pending |
| CSS-04 | P1: Color Purge | AC-4 | Pending |
| CSS-05 | P1: Color Purge | AC-5 | Pending |
| CSS-06 | P1: Color Purge | AC-6 | Pending |
| CSS-07 | P1: Color Purge | AC-7 | Pending |
| CSS-08 | P1: Smart/Dumb | AC-8 | Pending |
| CSS-09 | P1: Smart/Dumb | AC-9 | Pending |
| CSS-10 | P1: Smart/Dumb | AC-10 | Pending |
| CSS-11 | P1: Smart/Dumb | AC-11 | Pending |
| CSS-12 | P1: Smart/Dumb | AC-12 | Pending |
| CSS-13 | P1: Smart/Dumb | AC-13 | Pending |
| CSS-14 | P2: Material Migration | AC-14 | Pending |
| CSS-15 | P2: Material Migration | AC-15 | Pending |
| CSS-16 | P2: Material Migration | AC-16 | Pending |
| CSS-17 | P2: Material Migration | AC-17 | Pending |
| CSS-18 | P2: Breakpoints/Important | AC-18 | Pending |
| CSS-19 | P2: Breakpoints/Important | AC-19 | Pending |
| CSS-20 | P2: Breakpoints/Important | AC-20 | Pending |
| CSS-21 | P2: Cleanup | AC-21 | Pending |
| CSS-22 | P2: Cleanup | AC-22 | Pending |
| CSS-23 | P2: Cleanup | AC-23 | Pending |
| CSS-24 | P2: Cleanup | AC-24 | Pending |
| CSS-25 | P2: Cleanup | AC-25 | Pending |
| CSS-26 | P2: Cleanup | AC-26 | Pending |
| CSS-27 | P2: Cleanup | AC-27 | Pending |
| CSS-28 | P2: Cleanup | AC-28 | Pending |
| CSS-29 | P2: Cleanup | AC-29 | Pending |
| CSS-30 | P2: Cleanup | AC-30 | Pending |

**ID format:** `CSS-[NUMBER]`

**Status values:** Pending → In Tasks → Implementing → Verified

**Coverage:** 30 total, 0 mapped to tasks, 30 unmapped ⚠️

---

## Success Criteria

- [ ] `grep -rn '#630ed4\|#7c3aed\|#6366f1' src/ --include='*.scss'` returns 0 results
- [ ] `grep -rn '!important' src/ --include='*.component.scss' --include='*.container.scss'` returns 0 results
- [ ] `grep -rn 'inject(AuthService\|inject(FamilyService' src/app/features/**/components/**/*.component.ts` returns 0 for the 3 targeted files
- [ ] `find src/app/shared/components/confirm-dialog src/app/shared/components/theme-toggle -type d 2>/dev/null` returns empty
- [ ] All 79 unit test suites (426 tests) pass green
- [ ] All 15 E2E test suites (158 tests) pass green
- [ ] Production build succeeds with zero errors
