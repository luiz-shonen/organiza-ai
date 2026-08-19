# Guest Profile & History Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Design**: `.specs/features/06-guest-profile/design.md`  
**Status**: Draft  

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec - confirm before Execute. Guidelines found: `AGENTS.md`, `GEMINI.md`, `DESIGN.md`.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Model / Interface | none | - (build gate only) | `src/app/core/models/*.ts` | `npm run build` |
| Service | unit | All branches; 1:1 to spec ACs; profile update, attended events loading | `src/app/core/services/*.spec.ts` | `npx ng test --watch=false` |
| Dumb Component | unit | Input bindings, edit name form, output updateName emissions, accessibility | `src/app/features/profile/**/*.component.spec.ts` | `npx ng test --watch=false` |
| Container Component | unit | State orchestration, auth guard protection, profile binding | `src/app/features/profile/**/*.container.spec.ts` | `npx ng test --watch=false` |

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

### Phase 1: Foundation (Profile Model & Service)

Data models and user profile Firestore persistence.

```
T1 → T2
```

### Phase 2: UI Presentation Components

Profile information card and name editor.

```
T3
```

### Phase 3: Profile Container & Routing

Smart profile container and route setup under `/perfil`.

```
T4
```

---

## Task Breakdown

### Phase 1: Foundation (Profile Model & Service)

#### T1: Define UserProfile Interface Model

**What**: Define `UserProfile` data model interface for authenticated user profile records in Firestore.  
**Where**: `src/app/core/models/profile.model.ts`  
**Depends on**: None  
**Reuses**: Standard user ID and timestamp formats  
**Requirement**: PROF-01  

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `UserProfile` interface exported with `uid`, `email`, `displayName`, `photoURL`, `phone`, `createdAt`, and `updatedAt`
- [ ] Strictly typed with no `any` types
- [ ] Build gate passes: `npm run build`

**Tests**: none  
**Gate**: build  
**Commit**: `feat(profile): define UserProfile interface model`  

---

#### T2: Enhance UserService for Profile Updates and History

**What**: Add `updateProfile` and `getAttendedEvents` methods to `UserService` with Firestore queries.  
**Where**: `src/app/core/services/user.service.ts`  
**Depends on**: T1  
**Reuses**: `FirebaseService`, Firestore modular SDK  
**Requirement**: PROF-01, PROF-02  

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `updateProfile` updates `users/{uid}` with new displayName and phone
- [ ] `getAttendedEvents` returns list of events where user confirmed attendance
- [ ] Unit tests cover: profile update, attended events querying, error handling
- [ ] Quick gate passes: `npx ng test --watch=false`
- [ ] Test count: at least 3 tests pass

**Tests**: unit  
**Gate**: quick  
**Commit**: `feat(profile): add updateProfile and getAttendedEvents to UserService`  

---

### Phase 2: UI Presentation Components

#### T3: Create ProfileInfoCardComponent

**What**: Create presentational `ProfileInfoCardComponent` displaying user avatar, name, email, and phone with an inline edit mode.  
**Where**: `src/app/features/profile/components/profile-info-card/profile-info-card.component.ts`  
**Depends on**: None  
**Reuses**: Angular Material inputs, buttons, BEM SCSS  
**Requirement**: PROF-01  

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Standalone presentational component with `ChangeDetectionStrategy.OnPush`
- [ ] `user` required input and `updateName` output
- [ ] Accessible form with validation on empty name
- [ ] Separate `.html`, `.scss`, and `.spec.ts` files
- [ ] Unit tests cover: user info display, edit toggle, name update emission
- [ ] Quick gate passes: `npx ng test --watch=false`
- [ ] Test count: at least 4 tests pass

**Tests**: unit  
**Gate**: quick  
**Commit**: `feat(profile): create ProfileInfoCardComponent`  

---

### Phase 3: Profile Container & Routing

#### T4: Create ProfileContainer and Wire Route

**What**: Create smart `ProfileContainer` coordinating user details, attended events history, and register `/perfil` route protected by `authGuard`.  
**Where**: `src/app/features/profile/profile.container.ts`  
**Depends on**: T2, T3  
**Reuses**: `authGuard`, `AuthService`, `UserService`  
**Requirement**: PROF-01, PROF-02  

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `ProfileContainer` fetches user profile and attended events via Signals
- [ ] `/perfil` route added to `app.routes.ts` with `canActivate: [authGuard]`
- [ ] Unit tests cover: profile loading, route activation, update invocation
- [ ] Quick gate passes: `npx ng test --watch=false`
- [ ] Test count: at least 3 tests pass

**Tests**: unit  
**Gate**: quick  
**Commit**: `feat(profile): create ProfileContainer and wire /perfil route`  

---

## Phase Execution Map

```
Phase 1 → Phase 2 → Phase 3

Phase 1:  T1 ──────→ T2
Phase 2:  T3
Phase 3:  T4
```

Execution is strictly sequential - there is no intra-phase parallelism. A single agent (or batch worker) works one task at a time, in order.

---

## Task Granularity Check

| Task | Scope | Status |
| ---- | ----- | ------ |
| T1: Define UserProfile Interface Model | 1 interface model file | ✅ Granular |
| T2: Enhance UserService for Profile Updates and History | 1 service class update + spec | ✅ Granular |
| T3: Create ProfileInfoCardComponent | 1 presentational component + template + styles + spec | ✅ Granular |
| T4: Create ProfileContainer and Wire Route | 1 container class + template + route wiring + spec | ✅ Granular |

---

## Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
| ---- | ---------------------- | ------------- | ------ |
| T1 | None | None | ✅ Match |
| T2 | T1 | T1 → T2 | ✅ Match |
| T3 | None | None | ✅ Match |
| T4 | T2 (Phase 1), T3 (Phase 2) | Cross-phase backward deps | ✅ Match |

---

## Test Co-location Validation

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
| ---- | --------------------------- | --------------- | --------- | ------ |
| T1: Define UserProfile Interface Model | Model / Interface | none | none | ✅ OK |
| T2: Enhance UserService for Profile Updates and History | Service | unit | unit | ✅ OK |
| T3: Create ProfileInfoCardComponent | Dumb Component | unit | unit | ✅ OK |
| T4: Create ProfileContainer and Wire Route | Container Component | unit | unit | ✅ OK |
