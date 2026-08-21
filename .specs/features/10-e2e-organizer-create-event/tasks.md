# Feature 10 Tasks — E2E Happy-Path Atomic Tests & Visual Coverage

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Design**: `.specs/features/10-e2e-organizer-create-event/design.md`  
**Status**: Draft  

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec - confirm before Execute. Guidelines found: `AGENTS.md`, `GEMINI.md`, `DESIGN.md`, `.specs/STATE.md`.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Test Helpers / Invariant Utilities | none | - (build gate only) | `e2e/helpers/*.ts` | `npm run build` |
| E2E Spec Suites | e2e | All 29 ACs in scope: atomic setup + user interaction + design invariants + screenshot capture | `e2e/specs/13-organizer-happy-path.spec.ts` | `npm run test:e2e` |

## Gate Check Commands

> Generated from codebase - confirm before Execute.

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | After test helper and utility tasks | `npm run build` |
| Full | After E2E spec implementation tasks | `npx playwright test e2e/specs/13-organizer-happy-path.spec.ts` |
| Build | After phase completion or suite integration | `npm run build && npm run test:e2e` |

---

## Execution Plan

Phases are ordered and run sequentially - each phase completes before the next begins, and tasks within a phase execute in order.

### Phase 1: Test Invariants & Assertion Helpers

Foundational helper module providing reusable assertions for Glassmorphism backdrop-filter blur, minimum touch targets (>= 48px), typography font-family (Plus Jakarta Sans), and focused input theme borders.

```
T1
```

### Phase 2: Organizer Dashboard & Event Creation Journey

Atomic tests covering the organizer dashboard, Step 1 (Informações), Step 2 (Endereço & ViaCEP mock), Step 3 (Pix & Wishlist management), event submission with snackbar redirect, and editing existing events.

```
T2 → T3 → T4 → T5 → T6 → T7
```

### Phase 3: Guest RSVP Journey

Atomic tests covering public event details, countdown timer, minimum touch targets on RSVP CTA, glassmorphic modal dialog, and 1-touch verified RSVP submission.

```
T8 → T9 → T10
```

### Phase 4: User Profile, Family Roster & Collaboration Journey

Atomic tests covering profile page rendering, typography and glassmorphism, display name update, family roster add/remove members, and collaborator email invitation modal.

```
T11 → T12 → T13 → T14 → T15
```

---

## Task Breakdown

### Phase 1: Test Invariants & Assertion Helpers

#### T1: Implement Design Token & Invariant Assertion Helpers

**What**: Create reusable Playwright assertion helpers for Glassmorphism backdrop blur, >= 48px touch targets, typography font-family, and theme focus outline/border colors.  
**Where**: `e2e/helpers/design-tokens.helper.ts`  
**Depends on**: None  
**Reuses**: `@playwright/test` `Locator`, `expect`  
**Requirement**: E2E-02, E2E-15, E2E-17, E2E-19, E2E-22, E2E-23, E2E-26  

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Helpers exported: `assertGlassmorphism(locator)`, `assertMinTouchTarget(locator, minSize?)`, `assertFontFamily(locator, expectedFont?)`, `assertFocusPrimaryColor(locator)`
- [x] `assertGlassmorphism` reads `backdropFilter` / `webkitBackdropFilter` via `locator.evaluate` and checks for `blur`
- [x] `assertMinTouchTarget` reads `locator.boundingBox()` and asserts `height >= 48`
- [x] `assertFontFamily` reads `getComputedStyle(el).fontFamily` and asserts inclusion of `Plus Jakarta Sans`
- [x] `assertFocusPrimaryColor` focuses element and inspects computed border/outline/boxShadow
- [x] Gate check passes: `npm run build`

**Tests**: none  
**Gate**: quick  
**Commit**: `feat(e2e): implement design token and invariant assertion helpers`  

---

### Phase 2: Organizer Dashboard & Event Creation Journey

#### T2: Implement Organizer Dashboard Atomic Tests

**What**: Implement atomic tests for organizer dashboard rendering, filter chips, >= 48px "Novo Evento" button, and event card glassmorphism.  
**Where**: `e2e/specs/13-organizer-happy-path.spec.ts`  
**Depends on**: T1  
**Reuses**: `e2e/fixtures/test.fixture.ts`, `OrganizerDashboardPage`, `e2e/helpers/design-tokens.helper.ts`  
**Requirement**: E2E-01, E2E-02  

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `[E2E-01]` asserts dashboard renders with filter chips, event card, enabled "Novo Evento" button with height >= 48px, and saves screenshot `13-01-dashboard-desktop.png`
- [x] `[E2E-02]` asserts event cards have computed `backdrop-filter` containing `blur`
- [x] Gate check passes: `npx playwright test e2e/specs/13-organizer-happy-path.spec.ts -g "\[E2E-0[12]\]"`

**Tests**: e2e  
**Gate**: full  
**Commit**: `test(e2e): implement organizer dashboard atomic tests and baseline`  

---

#### T3: Implement Create Event Step 1 (Informações) Atomic Tests

**What**: Implement atomic tests for Step 1 empty state with disabled "Próximo" button, and filled basic info enabling the "Próximo" button.  
**Where**: `e2e/specs/13-organizer-happy-path.spec.ts`  
**Depends on**: T2  
**Reuses**: `EventEditorPage`, `setupMockAuthSession`  
**Requirement**: E2E-03, E2E-04  

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `[E2E-03]` navigates to `/meus-eventos/evento/novo`, asserts Step 1 empty inputs and disabled "Próximo" button, and saves screenshot `13-02-step1-empty-desktop.png`
- [x] `[E2E-04]` fills title, category chip, description, date, time, asserts "Próximo" button becomes enabled, and saves screenshot `13-03-step1-filled-desktop.png`
- [x] Gate check passes: `npx playwright test e2e/specs/13-organizer-happy-path.spec.ts -g "\[E2E-0[34]\]"`

**Tests**: e2e  
**Gate**: full  
**Commit**: `test(e2e): implement create event step 1 atomic tests and baseline`  

---

#### T4: Implement Create Event Step 2 (Endereço / ViaCEP) Atomic Tests

**What**: Implement atomic tests for Step 2 address fields with disabled "Próximo" button before CEP, and 8-digit CEP entry auto-populating fields via ViaCEP mock.  
**Where**: `e2e/specs/13-organizer-happy-path.spec.ts`  
**Depends on**: T3  
**Reuses**: `EventEditorPage`, `setupMockAuthSession`  
**Requirement**: E2E-05, E2E-06  

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `[E2E-05]` fills Step 1 in beforeEach, advances to Step 2, asserts address fields render with disabled "Próximo" button before CEP, and saves screenshot `13-04-step2-empty-desktop.png`
- [x] `[E2E-06]` intercepts ViaCEP endpoint, types valid 8-digit CEP `01310-100`, asserts auto-populated street/neighborhood/city/state, asserts "Próximo" button enables, and saves screenshot `13-05-step2-viacep-desktop.png`
- [x] Gate check passes: `npx playwright test e2e/specs/13-organizer-happy-path.spec.ts -g "\[E2E-0[56]\]"`

**Tests**: e2e  
**Gate**: full  
**Commit**: `test(e2e): implement create event step 2 viacep atomic tests`  

---

#### T5: Implement Create Event Step 3 (Pix & Wishlist) Atomic Tests

**What**: Implement atomic tests for Step 3 Pix key, wishlist item addition, multi-item listing, and item removal.  
**Where**: `e2e/specs/13-organizer-happy-path.spec.ts`  
**Depends on**: T4  
**Reuses**: `EventEditorPage`, `setupMockAuthSession`  
**Requirement**: E2E-07, E2E-08, E2E-09, E2E-10  

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `[E2E-07]` advances to Step 3, asserts Pix key input, wishlist name and quantity inputs, and saves screenshot `13-06-step3-pix-empty-desktop.png`
- [x] `[E2E-08]` adds first wishlist item and asserts it is visible in the wishlist list
- [x] `[E2E-09]` adds a second wishlist item and asserts both items are simultaneously visible, saving screenshot `13-07-step3-wishlist-items-desktop.png`
- [x] `[E2E-10]` removes one wishlist item and asserts remaining item is still visible
- [x] Gate check passes: `npx playwright test e2e/specs/13-organizer-happy-path.spec.ts -g "\[E2E-0[789]|E2E-10\]"`

**Tests**: e2e  
**Gate**: full  
**Commit**: `test(e2e): implement create event step 3 wishlist atomic tests`  

---

#### T6: Implement Create Event Submit & Confirmation Atomic Test

**What**: Implement atomic test for completed 3-step event submission, verifying Firestore write interception, success snackbar, and redirect.  
**Where**: `e2e/specs/13-organizer-happy-path.spec.ts`  
**Depends on**: T5  
**Reuses**: `EventEditorPage`, `setupMockAuthSession`  
**Requirement**: E2E-11  

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `[E2E-11]` advances through Steps 1, 2, and 3, clicks "Salvar", asserts success snackbar appears, asserts navigation occurs, and saves screenshot `13-08-event-created-snackbar-desktop.png`
- [x] Gate check passes: `npx playwright test e2e/specs/13-organizer-happy-path.spec.ts -g "\[E2E-11\]"`

**Tests**: e2e  
**Gate**: full  
**Commit**: `test(e2e): implement create event submit and confirmation atomic test`  

---

#### T7: Implement Edit Existing Event Flow Atomic Tests

**What**: Implement atomic tests for existing event editor pre-population, title mutation and save, validation on cleared title, and focused title border color token.  
**Where**: `e2e/specs/13-organizer-happy-path.spec.ts`  
**Depends on**: T6  
**Reuses**: `EventEditorPage`, `setupMockAuthSession`, `assertFocusPrimaryColor`  
**Requirement**: E2E-12, E2E-13, E2E-14, E2E-15  

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `[E2E-12]` navigates to existing event editor, asserts pre-populated title/date/description, and saves screenshot `13-09-event-edit-prepopulated-desktop.png`
- [x] `[E2E-13]` modifies title, clicks "Salvar", asserts success snackbar display
- [x] `[E2E-14]` clears title input, asserts "Título é obrigatório" validation error, and asserts save button is disabled
- [x] `[E2E-15]` focuses title input and asserts focused border/outline color matches `--org-primary` theme token
- [x] Gate check passes: `npx playwright test e2e/specs/13-organizer-happy-path.spec.ts -g "\[E2E-1[2345]\]"`

**Tests**: e2e  
**Gate**: full  
**Commit**: `test(e2e): implement edit existing event atomic tests`  

---

### Phase 3: Guest RSVP Journey

#### T8: Implement Guest RSVP Detail & Button Size Atomic Tests

**What**: Implement atomic tests for public event details view, header `<h1>`, countdown timer, location, and >= 48px RSVP CTA button.  
**Where**: `e2e/specs/13-organizer-happy-path.spec.ts`  
**Depends on**: T1  
**Reuses**: `EventDetailPage`, `assertMinTouchTarget`  
**Requirement**: E2E-16, E2E-17  

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `[E2E-16]` navigates to `/evento/:id`, asserts event title in `<h1>`, countdown timer, location, and saves screenshot `13-10-event-detail-desktop.png`
- [x] `[E2E-17]` asserts RSVP button bounding box height is >= 48px
- [x] Gate check passes: `npx playwright test e2e/specs/13-organizer-happy-path.spec.ts -g "\[E2E-1[67]\]"`

**Tests**: e2e  
**Gate**: full  
**Commit**: `test(e2e): implement guest rsvp detail and touch target atomic tests`  

---

#### T9: Implement Guest RSVP Dialog Open & Glassmorphism Atomic Tests

**What**: Implement atomic tests for opening RSVP modal dialog, verifying form controls (name, phone, confirm, cancel), and asserting dialog surface backdrop-filter blur.  
**Where**: `e2e/specs/13-organizer-happy-path.spec.ts`  
**Depends on**: T8  
**Reuses**: `EventDetailPage`, `RsvpDialogHarness`, `assertGlassmorphism`  
**Requirement**: E2E-18, E2E-19  

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `[E2E-18]` clicks RSVP button, asserts dialog opens with name, phone, confirm and cancel buttons, and saves screenshot `13-11-rsvp-dialog-open-desktop.png`
- [x] `[E2E-19]` asserts RSVP dialog surface has computed `backdrop-filter` containing `blur`
- [x] Gate check passes: `npx playwright test e2e/specs/13-organizer-happy-path.spec.ts -g "\[E2E-1[89]\]"`

**Tests**: e2e  
**Gate**: full  
**Commit**: `test(e2e): implement guest rsvp dialog open and glassmorphism tests`  

---

#### T10: Implement Guest RSVP Submission & Confirmation Atomic Test

**What**: Implement atomic test for submitting RSVP form, verifying Firestore write interception and success confirmation state.  
**Where**: `e2e/specs/13-organizer-happy-path.spec.ts`  
**Depends on**: T9  
**Reuses**: `EventDetailPage`, `RsvpDialogHarness`  
**Requirement**: E2E-20  

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `[E2E-20]` opens RSVP dialog, fills name and phone, clicks "Confirmar", asserts success snackbar or confirmation feedback, and saves screenshot `13-12-rsvp-confirmed-desktop.png`
- [ ] Gate check passes: `npx playwright test e2e/specs/13-organizer-happy-path.spec.ts -g "\[E2E-20\]"`

**Tests**: e2e  
**Gate**: full  
**Commit**: `test(e2e): implement guest rsvp submission and confirmation atomic test`  

---

### Phase 4: User Profile, Family Roster & Collaboration Journey

#### T11: Implement User Profile Page & Typography Atomic Tests

**What**: Implement atomic tests for `/perfil` rendering, "Meu Perfil" heading, profile info card, family roster section, glassmorphic card backdrop blur, and Plus Jakarta Sans font-family.  
**Where**: `e2e/specs/13-organizer-happy-path.spec.ts`  
**Depends on**: T1  
**Reuses**: `ProfilePage`, `setupMockAuthSession`, `assertGlassmorphism`, `assertFontFamily`  
**Requirement**: E2E-21, E2E-22, E2E-23  

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `[E2E-21]` navigates to `/perfil`, asserts "Meu Perfil" heading, profile card, family roster header, and saves screenshot `13-13-profile-page-desktop.png`
- [ ] `[E2E-22]` asserts profile info card computed `backdrop-filter` contains `blur`
- [ ] `[E2E-23]` asserts profile page heading computed `font-family` contains `Plus Jakarta Sans`
- [ ] Gate check passes: `npx playwright test e2e/specs/13-organizer-happy-path.spec.ts -g "\[E2E-2[123]\]"`

**Tests**: e2e  
**Gate**: full  
**Commit**: `test(e2e): implement profile page, glassmorphism, and typography atomic tests`  

---

#### T12: Implement User Profile Update Name Atomic Test

**What**: Implement atomic test for editing and saving user display name on `/perfil`.  
**Where**: `e2e/specs/13-organizer-happy-path.spec.ts`  
**Depends on**: T11  
**Reuses**: `ProfilePage`, `setupMockAuthSession`  
**Requirement**: E2E-24  

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `[E2E-24]` clicks "Editar", updates display name, clicks "Salvar", asserts updated name displays in card, and saves screenshot `13-14-profile-name-updated-desktop.png`
- [ ] Gate check passes: `npx playwright test e2e/specs/13-organizer-happy-path.spec.ts -g "\[E2E-24\]"`

**Tests**: e2e  
**Gate**: full  
**Commit**: `test(e2e): implement user profile name update atomic test`  

---

#### T13: Implement Family Roster Add Member & Button Size Atomic Tests

**What**: Implement atomic tests for adding a family member to the roster on `/perfil` and asserting >= 48px button height.  
**Where**: `e2e/specs/13-organizer-happy-path.spec.ts`  
**Depends on**: T12  
**Reuses**: `ProfilePage`, `FamilyRosterHarness`, `assertMinTouchTarget`  
**Requirement**: E2E-25, E2E-26  

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `[E2E-25]` fills member name and relationship, clicks "Adicionar", asserts new member appears in roster list, and saves screenshot `13-15-family-roster-added-desktop.png`
- [ ] `[E2E-26]` asserts "Adicionar membro" button bounding box height is >= 48px
- [ ] Gate check passes: `npx playwright test e2e/specs/13-organizer-happy-path.spec.ts -g "\[E2E-2[56]\]"`

**Tests**: e2e  
**Gate**: full  
**Commit**: `test(e2e): implement family roster add member and touch target atomic tests`  

---

#### T14: Implement Family Roster Remove Member Atomic Test

**What**: Implement atomic test for removing a family member from the roster and asserting remaining members stay visible.  
**Where**: `e2e/specs/13-organizer-happy-path.spec.ts`  
**Depends on**: T13  
**Reuses**: `ProfilePage`, `FamilyRosterHarness`, `setupMockAuthSession`  
**Requirement**: E2E-27  

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `[E2E-27]` seeds profile with initial family members, clicks remove on one member, asserts member is removed, asserts remaining member remains, and saves screenshot `13-16-family-roster-removed-desktop.png`
- [ ] Gate check passes: `npx playwright test e2e/specs/13-organizer-happy-path.spec.ts -g "\[E2E-27\]"`

**Tests**: e2e  
**Gate**: full  
**Commit**: `test(e2e): implement family roster remove member atomic test`  

---

#### T15: Implement Collaborator Invite Dialog & Submit Atomic Tests

**What**: Implement atomic tests for opening collaborator invite dialog, asserting non-default styled border, and submitting email invite with snackbar confirmation.  
**Where**: `e2e/specs/13-organizer-happy-path.spec.ts`  
**Depends on**: T14  
**Reuses**: `EventEditorPage`, `SharePanelHarness`, `setupMockAuthSession`  
**Requirement**: E2E-28, E2E-29  

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `[E2E-28]` opens collaborator dialog, asserts email input and styled border, and saves screenshot `13-17-collaborator-dialog-desktop.png`
- [ ] `[E2E-29]` fills email, clicks "Enviar", asserts success snackbar appears
- [ ] Gate check passes: `npx playwright test e2e/specs/13-organizer-happy-path.spec.ts -g "\[E2E-2[89]\]"`

**Tests**: e2e  
**Gate**: full  
**Commit**: `test(e2e): implement collaborator invite dialog and submission atomic tests`  

---

## Phase Execution Map

Visual representation of task ordering. Phases run in sequence, and tasks within a phase run in order:

```
Phase 1 → Phase 2 → Phase 3 → Phase 4

Phase 1:  T1
Phase 2:  T2 ------→ T3 ------→ T4 ------→ T5 ------→ T6 ------→ T7
Phase 3:  T8 ------→ T9 ------→ T10
Phase 4:  T11 -----→ T12 -----→ T13 -----→ T14 -----→ T15
```

---

## Task Granularity Check

| Task | Scope | Status |
| ---- | ----- | ------ |
| T1: Implement Design Token & Invariant Assertion Helpers | 1 helper module (`design-tokens.helper.ts`) | ✅ Granular |
| T2: Implement Organizer Dashboard Atomic Tests | 2 atomic tests (`[E2E-01]`, `[E2E-02]`) | ✅ Granular |
| T3: Implement Create Event Step 1 Atomic Tests | 2 atomic tests (`[E2E-03]`, `[E2E-04]`) | ✅ Granular |
| T4: Implement Create Event Step 2 Atomic Tests | 2 atomic tests (`[E2E-05]`, `[E2E-06]`) | ✅ Granular |
| T5: Implement Create Event Step 3 Atomic Tests | 4 atomic tests (`[E2E-07]`-`[E2E-10]`) | ✅ Granular |
| T6: Implement Create Event Submit Atomic Test | 1 atomic test (`[E2E-11]`) | ✅ Granular |
| T7: Implement Edit Existing Event Atomic Tests | 4 atomic tests (`[E2E-12]`-`[E2E-15]`) | ✅ Granular |
| T8: Implement Guest RSVP Detail & Button Size Tests | 2 atomic tests (`[E2E-16]`, `[E2E-17]`) | ✅ Granular |
| T9: Implement Guest RSVP Dialog Open Tests | 2 atomic tests (`[E2E-18]`, `[E2E-19]`) | ✅ Granular |
| T10: Implement Guest RSVP Submission Test | 1 atomic test (`[E2E-20]`) | ✅ Granular |
| T11: Implement Profile Page & Typography Tests | 3 atomic tests (`[E2E-21]`-`[E2E-23]`) | ✅ Granular |
| T12: Implement Profile Update Name Test | 1 atomic test (`[E2E-24]`) | ✅ Granular |
| T13: Implement Family Roster Add Member Tests | 2 atomic tests (`[E2E-25]`, `[E2E-26]`) | ✅ Granular |
| T14: Implement Family Roster Remove Member Test | 1 atomic test (`[E2E-27]`) | ✅ Granular |
| T15: Implement Collaborator Invite Dialog Tests | 2 atomic tests (`[E2E-28]`, `[E2E-29]`) | ✅ Granular |

---

## Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
| ---- | ---------------------- | ------------- | ------ |
| T1 | None | None | ✅ Match |
| T2 | T1 (cross-phase: Phase 1) | None (Phase 2 head) | ✅ Match |
| T3 | T2 | T2 -> T3 | ✅ Match |
| T4 | T3 | T3 -> T4 | ✅ Match |
| T5 | T4 | T4 -> T5 | ✅ Match |
| T6 | T5 | T5 -> T6 | ✅ Match |
| T7 | T6 | T6 -> T7 | ✅ Match |
| T8 | T1 (cross-phase: Phase 1) | None (Phase 3 head) | ✅ Match |
| T9 | T8 | T8 -> T9 | ✅ Match |
| T10 | T9 | T9 -> T10 | ✅ Match |
| T11 | T1 (cross-phase: Phase 1) | None (Phase 4 head) | ✅ Match |
| T12 | T11 | T11 -> T12 | ✅ Match |
| T13 | T12 | T12 -> T13 | ✅ Match |
| T14 | T13 | T13 -> T14 | ✅ Match |
| T15 | T14 | T14 -> T15 | ✅ Match |

---

## Test Co-location Validation

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
| ---- | --------------------------- | --------------- | --------- | ------ |
| T1: Implement Assertion Helpers | Test Helpers / Invariant Utilities | none | none | ✅ OK |
| T2: Organizer Dashboard Tests | E2E Spec Suites | e2e | e2e | ✅ OK |
| T3: Create Event Step 1 Tests | E2E Spec Suites | e2e | e2e | ✅ OK |
| T4: Create Event Step 2 Tests | E2E Spec Suites | e2e | e2e | ✅ OK |
| T5: Create Event Step 3 Tests | E2E Spec Suites | e2e | e2e | ✅ OK |
| T6: Create Event Submit Test | E2E Spec Suites | e2e | e2e | ✅ OK |
| T7: Edit Existing Event Tests | E2E Spec Suites | e2e | e2e | ✅ OK |
| T8: Guest RSVP Detail Tests | E2E Spec Suites | e2e | e2e | ✅ OK |
| T9: Guest RSVP Dialog Tests | E2E Spec Suites | e2e | e2e | ✅ OK |
| T10: Guest RSVP Submit Test | E2E Spec Suites | e2e | e2e | ✅ OK |
| T11: Profile Page Tests | E2E Spec Suites | e2e | e2e | ✅ OK |
| T12: Profile Update Name Test | E2E Spec Suites | e2e | e2e | ✅ OK |
| T13: Family Roster Add Tests | E2E Spec Suites | e2e | e2e | ✅ OK |
| T14: Family Roster Remove Test | E2E Spec Suites | e2e | e2e | ✅ OK |
| T15: Collaborator Invite Tests | E2E Spec Suites | e2e | e2e | ✅ OK |
