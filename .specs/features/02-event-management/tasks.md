# Event Management & Automated Notifications Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Design**: `.specs/features/02-event-management/design.md`  
**Status**: Draft  

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec - confirm before Execute. Guidelines found: `AGENTS.md`, `GEMINI.md`, `DESIGN.md`.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Model / Interface | none | - (build gate only) | `src/app/core/models/*.ts` | `npm run build` |
| Service | unit | All branches; 1:1 to spec ACs; 7-day reminder, 1-day reminder, critical update alert, cancellation alert, deduplication | `src/app/core/services/*.spec.ts` | `npx ng test --watch=false` |
| Dumb Component | unit | Input bindings, filter count display, output filterChange emissions, accessibility rendering | `src/app/features/**/*.component.spec.ts` | `npx ng test --watch=false` |
| Container Component | unit | Signal state filtering, child component binding, notification dispatch invocation | `src/app/features/**/*.container.spec.ts` | `npx ng test --watch=false` |

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

### Phase 1: Foundation (Notification Models & Service)

Core notification models and multi-stage reminder logic.

```
T1 → T2
```

### Phase 2: Dashboard UI Components

Status filter chips and count badges for organizer dashboard.

```
T3
```

### Phase 3: Service & Dashboard Integration

Wiring notifications into event lifecycle and connecting filters to dashboard.

```
T4 → T5
```

---

## Task Breakdown

### Phase 1: Foundation (Notification Models & Service)

#### T1: Create EventNotificationRecord Model

**What**: Define the `EventNotificationRecord` interface for tracking dispatched notifications and reminder history.  
**Where**: `src/app/core/models/notification.model.ts`  
**Depends on**: None  
**Reuses**: Standard ISO timestamp definitions  
**Requirement**: EVMG-12, EVMG-16  

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `EventNotificationRecord` interface exported with `id`, `eventId`, `type`, `title`, `body`, `sentAt`, and `recipientCount` fields
- [x] Strictly typed with no `any` types
- [x] Build gate passes: `npm run build`

**Tests**: none  
**Gate**: build  
**Commit**: `feat(events): define EventNotificationRecord model interface`  

---

#### T2: Implement EventNotificationService

**What**: Create `EventNotificationService` to evaluate 7-day and 1-day reminders and dispatch critical change/cancellation alerts with localStorage deduplication.  
**Where**: `src/app/core/services/event-notification.service.ts`  
**Depends on**: T1  
**Reuses**: `NotificationService`, Angular Service Worker `SwPush`  
**Requirement**: EVMG-04, EVMG-10, EVMG-12, EVMG-16  

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `notifyGuestsOfEventChange` method dispatches alerts to confirmed attendees
- [x] `notifyGuestsOfCancellation` method dispatches cancellation alerts
- [x] `evaluateCountdownReminders` evaluates 7-day and 1-day (24h) countdowns
- [x] Implements localStorage deduplication keys (`reminder_sent_{eventId}_{type}`)
- [x] Unit tests cover: 7-day reminder calculation, 1-day reminder calculation, deduplication prevention, and change alert dispatch
- [x] Quick gate passes: `npx ng test --watch=false`
- [x] Test count: at least 5 tests pass

**Tests**: unit  
**Gate**: quick  
**Commit**: `feat(events): create EventNotificationService for multi-stage alerts`  

---

### Phase 2: Dashboard UI Components

#### T3: Create EventDashboardFiltersComponent

**What**: Create presentational `EventDashboardFiltersComponent` displaying segmented filter chips with counts for all, upcoming, past, and cancelled events.  
**Where**: `src/app/features/organizer/dashboard/components/event-filters/event-filters.component.ts`  
**Depends on**: None  
**Reuses**: BEM SCSS styling, CSS variables (`--org-primary-color`), Angular Material chips  
**Requirement**: EVMG-11  

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Standalone presentational component with `ChangeDetectionStrategy.OnPush`
- [ ] `activeFilter` required input, `filterCounts` input, and `filterChange` output
- [ ] Renders all 4 filter states (`all`, `upcoming`, `past`, `cancelled`) with count badges
- [ ] WCAG 2.1 AA accessible with keyboard navigation and ARIA selected states
- [ ] Separate `.html`, `.scss`, and `.spec.ts` files
- [ ] Unit tests cover: active filter highlight, count badge rendering, output emission on click
- [ ] Quick gate passes: `npx ng test --watch=false`
- [ ] Test count: at least 4 tests pass

**Tests**: unit  
**Gate**: quick  
**Commit**: `feat(events): create EventDashboardFiltersComponent for status filtering`  

---

### Phase 3: Service & Dashboard Integration

#### T4: Integrate Multi-Stage Notifications into EventService

**What**: Wire `EventNotificationService` alert triggers into `EventService.saveEvent` when critical fields (date, time, location) change and in `cancelEvent`.  
**Where**: `src/app/core/services/event.service.ts`  
**Depends on**: T2  
**Reuses**: `EventNotificationService` injection  
**Requirement**: EVMG-04, EVMG-10  

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `saveEvent` detects changes to date, time, or address and invokes `notifyGuestsOfEventChange`
- [ ] `cancelEvent` invokes `notifyGuestsOfCancellation`
- [ ] Unit tests cover: change detection trigger, cancellation notification trigger, error handling
- [ ] Quick gate passes: `npx ng test --watch=false`
- [ ] Test count: at least 3 tests pass

**Tests**: unit  
**Gate**: quick  
**Commit**: `feat(events): wire change and cancellation alerts into EventService`  

---

#### T5: Integrate Filters and Reminders into Dashboard Container

**What**: Connect `EventDashboardFiltersComponent` reactive filtering to `dashboard.container.ts` and evaluate reminders on dashboard load.  
**Where**: `src/app/features/admin/dashboard/dashboard.container.ts`  
**Depends on**: T3, T4  
**Reuses**: Angular Signals (`computed`, `signal`), `EventNotificationService`  
**Requirement**: EVMG-11, EVMG-12, EVMG-16  

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Dashboard container provides filtered events computed signal based on `activeFilter`
- [ ] Computes counts for all, upcoming, past, and cancelled categories
- [ ] Invokes `evaluateCountdownReminders` on event list load
- [ ] Unit tests cover: filter switching updates visible events, reminder check triggered on load
- [ ] Quick gate passes: `npx ng test --watch=false`
- [ ] Test count: at least 3 tests pass

**Tests**: unit  
**Gate**: quick  
**Commit**: `feat(events): integrate status filters and reminder checks into dashboard container`  

---

## Phase Execution Map

```
Phase 1 → Phase 2 → Phase 3

Phase 1:  T1 ──────→ T2
Phase 2:  T3
Phase 3:  T4 ──────→ T5
```

Execution is strictly sequential - there is no intra-phase parallelism. A single agent (or batch worker) works one task at a time, in order.

---

## Task Granularity Check

| Task | Scope | Status |
| ---- | ----- | ------ |
| T1: Create EventNotificationRecord Model | 1 interface model file | ✅ Granular |
| T2: Implement EventNotificationService | 1 service class + spec | ✅ Granular |
| T3: Create EventDashboardFiltersComponent | 1 presentational component + template + styles + spec | ✅ Granular |
| T4: Integrate Multi-Stage Notifications into EventService | 1 service class update + spec | ✅ Granular |
| T5: Integrate Filters and Reminders into Dashboard Container | 1 container class update + template + spec | ✅ Granular |

---

## Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
| ---- | ---------------------- | ------------- | ------ |
| T1 | None | None | ✅ Match |
| T2 | T1 | T1 → T2 | ✅ Match |
| T3 | None | None | ✅ Match |
| T4 | T2 (Phase 1) | Cross-phase backward dep | ✅ Match |
| T5 | T3 (Phase 2), T4 (Phase 3) | T4 → T5 (intra-phase) | ✅ Match |

---

## Test Co-location Validation

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
| ---- | --------------------------- | --------------- | --------- | ------ |
| T1: Create EventNotificationRecord Model | Model / Interface | none | none | ✅ OK |
| T2: Implement EventNotificationService | Service | unit | unit | ✅ OK |
| T3: Create EventDashboardFiltersComponent | Dumb Component | unit | unit | ✅ OK |
| T4: Integrate Multi-Stage Notifications into EventService | Service | unit | unit | ✅ OK |
| T5: Integrate Filters and Reminders into Dashboard Container | Container Component | unit | unit | ✅ OK |
