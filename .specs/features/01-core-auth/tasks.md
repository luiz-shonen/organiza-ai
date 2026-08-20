# Core Auth & RBAC Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Design**: `.specs/features/01-core-auth/design.md`  
**Status**: Draft  

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec - confirm before Execute. Guidelines found: `AGENTS.md`, `GEMINI.md`, `DESIGN.md`.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Model / Interface | none | - (build gate only) | `src/app/core/models/*.ts` | `npm run build` |
| Guard | unit | All route permit / redirect branches; wait-for-auth resolution | `src/app/core/guards/*.spec.ts` | `npx ng test --watch=false` |
| Service | unit | All branches; 1:1 to spec ACs; Google login, email login, register, email verification, superadmin checks | `src/app/core/services/*.spec.ts` | `npx ng test --watch=false` |
| Dumb Component | unit | Input bindings, output event emissions, cooldown timer progression, accessibility rendering | `src/app/features/**/*.component.spec.ts` | `npx ng test --watch=false` |
| Routing Config | unit | Route configuration correctness, guard assignment | `src/app/*.spec.ts` | `npx ng test --watch=false` |

## Gate Check Commands

> Generated from codebase - confirm before Execute.

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | After tasks with unit tests only | `npx ng test --watch=false` |
| Full | After tasks with integration/e2e tests | `npx ng test --watch=false` |
| Build | After phase completion or model/config-only tasks | `npm run build && npx ng test --watch=false` |

---

## Execution Plan

Phases are ordered and run sequentially - each phase completes before the next begins, and tasks within a phase execute in order.

### Phase 1: Foundation (Models & Route Guards)

Core data structures and route security guards.

```
T1 → T2
T1 → T3
```

### Phase 2: Core Auth Service

Authentication business logic, open registration, and email verification.

```
T4
```

### Phase 3: Presentational Components & Route Integration

UI feedback components and application routing configuration.

```
T5 → T6
```

---

## Task Breakdown

### Phase 1: Foundation (Models & Route Guards)

#### T1: Create AuthUser Interface Model

**What**: Define the `AuthUser` data model interface for representing authenticated users and their verification state.  
**Where**: `src/app/core/models/user.model.ts`  
**Depends on**: None  
**Reuses**: Existing Firebase User attribute definitions  
**Requirement**: AUTH-02  

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `AuthUser` interface exported with `uid`, `email`, `displayName`, `photoURL`, and `emailVerified` fields
- [x] Strictly typed with no `any` types
- [x] Build gate passes: `npm run build`

**Tests**: none  
**Gate**: build  
**Commit**: `feat(auth): define AuthUser interface model`  

---

#### T2: Implement superAdminGuard

**What**: Create `superAdminGuard` to restrict `/admin` route access strictly to Super Admin accounts, redirecting unauthorized users to `/meus-eventos`.  
**Where**: `src/app/core/guards/super-admin.guard.ts`  
**Depends on**: T1  
**Reuses**: `src/app/core/guards/auth.guard.ts` signal waiting pattern  
**Requirement**: AUTH-05  

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `superAdminGuard` implemented as `CanActivateFn` checking `authService.isSuperAdmin()`
- [x] Redirects non-superadmin users to `/meus-eventos` via `UrlTree`
- [x] Waits for `authService.loading()` signal to resolve
- [x] Unit tests cover: superadmin access allowed, regular user redirected, unauthenticated user redirected
- [x] Quick gate passes: `npx ng test --watch=false`
- [x] Test count: at least 3 tests pass

**Tests**: unit  
**Gate**: quick  
**Commit**: `feat(auth): implement superAdminGuard for platform analytics route`  

---

#### T3: Refactor authGuard for Open User Access

**What**: Update `authGuard` to permit any authenticated user to access organizer routes (`/meus-eventos`), replacing the retired admin whitelist check.  
**Where**: `src/app/core/guards/auth.guard.ts`  
**Depends on**: T1  
**Reuses**: Existing `authGuard` file structure  
**Requirement**: AUTH-04  

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `authGuard` checks `currentUser() !== null` instead of `isAdmin()`
- [x] Redirects unauthenticated visitors to `/login`
- [x] Unit tests cover: authenticated user permitted, unauthenticated visitor redirected to `/login`
- [x] Quick gate passes: `npx ng test --watch=false`
- [x] Test count: at least 2 tests pass

**Tests**: unit  
**Gate**: quick  
**Commit**: `refactor(auth): update authGuard to enforce open user authentication`  

---

### Phase 2: Core Auth Service

#### T4: Refactor AuthService for Open Registration and Verification

**What**: Update `AuthService` to retire whitelist gating, implement `sendVerificationEmail()`, and synchronize `isSuperAdmin` signal.  
**Where**: `src/app/core/services/auth.service.ts`  
**Depends on**: T1  
**Reuses**: Firebase direct modular SDK (`firebase/auth`)  
**Requirement**: AUTH-01, AUTH-03, AUTH-06  

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `verifyAdminStatus` whitelist check removed from login/register flows
- [x] `sendVerificationEmail()` method implemented using Firebase `sendEmailVerification`
- [x] `isSuperAdmin` signal correctly evaluates hardcoded superadmin emails
- [x] Unit tests cover: Google sign-in state update, email registration with verification dispatch, logout session clearing, and superadmin identification
- [x] Quick gate passes: `npx ng test --watch=false`
- [x] Test count: at least 6 tests pass

**Tests**: unit  
**Gate**: quick  
**Commit**: `feat(auth): enable open registration and email verification in AuthService`  

---

### Phase 3: Presentational Components & Route Integration

#### T5: Create EmailVerificationBannerComponent

**What**: Create a dumb presentational component displaying an unverified email reminder banner with a 60-second cooldown on the resend button.  
**Where**: `src/app/features/organizer/components/email-verification-banner/email-verification-banner.component.ts`  
**Depends on**: T4  
**Reuses**: Modern Angular `@if`, Angular Material `mat-button`, `mat-icon`, CSS custom properties  
**Requirement**: AUTH-03  

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Standalone presentational component with `ChangeDetectionStrategy.OnPush`
- [ ] `email` required input, `resendCooldown` input, and `resend` output event emitter
- [ ] Disables resend button while `resendCooldown > 0` and displays remaining seconds
- [ ] WCAG 2.1 AA accessible with appropriate `role="alert"` and ARIA labels
- [ ] Separate `.html`, `.scss`, and `.spec.ts` files
- [ ] Unit tests cover: banner rendering, button disabled during cooldown, emit on click
- [ ] Quick gate passes: `npx ng test --watch=false`
- [ ] Test count: at least 4 tests pass

**Tests**: unit  
**Gate**: quick  
**Commit**: `feat(auth): create EmailVerificationBannerComponent with cooldown timer`  

---

#### T6: Configure Routing for /meus-eventos and /admin

**What**: Update application routing to protect `/meus-eventos` with `authGuard`, `/admin` with `superAdminGuard`, and route `/login` redirect to `/meus-eventos`.  
**Where**: `src/app/app.routes.ts`  
**Depends on**: T2, T3, T5  
**Reuses**: Angular Router standard config  
**Requirement**: AUTH-04, AUTH-05  

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `/meus-eventos` route protected by `authGuard`
- [ ] `/admin` route protected by `superAdminGuard`
- [ ] `/login` route configured for authentication entry
- [ ] Unit tests verify route configuration, path mappings, and guard assignments
- [ ] Quick gate passes: `npx ng test --watch=false`
- [ ] Test count: at least 3 tests pass

**Tests**: unit  
**Gate**: quick  
**Commit**: `feat(routing): configure /meus-eventos and /admin route guards`  

---

## Phase Execution Map

```
Phase 1 → Phase 2 → Phase 3

Phase 1:  T1 ──┬──→ T2
               └──→ T3
Phase 2:  T4
Phase 3:  T5 ──────→ T6
```

Execution is strictly sequential - there is no intra-phase parallelism. A single agent (or batch worker) works one task at a time, in order.

---

## Task Granularity Check

| Task | Scope | Status |
| ---- | ----- | ------ |
| T1: Create AuthUser Interface Model | 1 interface model file | ✅ Granular |
| T2: Implement superAdminGuard | 1 guard function + spec | ✅ Granular |
| T3: Refactor authGuard for Open User Access | 1 guard function + spec | ✅ Granular |
| T4: Refactor AuthService for Open Registration | 1 service class + spec | ✅ Granular |
| T5: Create EmailVerificationBannerComponent | 1 presentational component + template + styles + spec | ✅ Granular |
| T6: Configure Routing for /meus-eventos and /admin | 1 routing configuration file + spec | ✅ Granular |

---

## Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
| ---- | ---------------------- | ------------- | ------ |
| T1 | None | None | ✅ Match |
| T2 | T1 | T1 → T2 | ✅ Match |
| T3 | T1 | T1 → T3 | ✅ Match |
| T4 | T1 (Phase 1) | Cross-phase backward dep | ✅ Match |
| T5 | T4 (Phase 2) | Cross-phase backward dep | ✅ Match |
| T6 | T2, T3 (Phase 1), T5 (Phase 3) | T5 → T6 (intra-phase) | ✅ Match |

---

## Test Co-location Validation

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
| ---- | --------------------------- | --------------- | --------- | ------ |
| T1: Create AuthUser Interface Model | Model / Interface | none | none | ✅ OK |
| T2: Implement superAdminGuard | Guard | unit | unit | ✅ OK |
| T3: Refactor authGuard for Open User Access | Guard | unit | unit | ✅ OK |
| T4: Refactor AuthService for Open Registration | Service | unit | unit | ✅ OK |
| T5: Create EmailVerificationBannerComponent | Dumb Component | unit | unit | ✅ OK |
| T6: Configure Routing for /meus-eventos and /admin | Routing Config | unit | unit | ✅ OK |
