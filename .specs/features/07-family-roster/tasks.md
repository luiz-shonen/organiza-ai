# Personal Family Roster & Batch RSVP Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Design**: `.specs/features/07-family-roster/design.md`  
**Status**: Draft  

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec - confirm before Execute. Guidelines found: `AGENTS.md`, `GEMINI.md`, `DESIGN.md`.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Model / Interface | none | - (build gate only) | `src/app/core/models/*.ts` | `npm run build` |
| Service | unit | All branches; 1:1 to spec ACs; family member CRUD, batch RSVP with writeBatch, cascade cancellation | `src/app/core/services/*.spec.ts` | `npx ng test --watch=false` |
| Dumb Component | unit | Input bindings, select all toggle, itemized member toggle, inline addition output, accessibility | `src/app/features/**/*.component.spec.ts` | `npx ng test --watch=false` |
| Container / Dialog Component | unit | Family list loading, selection state, batch confirmation dispatch | `src/app/features/**/*.component.spec.ts` | `npx ng test --watch=false` |

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

### Phase 1: Foundation (Family Model & Service Methods)

Family data models and Firestore subcollection operations.

```
T1 → T2
```

### Phase 2: UI Presentation Components

Family roster manager for profile and collapsible selector for RSVP.

```
T3
T4
```

### Phase 3: RSVP Dialog Integration

Embedding family selection into the event RSVP flow and cascade cancellations.

```
T5
```

---

## Task Breakdown

### Phase 1: Foundation (Family Model & Service Methods)

#### T1: Define FamilyMember Interface Model

**What**: Define `FamilyMember` data model interface for personal family roster subcollections.  
**Where**: `src/app/core/models/family.model.ts`  
**Depends on**: None  
**Reuses**: Standard ISO timestamp definitions  
**Requirement**: ROST-01  

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `FamilyMember` interface exported with `id`, `name`, `relationship`, and `createdAt`
- [x] Strictly typed with no `any` types
- [x] Build gate passes: `npm run build`

**Tests**: none  
**Gate**: build  
**Commit**: `feat(family): define FamilyMember interface model`  

---

#### T2: Implement Family Roster and Batch RSVP in Services

**What**: Add family roster CRUD in `UserService` and `batchConfirmRsvp` with Firestore `writeBatch` in `GuestService`.  
**Where**: `src/app/core/services/family.service.ts`  
**Depends on**: T1  
**Reuses**: Firestore modular SDK (`collection`, `writeBatch`)  
**Requirement**: ROST-01, ROST-02  

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `getFamilyMembers`, `addFamilyMember`, and `deleteFamilyMember` operate on `users/{uid}/family`
- [x] `batchConfirmRsvp` creates 1 primary guest document and N linked family guest documents atomically
- [x] Unit tests cover: family CRUD, atomic batch write, cascade cancellation
- [x] Quick gate passes: `npx ng test --watch=false`
- [x] Test count: at least 4 tests pass

**Tests**: unit  
**Gate**: quick  
**Commit**: `feat(family): implement family roster CRUD and batch RSVP operations`  

---

### Phase 2: UI Presentation Components

#### T3: Create FamilyRosterManagerComponent

**What**: Create presentational `FamilyRosterManagerComponent` for managing family members on the profile page.  
**Where**: `src/app/features/profile/components/family-roster-manager/family-roster-manager.component.ts`  
**Depends on**: None  
**Reuses**: Angular Material `MatFormField`, `MatInput`, `MatSelect`, BEM SCSS  
**Requirement**: ROST-01  

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Standalone presentational component with `ChangeDetectionStrategy.OnPush`
- [x] `members` required input, `addMember` output, and `removeMember` output
- [x] Relationship dropdown with pre-defined categories
- [x] WCAG 2.1 AA accessible with labels and keyboard interactions
- [x] Separate `.html`, `.scss`, and `.spec.ts` files
- [x] Unit tests cover: member list display, add member submission, remove member trigger
- [x] Quick gate passes: `npx ng test --watch=false`
- [x] Test count: at least 4 tests pass

**Tests**: unit  
**Gate**: quick  
**Commit**: `feat(family): create FamilyRosterManagerComponent`  

---

#### T4: Create FamilySelectorComponent

**What**: Create presentational `FamilySelectorComponent` for collapsible selection and inline quick-add during event RSVP.  
**Where**: `src/app/features/event-detail/components/family-selector/family-selector.component.ts`  
**Depends on**: None  
**Reuses**: Angular Material `MatExpansionModule`, `MatCheckboxModule`, BEM SCSS  
**Requirement**: ROST-02  

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Standalone presentational component with `ChangeDetectionStrategy.OnPush`
- [x] `members` input, `selectedIds` input, `toggleMember` output, `selectAll` output, `addInlineMember` output
- [x] "Selecionar Todos" checkbox toggles all members
- [x] Inline text input to quickly add a member on the fly
- [x] WCAG 2.1 AA accessible with ARIA expansion and checkbox controls
- [x] Separate `.html`, `.scss`, and `.spec.ts` files
- [x] Unit tests cover: expansion toggle, select all emission, itemized checkbox toggle, inline add
- [x] Quick gate passes: `npx ng test --watch=false`
- [x] Test count: at least 4 tests pass

**Tests**: unit  
**Gate**: quick  
**Commit**: `feat(family): create FamilySelectorComponent for batch RSVP`  

---

### Phase 3: RSVP Dialog Integration

#### T5: Integrate Family Selector into GuestFormDialogComponent

**What**: Embed `FamilySelectorComponent` in `GuestFormDialogComponent` and execute batch confirmation.  
**Where**: `src/app/features/event-detail/components/guest-form-dialog/guest-form-dialog.component.ts`  
**Depends on**: T2, T3, T4  
**Reuses**: `FamilyService`, `GuestService`, Angular Material `MatDialog`  
**Requirement**: ROST-02  

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Loads user's family roster when authenticated
- [ ] Displays collapsible family selector panel
- [ ] Emits combined confirmation payload with primary guest and selected family members
- [ ] Unit tests cover: dialog initialization with family members, batch submission payload
- [x] Quick gate passes: `npx ng test --watch=false`
- [ ] Test count: at least 3 tests pass

**Tests**: unit  
**Gate**: quick  
**Commit**: `feat(family): integrate family selector into GuestFormDialogComponent`  

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
| T1: Define FamilyMember Interface Model | 1 interface model file | ✅ Granular |
| T2: Implement Family Roster and Batch RSVP in Services | 1 service class + spec | ✅ Granular |
| T3: Create FamilyRosterManagerComponent | 1 presentational component + template + styles + spec | ✅ Granular |
| T4: Create FamilySelectorComponent | 1 presentational component + template + styles + spec | ✅ Granular |
| T5: Integrate Family Selector into GuestFormDialogComponent | 1 dialog component update + template + spec | ✅ Granular |

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
| T1: Define FamilyMember Interface Model | Model / Interface | none | none | ✅ OK |
| T2: Implement Family Roster and Batch RSVP in Services | Service | unit | unit | ✅ OK |
| T3: Create FamilyRosterManagerComponent | Dumb Component | unit | unit | ✅ OK |
| T4: Create FamilySelectorComponent | Dumb Component | unit | unit | ✅ OK |
| T5: Integrate Family Selector into GuestFormDialogComponent | Container / Dialog Component | unit | unit | ✅ OK |
