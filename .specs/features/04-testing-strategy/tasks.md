# Automated Testing Strategy Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Design**: `.specs/features/04-testing-strategy/design.md`  
**Status**: Draft  

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec - confirm before Execute. Guidelines found: `AGENTS.md`, `GEMINI.md`, `DESIGN.md`.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Test Mock / Fixture | none | - (build gate only) | `src/app/testing/**/*.ts` | `npm run build` |
| Service | unit | All branches; 1:1 to spec ACs; Signal states, storage sync, HTTP lookups | `src/app/core/services/*.spec.ts` | `npx ng test --watch=false` |
| Dumb Component | unit | Input bindings, output event emissions, accessibility rendering, seasonal theming | `src/app/shared/**/*.component.spec.ts` | `npx ng test --watch=false` |
| E2E Journey | e2e | Happy path navigation, routing, PWA install prompt, basic interaction | `e2e/*.spec.ts` | `npx playwright test` |

## Gate Check Commands

> Generated from codebase - confirm before Execute.

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | After tasks with unit tests only | `npx ng test --watch=false` |
| Full | After tasks with e2e/integration tests | `npx ng test --watch=false && npx playwright test` |
| Build | After phase completion or mock/fixture-only tasks | `npm run build && npx ng test --watch=false` |

---

## Execution Plan

Phases are ordered and run sequentially - each phase completes before the next begins, and tasks within a phase execute in order.

### Phase 1: Foundation (Testing Harness & Mocks)

Mock service providers and fixing pre-existing test environment issues.

```
T1 → T2
```

### Phase 2: Core Unit & Component Suites

Core service tests and presentational component testing.

```
T3
T4
```

### Phase 3: E2E Testing Framework & Smoke Test

Playwright configuration and critical user flow verification.

```
T5
```

---

## Task Breakdown

### Phase 1: Foundation (Testing Harness & Mocks)

#### T1: Create Mock Services Fixtures

**What**: Create reusable mock service fixtures (`MockAuthService`, `MockEventService`) with Signals and spies for isolated unit testing.  
**Where**: `src/app/testing/mocks/mock-auth.service.ts`  
**Depends on**: None  
**Reuses**: Angular Signals (`signal`)  
**Requirement**: TEST-01  

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `MockAuthService` exports Signals (`currentUser`, `isAdmin`, `isSuperAdmin`, `loading`) and spy methods
- [x] No `any` types
- [x] Build gate passes: `npm run build`

**Tests**: none  
**Gate**: build  
**Commit**: `test(fixtures): create mock service test fixtures for isolated testing`  

---

#### T2: Fix Existing Test Suites Environment Setup

**What**: Fix `window.matchMedia` mock in `ThemeService` and DOM assertions in `SeasonalOverlayComponent` tests so all current tests pass cleanly.  
**Where**: `src/app/core/services/theme.service.ts`  
**Depends on**: T1  
**Reuses**: Vitest / jsdom environment mocking  
**Requirement**: TEST-01  

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `ThemeService` safely handles SSR / jsdom environments where `window.matchMedia` is undefined
- [x] `app.spec.ts` and `seasonal-overlay.component.spec.ts` pass cleanly
- [x] Quick gate passes: `npx ng test --watch=false`
- [x] Test count: 11 tests pass with 0 failures

**Tests**: unit  
**Gate**: quick  
**Commit**: `fix(test): resolve window.matchMedia mock in ThemeService and fix initial unit tests`  

---

### Phase 2: Core Unit & Component Suites

#### T3: Implement ThemeService & LocationService Unit Tests

**What**: Write thorough unit tests for `ThemeService` and `LocationService` (ViaCep integration, CEP mask, timeout handling).  
**Where**: `src/app/core/services/location.service.spec.ts`  
**Depends on**: T2  
**Reuses**: Angular `HttpClientTestingModule` / `provideHttpClientTesting`  
**Requirement**: TEST-01  

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Unit tests verify valid CEP auto-fill, invalid CEP error handling, and timeout fallback
- [ ] Quick gate passes: `npx ng test --watch=false`
- [ ] Test count: at least 4 new tests pass

**Tests**: unit  
**Gate**: quick  
**Commit**: `test(core): add unit tests for LocationService and ThemeService`  

---

#### T4: Implement PixCard Component API Tests

**What**: Write unit tests for `PixCardComponent` verifying Signal input bindings, computed split calculation, copy button output, and accessibility.  
**Where**: `src/app/features/event-detail/components/pix-card/pix-card.component.spec.ts`  
**Depends on**: T2  
**Reuses**: Angular Component fixture testing  
**Requirement**: TEST-02  

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Verifies dynamic per-person split updates when `estimatedBudget` or `guestCount` change
- [ ] Verifies `copyPix` emission when copy button is activated via click and keyboard
- [ ] Quick gate passes: `npx ng test --watch=false`
- [ ] Test count: at least 4 tests pass

**Tests**: unit  
**Gate**: quick  
**Commit**: `test(event-detail): add component API tests for PixCardComponent`  

---

### Phase 3: E2E Testing Framework & Smoke Test

#### T5: Setup Playwright E2E Smoke Journey

**What**: Configure Playwright test harness and implement end-to-end smoke test for home page navigation and public event view.  
**Where**: `e2e/smoke.spec.ts`  
**Depends on**: None  
**Reuses**: Playwright test runner  
**Requirement**: TEST-03  

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Playwright config file and `e2e/smoke.spec.ts` created
- [ ] E2E test verifies home page renders, navigates to login, and renders public event page
- [ ] Build gate passes: `npm run build`

**Tests**: e2e  
**Gate**: full  
**Commit**: `test(e2e): configure Playwright and add initial smoke journey`  

---

## Phase Execution Map

```
Phase 1 → Phase 2 → Phase 3

Phase 1:  T1 ──────→ T2
Phase 2:  T3
          T4
Phase 3:  T5
```

Execution is strictly sequential - there is no intra-phase parallelism. A single agent (or batch worker) works one task at a time, in order.

---

## Task Granularity Check

| Task | Scope | Status |
| ---- | ----- | ------ |
| T1: Create Mock Services Fixtures | 1 test fixture file | ✅ Granular |
| T2: Fix Existing Test Suites Environment Setup | 1 service class fix + passing specs | ✅ Granular |
| T3: Implement ThemeService & LocationService Unit Tests | 1 spec file | ✅ Granular |
| T4: Implement PixCard Component API Tests | 1 spec file | ✅ Granular |
| T5: Setup Playwright E2E Smoke Journey | 1 e2e spec file | ✅ Granular |

---

## Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
| ---- | ---------------------- | ------------- | ------ |
| T1 | None | None | ✅ Match |
| T2 | T1 | T1 → T2 | ✅ Match |
| T3 | T2 (Phase 1) | Cross-phase backward dep | ✅ Match |
| T4 | T2 (Phase 1) | Cross-phase backward dep | ✅ Match |
| T5 | None | None | ✅ Match |

---

## Test Co-location Validation

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
| ---- | --------------------------- | --------------- | --------- | ------ |
| T1: Create Mock Services Fixtures | Test Mock / Fixture | none | none | ✅ OK |
| T2: Fix Existing Test Suites Environment Setup | Service | unit | unit | ✅ OK |
| T3: Implement ThemeService & LocationService Unit Tests | Service | unit | unit | ✅ OK |
| T4: Implement PixCard Component API Tests | Dumb Component | unit | unit | ✅ OK |
| T5: Setup Playwright E2E Smoke Journey | E2E Journey | e2e | e2e | ✅ OK |
