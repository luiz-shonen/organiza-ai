# Feature 13 Tasks — Layout Remediation and Organizer RBAC Regression Coverage

**Design**: `.specs/features/13-layout-and-organizer-rbac-remediation/design.md`  
**Status**: In Progress

## Test Coverage Matrix

> Generated from `AGENTS.md`, `README.md`, `package.json`, `playwright.config.ts`, existing component specs, and the Feature 13 spec. E2E cases use the Pixel 5 project and deterministic Firebase/ViaCEP mocks.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| --- | --- | --- | --- | --- |
| Presentational Angular component | unit + e2e | Component API behavior, semantic markup, 48px controls; visual ACs measured on mobile and desktop | `src/app/**/*.component.spec.ts`, `e2e/specs/*.spec.ts` | `npm test -- --watch=false` / focused Playwright |
| Application shell and E2E helpers | e2e | Screenshot origin, responsive insets, no horizontal overflow, and deterministic capture behavior | `e2e/pages/*.ts`, `e2e/helpers/*.ts`, `e2e/specs/*.spec.ts` | focused Playwright |
| Router/role regression | unit + e2e | Guards and URLs: `/meus-eventos` organizer happy path, denied `/admin` redirect | `src/app/app.routes.spec.ts`, `e2e/specs/*.spec.ts` | `npm test -- --watch=false` / focused Playwright |
| SCSS token layout | e2e + build | Mobile insets, no clipping, token/focus behavior, and 48px actions | `src/app/**/*.scss`, `e2e/specs/*.spec.ts` | `npm run build` / focused Playwright |

## Gate Check Commands

| Gate Level | When to Use | Command |
| --- | --- | --- |
| Quick | Component or route unit behavior | `npm test -- --watch=false` |
| Full | Each visual or route E2E slice | `npm test -- --watch=false && npm run test:e2e -- e2e/specs/13-organizer-happy-path.spec.ts --project=mobile-chrome` |
| Build | Final phase completion | `npm run build && npm test -- --watch=false && npm run test:e2e` |

## Execution Plan

### Phase 1: Deterministic mobile capture

```
T1
```

### Phase 2: Component-owned form and modal consistency

```
T2 → T3
```

### Phase 3: Single-gutter mobile pages

```
T4 → T5
```

### Phase 4: Organizer route regression coverage

```
T6
```

## Task Breakdown

### T1: Reset the actual app scroll owner before visual capture ✅

**What**: Add a mobile screenshot contract that resets the actual shell scroll owner after ViaCEP interaction.
**Where**: `e2e/pages/base.page.ts`
**Depends on**: None
**Reuses**: `main.app-content`, `assertNoHorizontalOverflow`, `EventEditorPage`.
**Requirement**: CAPTURE-01, CAPTURE-02, CAPTURE-03

**Done when**:

- [x] `captureScreenshot` resets window and `main.app-content` horizontal and vertical scroll positions before capture.
- [x] Mobile ViaCEP E2E asserts shell `scrollLeft === 0` and `scrollTop === 0` after capture.

**Tests**: e2e
**Gate**: full
**Commit**: `fix(visual): reset app scroll before mobile screenshots`

### T2: Give the collaborator dialog responsive, touch-safe insets ✅

**What**: Make title, content, actions, field, and close control use the required component-owned modal spacing without new global overrides.
**Where**: `src/app/features/organizer/event-editor/components/collaborator-invite-dialog/collaborator-invite-dialog.component.scss`
**Depends on**: T1
**Reuses**: Existing dialog signals, Material dialog surface, `--mat-sys-*` tokens.
**Requirement**: LAYOUT-01, LAYOUT-02, LAYOUT-05

**Done when**:

- [x] Mobile dialog child regions have `>= 16px` inset from the dialog surface.
- [x] Desktop dialog child regions have 24px insets and primary/close actions are `>= 48px` high.
- [x] Existing dialog content keeps the Material modal scroll boundary instead of adding document-level overflow.

**Tests**: unit + e2e
**Gate**: full
**Commit**: `fix(dialog): standardize collaborator invite spacing`

### T3: Align profile name editing with the shared form contract ✅

**What**: Give the editable profile name its own full-width form layout and signal input binding while preserving save/cancel output behavior.
**Where**: `src/app/features/profile/components/profile-info-card/profile-info-card.component.html`
**Depends on**: T2
**Reuses**: Existing `editName` signal, `updateName` output, outlined Material field.
**Requirement**: LAYOUT-03, LAYOUT-05

**Done when**:

- [x] The edit field uses `[value]` and `(input)` signal binding rather than ngModel synchronization.
- [x] Mobile and desktop profile edit E2E proves the form stays inside its 24px card gutter, receives focus, and keeps actions at least 48px high.
- [x] Existing save, validation, and cancel unit behavior remains covered.

**Tests**: unit + e2e
**Gate**: full
**Commit**: `fix(profile): align name editor with form tokens`

### T4: Normalize event-detail mobile gutter ownership

**What**: Remove duplicated outer horizontal spacing inside EventCard while retaining the EventDetail page gutter and card-internal padding.
**Where**: `src/app/features/event-detail/components/event-card/event-card.component.scss`
**Depends on**: T3
**Reuses**: `.event-detail` outer 12px gutter and existing EventCard details/host structures.
**Requirement**: LAYOUT-04, LAYOUT-05

**Done when**:

- [ ] Hero, details, host, and RSVP content share one visible 12px mobile page gutter.
- [ ] Long title and address stay inside the viewport with zero document overflow.
- [ ] Date/location controls remain 48px touch targets.

**Tests**: unit + e2e
**Gate**: full
**Commit**: `fix(event-detail): normalize mobile content gutters`

### T5: Protect the event-editor mobile canvas and stepper insets

**What**: Constrain the editor surface and active-step fields to the required viewport insets without suppressing intended horizontal stepper-header scrolling.
**Where**: `src/app/features/admin/event-editor/event-editor.container.scss`
**Depends on**: T4
**Reuses**: Existing editor grid, `.editor__stepper`, and mobile-first media queries.
**Requirement**: LAYOUT-04, CAPTURE-03

**Done when**:

- [ ] Editor card, title, active form fields, and actions maintain `>= 12px` inset on Pixel 5 before and after ViaCEP interaction.
- [ ] The stepper header keeps `max-width: 100%`, `overflow-x: auto`, `flex-wrap: nowrap`, and touch scrolling.
- [ ] No page or app-shell horizontal offset remains after a focused field is captured.

**Tests**: unit + e2e
**Gate**: full
**Commit**: `fix(editor): preserve mobile canvas spacing`

### T6: Make organizer E2E journeys independent of Super Admin URLs

**What**: Move stale organizer E2E navigation and fixtures to `/meus-eventos` with a non-whitelisted user, while retaining explicit `/admin` denial coverage.
**Where**: `e2e/specs/06-collaborator-rbac.spec.ts`
**Depends on**: T5
**Reuses**: `setupMockAuthSession`, `superAdminGuard` tests, and organizer page objects.
**Requirement**: RBAC-01, RBAC-02, RBAC-03

**Done when**:

- [ ] Collaborator and share organizer paths run with a non-Super-Admin fixture only under `/meus-eventos`.
- [ ] Every remaining organizer E2E route in scope uses `/meus-eventos`; `/admin` remains only in authorization-denial tests.
- [ ] Unit and browser tests assert `/meus-eventos` auth protection and `/admin` redirect for a non-Super-Admin.

**Tests**: unit + e2e
**Gate**: build
**Commit**: `test(rbac): cover organizer routes without admin access`

## Phase Execution Map

```
Phase 1: T1 → T2
Phase 2: T2 → T3 → T4
Phase 3: T4 → T5 → T6
Phase 4: T6
```

## Task Granularity Check

| Task | Scope | Status |
| --- | --- | --- |
| T1 | Screenshot helper contract | ✅ Granular |
| T2 | Collaborator dialog component | ✅ Granular |
| T3 | ProfileInfoCard edit boundary | ✅ Granular |
| T4 | EventCard mobile layout | ✅ Granular |
| T5 | EventEditor mobile layout | ✅ Granular |
| T6 | Organizer route regression suite | ✅ Granular |

## Diagram-Definition Cross-Check

| Task | Depends On | Diagram Shows | Status |
| --- | --- | --- | --- |
| T1 | None | None | ✅ Match |
| T2 | T1 | T1 → T2 | ✅ Match |
| T3 | T2 | T2 → T3 | ✅ Match |
| T4 | T3 | T3 → T4 | ✅ Match |
| T5 | T4 | T4 → T5 | ✅ Match |
| T6 | T5 | T5 → T6 | ✅ Match |

## Test Co-location Validation

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
| --- | --- | --- | --- | --- |
| T1 | Shell helper/layout | e2e | e2e | ✅ OK |
| T2 | Presentational dialog | unit + e2e | unit + e2e | ✅ OK |
| T3 | Presentational profile card | unit + e2e | unit + e2e | ✅ OK |
| T4 | Presentational event card | unit + e2e | unit + e2e | ✅ OK |
| T5 | Container layout | unit + e2e | unit + e2e | ✅ OK |
| T6 | Router/role regression | unit + e2e | unit + e2e | ✅ OK |
