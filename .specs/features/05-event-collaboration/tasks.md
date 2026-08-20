# Event Collaboration & Scoped Feeds Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Design**: `.specs/features/05-event-collaboration/design.md`  
**Status**: Implemented  

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec - confirm before Execute. Guidelines found: `AGENTS.md`, `GEMINI.md`, `DESIGN.md`.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Model / Interface | none | - (build gate only) | `src/app/core/models/*.ts` | `npm run build` |
| Service | unit | All branches; 1:1 to spec ACs; scoped feeds merging, invitation creation, auto-claim writeBatch | `src/app/core/services/*.spec.ts` | `npx ng test --watch=false` |
| Dumb Component | unit | Input bindings, role badge rendering, dialog output emissions, accessibility | `src/app/features/**/*.component.spec.ts` | `npx ng test --watch=false` |
| Container Component | unit | Field disabled states for collaborators, owner vs collaborator action permissions | `src/app/features/**/*.container.spec.ts` | `npx ng test --watch=false` |

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

### Phase 1: Foundation (Invitation Models & Service Queries)

Invitation models, scoped queries, and auto-claim batch processing.

```
T1 → T2
```

### Phase 2: UI Presentation Components

Collaborator invitation modal and dashboard role badges.

```
T3
T4
```

### Phase 3: Container Integration

Scoped field locking for collaborators and auto-claim on user login.

```
T5
```

---

## Task Breakdown

### Phase 1: Foundation (Invitation Models & Service Queries)

#### T1: Define EventInvitation Interface Model

**What**: Define `EventInvitation` data model interface for tracking pending collaborator email invites.  
**Where**: `src/app/core/models/invitation.model.ts`  
**Depends on**: None  
**Reuses**: Standard ISO timestamp and ID formats  
**Requirement**: COLLAB-01  

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `EventInvitation` interface exported with `id`, `eventId`, `eventTitle`, `invitedEmail`, `invitedBy`, and `createdAt`
- [x] Strictly typed with no `any` types
- [x] Build gate passes: `npm run build`

**Tests**: none  
**Gate**: build  
**Commit**: `feat(collab): define EventInvitation interface model`  

---

#### T2: Implement Collaborator Queries and Auto-Claim in EventService

**What**: Add `getUserEvents`, `inviteCollaborator`, and `claimPendingInvitations` using Firestore `writeBatch` in `EventService`.  
**Where**: `src/app/core/services/event.service.ts`  
**Depends on**: T1  
**Reuses**: Firestore modular SDK (`where`, `writeBatch`)  
**Requirement**: COLLAB-01, COLLAB-02  

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `getUserEvents` returns combined stream of created and collaborated events
- [x] `inviteCollaborator` creates subcollection document in `events/{id}/invitations/{email}`
- [x] `claimPendingInvitations` queries pending invitations by email and adds user UID to `collaborators`
- [x] Unit tests cover: scoped query merging, invitation creation, and auto-claim batch commit
- [x] Quick gate passes: `npx ng test --watch=false`
- [x] Test count: at least 4 tests pass

**Tests**: unit  
**Gate**: quick  
**Commit**: `feat(collab): implement scoped feeds and auto-claim in EventService`  

---

### Phase 2: UI Presentation Components

#### T3: Create CollaboratorInviteDialogComponent

**What**: Create presentational `CollaboratorInviteDialogComponent` for inviting collaborators by email and listing active/pending collaborators.  
**Where**: `src/app/features/organizer/event-editor/components/collaborator-invite-dialog/collaborator-invite-dialog.component.ts`  
**Depends on**: None  
**Reuses**: Angular Material `MatDialog`, `MatChips`, BEM styles  
**Requirement**: COLLAB-01  

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Standalone presentational component with `ChangeDetectionStrategy.OnPush`
- [x] `collaborators` input, `pendingInvites` input, `invite` output, and `removeCollaborator` output
- [x] Validates email format before emitting invite
- [x] WCAG 2.1 AA accessible with focus trap and keyboard navigation
- [x] Separate `.html`, `.scss`, and `.spec.ts` files
- [x] Unit tests cover: email validation, chip list rendering, output emissions
- [x] Quick gate passes: `npx ng test --watch=false`
- [x] Test count: at least 4 tests pass

**Tests**: unit  
**Gate**: quick  
**Commit**: `feat(collab): create CollaboratorInviteDialogComponent`  

---

#### T4: Add Role Badges to EventCardComponent

**What**: Update presentational `EventCardComponent` to accept user role (`Organizador` vs `Colaborador`) and render distinct visual badges.  
**Where**: `src/app/features/organizer/dashboard/components/event-card/event-card.component.ts`  
**Depends on**: None  
**Reuses**: CSS Custom Properties (`--org-primary-color`, `--org-accent-color`)  
**Requirement**: COLLAB-03  

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `isOwner = input<boolean>(true)` added to `EventCardComponent`
- [x] Displays "Organizador" badge when `isOwner` is true and "Colaborador" badge when false
- [x] Unit tests cover: correct badge rendering based on `isOwner` input
- [x] Quick gate passes: `npx ng test --watch=false`
- [x] Test count: at least 3 tests pass

**Tests**: unit  
**Gate**: quick  
**Commit**: `feat(collab): add role badges to EventCardComponent`  

---

### Phase 3: Container Integration

#### T5: Enforce Scoped Field Protection in EventEditorContainer

**What**: Update `EventEditorContainer` to compute `isOwner` signal and lock core event fields (title, date, location, Pix key, budget, delete button) for collaborators.  
**Where**: `src/app/features/admin/event-editor/event-editor.container.ts`  
**Depends on**: T2, T3, T4  
**Reuses**: Angular Signals `computed()`, `AuthService`  
**Requirement**: COLLAB-03, COLLAB-04  

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `isOwner` computed signal compares `event().createdBy` to `authService.currentUser().uid`
- [x] Disables core form inputs and hides delete button when `isOwner` is false
- [x] Allows collaborators to manage items and view guest lists
- [x] Unit tests cover: disabled inputs for collaborators, full access for owner
- [x] Quick gate passes: `npx ng test --watch=false`
- [x] Test count: at least 4 tests pass

**Tests**: unit  
**Gate**: quick  
**Commit**: `feat(collab): enforce owner vs collaborator field permissions in EventEditorContainer`  

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
| T1: Define EventInvitation Interface Model | 1 interface model file | ✅ Granular |
| T2: Implement Collaborator Queries and Auto-Claim in EventService | 1 service class update + spec | ✅ Granular |
| T3: Create CollaboratorInviteDialogComponent | 1 presentational dialog + template + styles + spec | ✅ Granular |
| T4: Add Role Badges to EventCardComponent | 1 presentational component update + template + styles + spec | ✅ Granular |
| T5: Enforce Scoped Field Protection in EventEditorContainer | 1 container class update + template + spec | ✅ Granular |

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
| T1: Define EventInvitation Interface Model | Model / Interface | none | none | ✅ OK |
| T2: Implement Collaborator Queries and Auto-Claim in EventService | Service | unit | unit | ✅ OK |
| T3: Create CollaboratorInviteDialogComponent | Dumb Component | unit | unit | ✅ OK |
| T4: Add Role Badges to EventCardComponent | Dumb Component | unit | unit | ✅ OK |
| T5: Enforce Scoped Field Protection in EventEditorContainer | Container Component | unit | unit | ✅ OK |
