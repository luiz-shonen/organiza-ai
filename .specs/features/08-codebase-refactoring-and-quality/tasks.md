# Codebase Refactoring & Quality Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Spec**: `.specs/features/08-codebase-refactoring-and-quality/spec.md`  
**Design**: `.specs/features/08-codebase-refactoring-and-quality/design.md`  
**Status**: Draft  

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec - confirm before Execute. Guidelines found: `AGENTS.md`, `GEMINI.md`, `DESIGN.md`.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Model / Interface | none | - (build gate only) | `src/app/core/models/*.ts` | `npm run build` |
| Core Service | unit | All branches; 1:1 to spec ACs; type safety, safe browser/SSR fallback, mock fixtures | `src/app/core/services/*.spec.ts` | `npx ng test --watch=false` |
| Dumb Component | unit | Signal inputs/outputs, template rendering, WCAG 2.1 AA keyboard navigation, accessibility attributes | `src/app/features/**/*.component.spec.ts`, `src/app/shared/components/**/*.component.spec.ts` | `npx ng test --watch=false` |
| Container / Smart Component | unit | Signal conversion (toSignal), lifecycle events, routing navigation, service orchestration, strict error handling | `src/app/features/**/*.container.spec.ts` | `npx ng test --watch=false` |
| Global Styles / MDC Tokens | none | - (build gate only) | `src/styles.scss` | `npm run build` |

## Gate Check Commands

> Generated from codebase - confirm before Execute.

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | After tasks with unit tests only | `npx ng test --watch=false` |
| Full | After tasks with integration/e2e tests | `npx ng test --watch=false` |
| Build | After phase completion or model/config/style-only tasks | `npm run build && npx ng test --watch=false` |

---

## Execution Plan

Phases are ordered and run sequentially - each phase completes before the next begins, and tasks within a phase execute in order.

### Phase 1: Foundation (SOLID Models & Strict TypeScript Services)

Core data contracts, DTO extractions, and eliminating untyped `any` casts in core services.

```
T1 → T4
T1 → T5
T2 → T4
T3
T6
T7
```

### Phase 2: Dead Code Pruning & Domain Structure Consolidation

Pruning orphaned components and establishing clean 3-domain folder architecture (`organizer`, `admin`, `auth`).

```
T8 → T9
```

### Phase 3: Component Signals & Template Refactoring

Modernizing UI components with Angular Signals `output<T>()` and `toSignal()`, template separation, and WCAG 2.1 AA keyboard accessibility.

```
T10
T11
T12
T13
T14
T15
T16
```

### Phase 4: Design Tokens & Core Service Test Coverage

Material 3 MDC design token optimization and completing 100% unit test coverage across active services.

```
T17
T18
T19
T20
T21
T22
T23
```

---

## Task Breakdown

### Phase 1: Foundation (SOLID Models & Strict TypeScript Services)

#### T1: Define ThemeMode Type Model

**What**: Extract `ThemeMode` union type into a dedicated model file to decouple profile models and theme services.  
**Where**: `src/app/core/models/theme.model.ts`  
**Depends on**: None  
**Reuses**: `src/app/core/models/index.ts`  
**Requirement**: REFACTOR-07  

**Tools**:

- MCP: NONE  
- Skill: NONE  

**Done when**:

- [ ] `ThemeMode` type (`'light' | 'dark' | 'system'`) is exported from `src/app/core/models/theme.model.ts`
- [ ] Exported cleanly via `src/app/core/models/index.ts`
- [ ] Build gate passes: `npm run build`

**Tests**: none  
**Gate**: build  
**Commit**: `refactor(models): extract ThemeMode to dedicated theme model`  

---

#### T2: Define Dialog and Batch DTO Interfaces

**What**: Extract `ConfirmDialogData`, `GuestFormDialogData`, `GuestFormDialogResult`, and `BatchPrimaryGuestInput` into a dedicated model file.  
**Where**: `src/app/core/models/dialog.model.ts`  
**Depends on**: None  
**Reuses**: `src/app/core/models/index.ts`  
**Requirement**: REFACTOR-07  

**Tools**:

- MCP: NONE  
- Skill: NONE  

**Done when**:

- [ ] `ConfirmDialogData`, `GuestFormDialogData`, `GuestFormDialogResult`, and `BatchPrimaryGuestInput` interfaces are defined in `src/app/core/models/dialog.model.ts`
- [ ] Exported cleanly via `src/app/core/models/index.ts`
- [ ] Build gate passes: `npm run build`

**Tests**: none  
**Gate**: build  
**Commit**: `refactor(models): extract dialog and batch RSVP DTOs to dialog model`  

---

#### T3: Enforce Strict Type Safety in FirestoreGateway

**What**: Eliminate `as any` casts in `FirestoreGateway` using official `WithFieldValue<DocumentData>` and `UpdateData<DocumentData>`.  
**Where**: `src/app/core/services/firestore.gateway.ts`  
**Depends on**: None  
**Reuses**: `firebase/firestore` types  
**Requirement**: REFACTOR-08  

**Tools**:

- MCP: NONE  
- Skill: NONE  

**Done when**:

- [ ] All occurrences of `as any` in `setDoc`, `updateDoc`, `addDoc`, and `runBatch` are replaced with strict Firestore SDK types
- [ ] Unit tests pass: `src/app/core/services/firestore.gateway.spec.ts`
- [ ] Quick gate passes: `npx ng test --watch=false`
- [ ] Test count: at least 20 tests pass

**Tests**: unit  
**Gate**: quick  
**Commit**: `refactor(core): eliminate untyped casts in FirestoreGateway`  

---

#### T4: Enforce Strict Type Safety in EventService

**What**: Eliminate `as any` casts in `EventService` for `addressDetails`, `pixType`, and `estimatedBudget` mappings.  
**Where**: `src/app/core/services/event.service.ts`  
**Depends on**: T1, T2  
**Reuses**: `src/app/core/models/event.model.ts`  
**Requirement**: REFACTOR-08  

**Tools**:

- MCP: NONE  
- Skill: NONE  

**Done when**:

- [ ] Data mappings use explicit `AddressDetails`, `PixType`, and `number` types without `as any`
- [ ] Unit tests pass: `src/app/core/services/event.service.spec.ts`
- [ ] Quick gate passes: `npx ng test --watch=false`
- [ ] Test count: at least 17 tests pass

**Tests**: unit  
**Gate**: quick  
**Commit**: `refactor(core): eliminate untyped data mappings in EventService`  

---

#### T5: Enforce Strict Type Safety and Model Decoupling in UserService

**What**: Decouple `ThemeMode` import to reference `theme.model.ts` and eliminate `as any` for `addressDetails` in `UserService`.  
**Where**: `src/app/core/services/user.service.ts`  
**Depends on**: T1  
**Reuses**: `src/app/core/models/theme.model.ts`  
**Requirement**: REFACTOR-07, REFACTOR-08  

**Tools**:

- MCP: NONE  
- Skill: NONE  

**Done when**:

- [ ] `UserService` imports `ThemeMode` from `src/app/core/models` instead of inline/inverted imports
- [ ] Profile data mappings avoid `as any`
- [ ] Unit tests pass: `src/app/core/services/user.service.spec.ts`
- [ ] Quick gate passes: `npx ng test --watch=false`
- [ ] Test count: at least 18 tests pass

**Tests**: unit  
**Gate**: quick  
**Commit**: `refactor(core): decouple ThemeMode and strict type UserService`  

---

#### T6: Enforce Strict FirestoreSettings in FirebaseService

**What**: Replace `as any` cast in `initializeFirestore` with typed `FirestoreSettings` interface.  
**Where**: `src/app/core/services/firebase.service.ts`  
**Depends on**: None  
**Reuses**: `firebase/firestore` types  
**Requirement**: REFACTOR-08  

**Tools**:

- MCP: NONE  
- Skill: NONE  

**Done when**:

- [ ] `initializeFirestore` utilizes official `FirestoreSettings` type without `as any`
- [ ] Build gate passes: `npm run build`

**Tests**: none  
**Gate**: build  
**Commit**: `refactor(core): type FirestoreSettings in FirebaseService`  

---

#### T7: Enforce ExtendedNotificationOptions in NotificationService

**What**: Replace `as any` cast in `new Notification()` with typed `ExtendedNotificationOptions` interface extending `NotificationOptions`.  
**Where**: `src/app/core/services/notification.service.ts`  
**Depends on**: None  
**Reuses**: DOM `NotificationOptions`  
**Requirement**: REFACTOR-08  

**Tools**:

- MCP: NONE  
- Skill: NONE  

**Done when**:

- [ ] Interface `ExtendedNotificationOptions` created and used without `as any`
- [ ] Build gate passes: `npm run build`

**Tests**: none  
**Gate**: build  
**Commit**: `refactor(core): type NotificationOptions in NotificationService`  

---

### Phase 2: Dead Code Pruning & Domain Structure Consolidation

#### T8: Prune Dead and Duplicate Event Detail and Organizer Components

**What**: Delete unreferenced legacy components (`ItemListComponent`, `RsvpFormComponent`, `EventHeaderComponent`, `EventInfoCardComponent`, `EmailVerificationBannerComponent`, `OrganizerEventCardComponent`).  
**Where**: `src/app/features/event-detail/components/`  
**Depends on**: None  
**Reuses**: Active replacement components (`ItemListCardComponent`, `RsvpCardComponent`, `EventCardComponent`, `DashboardContainer`)  
**Requirement**: REFACTOR-04, REFACTOR-05  

**Tools**:

- MCP: NONE  
- Skill: NONE  

**Done when**:

- [ ] Legacy component folders in `event-detail/components/` and `organizer/components/` deleted
- [ ] No broken references or dangling imports in the project
- [ ] Build gate passes: `npm run build && npx ng test --watch=false`

**Tests**: none  
**Gate**: build  
**Commit**: `chore(features): prune dead event-detail and organizer components`  

---

#### T9: Relocate LoginContainer to Features Auth Domain and Update Routing

**What**: Relocate `LoginContainer` from `features/admin/login/` to `src/app/features/auth/login/` and update lazy route declarations.  
**Where**: `src/app/app.routes.ts`  
**Depends on**: T8  
**Reuses**: Angular Router lazy loading  
**Requirement**: REFACTOR-06  

**Tools**:

- MCP: NONE  
- Skill: NONE  

**Done when**:

- [ ] `LoginContainer` resides in `src/app/features/auth/login/`
- [ ] `src/app/app.routes.ts` routes `/login` to `src/app/features/auth/login/login.container`
- [ ] Unit tests pass: `src/app/app.routes.spec.ts`
- [ ] Quick gate passes: `npx ng test --watch=false`
- [ ] Test count: at least 7 tests pass

**Tests**: unit  
**Gate**: quick  
**Commit**: `refactor(auth): relocate LoginContainer to auth domain and update routes`  

---

### Phase 3: Component Signals & Template Refactoring

#### T10: Migrate ItemListCardComponent to Signal Outputs with Unit Tests

**What**: Replace legacy `@Output()` decorators in `ItemListCardComponent` with Angular signal-based `output<string>()` and provide unit tests.  
**Where**: `src/app/features/event-detail/components/item-list-card/item-list-card.component.ts`  
**Depends on**: None  
**Reuses**: Angular modern signals `output<T>()`, `ChangeDetectionStrategy.OnPush`  
**Requirement**: REFACTOR-01, REFACTOR-12  

**Tools**:

- MCP: NONE  
- Skill: NONE  

**Done when**:

- [ ] `onClaim` and `onUnclaim` are defined as `output<string>()`
- [ ] `ChangeDetectionStrategy.OnPush` is strictly enforced
- [ ] `item-list-card.component.spec.ts` verifies: rendering items, claim output emission, unclaim output emission
- [ ] Quick gate passes: `npx ng test --watch=false`
- [ ] Test count: at least 4 tests pass

**Tests**: unit  
**Gate**: quick  
**Commit**: `refactor(event-detail): migrate ItemListCardComponent to signal outputs`  

---

#### T11: Refactor HomeContainer to Signals, A11y and SCSS Encapsulation with Unit Tests

**What**: Migrate `HomeContainer` from `AsyncPipe` to `toSignal()`, remove inline styles, add WCAG 2.1 AA keyboard accessibility, and add unit tests.  
**Where**: `src/app/features/home/home.container.ts`  
**Depends on**: None  
**Reuses**: `toSignal()`, `EventService`, BEM SCSS, WCAG 2.1 AA keyboard patterns  
**Requirement**: REFACTOR-02, REFACTOR-10, REFACTOR-12  

**Tools**:

- MCP: NONE  
- Skill: NONE  

**Done when**:

- [ ] `events` is a Signal initialized via `toSignal(this.eventService.listEvents())`
- [ ] `AsyncPipe` removed from imports and template
- [ ] Inline `style="cursor: pointer..."` removed and encapsulated in `home.container.scss`
- [ ] Event cards support keyboard interaction (`role="link"`, `tabindex="0"`, `Enter` and `Space` key navigation)
- [ ] `home.container.spec.ts` verifies: signal data rendering, loading state, empty state, keyboard navigation
- [ ] Quick gate passes: `npx ng test --watch=false`
- [ ] Test count: at least 5 tests pass

**Tests**: unit  
**Gate**: quick  
**Commit**: `refactor(home): migrate HomeContainer to signals with keyboard a11y`  

---

#### T12: Extract ConfirmDialogComponent Template and Styles with Unit Tests

**What**: Extract inline template from `ConfirmDialogComponent` into dedicated `.html` and `.scss` files, import `ConfirmDialogData` from models, and add unit tests.  
**Where**: `src/app/shared/components/confirm-dialog/confirm-dialog.component.ts`  
**Depends on**: T2  
**Reuses**: `src/app/core/models/dialog.model.ts`, `MatDialogModule`  
**Requirement**: REFACTOR-03, REFACTOR-12  

**Tools**:

- MCP: NONE  
- Skill: NONE  

**Done when**:

- [ ] `confirm-dialog.component.html` and `confirm-dialog.component.scss` created and referenced via `templateUrl` & `styleUrl`
- [ ] `ConfirmDialogData` imported from `src/app/core/models`
- [ ] `confirm-dialog.component.spec.ts` verifies: data injection rendering, confirm button action, cancel button action
- [ ] Quick gate passes: `npx ng test --watch=false`
- [ ] Test count: at least 3 tests pass

**Tests**: unit  
**Gate**: quick  
**Commit**: `refactor(shared): extract ConfirmDialogComponent template and scss`  

---

#### T13: Encapsulate ThemeToggleComponent Styles and Model Imports with Unit Tests

**What**: Create dedicated `theme-toggle.component.scss`, update `ThemeMode` import source, and add unit tests.  
**Where**: `src/app/shared/components/theme-toggle/theme-toggle.component.ts`  
**Depends on**: T1  
**Reuses**: `src/app/core/models/theme.model.ts`, `ThemeService`  
**Requirement**: REFACTOR-03, REFACTOR-07, REFACTOR-12  

**Tools**:

- MCP: NONE  
- Skill: NONE  

**Done when**:

- [ ] `theme-toggle.component.scss` created and linked via `styleUrl`
- [ ] `ThemeMode` imported from `src/app/core/models`
- [ ] `theme-toggle.component.spec.ts` verifies: menu opening, theme mode selection triggering `ThemeService.setMode`
- [ ] Quick gate passes: `npx ng test --watch=false`
- [ ] Test count: at least 3 tests pass

**Tests**: unit  
**Gate**: quick  
**Commit**: `refactor(shared): extract ThemeToggleComponent scss and use theme model`  

---

#### T14: Strict Error Narrowing and Unit Tests for AdminFormDrawerComponent

**What**: Enforce `catch (error: unknown)` with error narrowing in `AdminFormDrawerComponent` and implement unit test suite.  
**Where**: `src/app/features/admin/dashboard/components/admin-form-drawer/admin-form-drawer.component.ts`  
**Depends on**: None  
**Reuses**: `AdminService`, `NotificationService`, `ConfirmDialogComponent`  
**Requirement**: REFACTOR-08, REFACTOR-09, REFACTOR-12  

**Tools**:

- MCP: NONE  
- Skill: NONE  

**Done when**:

- [ ] Catch blocks use `error: unknown` and `error instanceof Error ? error.message : String(error)`
- [ ] `admin-form-drawer.component.spec.ts` verifies: admin list loading, add admin flow, remove admin flow with confirmation, error handling
- [ ] Quick gate passes: `npx ng test --watch=false`
- [ ] Test count: at least 4 tests pass

**Tests**: unit  
**Gate**: quick  
**Commit**: `refactor(admin): strict error narrowing and unit tests for AdminFormDrawerComponent`  

---

#### T15: Implement Unit Tests for SharePanelComponent

**What**: Create comprehensive unit tests for `SharePanelComponent` covering QR code rendering, clipboard copy, and WhatsApp sharing.  
**Where**: `src/app/features/organizer/event-editor/components/share-panel/share-panel.component.ts`  
**Depends on**: None  
**Reuses**: `MatSnackBar`, `qrcode` canvas mock  
**Requirement**: REFACTOR-12  

**Tools**:

- MCP: NONE  
- Skill: NONE  

**Done when**:

- [ ] `share-panel.component.spec.ts` created
- [ ] Tests verify: QR canvas generation, copy link to clipboard with snackbar feedback, WhatsApp share link format
- [ ] Quick gate passes: `npx ng test --watch=false`
- [ ] Test count: at least 4 tests pass

**Tests**: unit  
**Gate**: quick  
**Commit**: `test(organizer): implement unit tests for SharePanelComponent`  

---

#### T16: Refactor LoginContainer SCSS and Strict Error Handling with Unit Tests

**What**: Remove inline styles in `login.container.html`, move to `login.container.scss`, enforce strict error narrowing, and add unit tests.  
**Where**: `src/app/features/auth/login/login.container.ts`  
**Depends on**: T9  
**Reuses**: `AuthService`, `NotificationService`, BEM SCSS  
**Requirement**: REFACTOR-09, REFACTOR-11, REFACTOR-12  

**Tools**:

- MCP: NONE  
- Skill: NONE  

**Done when**:

- [ ] Inline `style="height: 76px"` moved to `.login__logo` in `login.container.scss`
- [ ] Catch blocks narrow `error: unknown`
- [ ] `login.container.spec.ts` verifies: email/password login, registration fallback, Google OAuth sign-in, error snackbars
- [ ] Quick gate passes: `npx ng test --watch=false`
- [ ] Test count: at least 5 tests pass

**Tests**: unit  
**Gate**: quick  
**Commit**: `refactor(auth): clean LoginContainer scss and strict error handling`  

---

### Phase 4: Design Tokens & Core Service Test Coverage

#### T17: Optimize Material 3 MDC Design Tokens and SCSS Theming

**What**: Optimize global form field and surface styles in `src/styles.scss` using native Material 3 / MDC tokens and `--org-*` properties without `!important` form overrides.  
**Where**: `src/styles.scss`  
**Depends on**: None  
**Reuses**: `--mdc-outlined-text-field-*`, `--mdc-dialog-*`, `--mat-menu-*`  
**Requirement**: REFACTOR-11  

**Tools**:

- MCP: NONE  
- Skill: NONE  

**Done when**:

- [ ] Form field borders, focus states, and typography leverage MDC tokens
- [ ] Unnecessary `!important` declarations on form inputs eliminated
- [ ] Build gate passes: `npm run build && npx ng test --watch=false`

**Tests**: none  
**Gate**: build  
**Commit**: `refactor(theme): optimize Material 3 MDC tokens in global styles`  

---

#### T18: Implement Unit Tests and Safe SSR Fallback for GuestSessionService

**What**: Implement unit test suite for `GuestSessionService` with safe SSR/JSDOM platform guards.  
**Where**: `src/app/core/services/guest-session.service.ts`  
**Depends on**: None  
**Reuses**: `localStorage` mock, `GuestSession` model  
**Requirement**: REFACTOR-13  

**Tools**:

- MCP: NONE  
- Skill: NONE  

**Done when**:

- [ ] `GuestSessionService` guards against missing `window` / `localStorage`
- [ ] `guest-session.service.spec.ts` verifies: saving session, retrieving session, clearing session, safe fallback
- [ ] Quick gate passes: `npx ng test --watch=false`
- [ ] Test count: at least 4 tests pass

**Tests**: unit  
**Gate**: quick  
**Commit**: `test(core): implement unit tests for GuestSessionService`  

---

#### T19: Implement Unit Tests for ConfettiService

**What**: Implement unit test suite for `ConfettiService`.  
**Where**: `src/app/core/services/confetti.service.ts`  
**Depends on**: None  
**Reuses**: `canvas-confetti` mock  
**Requirement**: REFACTOR-13  

**Tools**:

- MCP: NONE  
- Skill: NONE  

**Done when**:

- [ ] `confetti.service.spec.ts` verifies: `fireSuccessConfetti` executes without throwing errors under browser and test environments
- [ ] Quick gate passes: `npx ng test --watch=false`
- [ ] Test count: at least 2 tests pass

**Tests**: unit  
**Gate**: quick  
**Commit**: `test(core): implement unit tests for ConfettiService`  

---

#### T20: Implement Unit Tests for DrawerService

**What**: Implement unit test suite for `DrawerService` verifying signal state management.  
**Where**: `src/app/core/services/drawer.service.ts`  
**Depends on**: None  
**Reuses**: Angular Signals (`isOpen`, `mode`, `data`)  
**Requirement**: REFACTOR-13  

**Tools**:

- MCP: NONE  
- Skill: NONE  

**Done when**:

- [ ] `drawer.service.spec.ts` verifies: opening admin drawer, opening event drawer with data, closing drawer, signals reactivity
- [ ] Quick gate passes: `npx ng test --watch=false`
- [ ] Test count: at least 4 tests pass

**Tests**: unit  
**Gate**: quick  
**Commit**: `test(core): implement unit tests for DrawerService`  

---

#### T21: Implement Unit Tests for HeaderService

**What**: Implement unit test suite for `HeaderService` verifying reactive title and navigation signals.  
**Where**: `src/app/core/services/header.service.ts`  
**Depends on**: None  
**Reuses**: Angular Signals (`title`, `showBack`, `backUrl`)  
**Requirement**: REFACTOR-13  

**Tools**:

- MCP: NONE  
- Skill: NONE  

**Done when**:

- [ ] `header.service.spec.ts` verifies: updating title, setting back button visibility, configuring custom back URL
- [ ] Quick gate passes: `npx ng test --watch=false`
- [ ] Test count: at least 3 tests pass

**Tests**: unit  
**Gate**: quick  
**Commit**: `test(core): implement unit tests for HeaderService`  

---

#### T22: Implement Unit Tests and Feature Detection for NotificationService

**What**: Implement unit test suite for `NotificationService` verifying permission requests, in-app notifications, and browser support fallbacks.  
**Where**: `src/app/core/services/notification.service.ts`  
**Depends on**: T7  
**Reuses**: `MatSnackBar`, Notification API mock  
**Requirement**: REFACTOR-13  

**Tools**:

- MCP: NONE  
- Skill: NONE  

**Done when**:

- [ ] `notification.service.spec.ts` verifies: local snackbar dispatch, permission checking, safe fallback when Notification API is unsupported
- [ ] Quick gate passes: `npx ng test --watch=false`
- [ ] Test count: at least 4 tests pass

**Tests**: unit  
**Gate**: quick  
**Commit**: `test(core): implement unit tests for NotificationService`  

---

#### T23: Implement Unit Tests for FirebaseService

**What**: Implement unit test suite for `FirebaseService` verifying initialization of Firebase App, Auth, and Firestore instances.  
**Where**: `src/app/core/services/firebase.service.ts`  
**Depends on**: T6  
**Reuses**: Firebase modular SDK  
**Requirement**: REFACTOR-13  

**Tools**:

- MCP: NONE  
- Skill: NONE  

**Done when**:

- [ ] `firebase.service.spec.ts` verifies: singleton initialization, instance exposures (`app`, `auth`, `firestore`)
- [ ] Quick gate passes: `npx ng test --watch=false`
- [ ] Test count: at least 3 tests pass

**Tests**: unit  
**Gate**: quick  
**Commit**: `test(core): implement unit tests for FirebaseService`  

---

## Phase Execution Map

```
Phase 1 → Phase 2 → Phase 3 → Phase 4

Phase 1:  T1 ──────→ T4
          T1 ──────→ T5
          T2 ──────→ T4
          T3
          T6
          T7
Phase 2:  T8 ──────→ T9
Phase 3:  T10
          T11
          T12
          T13
          T14
          T15
          T16
Phase 4:  T17
          T18
          T19
          T20
          T21
          T22
          T23
```

Execution is organized into 3 task-budgeted sub-agent worker batches (~7-9 tasks each) executed sequentially:
- **Batch 1 (Worker 1)**: Phase 1 + Phase 2 (9 tasks) — Models, Services Strict Typing, Dead Code Pruning, Auth Relocation.
- **Batch 2 (Worker 2)**: Phase 3 (7 tasks) — Component Signals, SCSS Extraction, WCAG 2.1 AA A11y & Component Specs.
- **Batch 3 (Worker 3)**: Phase 4 (7 tasks) — Material 3 MDC Design Tokens & Core Services Spec Expansion.
- **Validation (Verifier)**: Independent adversarial verification, spec-anchored outcome checking, and discrimination sensor.

---

## Task Granularity Check

| Task | Scope | Status |
| ---- | ----- | ------ |
| T1: Define ThemeMode Type Model | 1 type model file | ✅ Granular |
| T2: Define Dialog and Batch DTO Interfaces | 1 interface model file | ✅ Granular |
| T3: Enforce Strict Type Safety in FirestoreGateway | 1 service class | ✅ Granular |
| T4: Enforce Strict Type Safety in EventService | 1 service class | ✅ Granular |
| T5: Enforce Strict Type Safety and Model Decoupling in UserService | 1 service class | ✅ Granular |
| T6: Enforce Strict FirestoreSettings in FirebaseService | 1 service class | ✅ Granular |
| T7: Enforce ExtendedNotificationOptions in NotificationService | 1 service class | ✅ Granular |
| T8: Prune Dead and Duplicate Event Detail and Organizer Components | File cleanup of unused components | ✅ Granular |
| T9: Relocate LoginContainer to Features Auth Domain and Update Routing | 1 container move + routes | ✅ Granular |
| T10: Migrate ItemListCardComponent to Signal Outputs with Unit Tests | 1 presentational component + spec | ✅ Granular |
| T11: Refactor HomeContainer to Signals, A11y and SCSS Encapsulation with Unit Tests | 1 container component + template + styles + spec | ✅ Granular |
| T12: Extract ConfirmDialogComponent Template and Styles with Unit Tests | 1 shared dialog component + template + styles + spec | ✅ Granular |
| T13: Encapsulate ThemeToggleComponent Styles and Model Imports with Unit Tests | 1 shared component + styles + spec | ✅ Granular |
| T14: Strict Error Narrowing and Unit Tests for AdminFormDrawerComponent | 1 drawer component + spec | ✅ Granular |
| T15: Implement Unit Tests for SharePanelComponent | 1 component spec | ✅ Granular |
| T16: Refactor LoginContainer SCSS and Strict Error Handling with Unit Tests | 1 container component + styles + spec | ✅ Granular |
| T17: Optimize Material 3 MDC Design Tokens and SCSS Theming | 1 global styles file | ✅ Granular |
| T18: Implement Unit Tests and Safe SSR Fallback for GuestSessionService | 1 service + spec | ✅ Granular |
| T19: Implement Unit Tests for ConfettiService | 1 service spec | ✅ Granular |
| T20: Implement Unit Tests for DrawerService | 1 service spec | ✅ Granular |
| T21: Implement Unit Tests for HeaderService | 1 service spec | ✅ Granular |
| T22: Implement Unit Tests and Feature Detection for NotificationService | 1 service + spec | ✅ Granular |
| T23: Implement Unit Tests for FirebaseService | 1 service spec | ✅ Granular |

---

## Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
| ---- | ---------------------- | ------------- | ------ |
| T1 | None | None | ✅ Match |
| T2 | None | None | ✅ Match |
| T3 | None | None | ✅ Match |
| T4 | T1, T2 | T1 → T4, T2 → T4 | ✅ Match |
| T5 | T1 | T1 → T5 | ✅ Match |
| T6 | None | None | ✅ Match |
| T7 | None | None | ✅ Match |
| T8 | None | None | ✅ Match |
| T9 | T8 | T8 → T9 | ✅ Match |
| T10 | None | None | ✅ Match |
| T11 | None | None | ✅ Match |
| T12 | T2 (Phase 1) | Backward cross-phase dep | ✅ Match |
| T13 | T1 (Phase 1) | Backward cross-phase dep | ✅ Match |
| T14 | None | None | ✅ Match |
| T15 | None | None | ✅ Match |
| T16 | T9 (Phase 2) | Backward cross-phase dep | ✅ Match |
| T17 | None | None | ✅ Match |
| T18 | None | None | ✅ Match |
| T19 | None | None | ✅ Match |
| T20 | None | None | ✅ Match |
| T21 | None | None | ✅ Match |
| T22 | T7 (Phase 1) | Backward cross-phase dep | ✅ Match |
| T23 | T6 (Phase 1) | Backward cross-phase dep | ✅ Match |

---

## Test Co-location Validation

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
| ---- | --------------------------- | --------------- | --------- | ------ |
| T1: Define ThemeMode Type Model | Model / Interface | none | none | ✅ OK |
| T2: Define Dialog and Batch DTO Interfaces | Model / Interface | none | none | ✅ OK |
| T3: Enforce Strict Type Safety in FirestoreGateway | Core Service | unit | unit | ✅ OK |
| T4: Enforce Strict Type Safety in EventService | Core Service | unit | unit | ✅ OK |
| T5: Enforce Strict Type Safety and Model Decoupling in UserService | Core Service | unit | unit | ✅ OK |
| T6: Enforce Strict FirestoreSettings in FirebaseService | Core Service / Config | none | none | ✅ OK |
| T7: Enforce ExtendedNotificationOptions in NotificationService | Core Service / Config | none | none | ✅ OK |
| T8: Prune Dead and Duplicate Event Detail and Organizer Components | Dead Code Cleanup | none | none | ✅ OK |
| T9: Relocate LoginContainer to Features Auth Domain and Update Routing | Container / Smart Component | unit | unit | ✅ OK |
| T10: Migrate ItemListCardComponent to Signal Outputs with Unit Tests | Dumb Component | unit | unit | ✅ OK |
| T11: Refactor HomeContainer to Signals, A11y and SCSS Encapsulation with Unit Tests | Container / Smart Component | unit | unit | ✅ OK |
| T12: Extract ConfirmDialogComponent Template and Styles with Unit Tests | Dumb Component | unit | unit | ✅ OK |
| T13: Encapsulate ThemeToggleComponent Styles and Model Imports with Unit Tests | Dumb Component | unit | unit | ✅ OK |
| T14: Strict Error Narrowing and Unit Tests for AdminFormDrawerComponent | Dumb Component | unit | unit | ✅ OK |
| T15: Implement Unit Tests for SharePanelComponent | Dumb Component | unit | unit | ✅ OK |
| T16: Refactor LoginContainer SCSS and Strict Error Handling with Unit Tests | Container / Smart Component | unit | unit | ✅ OK |
| T17: Optimize Material 3 MDC Design Tokens and SCSS Theming | Global Styles / MDC Tokens | none | none | ✅ OK |
| T18: Implement Unit Tests and Safe SSR Fallback for GuestSessionService | Core Service | unit | unit | ✅ OK |
| T19: Implement Unit Tests for ConfettiService | Core Service | unit | unit | ✅ OK |
| T20: Implement Unit Tests for DrawerService | Core Service | unit | unit | ✅ OK |
| T21: Implement Unit Tests for HeaderService | Core Service | unit | unit | ✅ OK |
| T22: Implement Unit Tests and Feature Detection for NotificationService | Core Service | unit | unit | ✅ OK |
| T23: Implement Unit Tests for FirebaseService | Core Service | unit | unit | ✅ OK |
