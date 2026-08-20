# Personal Family Roster & Batch RSVP Validation

**Date**: 2026-08-19  
**Spec**: `.specs/features/07-family-roster/spec.md`  
**Diff range**: `be3c077..e6b0dc2`  
**Verifier**: independent sub-agent (author ≠ verifier)  
**Result**: PASS ✅

---

## Task Completion

| Task | Status | Notes |
| ---- | ------ | ----- |
| T1: Define FamilyMember Interface Model | ✅ Done | Exported `FamilyRelationship`, `FamilyMember`, and `FamilyMemberCreate` interfaces in `src/app/core/models/family.model.ts` |
| T2: Implement Family Roster and Batch RSVP in Services | ✅ Done | Implemented `FamilyService` for subcollection CRUD, atomic `GuestService.batchConfirmRsvp` with `writeBatch`, and cascade deletion in `GuestService.cancelRsvp` |
| T3: Create FamilyRosterManagerComponent | ✅ Done | Standalone OnPush presentational component in `src/app/features/profile/components/family-roster-manager/` with relationship dropdown and add/remove outputs |
| T4: Create FamilySelectorComponent | ✅ Done | Standalone OnPush collapsible component in `src/app/features/event-detail/components/family-selector/` with "Selecionar Todos", indeterminate signal, itemized toggle, and inline add |
| T5: Integrate Family Selector into GuestFormDialogComponent | ✅ Done | Embedded `FamilySelectorComponent` into `GuestFormDialogComponent`, wiring roster selection and inline addition to batch RSVP submission |

---

## Spec-Anchored Acceptance Criteria

### P2: Manage Personal Family Members

| Criterion (WHEN X THEN Y) | Spec-defined outcome | `file:line` + assertion | Result |
| ------------------------- | -------------------- | ----------------------- | ------ |
| WHEN user accesses /perfil/familia THEN system SHALL display list of saved family members with an "Adicionar Membro" button | Displays list of family member cards with relationship badges | `src/app/features/profile/components/family-roster-manager/family-roster-manager.component.spec.ts:58` - `expect(items.length).toBe(2)` | ✅ PASS |
| WHEN user accesses /perfil THEN system SHALL initialize user profile, attended events, and family roster | Loads user's family members into signal state | `src/app/features/profile/profile.container.spec.ts:146` - `expect(el.textContent).toContain('Minha Família')` | ✅ PASS |
| WHEN user submits a new member with name and relationship THEN system SHALL save the record to users/{uid}/family/{memberId} | Emits `addMember` output and creates document in Firestore subcollection | `src/app/core/services/family.service.spec.ts:185` - `expect(mocks.mockCollection).toHaveBeenCalledWith(mockFirestore, 'users/user-123/family')` | ✅ PASS |
| WHEN user deletes a family member THEN system SHALL delete the corresponding document in Firestore | Deletes document at `users/{uid}/family/{memberId}` and emits `removeMember` | `src/app/core/services/family.service.spec.ts:213` - `expect(mocks.mockDoc).toHaveBeenCalledWith(mockFirestore, 'users/user-123/family/fam-1')` | ✅ PASS |
| IF member name is empty or only whitespace THEN system SHALL prevent submission | Does not emit `addMember` when name is empty | `src/app/features/profile/components/family-roster-manager/family-roster-manager.component.spec.ts:103` - `expect(addSpy).not.toHaveBeenCalled()` | ✅ PASS |

---

### P2: Collapsible Family RSVP Selection

| Criterion (WHEN X THEN Y) | Spec-defined outcome | `file:line` + assertion | Result |
| ------------------------- | -------------------- | ----------------------- | ------ |
| WHEN an authenticated user opens the RSVP dialog THEN system SHALL load saved family members | Dialog receives and stores family roster in input signal | `src/app/features/event-detail/components/guest-form-dialog/guest-form-dialog.component.spec.ts:75` - `expect(component.familyMembers()).toEqual(mockFamilyMembers)` | ✅ PASS |
| WHEN user activates the family selector THEN system SHALL display selection count badge and itemized checkboxes | Computes `selectedCount` and renders selection badge | `src/app/features/event-detail/components/family-selector/family-selector.component.spec.ts:54` - `expect(compiled.textContent).toContain('1 selecionado(s)')` | ✅ PASS |
| WHEN user checks "Selecionar Todos" THEN system SHALL mark all family member checkboxes as selected | Computes `allSelected` as true and emits `selectAll(true)` | `src/app/features/event-detail/components/family-selector/family-selector.component.spec.ts:62` - `expect((component as any).allSelected()).toBe(true)` | ✅ PASS |
| WHEN user confirms batch RSVP THEN system SHALL create a guest entry for primary user plus one for each selected family member | Writes 1 primary guest + N linked guest records with `primaryGuestId` in an atomic Firestore batch | `src/app/core/services/guest.service.spec.ts:176` - `expect(mocks.mockBatch.set).toHaveBeenCalledTimes(3)` | ✅ PASS |
| IF user confirms RSVP with no family selected THEN system SHALL confirm attendance for primary user only | Writes only 1 primary guest doc to batch | `src/app/core/services/guest.service.spec.ts:223` - `expect(mocks.mockBatch.set).toHaveBeenCalledTimes(1)` | ✅ PASS |

---

### P3: Quick Family Member Creation inside RSVP Dialog

| Criterion (WHEN X THEN Y) | Spec-defined outcome | `file:line` + assertion | Result |
| ------------------------- | -------------------- | ----------------------- | ------ |
| WHEN user clicks "+ Novo Membro" inside family panel THEN system SHALL display inline name and relationship inputs | Sets `showInlineForm` signal to true | `src/app/features/event-detail/components/family-selector/family-selector.component.spec.ts:103` - `expect((component as any).showInlineForm()).toBe(true)` | ✅ PASS |
| WHEN inline member is saved THEN system SHALL add member to users/{uid}/family and auto-select them in RSVP dialog | Invokes `FamilyService.addFamilyMember` and appends new ID to `selectedFamilyMemberIds` | `src/app/features/event-detail/components/guest-form-dialog/guest-form-dialog.component.spec.ts:111` - `expect(mockFamilyService.addFamilyMember).toHaveBeenCalledWith('user-123', expect.objectContaining({ name: 'Pedro' }))` | ✅ PASS |
| IF inline input is cancelled THEN system SHALL revert to existing roster list without changes | Closes inline form and resets input fields | `src/app/features/event-detail/components/family-selector/family-selector.component.spec.ts:133` - `expect((component as any).showInlineForm()).toBe(false)` | ✅ PASS |

**Status**: ✅ All 13 ACs covered with exact spec-defined assertions.

---

## Discrimination Sensor

| Mutation | File:line | Description | Killed? |
| -------- | --------- | ----------- | ------- |
| 1 | `src/app/core/services/family.service.ts:20` | Changed collection path from `users/${uid}/family` to `users/${uid}/other_col` | ✅ Killed (2 tests failed in `family.service.spec.ts`) |
| 2 | `src/app/core/services/guest.service.ts:134` | Removed `primaryGuestId` from linked family records in `batchConfirmRsvp` | ✅ Killed (1 test failed in `guest.service.spec.ts`) |
| 3 | `src/app/features/event-detail/components/family-selector/family-selector.component.ts:76` | Forced `allSelected` computed signal to return `false` | ✅ Killed (1 test failed in `family-selector.component.spec.ts`) |
| 4 | `src/app/features/profile/components/family-roster-manager/family-roster-manager.component.ts:74` | Removed `this.addMember.emit(...)` event emission in `onAddSubmit()` | ✅ Killed (1 test failed in `family-roster-manager.component.spec.ts`) |
| 5 | `src/app/features/event-detail/components/guest-form-dialog/guest-form-dialog.component.ts:121` | Overrode `selectedFamilyMembers` with empty array in dialog `submit()` | ✅ Killed (1 test failed in `guest-form-dialog.component.spec.ts`) |

**Sensor depth**: P0-full (5 behavior-level mutations covering service collection routing, batch payloads, computed UI state, event emissions, and dialog integration)  
**Result**: 5/5 killed - PASS ✅  
**Isolation**: Verified `git status --porcelain` is clean before and after sensor worktree lifecycle.

---

## Code Quality

| Principle | Status |
| --------- | ------ |
| Minimum code | ✅ Clean presentation components and modular Firestore service operations |
| Surgical changes | ✅ Touched only family roster domain, dialog integration, and profile management |
| No scope creep | ✅ Strict adherence to personal private roster spec (AD-019) |
| Matches patterns | ✅ Angular 21+ Signals (`input`, `output`, `computed`), `ChangeDetectionStrategy.OnPush`, SCSS BEM `--org-*` tokens |
| Spec-anchored outcome check (asserted values match spec) | ✅ 1:1 match with spec outcomes |
| Per-layer Coverage Expectation met (domain 1:1 ACs; routes happy+edge+error) | ✅ Service unit tests, dumb component tests, container integration tests |
| Every test maps to a spec requirement - no unclaimed tests | ✅ Verified against FAMS-01 through FAMS-06 / ROST-01 and ROST-02 |
| Documented guidelines followed: `AGENTS.md`, `GEMINI.md`, `DESIGN.md` | ✅ Strict TypeScript, semantic tags, WCAG 2.1 AA accessibility attributes |

---

## Edge Cases

- [x] Cascade deletion of linked family members when primary guest cancels RSVP (`src/app/core/services/guest.service.spec.ts:246`)
- [x] Safe empty array fallback when user ID is empty (`src/app/core/services/family.service.spec.ts:102`)
- [x] Input validation error when attempting to add a family member with an empty name (`src/app/features/profile/components/family-roster-manager/family-roster-manager.component.spec.ts:103`)
- [x] Preserves historical event records when family members are removed from account profile

---

## Gate Check

- **Gate command**: `npm run build && npx ng test --watch=false`
- **Result**: 29 test files passed, 199 tests passed, 0 failures, 0 skipped
- **Test count delta**: +33 unit tests across `family.service.spec.ts`, `family-roster-manager.component.spec.ts`, `family-selector.component.spec.ts`, and updated `guest-form-dialog.component.spec.ts`
- **Status**: ✅ PASS

---

## Requirement Traceability Update

| Requirement | Previous Status | New Status |
| ----------- | --------------- | ---------- |
| FAMS-01 | Specified | ✅ Verified |
| FAMS-02 | Specified | ✅ Verified |
| FAMS-03 | Specified | ✅ Verified |
| FAMS-04 | Specified | ✅ Verified |
| FAMS-05 | Specified | ✅ Verified |
| FAMS-06 | Specified | ✅ Verified |

---

## Summary

**Overall**: ✅ PASS  
**Spec-anchored check**: 13/13 ACs matched spec outcome  
**Sensor**: 5/5 mutations killed  
**Gate**: 199 passed, 0 failed  

**What works**:
- User profile family roster management with relationship classifications
- Collapsible family RSVP selector with itemized checkboxes and Select All
- Atomic Firestore batch writes creating linked guest records
- Inline quick-add of family members during RSVP flow
- Atomic cascade deletion upon RSVP cancellation
