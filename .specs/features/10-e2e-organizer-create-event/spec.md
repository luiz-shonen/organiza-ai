# E2E Happy-Path Atomic Tests & Visual Coverage Spec

## Problem Statement

The existing E2E suite (`09-playwright-e2e-coverage`, 88 tests) covers isolated component states
but has two systemic gaps:

1. **No happy-path coverage.** Tests verify validation and error states but never walk through
   the sequential states a real user navigates. The most critical gap: no test covers any step
   of the organizer "create event" flow end-to-end (Step 1, 2, or 3), nor guest RSVP submission,
   profile save, or family roster CRUD.

2. **No per-step screenshots.** Existing visual baselines (`07-visual-layout.spec.ts`) capture
   static views only. There are no screenshots for in-progress flow states — event editor Step 2
   or Step 3, open RSVP dialog, or post-save profile — making visual regressions in those states
   invisible to CI.

**Design principle for this feature:** each test is *atomic* — it sets up its own state
independently (via mock session + navigation), asserts exactly one flow step or screen state,
takes a screenshot, and ends. No test chains multiple steps. Step N's test navigates and fills
everything needed to reach step N independently, without relying on step N-1's test having run.
This makes every test runnable in isolation, failures pinpoint the exact step, and screenshots
are granular.

## Goals

- [ ] Deliver atomic tests for every step of every major happy-path flow:
  organizer dashboard, event editor (Steps 1, 2, 3, submit), event edit, guest RSVP (event
  detail, dialog open, RSVP submitted), profile update, family roster (add, remove), and
  collaborator invite.
- [ ] Each test ends with a full-page screenshot baseline so visual regressions in any step are
  detectable.
- [ ] On each test, assert the key design-system invariants relevant to that step: Glassmorphism
  `backdrop-filter`, `--org-*` color tokens, ≥ 48 px touch targets, Plus Jakarta Sans font.

## Out of Scope

| Feature | Reason |
| --- | --- |
| Real Firestore writes | Tests use deterministic mocks per AD-029 |
| Push notification delivery | Untestable in headless Playwright |
| Super Admin `/admin` dashboard | Separate domain per AD-027 |
| Pixel-perfect automated snapshot diffing | Baselines are for human review; automated diff is a future iteration |
| E-mail delivery for collaborator invites | Untestable in headless; invite storage covered in `06-collaborator-rbac.spec.ts` |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --- | --- | --- | --- |
| Each test sets up its own mock session independently via `addInitScript` | Per-test `beforeEach` or inline setup | Atomic tests cannot share state; same pattern as `03-event-lifecycle.spec.ts` | y |
| To reach Step 2 in its own test, the test fills Step 1 in `beforeEach` and advances | `beforeEach` fills and advances | Standard Playwright pattern for reaching a specific state | y |
| Organizer dashboard route is `/meus-eventos` | `/meus-eventos` | AD-020; confirmed in `02-auth-guards.spec.ts` | y |
| Event editor route for new event is `/meus-eventos/evento/novo` | `/meus-eventos/evento/novo` | Confirmed in `03-event-lifecycle.spec.ts` and `07-visual-layout.spec.ts` | y |
| Stepper has 3 steps: Informações → Endereço → Pix | 3 steps | Confirmed in `03-event-lifecycle.spec.ts:204` | y |
| Post-save feedback is a snackbar | `simple-snack-bar` | Confirmed in `03-event-lifecycle.spec.ts:274` | y |
| Screenshot filenames follow `NN-description-{desktop,mobile}.png` convention | Same as `e2e/screenshots/` existing files | Follows `01-home-light-desktop.png` pattern | y |
| Tests live in `e2e/specs/13-organizer-happy-path.spec.ts` | New file | Keeps existing specs focused on component-level concerns | y |
| `backdrop-filter` is asserted via `page.evaluate(() => getComputedStyle(el).backdropFilter)` | `page.evaluate` | Only way to read computed CSS in Playwright | y |
| Font family is asserted via `getComputedStyle(heading).fontFamily` | `page.evaluate` | Same as above | y |

**Open questions:** none — all resolved or logged above.

---

## User Stories

### P1: Organizer Dashboard ⭐ MVP

**User Story**: As an organizer, I want to see my event list on the dashboard so that I can
manage my events.

**Acceptance Criteria**:

1. WHEN an authenticated organizer navigates to `/meus-eventos` THEN the system SHALL render the dashboard with filter chips, at least one event card, and an enabled "Novo Evento" button, AND the "Novo Evento" button bounding box height SHALL be ≥ 48 px. `[E2E-01]`
2. WHEN the dashboard event cards are rendered THEN each card's computed `backdrop-filter` CSS value SHALL contain `blur`. `[E2E-02]`

**Independent Test**: Each is a standalone test. `[E2E-01]` and `[E2E-02]` run independently with their own setup.

---

### P1: Create Event — Step 1 (Informações) ⭐ MVP

**User Story**: As an organizer, I want to fill the basic event information in Step 1 so that
I can proceed to the address step.

**Acceptance Criteria**:

1. WHEN an authenticated organizer navigates to `/meus-eventos/evento/novo` THEN the system SHALL render Step 1 with title, description, date, time inputs visible, and the "Próximo" button SHALL be disabled. `[E2E-03]`
2. WHEN the organizer fills title, selects a category chip, fills description, date, and time THEN the system SHALL enable the "Próximo" button AND the active stepper label SHALL indicate Step 1 is complete. `[E2E-04]`

**Independent Test**: `[E2E-03]` navigates and asserts the empty state. `[E2E-04]` navigates, fills Step 1, and asserts the enabled state + screenshot.

---

### P1: Create Event — Step 2 (Endereço) ⭐ MVP

**User Story**: As an organizer, I want to fill the event address using ViaCEP auto-fill in
Step 2 so that I can proceed to the Pix step.

**Acceptance Criteria**:

1. WHEN an organizer has completed Step 1 and is on Step 2 THEN the system SHALL display the CEP input, street, neighborhood, city, and state fields, and the "Próximo" button SHALL be disabled before CEP entry. `[E2E-05]`
2. WHEN the organizer types a valid 8-digit CEP THEN the system SHALL auto-populate street, neighborhood, city, and state fields via ViaCEP, AND the "Próximo" button SHALL become enabled. `[E2E-06]`

**Independent Test**: Each test fills Step 1 in `beforeEach` to reach Step 2 independently. `[E2E-06]` ends with a screenshot of the auto-filled address form.

---

### P1: Create Event — Step 3 (Pix + Wishlist) ⭐ MVP

**User Story**: As an organizer, I want to configure Pix and add wishlist items in Step 3 so
that guests can contribute and claim items.

**Acceptance Criteria**:

1. WHEN an organizer has completed Steps 1 and 2 and is on Step 3 THEN the system SHALL display the Pix key input, wishlist item name and quantity fields, and an "Adicionar" button. `[E2E-07]`
2. WHEN the organizer fills the item name and quantity and clicks "Adicionar" THEN the system SHALL add the item to the wishlist list visible on the page. `[E2E-08]`
3. WHEN the organizer adds a second wishlist item THEN both items SHALL be visible in the list simultaneously. `[E2E-09]`
4. WHEN the organizer removes one wishlist item THEN only the remaining item SHALL be visible. `[E2E-10]`

**Independent Test**: Each test fills Steps 1 and 2 in `beforeEach` to reach Step 3 independently. Each ends with a screenshot at its specific state.

---

### P1: Create Event — Submit & Confirmation ⭐ MVP

**User Story**: As an organizer, I want to submit the completed event form and receive a success
confirmation.

**Acceptance Criteria**:

1. WHEN the organizer has completed all 3 steps and clicks "Salvar" THEN the system SHALL intercept the Firestore write, display a success snackbar, and navigate away from the editor. `[E2E-11]`

**Independent Test**: `beforeEach` fills all 3 steps to reach the Salvar button independently. Ends with screenshot of the snackbar.

---

### P1: Edit Existing Event ⭐ MVP

**User Story**: As an organizer, I want to open an existing event in the editor and update its
title so that the change is saved.

**Acceptance Criteria**:

1. WHEN an organizer navigates to the editor for an existing event THEN the system SHALL render the editor pre-populated with the event's title, date, and description. `[E2E-12]`
2. WHEN the organizer changes the title and submits THEN the system SHALL intercept the Firestore update and display a success snackbar. `[E2E-13]`
3. IF the organizer clears the title field THEN the system SHALL display a "Título é obrigatório" validation error and the "Salvar" button SHALL be disabled. `[E2E-14]`
4. WHEN the title input is focused THEN its computed border or outline color SHALL reflect the `--org-primary` purple token (not the browser default blue). `[E2E-15]`

**Independent Test**: Each test seeds the mock event and navigates independently. Each ends with a screenshot.

---

### P1: Guest RSVP — Event Detail Page ⭐ MVP

**User Story**: As a guest, I want to see the event details (header, countdown, location) when
I open the event page, so I know what I'm RSVPing to.

**Acceptance Criteria**:

1. WHEN a guest navigates to `/evento/:id` with a seeded active event THEN the system SHALL display the event title in an `<h1>`, the countdown timer, and the location text. `[E2E-16]`
2. WHEN the RSVP button is rendered THEN its bounding box height SHALL be ≥ 48 px. `[E2E-17]`

**Independent Test**: Each test seeds its event and navigates independently. `[E2E-16]` ends with a screenshot of the event detail.

---

### P1: Guest RSVP — Dialog Open ⭐ MVP

**User Story**: As a guest, I want to open the RSVP dialog and see the confirmation form.

**Acceptance Criteria**:

1. WHEN a guest clicks the RSVP button THEN the system SHALL open the RSVP dialog with name input, phone input, confirm button, and cancel button visible. `[E2E-18]`
2. WHEN the RSVP dialog is open THEN the dialog surface's computed `backdrop-filter` value SHALL contain `blur`. `[E2E-19]`

**Independent Test**: Each test seeds the event and opens the dialog independently. `[E2E-18]` ends with a screenshot of the open dialog.

---

### P1: Guest RSVP — Confirmation Submit ⭐ MVP

**User Story**: As a guest, I want to submit my RSVP and receive a confirmation so that my
attendance is registered.

**Acceptance Criteria**:

1. WHEN a guest fills name and phone in the RSVP dialog and clicks "Confirmar" THEN the system SHALL intercept the Firestore write and display a success snackbar or confetti animation. `[E2E-20]`

**Independent Test**: `beforeEach` seeds the event and opens the dialog independently. Ends with a screenshot of the post-confirmation state.

---

### P1: User Profile — Page Renders ⭐ MVP

**User Story**: As a user, I want to see my profile page with personal info, family roster, and
attended events sections.

**Acceptance Criteria**:

1. WHEN a user navigates to `/perfil` THEN the system SHALL render the heading "Meu Perfil", the profile info card, the family roster section header, and the attended events section. `[E2E-21]`
2. WHEN the profile page cards are rendered THEN the profile info card's computed `backdrop-filter` value SHALL contain `blur`. `[E2E-22]`
3. WHEN the profile page heading is rendered THEN its computed `font-family` value SHALL contain "Plus Jakarta Sans". `[E2E-23]`

**Independent Test**: Each test sets up the mock session and navigates independently. `[E2E-21]` ends with a screenshot.

---

### P1: User Profile — Update Name ⭐ MVP

**User Story**: As a user, I want to edit and save my display name so that the updated name is
reflected on the page.

**Acceptance Criteria**:

1. WHEN the user clicks "Editar", changes the display name to a new value, and clicks "Salvar" THEN the system SHALL display the updated name in the profile card. `[E2E-24]`

**Independent Test**: `beforeEach` sets up the mock session and navigates to `/perfil` independently. Ends with a screenshot showing the updated name.

---

### P2: Family Roster — Add Member

**User Story**: As a user, I want to add a family member to my roster.

**Acceptance Criteria**:

1. WHEN the user fills the family member name and relationship and clicks "Adicionar" THEN the system SHALL display the new member in the roster list. `[E2E-25]`
2. WHEN the "Adicionar membro" button is rendered THEN its bounding box height SHALL be ≥ 48 px. `[E2E-26]`

**Independent Test**: Each test sets up the session and navigates to `/perfil` independently. `[E2E-25]` ends with a screenshot of the updated roster.

---

### P2: Family Roster — Remove Member

**User Story**: As a user, I want to remove a family member from my roster.

**Acceptance Criteria**:

1. WHEN the user clicks the remove button on a family member THEN the system SHALL remove that member from the roster list AND the remaining members SHALL still be visible. `[E2E-27]`

**Independent Test**: `beforeEach` seeds the session with at least one pre-existing family member (via `__MOCK_DOCUMENTS__`) and navigates to `/perfil` independently. Ends with screenshot.

---

### P2: Collaborator Invite Dialog

**User Story**: As an event owner, I want to open the collaborator dialog and send an email
invite.

**Acceptance Criteria**:

1. WHEN the organizer opens the Collaborators dialog THEN the dialog SHALL render the email input and "Enviar" button, and the dialog border color SHALL not be the browser-default gray (i.e., it SHALL have a non-default styled border). `[E2E-28]`
2. WHEN the organizer fills the email and clicks "Enviar" THEN the system SHALL intercept the Firestore write and display a success snackbar. `[E2E-29]`

**Independent Test**: Each test seeds the event and navigates to the editor independently. `[E2E-28]` ends with a screenshot of the open dialog.

---

## Edge Cases

- IF a Firestore write intercept is not triggered on any submit step THEN the test SHALL fail via assertion timeout rather than a silent pass.
- IF `backdrop-filter` returns `none` or empty string THEN the test SHALL fail with a descriptive message identifying which surface (card, dialog, profile card) regressed.
- IF the "Próximo" button is not enabled after valid Step 1 data THEN the test SHALL fail with a locator timeout surfacing the regression.
- WHEN any test runs on Mobile Chrome viewport THEN 48 px touch target assertions SHALL also pass on that viewport.

---

## Requirement Traceability

| Requirement ID | Story | Task | Status |
| --- | --- | --- | --- |
| E2E-01 | Dashboard – renders + CTA size | T2 | Complete |
| E2E-02 | Dashboard – card backdrop-filter | T1, T2 | Complete |
| E2E-03 | Step 1 – empty state renders | T3 | Complete |
| E2E-04 | Step 1 – filled → Próximo enabled | T3 | Complete |
| E2E-05 | Step 2 – renders before CEP | T4 | Complete |
| E2E-06 | Step 2 – ViaCEP auto-fill | T4 | Complete |
| E2E-07 | Step 3 – renders Pix + wishlist form | T5 | Complete |
| E2E-08 | Step 3 – add first item | T5 | Complete |
| E2E-09 | Step 3 – two items visible | T5 | Complete |
| E2E-10 | Step 3 – remove one item | T5 | Complete |
| E2E-11 | Submit → snackbar + redirect | T6 | Complete |
| E2E-12 | Edit – pre-populated editor | T7 | Complete |
| E2E-13 | Edit – submit → snackbar | T7 | Complete |
| E2E-14 | Edit – empty title validation | T7 | Complete |
| E2E-15 | Edit – input border color token | T1, T7 | Complete |
| E2E-16 | RSVP – event detail renders | T8 | Complete |
| E2E-17 | RSVP – button ≥ 48 px | T1, T8 | Complete |
| E2E-18 | RSVP – dialog opens | T9 | Complete |
| E2E-19 | RSVP – dialog backdrop-filter | T1, T9 | Complete |
| E2E-20 | RSVP – submit → confirmation | T10 | Complete |
| E2E-21 | Profile – page renders | T11 | Complete |
| E2E-22 | Profile – card backdrop-filter | T1, T11 | Complete |
| E2E-23 | Profile – heading font-family | T1, T11 | Complete |
| E2E-24 | Profile – update name | T12 | Pending |
| E2E-25 | Family – add member | T13 | Pending |
| E2E-26 | Family – add button ≥ 48 px | T1, T13 | Pending |
| E2E-27 | Family – remove member | T14 | Pending |
| E2E-28 | Collab – dialog renders + border | T15 | Pending |
| E2E-29 | Collab – submit → snackbar | T15 | Pending |

**Coverage:** 29 total, 29 mapped to tasks, 0 unmapped ✅

---

## Success Criteria

- [ ] `npm run test:e2e` exits 0 with all 29 ACs covered by independent tests.
- [ ] Each test produces exactly one screenshot in `e2e/screenshots/` named after its step.
- [ ] Zero regressions in the existing 12 spec files.
- [ ] `npm run build` remains green after all changes.
