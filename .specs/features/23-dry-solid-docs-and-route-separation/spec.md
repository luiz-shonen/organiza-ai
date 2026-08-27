# Feature 23: DRY/SOLID Architecture, Route Separation & Documentation Sync

## Problem Statement

The Organiza AI project has accumulated code duplication, Single Responsibility Principle (SRP) violations, explicit `any` types, route domain confusion, and severe documentation drift. Key utilities (date formatting, WhatsApp sharing, clipboard operations, CEP formatting, ID generation) and model interfaces are duplicated in 2-3 places across services and components. `AuthService` handles authentication plus Firestore admin collection CRUD, while `UserService` proxies family operations and duplicates event mapping logic. Furthermore, `/admin` (Super Admin metrics) and `/meus-eventos` (Organizer dashboard) share the same containers, violating domain separation. Finally, documentation across `AGENTS.md`, `README.md`, `CONTEXT.md`, and `DESIGN.md` contains obsolete brand colors, outdated test counts, and removed directive references, causing AI agent hallucinations.

## Goals

- [ ] Centralize shared utility functions into `src/app/core/utils/` (date, sharing, id, cep, relationship)
- [ ] Consolidate duplicated models and interfaces in `src/app/core/models/` and export via `index.ts`
- [ ] Enforce SRP in `AuthService` (add `isAuthenticated`, `waitForAuthReady()`) and `UserService` (clean passthroughs and duplicate mappers)
- [ ] Eliminate explicit `any` types in production code and provide typed `window.__MOCK_DOCUMENTS__`
- [ ] Deduplicate E2E mock setup across Playwright test suites using `setupMockAuthSession()`
- [ ] Decouple `/admin` (Super Admin) from `/meus-eventos` (Organizer) with dedicated routes and container components
- [ ] Synchronize all documentation files (`AGENTS.md`, `README.md`, `CONTEXT.md`, `DESIGN.md`, `.gemini/GEMINI.md`, `.claude/CLAUDE.md`, `.specs/STATE.md`) with the actual codebase
- [ ] Establish a `.agents/skills/` library providing actionable guides for page creation, component design, style guides, and design system usage

## Out of Scope

| Feature | Reason |
|---|---|
| Installing linting and formatting tools | Feature 21 scope |
| SCSS token unification, hardcoded color fixes, and component `!important` elimination | Feature 22 scope |
| Component-level dumb component refactoring and dead component deletion | Feature 22 scope |
| Major backend schema changes to Firestore | Only frontend architecture and domain routing are refactored |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
|---|---|---|---|
| Shared utilities live in `src/app/core/utils/` | yes | Standard Angular architectural layer for pure helpers | y |
| `/meus-eventos` containers move to `src/app/features/organizer/` | yes | Clarifies ownership; organizer features belong in organizer domain | y |
| `/admin` route gets dedicated Super Admin management container in `src/app/features/admin/` | yes | User confirmed: "/admin should be different than /meus-eventos, absolutely." | y |
| Global `window.__MOCK_DOCUMENTS__` is typed in `src/app/testing/types/mock-window.d.ts` | yes | Eliminates 21 `(window as any)` production casts safely | y |
| Documentation updates will reflect 79 unit test suites (426 tests) and 15 E2E suites (158 tests) | yes | Matches actual verified test run counts | y |
| `.agents/skills/` contains 4 skills referencing `tdd`, `bem-css`, and `tlc-spec-driven` | yes | Provides unified guidance for both human contributors and AI agents | y |

**Open questions:** none — all resolved or logged above.

---

## User Stories

### P1: Core Utilities & Interface Consolidation ⭐ MVP

**User Story**: As a developer, I want duplicated helper functions and interfaces centralized into `core/utils/` and `core/models/` so that logic is DRY and single-sourced.

**Why P1**: Prevents diverging implementations of date formatting, sharing links, CEP cleaning, and model contracts.

**Acceptance Criteria**:

1. The system SHALL provide pure utility functions in `src/app/core/utils/date.utils.ts`, `src/app/core/utils/sharing.utils.ts`, `src/app/core/utils/id.utils.ts`, `src/app/core/utils/cep.utils.ts`, and `src/app/core/utils/relationship.utils.ts`. <!-- ubiquitous -->
2. The system SHALL import date formatting (`formatDate`, `getDay`, `getMonth`), WhatsApp sharing (`shareWhatsApp`), clipboard copying (`copyLink`), and CEP formatting from `src/app/core/utils/` across all feature containers and components. <!-- ubiquitous -->
3. The system SHALL define single canonical interfaces in `src/app/core/models/` for `BatchPrimaryGuestInput`, `GuestFormDialogData`, `GuestFormDialogResult`, `RelationshipOption`, `FamilyMemberCreate`, `OrgConfirmDialogData`, `ViaCepResponse`, `DesignSystemNavigationItem`, and `DesignSystemNavigationGroup`. <!-- ubiquitous -->
4. The system SHALL export all consolidated model interfaces from `src/app/core/models/index.ts` and eliminate duplicate local interface declarations in components and services. <!-- ubiquitous -->

**Independent Test**: `find src/app/core/utils/ -type f` returns all 5 utility files; `npm run build` succeeds with zero model import errors.

---

### P1: Service SRP & Reactive Auth Alignment ⭐ MVP

**User Story**: As an architect, I want `AuthService` and `UserService` refactored so that each service has a single responsibility and clean reactive Signals state.

**Why P1**: `AuthService` currently manages Firestore admin collections directly, while `UserService` contains passthrough methods and duplicate event mappers.

**Acceptance Criteria**:

5. The `AuthService` SHALL expose an `isAuthenticated` computed signal returning true when `currentUser()` is non-null and not anonymous. <!-- ubiquitous -->
6. The `AuthService` SHALL provide a `waitForAuthReady()` method returning a Promise that resolves when `loading()` becomes false. <!-- ubiquitous -->
7. The `auth.guard.ts` and `super-admin.guard.ts` SHALL call `AuthService.waitForAuthReady()` and read `AuthService.isAuthenticated` or `AuthService.isSuperAdmin()`, eliminating duplicate effect-based waiter logic. <!-- ubiquitous -->
8. The `UserService` SHALL NOT contain `getFamilyMembers`, `addFamilyMember`, or `deleteFamilyMember` passthrough methods — callers SHALL inject `FamilyService` directly. <!-- ubiquitous -->
9. The `UserService` SHALL NOT contain the private duplicate `mapEventData()` method — it SHALL delegate event data mapping to `EventService`. <!-- ubiquitous -->

**Independent Test**: Unit tests for `AuthService`, `UserService`, `auth.guard.ts`, and `super-admin.guard.ts` pass with 100% assertions green.

---

### P1: Route & Domain Decoupling (/admin vs /meus-eventos) ⭐ MVP

**User Story**: As an organizer and Super Admin, I want `/meus-eventos` and `/admin` to load distinct domain containers so that organizer workflows and Super Admin governance are completely separate.

**Why P1**: Currently both routes load the same admin routes and containers, confusing roles and domain boundaries.

**Acceptance Criteria**:

10. The `/meus-eventos` route SHALL route to `src/app/features/organizer/organizer.routes.ts` protected by `authGuard`, loading organizer-owned dashboard and event editor containers in `src/app/features/organizer/`. <!-- ubiquitous -->
11. The `/admin` route SHALL route to `src/app/features/admin/admin.routes.ts` protected by `superAdminGuard`, loading a dedicated Super Admin platform dashboard in `src/app/features/admin/`. <!-- ubiquitous -->
12. The `app.routes.ts` file SHALL register `/meus-eventos` to `ORGANIZER_ROUTES` and `/admin` to `ADMIN_ROUTES` as distinct route configurations. <!-- ubiquitous -->

**Independent Test**: Navigate to `/meus-eventos` as authenticated user → loads organizer dashboard; navigate to `/admin` as super admin → loads dedicated admin dashboard.

---

### P1: Production Type Safety & `any` Elimination ⭐ MVP

**User Story**: As a developer, I want all production code strictly typed with zero `any` types and a typed mock window declaration so that type safety is guaranteed.

**Why P1**: Strict TypeScript prevents runtime errors and supports IDE autocompletion.

**Acceptance Criteria**:

13. The system SHALL provide `src/app/testing/types/mock-window.d.ts` defining strict global typings for `window.__MOCK_DOCUMENTS__`. <!-- ubiquitous -->
14. The production files in `src/app/` SHALL NOT contain explicit `(window as any)` or `any` type annotations, replacing all 21 occurrences in `firestore.gateway.ts` with strict typed access. <!-- ubiquitous -->
15. The `org-date-field.component.html` template SHALL NOT use `$any()` casting — input events SHALL be typed via proper DOM event binding. <!-- ubiquitous -->

**Independent Test**: `grep -rn '(window as any)' src/app/` returns 0 results; `npm run build` succeeds without compiler warnings.

---

### P2: Documentation Synchronization

**User Story**: As a contributor and AI agent, I want all project documentation updated to reflect the exact current codebase so that documentation drift and hallucinations are eliminated.

**Why P2**: Accurate context files are the primary mechanism for preventing AI hallucinations.

**Acceptance Criteria**:

16. The `AGENTS.md` and `README.md` files SHALL document the canonical Pink-Orange-Yellow brand palette (`#ff4d94`, `#ff8c42`, `#ffc837`), exact test metrics (79 unit suites / 426 tests, 15 E2E suites / 158 tests, 60 baselines), and complete core services list (17 services). <!-- ubiquitous -->
17. The `CONTEXT.md` and `DESIGN.md` files SHALL reference standalone `Org*` components (`<org-surface>`, `<org-button>`, etc.), omit removed legacy attribute directives, fix markdown links, and update decision logs through AD-039. <!-- ubiquitous -->
18. The `.gemini/GEMINI.md`, `.claude/CLAUDE.md`, and `.specs/STATE.md` files SHALL reflect Angular 22, verified-only RSVP rules (AD-024), open registration (AD-016), and updated decision logs through AD-039. <!-- ubiquitous -->

**Independent Test**: Review `AGENTS.md`, `README.md`, `CONTEXT.md`, and `DESIGN.md` — all token values, test counts, component names, and route tables match code reality.

---

### P2: Project Agent Skills & Engineering Style Guide

**User Story**: As a developer and AI agent, I want `.agents/skills/` containing standardized recipes and style guides referencing `tdd`, `bem-css`, and `tlc-spec-driven` so that all contributors follow consistent patterns.

**Why P2**: Equips AI agents and human contributors with clear, self-contained playbooks in the repository.

**Acceptance Criteria**:

19. The system SHALL provide `.agents/skills/style-guide/SKILL.md` documenting DOs/DON'Ts for TypeScript, OnPush Signals, SCSS/BEM, Firebase, testing, and accessibility with concrete code snippets. <!-- ubiquitous -->
20. The system SHALL provide `.agents/skills/creating-pages/SKILL.md` with step-by-step guidance on routed containers, route registration, guards, and design system layout primitives. <!-- ubiquitous -->
21. The system SHALL provide `.agents/skills/creating-components/SKILL.md` with recipes for pure presentational components, `input()`/`output()` APIs, and OnPush change detection. <!-- ubiquitous -->
22. The system SHALL provide `.agents/skills/design-system-usage/SKILL.md` cataloging all 32 `Org*` components, import paths from `@shared/ui`, and replacements for raw Angular Material tags. <!-- ubiquitous -->
23. The skill files in `.agents/skills/` SHALL explicitly reference `tdd`, `bem-css`, and `tlc-spec-driven` as mandatory methodology standards. <!-- ubiquitous -->

**Independent Test**: `find .agents/skills/ -name "SKILL.md"` returns all 4 skill files; each file contains valid Markdown with code examples and methodology references.

---

### P3: Playwright E2E Mock Setup Deduplication

**User Story**: As a QA engineer, I want Playwright E2E specs to use `setupMockAuthSession()` from `auth-mock.helper.ts` so that test setup code is DRY and maintainable.

**Why P3**: 3 test specs duplicate 40-80 lines of mock route registration and IndexedDB injection.

**Acceptance Criteria**:

24. The `e2e/specs/07-visual-layout.spec.ts`, `e2e/specs/08-keyboard-a11y.spec.ts`, and `e2e/specs/09-multi-user-sync.spec.ts` files SHALL use `setupMockAuthSession()` from `auth-mock.helper.ts` for all mock authentication and document store setup. <!-- ubiquitous -->
25. The component harnesses in `e2e/components/confirm-dialog.harness.ts` and `e2e/components/rsvp-dialog.harness.ts` SHALL remove legacy fallback selector locators and target active `Org*` components directly. <!-- ubiquitous -->

**Independent Test**: `npx playwright test e2e/specs/07-visual-layout.spec.ts e2e/specs/08-keyboard-a11y.spec.ts e2e/specs/09-multi-user-sync.spec.ts` passes with 100% tests green.

---

## Edge Cases

- IF an E2E test requires a dual-context (Host and Guest simultaneously) THEN `setupMockAuthSession()` SHALL support context-scoped mock initialization without crosstalk. <!-- unwanted-behavior -->
- IF legacy components or tests still import interfaces from individual service or component files THEN TypeScript compilation SHALL fail until updated to import from `src/app/core/models/index.ts`. <!-- unwanted-behavior -->
- IF route migration moves organizer containers to `features/organizer/` THEN existing unit and E2E test import paths SHALL be updated atomically to prevent broken test suites. <!-- unwanted-behavior -->

---

## Requirement Traceability

| Requirement ID | Story | AC# | Status |
|---|---|---|---|
| DRY-01 | P1: Core Utilities | AC-1 | Pending |
| DRY-02 | P1: Core Utilities | AC-2 | Pending |
| DRY-03 | P1: Interface Consolidation | AC-3 | Pending |
| DRY-04 | P1: Interface Consolidation | AC-4 | Pending |
| DRY-05 | P1: Service SRP | AC-5 | Pending |
| DRY-06 | P1: Service SRP | AC-6 | Pending |
| DRY-07 | P1: Service SRP | AC-7 | Pending |
| DRY-08 | P1: Service SRP | AC-8 | Pending |
| DRY-09 | P1: Route Decoupling | AC-9 | Pending |
| DRY-10 | P1: Route Decoupling | AC-10 | Pending |
| DRY-11 | P1: Route Decoupling | AC-11 | Pending |
| DRY-12 | P1: Type Safety | AC-12 | Pending |
| DRY-13 | P1: Type Safety | AC-13 | Pending |
| DRY-14 | P1: Type Safety | AC-14 | Pending |
| DRY-15 | P1: Type Safety | AC-15 | Pending |
| DRY-16 | P2: Documentation Sync | AC-16 | Pending |
| DRY-17 | P2: Documentation Sync | AC-17 | Pending |
| DRY-18 | P2: Documentation Sync | AC-18 | Pending |
| DRY-19 | P2: Agent Skills | AC-19 | Pending |
| DRY-20 | P2: Agent Skills | AC-20 | Pending |
| DRY-21 | P2: Agent Skills | AC-21 | Pending |
| DRY-22 | P2: Agent Skills | AC-22 | Pending |
| DRY-23 | P2: Agent Skills | AC-23 | Pending |
| DRY-24 | P3: E2E Deduplication | AC-24 | Pending |
| DRY-25 | P3: E2E Deduplication | AC-25 | Pending |

**ID format:** `DRY-[NUMBER]`

**Status values:** Pending → In Tasks → Implementing → Verified

**Coverage:** 25 total, 0 mapped to tasks, 25 unmapped ⚠️

---

## Success Criteria

- [ ] All 5 utility files in `src/app/core/utils/` created and consumed across features
- [ ] 0 duplicate interface declarations remain across model, service, and component files
- [ ] `AuthService` exposes `isAuthenticated` and `waitForAuthReady()`; guards use them cleanly
- [ ] `/meus-eventos` and `/admin` routes map to separate containers in `features/organizer/` and `features/admin/`
- [ ] `grep -rn '(window as any)' src/app/` returns 0 results
- [ ] `AGENTS.md`, `README.md`, `CONTEXT.md`, and `DESIGN.md` fully synchronized with current code state
- [ ] `.agents/skills/` contains all 4 complete, actionable SKILL.md guides
- [ ] All unit tests (426 tests) and Playwright E2E tests (158 tests) pass green
