# Guest Experience & Verified RSVP Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Design**: `.specs/features/03-guest-experience/design.md`  
**Status**: Draft  

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec - confirm before Execute. Guidelines found: `AGENTS.md`, `GEMINI.md`, `DESIGN.md`.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Model / Interface | none | - (build gate only) | `src/app/core/models/*.ts` | `npm run build` |
| Service | unit | All branches; 1:1 to spec ACs; verified RSVP save, atomic cancellation with writeBatch, item claim release | `src/app/core/services/*.spec.ts` | `npx ng test --watch=false` |
| Dumb Component | unit | Input bindings, computed split calculation, output event emissions, accessibility rendering | `src/app/features/**/*.component.spec.ts` | `npx ng test --watch=false` |
| Container Component | unit | Google popup trigger, guest state binding, child component inputs/outputs | `src/app/features/**/*.container.spec.ts` | `npx ng test --watch=false` |

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

### Phase 1: Foundation (Guest Model & Batch Cancellation Service)

Data models and atomic Firestore batch operations.

```
T1 → T2
```

### Phase 2: UI Presentation Components

Pix split card with computed signals and 1-touch RSVP card.

```
T3
T4
```

### Phase 3: Container Integration

Smart container orchestration for verified RSVP, item claiming, and split display.

```
T5
```

---

## Task Breakdown

### Phase 1: Foundation (Guest Model & Batch Cancellation Service)

#### T1: Update Guest Interface Model

**What**: Update `Guest` interface with `primaryGuestId`, `photoUrl`, and `confirmedAt` ISO timestamp.  
**Where**: `src/app/core/models/guest.model.ts`  
**Depends on**: None  
**Reuses**: Existing Guest model definitions  
**Requirement**: GEXP-01, GEXP-02  

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `Guest` interface updated with `primaryGuestId?: string`, `photoUrl?: string`, and `confirmedAt: string`
- [x] Strictly typed with no `any` types
- [x] Build gate passes: `npm run build`

**Tests**: none  
**Gate**: build  
**Commit**: `feat(guest): update Guest interface with verified fields`  

---

#### T2: Implement Atomic RSVP Cancellation in GuestService

**What**: Update `GuestService.cancelRsvp` to atomically delete the guest document and reset all claimed items for that UID using Firestore `writeBatch`.  
**Where**: `src/app/core/services/guest.service.ts`  
**Depends on**: T1  
**Reuses**: Firebase modular Firestore `writeBatch`  
**Requirement**: GEXP-05  

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `cancelRsvp` creates a `writeBatch` deleting the guest document and updating claimed items
- [x] Atomically commits the batch to prevent orphaned claimed items
- [x] Unit tests cover: single guest deletion, multi-item claim reset, and batch failure rollback handling
- [x] Quick gate passes: `npx ng test --watch=false`
- [x] Test count: at least 4 tests pass

**Tests**: unit  
**Gate**: quick  
**Commit**: `feat(guest): implement atomic guest cancellation and item release in GuestService`  

---

### Phase 2: UI Presentation Components

#### T3: Refactor PixCardComponent for Dynamic Split

**What**: Update presentational `PixCardComponent` to accept `estimatedBudget` and `guestCount` inputs and compute `suggestedSplit`.  
**Where**: `src/app/features/event-detail/components/pix-card/pix-card.component.ts`  
**Depends on**: None  
**Reuses**: Angular Signals `computed()`, BEM styles, CSS variables (`--org-primary-color`)  
**Requirement**: GEXP-08  

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `estimatedBudget` input and `guestCount` input added as Signal inputs
- [ ] `suggestedSplit` computed signal correctly calculates `budget / count` (or null if budget is empty or count is 0)
- [ ] Renders formatted currency "R$ XX,XX por pessoa" when suggested split is present
- [ ] Emits `copyPix` output when copy button is clicked
- [ ] Unit tests cover: split calculation with valid budget, null split when budget missing, and copy event emission
- [ ] Quick gate passes: `npx ng test --watch=false`
- [ ] Test count: at least 4 tests pass

**Tests**: unit  
**Gate**: quick  
**Commit**: `feat(guest): add dynamic budget split calculation to PixCardComponent`  

---

#### T4: Refactor RsvpCardComponent for 1-Touch Verification

**What**: Update presentational `RsvpCardComponent` to display 1-touch Google confirmation CTA and confirmed attendance state with cancellation action.  
**Where**: `src/app/features/event-detail/components/rsvp-card/rsvp-card.component.ts`  
**Depends on**: None  
**Reuses**: Modern Angular control flow `@if`, Angular Material button  
**Requirement**: GEXP-01, GEXP-02, GEXP-05  

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Standalone presentational component with `ChangeDetectionStrategy.OnPush`
- [ ] `isConfirmed`, `guestCount`, and `isLoading` inputs
- [ ] `confirmRsvp` and `cancelRsvp` outputs
- [ ] WCAG 2.1 AA accessible with appropriate button focus and aria attributes
- [ ] Unit tests cover: unconfirmed CTA rendering, confirmed badge rendering, output emissions on click
- [ ] Quick gate passes: `npx ng test --watch=false`
- [ ] Test count: at least 4 tests pass

**Tests**: unit  
**Gate**: quick  
**Commit**: `feat(guest): update RsvpCardComponent for verified 1-touch RSVP`  

---

### Phase 3: Container Integration

#### T5: Integrate 1-Touch RSVP and Split into EventDetailContainer

**What**: Wire verified Google RSVP flow, dynamic split inputs to `PixCardComponent`, and atomic cancellation into `event-detail.container.ts`.  
**Where**: `src/app/features/event-detail/event-detail.container.ts`  
**Depends on**: T2, T3, T4  
**Reuses**: `AuthService`, `GuestService`, `ConfettiService`  
**Requirement**: GEXP-01, GEXP-05, GEXP-08  

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Clicking RSVP initiates 1-touch Google sign-in if unauthenticated
- [ ] Confirmed RSVP triggers celebratory confetti via `ConfettiService`
- [ ] Passes `estimatedBudget` and `confirmedGuestCount` to `PixCardComponent`
- [ ] Invokes atomic `GuestService.cancelRsvp` on cancellation confirmation
- [ ] Unit tests cover: RSVP confirmation flow, split props binding, and cancellation invocation
- [ ] Quick gate passes: `npx ng test --watch=false`
- [ ] Test count: at least 4 tests pass

**Tests**: unit  
**Gate**: quick  
**Commit**: `feat(guest): wire verified RSVP and budget split into EventDetailContainer`  

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
| T1: Update Guest Interface Model | 1 interface model file | ✅ Granular |
| T2: Implement Atomic RSVP Cancellation in GuestService | 1 service class update + spec | ✅ Granular |
| T3: Refactor PixCardComponent for Dynamic Split | 1 presentational component + template + styles + spec | ✅ Granular |
| T4: Refactor RsvpCardComponent for 1-Touch Verification | 1 presentational component + template + styles + spec | ✅ Granular |
| T5: Integrate 1-Touch RSVP and Split into EventDetailContainer | 1 container class update + template + spec | ✅ Granular |

---

## Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
| ---- | ---------------------- | ------------- | ------ |
| T1 | None | None | ✅ Match |
| T2 | T1 | T1 → T2 | ✅ Match |
| T3 | None | None | ✅ Match |
| T4 | None | None | ✅ Match |
| T5 | T2 (Phase 1), T3, T4 (Phase 2) | Cross-phase backward deps | ✅ Match |

---

## Test Co-location Validation

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
| ---- | --------------------------- | --------------- | --------- | ------ |
| T1: Update Guest Interface Model | Model / Interface | none | none | ✅ OK |
| T2: Implement Atomic RSVP Cancellation in GuestService | Service | unit | unit | ✅ OK |
| T3: Refactor PixCardComponent for Dynamic Split | Dumb Component | unit | unit | ✅ OK |
| T4: Refactor RsvpCardComponent for 1-Touch Verification | Dumb Component | unit | unit | ✅ OK |
| T5: Integrate 1-Touch RSVP and Split into EventDetailContainer | Container Component | unit | unit | ✅ OK |
