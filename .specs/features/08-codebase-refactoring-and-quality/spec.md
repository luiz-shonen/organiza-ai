# Codebase Refactoring & Quality Specification

## Problem Statement

The codebase has accumulated minor technical debt, legacy Angular patterns (such as `@Output()` decorators and `AsyncPipe` in components), dead/orphaned components, untyped `as any` assertions, DTOs defined outside the `/models` directory, and incomplete unit test coverage across active components and services. Addressing these issues now ensures a clean, robust, and accessible foundation adhering strictly to Angular v21+ Signals architecture, SOLID principles, and WCAG 2.1 AA standards before executing full end-to-end testing in Feature 09.

## Goals

- [ ] Eliminate all legacy Angular decorators (`@Output()`) and Observable bindings in UI components in favor of native Angular Signals (`output<T>()`, `toSignal()`).
- [ ] Prune orphaned and duplicate components (`item-list`, `rsvp-form`, `event-header`, `event-info-card`, `email-verification-banner`, unused `organizer/event-card`).
- [ ] Enforce SOLID and strict TypeScript by extracting DTO interfaces to dedicated model files and eliminating all `as any` casts in production code.
- [ ] Ensure full WCAG 2.1 AA keyboard accessibility on interactive cards/banners and align SCSS tokens with the "Vibrant Modernism" design system.
- [ ] Provide 100% unit and component API test coverage (`.spec.ts`) for all active components and core services.

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
| --- | --- |
| Rewriting core domain features | Functional requirements are already implemented; this feature only refactors and cleans existing code without changing business behavior |
| Playwright E2E test implementation | Deferred to Feature 09 (`09-playwright-e2e-coverage`) to run against the clean codebase |
| Backend Firestore schema migrations | Database schema is stable; refactor touches only client-side types and architecture |

---

## Assumptions & Open Questions

Every ambiguity is resolved or recorded here - nothing is left silently unclear.

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --- | --- | --- | --- |
| Directory consolidation for organizer features | Consolidate `features/organizer` components into `features/admin` domain | Admin routes `/meus-eventos` and `/admin` consume these components; consolidating removes fracture | yes |
| Component vs Container role for AdminFormDrawer | Retain as a managed drawer within `features/admin/dashboard` with typed inputs/outputs | Maintains existing UX while isolating side-effects cleanly | yes |
| Error typing in catch blocks | Use `catch (error: unknown)` with `error instanceof Error` checks | Satisfies strict TypeScript rules without resorting to `any` | yes |

**Open questions:** none - all resolved or logged above (required before the spec is confirmed).

---

## User Stories

### P1: Eliminate Legacy Decorators & Align State with Angular Signals ⭐ MVP

**User Story**: As a developer, I want to use modern Angular signals (`output<T>()` and `toSignal()`) throughout the codebase so that state management and event emission are consistent and reactive.

**Why P1**: Foundation of Angular v21+ architecture rules; ensures uniform reactive programming patterns across all components.

**Acceptance Criteria**:

1. The system SHALL replace `@Output()` event emitters in `ItemListCardComponent` with Angular signal-based `output<string>()`.
2. WHEN `HomeContainer` loads event data THEN the system SHALL bind events using `toSignal()` rather than `AsyncPipe`.
3. The system SHALL extract the inline template of `ConfirmDialogComponent` into dedicated `.html` and `.scss` files and provide a dedicated `.scss` style file for `ThemeToggleComponent`.
4. The system SHALL enforce `ChangeDetectionStrategy.OnPush` on all modified components.

**Independent Test**: Verify via unit tests that `ItemListCardComponent` emits through `output()`, `HomeContainer` renders events via signal, and `ConfirmDialogComponent` loads external template and styles.

---

### P1: Prune Dead Code & Unify Orphaned/Duplicated Components ⭐ MVP

**User Story**: As a maintainer, I want unused and duplicate components removed from the codebase so that bundle size is minimal and maintenance overhead is reduced.

**Why P1**: Prevents confusion and reduces dead weight in production bundles and test suites.

**Acceptance Criteria**:

1. The system SHALL delete unused components `ItemListComponent`, `RsvpFormComponent`, `EventHeaderComponent`, and `EventInfoCardComponent` from `src/app/features/event-detail/components/`.
2. The system SHALL retire obsolete components `EmailVerificationBannerComponent` and unintegrated `OrganizerEventCardComponent` from `src/app/features/organizer/`.
3. WHEN organizing feature files THEN the system SHALL consolidate active shared organizer components (`event-filters`, `collaborator-invite-dialog`) into the `src/app/features/admin/` domain.

**Independent Test**: Verify that the project builds cleanly (`npm run build`) and all existing tests pass after deleting the unreferenced files.

---

### P2: Enforce Strict TypeScript & SOLID Clean Architecture

**User Story**: As an architect, I want strict TypeScript types without `any` and decoupled model files so that the codebase complies with SOLID principles.

**Why P2**: Eliminates runtime type bugs and inverted dependencies across layers.

**Acceptance Criteria**:

1. The system SHALL define `ThemeMode` in a dedicated `theme.model.ts` file and remove service imports from `profile.model.ts`.
2. The system SHALL extract DTO interfaces (`BatchPrimaryGuestInput`, `ConfirmDialogData`, `GuestFormDialogData`, `GuestFormDialogResult`) into dedicated model files under `src/app/core/models/`.
3. The system SHALL eliminate untyped `as any` casts in `EventService`, `UserService`, `AdminFormDrawerComponent`, and `FirebaseService`, replacing them with explicit interfaces and type guards.
4. WHILE handling errors in asynchronous operations the system SHALL use `catch (error: unknown)` with explicit error narrowing.

**Independent Test**: Run TypeScript compilation (`npm run build`) with strict checks enabled to confirm zero `any` leaks.

---

### P2: Accessibility & Glassmorphism Design System Compliance (WCAG 2.1 AA)

**User Story**: As a user with accessibility needs, I want all interactive elements to be fully keyboard navigable and styled according to the design system so that the app is accessible and visually consistent.

**Why P2**: Mandatory project guideline for WCAG 2.1 AA accessibility and theme consistency.

**Acceptance Criteria**:

1. WHEN a user interacts with alert banners or event cards via keyboard THEN the system SHALL support focus (`tabindex="0"`), ARIA roles (`role="button"` or `<a>`), and trigger actions on `Enter` and `Space` key presses.
2. The system SHALL eliminate inline `style=""` attributes from `home.container.html` and `login.container.html`, moving them to their respective SCSS files.
3. The system SHALL replace hardcoded color fallbacks in SCSS files with the standard `--org-` CSS custom properties from the "Vibrant Modernism" design token palette.

**Independent Test**: Inspect rendered HTML elements for ARIA tags, tabindex, keyboard event handlers, and verify SCSS uses `--org-` custom properties.

---

### P3: Complete Spec & Unit Test Suite Coverage

**User Story**: As a developer, I want comprehensive unit and component API tests for all active components and services so that regressions are automatically prevented.

**Why P3**: Completes our 100% component and service spec requirement and locks in code quality.

**Acceptance Criteria**:

1. The system SHALL provide passing `.spec.ts` test files for `HomeContainer`, `LoginContainer`, `ConfirmDialogComponent`, `ThemeToggleComponent`, `ItemListCardComponent`, `SharePanelComponent`, and `AdminFormDrawerComponent`.
2. The system SHALL provide passing `.spec.ts` test files for `GuestSessionService`, `ConfettiService`, `DrawerService`, `HeaderService`, `NotificationService`, and `FirebaseService`.
3. WHEN running the test suite (`npm test -- --watch=false`) THEN the system SHALL pass 100% of test suites with zero failures.

**Independent Test**: Execute `npm test -- --watch=false` and confirm all test suites pass.

---

## Edge Cases

- IF an error occurs during an async operation with `unknown` error type THEN the system SHALL safely extract a message using type narrowing (`error instanceof Error ? error.message : String(error)`).
- IF an interactive card or banner is focused via keyboard THEN the system SHALL execute the corresponding action on `Enter` or `Space` key down without triggering double submission.
- WHEN a component is rendered in an SSR / test environment without `localStorage` or `window.matchMedia` THEN the system SHALL safely fallback without throwing exceptions.

---

## Requirement Traceability

Each requirement gets a unique ID for tracking across design, tasks, and validation.

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| REFACTOR-01 | P1: Eliminate Legacy Decorators & Align State with Angular Signals | Tasks | Ready |
| REFACTOR-02 | P1: Eliminate Legacy Decorators & Align State with Angular Signals | Tasks | Ready |
| REFACTOR-03 | P1: Eliminate Legacy Decorators & Align State with Angular Signals | Tasks | Ready |
| REFACTOR-04 | P1: Prune Dead Code & Unify Orphaned/Duplicated Components | Tasks | Ready |
| REFACTOR-05 | P1: Prune Dead Code & Unify Orphaned/Duplicated Components | Tasks | Ready |
| REFACTOR-06 | P1: Prune Dead Code & Unify Orphaned/Duplicated Components | Tasks | Ready |
| REFACTOR-07 | P2: Enforce Strict TypeScript & SOLID Clean Architecture | Tasks | Ready |
| REFACTOR-08 | P2: Enforce Strict TypeScript & SOLID Clean Architecture | Tasks | Ready |
| REFACTOR-09 | P2: Enforce Strict TypeScript & SOLID Clean Architecture | Tasks | Ready |
| REFACTOR-10 | P2: Accessibility & Glassmorphism Design System Compliance | Tasks | Ready |
| REFACTOR-11 | P2: Accessibility & Glassmorphism Design System Compliance | Tasks | Ready |
| REFACTOR-12 | P3: Complete Spec & Unit Test Suite Coverage | Tasks | Ready |
| REFACTOR-13 | P3: Complete Spec & Unit Test Suite Coverage | Tasks | Ready |

**ID format:** `REFACTOR-[NUMBER]`

**Status values:** Pending → In Design → In Tasks → Implementing → Verified

---

## Success Criteria

- [ ] Zero legacy `@Output()` or `@Input()` decorators in the codebase.
- [ ] Zero orphaned/dead component directories in `src/app/features/`.
- [ ] Zero `as any` casts in production application code.
- [ ] 100% of components adhere to template separation (`templateUrl` & `styleUrl`) and `ChangeDetectionStrategy.OnPush`.
- [ ] 100% of interactive elements meet WCAG 2.1 AA keyboard accessibility criteria.
- [ ] 100% of active components and core services possess dedicated `.spec.ts` unit tests with all tests passing.
