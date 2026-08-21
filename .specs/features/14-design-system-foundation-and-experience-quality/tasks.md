# Feature 14 Tasks — Design System Foundation and Experience Quality

## Execution Protocol

Implement these tasks with the `tlc-spec-driven` skill. Work one task at a time with a red-green-refactor cycle, update this file and spec traceability before each atomic Conventional Commit, and run the listed gate before marking a task done. This feature has 30 tasks, so Execute must offer task-batched sub-agents before dispatching work and must finish with an independent Verifier and discrimination sensor.

**Design**: `.specs/features/14-design-system-foundation-and-experience-quality/design.md`
**Status**: In progress — Phase 1 started.

## Completion Status

- [x] T1 — Register the visual scenarios and semantic anchors
- [x] T2 — Capture scroll-owner anchors deterministically
- [x] T3 — Add numerical visual failure assertions
  - Corrective verification: inspect `OrgFormField` MDC focus tokens through the owning Material field host, ignoring transparent notch sides and rejecting visible multi-colour outlines.
  - Follow-up: touch-target checks allow at most 0.01px of browser rounding, reject material undersizing, and wait for overlay entry animation before measuring collaborator actions.
- [x] T4 — Configure tracked visual snapshot output

### Phase 2

- [x] T5 — Define semantic and seasonal theme tokens
- [x] T6 — Create the single-owner glass surface primitive
- [x] T7 — Create the native Material field directive
- [x] T8 — Create the field-label contract
- [x] T9 — Create shared action and chip directives
- [x] T10 — Create the semantic icon map

### Phase 3

- [x] T11 — Migrate the Home badge and event cards to shared surfaces
- [x] T12 — Simplify profile information into one surface
- [x] T13 — Rebuild the family roster composition
- [x] T14 — Standardize seasonal event card surface
- [x] T15 — Replace the undersized mobile stepper presentation
  - Follow-up: removed redundant foreground overrides that already inherit the Material `on-primary` token and the default flex alignment, returning the editor stylesheet below its enforced budget without changing the mobile stepper contract.

### Phase 4

- [x] T16 — Create the typed snackbar and banner presentation
- [x] T17 — Create the typed feedback service
- [x] T18 — Migrate profile feedback callers
- [x] T19 — Migrate event-detail feedback callers
- [x] T20 — Migrate event-editor feedback callers
- [x] T21 — Migrate dashboard and share feedback callers

### Phase 5

- [x] T22 — Establish Firestore rules emulator coverage
- [x] T23 — Persist named companion metadata compatibly
- [x] T24 — Create the RSVP drawer with companion form array

## Test Coverage Matrix

> Generated from `AGENTS.md`, `DESIGN.md`, `README.md`, `package.json`, `playwright.config.ts`, existing Vitest component specs, and existing Playwright POM/spec patterns. Existing project quality rules require a spec for every feature, OnPush components, WCAG assertions, atomic E2E tests, a screenshot per state, both desktop and mobile coverage, and no horizontal overflow.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| --- | --- | --- | --- | --- |
| Shared UI component/directive/service | unit + e2e | Public API, all documented variants/states, aria semantics, focus, 48px targets, and representative consumer rendering | `src/app/shared/ui/**/*.spec.ts`, `e2e/specs/*.spec.ts` | `npm test -- --watch=false` and focused Playwright |
| Feature presentational component | unit + e2e | Input/output behavior, validation, keyboard behavior, light/dark visual scenario anchors | `src/app/features/**/*.component.spec.ts`, `e2e/specs/*.spec.ts` | `npm test -- --watch=false` and focused Playwright |
| Container/persistence | unit + rules + e2e | Every mapped AC, legacy read, atomic write/cancel, and real Firestore authorization contract | `src/app/**/*.spec.ts`, future `e2e/rules/**/*.spec.ts` | `npm test -- --watch=false`; after T23, `npm run test:rules` |
| Application shell/router | unit + e2e | Authorized navigation, drawer focus/close restoration, no toolbar regression | `src/app/app.spec.ts`, `e2e/specs/*.spec.ts` | `npm test -- --watch=false` and focused Playwright |
| SCSS/tokens and visual infrastructure | e2e + build | Both themes/viewports, semantic anchor screenshot comparison, overflow, token geometry, and visual settling | `src/**/*.scss`, `e2e/**/*.ts` | `npm run build` and `npm run test:e2e` |

## Gate Check Commands

| Gate Level | When to Use | Command |
| --- | --- | --- |
| Quick | A unit-only primitive or service slice | `npm test -- --watch=false` |
| Full | A consumer, drawer, visual, or route slice | `npm test -- --watch=false && npm run test:e2e` |
| Rules | RSVP persistence after the rules harness exists | `npm run test:rules && npm test -- --watch=false` |
| Build | End of every phase and final verification | `npm run build && npm test -- --watch=false && npm run test:e2e` |

## Execution Plan

### Phase 1: Visual characterization and complete capture

```
T1 → T2 → T3 → T4
```

### Phase 2: Tokens and primitive contracts

```
T5 → T6 → T7 → T8 → T9 → T10
```

### Phase 3: Migrate the visual defect hotspots

```
T11 → T12 → T13 → T14 → T15
```

### Phase 4: Feedback unification

```
T16 → T17 → T18 → T19 → T20 → T21
```

### Phase 5: RSVP companion persistence

```
T22 → T23 → T24
```

### Phase 6: Navigation and workflow drawers

```
T25 → T26 → T27 → T28
```

### Phase 7: Matrix completion and legacy-style removal

```
T29 → T30
```

## Task Breakdown

### Phase 1: Visual characterization and complete capture

### T1: Register the visual scenarios and semantic anchors

**What**: Create the typed scenario registry covering Home, Login, Organizer Dashboard, Event Editor steps, Event Detail, Profile, Navigation Drawer, RSVP Drawer, and Collaborator Drawer, with explicit anchors and all four theme/viewport variants.
**Where**: `e2e/visual/visual-scenarios.ts`
**Depends on**: None
**Reuses**: Existing Page Objects, deterministic auth mocks, and `ThemeService` local-storage contract.
**Requirement**: VIS-03
**Tests**: e2e
**Gate**: full
**Commit**: `test(visual): register theme and viewport scenarios`

### T2: Capture scroll-owner anchors deterministically

**What**: Replace document-only baseline capture with anchor-based capture inside `main.app-content`, including scroll-origin reset, font readiness, motion settling, and per-anchor screenshot assertions.
**Where**: `e2e/pages/base.page.ts`
**Depends on**: T1
**Reuses**: Existing `captureScreenshot` file naming and Playwright screenshot API.
**Requirement**: VIS-01, VIS-02, VIS-05
**Tests**: e2e
**Gate**: full
**Commit**: `test(visual): capture internal scroll anchors`

### T3: Add numerical visual failure assertions

**What**: Add helpers that prove app-scroll origin, anchor visibility, horizontal-overflow absence, one-surface geometry, focused field coherence, and drawer inset/touch-target contracts.
**Where**: `e2e/helpers/design-tokens.helper.ts`
**Depends on**: T2
**Reuses**: `assertNoHorizontalOverflow`, `assertMinTouchTarget`, and existing POM locators.
**Requirement**: VIS-04, DS-02, DS-04, DS-05
**Tests**: e2e
**Gate**: full
**Commit**: `test(visual): assert anchor geometry contracts`

### T4: Configure tracked visual snapshot output

**What**: Configure Playwright snapshot paths and visual-mode stability so approved artifacts are compared rather than silently overwritten.
**Where**: `playwright.config.ts`
**Depends on**: T3
**Reuses**: Existing Chromium and Pixel 5 projects.
**Requirement**: VIS-02, VIS-04
**Tests**: e2e
**Gate**: build
**Commit**: `test(visual): configure deterministic baseline comparison`

### Phase 2: Tokens and primitive contracts

### T5: Define semantic and seasonal theme tokens

**What**: Define semantic, surface, and seasonal theme tokens (`html.theme-junina`, `html.theme-natal`, `html.theme-pascoa`, `html.theme-ano-novo`) with high contrast, stable MDC token mappings, and single-ring glassmorphic surface defaults.
**Where**: `src/app/shared/ui/tokens/_semantic.scss`
**Depends on**: T4
**Reuses**: Current palette, `ThemeService`, `SeasonalThemeService`, and seasonal decoration names.
**Requirement**: THEME-01, THEME-02
**Tests**: e2e
**Gate**: build
**Commit**: `feat(ui): define semantic and seasonal theme tokens`

### T6: Create the single-owner glass surface primitive

**What**: Create the OnPush `OrgSurfaceComponent` and tests for one gradient ring, light/dark surfaces, responsive padding, and seasonal theme compatibility.
**Where**: `src/app/shared/ui/surface/`
**Depends on**: T5
**Reuses**: Glass background, blur, and radius intent from the current token set.
**Requirement**: DS-01, DS-02
**Tests**: unit + e2e
**Gate**: full
**Commit**: `feat(ui): add single-owner surface primitive`

### T7: Create the native Material field directive

**What**: Add the standalone form-field directive with default, hover, focus, invalid, disabled, autofill, and dark token recipes, without Material internal-selector styling.
**Where**: `src/app/shared/ui/forms/`
**Depends on**: T6
**Reuses**: Native `mat-form-field`, reactive forms, and MDC custom properties.
**Requirement**: DS-01, DS-03, DS-04
**Tests**: unit + e2e
**Gate**: full
**Commit**: `feat(ui): add material field token directive`

### T8: Create the field-label contract

**What**: Add the label directive and tests that distinguish floating Material labels from external labels, preserve associations, and prevent clipped or decorative label backgrounds.
**Where**: `src/app/shared/ui/forms/org-field-label.directive.ts`
**Depends on**: T7
**Reuses**: Material label semantics and current FormField error/hint projection.
**Requirement**: DS-01, DS-03
**Tests**: unit + e2e
**Gate**: full
**Commit**: `feat(ui): add accessible field label contract`

### T9: Create shared action and chip directives

**What**: Add primary, secondary, danger, and icon-button directives (`OrgButtonDirective`, `OrgIconButtonDirective`) and chip directive (`OrgChipDirective`) with a 48px contract and controlled loading/disabled states.
**Where**: `src/app/shared/ui/actions/`
**Depends on**: T8
**Reuses**: Native Material button directives and semantic color tokens.
**Requirement**: DS-01, DS-05
**Tests**: unit + e2e
**Gate**: full
**Commit**: `feat(ui): add action and chip directives`

### T10: Create the semantic icon map

**What**: Add an OnPush semantic icon component and typed icon-name map for shared action, field, feedback, and navigation icons.
**Where**: `src/app/shared/ui/actions/org-icon.component.ts`
**Depends on**: T9
**Reuses**: `MatIconModule` and Material Symbols already loaded by the app.
**Requirement**: DS-01, DS-06
**Tests**: unit + e2e
**Gate**: full
**Commit**: `feat(ui): add semantic icon component`

### Phase 3: Migrate the visual defect hotspots

### T11: Migrate the Home badge and event cards to shared surfaces

**What**: Remove the unexplained `Simplifique seus Momentos` outline and migrate Home card/badge composition to surface, action, and icon contracts.
**Where**: `src/app/features/home/home.container.html`
**Depends on**: T10
**Reuses**: Home event list behavior and route keyboard activation.
**Requirement**: DS-02, DS-05, VIS-03
**Tests**: unit + e2e
**Gate**: full
**Commit**: `fix(home): migrate hero and cards to ui surfaces`

### T12: Simplify profile information into one surface

**What**: Remove the nested-border appearance from personal data and migrate profile information to a single surface and shared field/action contracts.
**Where**: `src/app/features/profile/components/profile-info-card/`
**Depends on**: T11
**Reuses**: Existing signal name editing and `updateName` output.
**Requirement**: DS-02, DS-03, DS-04
**Tests**: unit + e2e
**Gate**: full
**Commit**: `fix(profile): simplify personal information surface`

**Follow-up**: Profile visual checks target the rendered `section.org-surface`, assert the 16px/24px responsive block inset, and retain the 12px/16px inline gutter geometry.

### T13: Rebuild the family roster composition

**What**: Migrate the family card and add-member form to one hierarchy of surface, label, field, action, and semantic icons with no blue arbitrary field fill.
**Where**: `src/app/features/profile/components/family-roster-manager/`
**Depends on**: T12
**Reuses**: Existing signal inputs and add/remove outputs.
**Requirement**: DS-02, DS-03, DS-05, DS-06
**Tests**: unit + e2e
**Gate**: full
**Commit**: `fix(profile): standardize family roster composition`

### T14: Standardize seasonal event card surface

**What**: Standardize event detail cards and hero with shared surfaces and seasonal theme palette, ensuring festive colors apply smoothly to cards and overlays without duplicate borders.
**Where**: `src/app/features/event-detail/components/event-card/`
**Depends on**: T13
**Reuses**: Existing event category and hero fallback.
**Requirement**: DS-02, THEME-01, THEME-02
**Tests**: unit + e2e
**Gate**: full
**Commit**: `fix(event-detail): standardize seasonal event card surface`

### T15: Replace the undersized mobile stepper presentation

**What**: Make editor step navigation deliberate on mobile: active step visible, accessible complete labels, horizontal scroll only where intentional, and shared controls/fields in the Pix step.
**Where**: `src/app/features/admin/event-editor/event-editor.container.scss`
**Depends on**: T14
**Reuses**: Existing Angular Material stepper validation and active-step flow.
**Requirement**: DS-03, DS-05, VIS-04
**Tests**: unit + e2e
**Gate**: full
**Commit**: `fix(editor): make mobile stepper legible`

### Phase 4: Feedback unification

### T16: Create the typed snackbar and banner presentation

**What**: Create the custom snackbar component (`FeedbackSnackbarComponent`) with success, error, and info variants, MDC annotations, green `check_circle` success contract, and alert banner primitive (`OrgBannerComponent`).
**Where**: `src/app/shared/ui/feedback/`
**Depends on**: T15
**Reuses**: Angular Material snackbar overlay and live-region behavior.
**Requirement**: FEED-01, FEED-02, FEED-03, DS-01
**Tests**: unit + e2e
**Gate**: full
**Commit**: `feat(ui): add semantic feedback snackbar and banner`

### T17: Create the typed feedback service

**What**: Add `FeedbackService` and tests for success/error/info configuration, duration, and no focus-stealing behavior.
**Where**: `src/app/shared/ui/feedback/feedback.service.ts`
**Depends on**: T16
**Reuses**: `MatSnackBar.openFromComponent`.
**Requirement**: FEED-01, FEED-02, FEED-03
**Tests**: unit + e2e
**Gate**: full
**Commit**: `feat(ui): centralize feedback publishing`

### T18: Migrate profile feedback callers

**What**: Replace profile name and family success/error snackbar calls with `FeedbackService` and prove the shared success component appears.
**Where**: `src/app/features/profile/profile.container.ts`
**Depends on**: T17
**Reuses**: Existing profile mutation handling.
**Requirement**: FEED-01, FEED-02
**Tests**: unit + e2e
**Gate**: full
**Commit**: `refactor(profile): use shared feedback service`

### T19: Migrate event-detail feedback callers

**What**: Replace RSVP, Pix, item-claim, and cancellation snackbar calls with the shared feedback API.
**Where**: `src/app/features/event-detail/event-detail.container.ts`
**Depends on**: T18
**Reuses**: Existing confetti and RSVP error handling.
**Requirement**: FEED-01, FEED-02
**Tests**: unit + e2e
**Gate**: full
**Commit**: `refactor(event-detail): use shared feedback service`

### T20: Migrate event-editor feedback callers

**What**: Replace editor save, invitation, item, validation, and export snackbar calls with the shared feedback API.
**Where**: `src/app/features/admin/event-editor/event-editor.container.ts`
**Depends on**: T19
**Reuses**: Existing save and collaborator flows.
**Requirement**: FEED-01, FEED-02
**Tests**: unit + e2e
**Gate**: full
**Commit**: `refactor(editor): use shared feedback service`

### T21: Migrate dashboard and share feedback callers

**What**: Replace organizer dashboard and share-panel snackbar calls with the shared feedback API and remove their local success wording variants.
**Where**: `src/app/features/admin/dashboard/dashboard.container.ts`
**Depends on**: T20
**Reuses**: Existing dashboard cancellation and share workflows.
**Requirement**: FEED-01, FEED-02
**Tests**: unit + e2e
**Gate**: full
**Commit**: `refactor(organizer): use shared feedback service`

### Phase 5: RSVP companion persistence

### T22: Establish Firestore rules emulator coverage

**What**: Add a deterministic Firestore Emulator rules-test command and characterize verified primary and family RSVP writes before changing their schema.
**Where**: `package.json`
**Depends on**: T21
**Reuses**: `firebase.json`, `firestore.rules`, and existing mock fixtures as non-authorization test doubles.
**Requirement**: RSVP-03, RSVP-05
**Tests**: rules
**Gate**: build
**Commit**: `test(rules): cover verified rsvp write contracts`

### T23: Persist named companion metadata compatibly

**What**: Add `GuestCompanion`, make companion arrays the new write source, preserve legacy count reads, and correct the Firestore rules/service batch contract under emulator tests.
**Where**: `src/app/core/models/guest.model.ts`
**Depends on**: T22
**Reuses**: `GuestService.batchConfirmRsvp`, cancel cascade, and existing aggregate total calculation.
**Requirement**: RSVP-03, RSVP-04, RSVP-05
**Tests**: unit + rules + e2e
**Gate**: rules
**Commit**: `feat(rsvp): persist named companion metadata`

### T24: Create the RSVP drawer with companion form array

**What**: Replace the long RSVP dialog with a presentational drawer that derives count from 0–10 named companions and retains family selection/inline family creation.
**Where**: `src/app/features/event-detail/components/rsvp-drawer/`
**Depends on**: T23
**Reuses**: Existing reactive form validation, FamilySelector, and typed RSVP result contract.
**Requirement**: RSVP-01, RSVP-02, NAV-03, NAV-04
**Tests**: unit + e2e
**Gate**: rules
**Commit**: `feat(rsvp): move confirmation to named companion drawer`

**Follow-up (2026-08-21)**: The RSVP E2E harness targets the explicit `rsvp-cancel-btn` so its cancel action cannot resolve to the separate close control.

### Phase 6: Navigation and workflow drawers

### T25: [x] Type the root drawer request and result contract

**What**: Replace the drawer service's untyped `unknown` data and retired drawer variants with discriminated navigation, RSVP, and collaborator request/result contracts.
**Where**: `src/app/core/services/drawer.service.ts`
**Depends on**: T24
**Reuses**: Existing signal state and root sidenav close binding.
**Requirement**: NAV-02, NAV-03, NAV-04
**Tests**: unit + e2e
**Gate**: full
**Commit**: `feat(drawer): type workflow drawer state`

### T26: [x] Create the accessible navigation drawer

**What**: Create the OnPush navigation drawer with authorized route actions, theme selection, logout, active route indication, and keyboard-safe close behavior.
**Where**: `src/app/shared/ui/drawer/navigation-drawer.component.ts`
**Depends on**: T25
**Reuses**: Auth signals, ThemeService, router links, and existing user menu actions.
**Requirement**: NAV-01, NAV-02, NAV-04
**Tests**: unit + e2e
**Gate**: full
**Commit**: `feat(drawer): add accessible navigation sheet`

### T27: [x] Compose the root drawer host and calm toolbar

**What**: Populate the root side sheet through typed `@switch` branches, reduce the toolbar to brand/menu/profile, and retain focus restoration for all close paths.
**Where**: `src/app/app.html`
**Depends on**: T26
**Reuses**: Existing end-positioned `mat-sidenav` and user identity controls.
**Requirement**: NAV-01, NAV-02, NAV-04
**Tests**: unit + e2e
**Gate**: full
**Commit**: `feat(shell): move navigation into end drawer`

### T28: [x] Move collaborator management into a drawer

**What**: Replace the collaborator dialog with the typed presenter drawer and preserve email validation, invitation, removal, active/pending sections, and container-owned service calls.
**Where**: `src/app/features/organizer/event-editor/components/collaborator-drawer/`
**Depends on**: T27
**Reuses**: Existing collaborator signals and email invitation behavior.
**Requirement**: NAV-03, NAV-04, DS-03, DS-06
**Tests**: unit + e2e
**Gate**: full
**Commit**: `feat(collaboration): move management into drawer`

### Phase 7: Matrix completion and legacy-style removal

### T29: Register migrated drawer and dark-mode scenarios

**What**: Add scenario fixtures and screenshot assertions for Home, Profile, Editor, Event Detail, navigation, RSVP, and collaborator drawers across all required variants and anchors.
**Where**: `e2e/specs/13-organizer-happy-path.spec.ts`
**Depends on**: T28
**Reuses**: Visual registry, base capture helper, and existing atomic flow setup.
**Requirement**: VIS-01, VIS-02, VIS-03, VIS-04, VIS-05
**Tests**: e2e
**Gate**: full
**Commit**: `test(visual): cover dark drawer and full-content matrix`

### T30: Remove competing global style debt and validate the matrix

**What**: Remove the legacy global Material outline/icon/form overrides after all migrated consumers pass, regenerate approved visual baselines, and execute the complete regression matrix.
**Where**: `src/styles.scss`
**Depends on**: T29
**Reuses**: Semantic token imports and primitive-local styles.
**Requirement**: DS-02, DS-03, DS-04, DS-06, THEME-01, THEME-02, VIS-04
**Tests**: unit + rules + e2e
**Gate**: build
**Commit**: `refactor(styles): remove conflicting global material overrides`

## Phase Execution Map

```
Phase 1: T1 → T2 → T3 → T4
Phase 2: T5 → T6 → T7 → T8 → T9 → T10
Phase 3: T11 → T12 → T13 → T14 → T15
Phase 4: T16 → T17 → T18 → T19 → T20 → T21
Phase 5: T22 → T23 → T24
Phase 6: T25 → T26 → T27 → T28
Phase 7: T29 → T30
```

## Task Granularity Check

| Task group | Scope | Status |
| --- | --- | --- |
| T1–T4 | One visual contract helper/configuration concern per task | ✅ Granular |
| T5–T10 | One token or UI primitive concern per task | ✅ Granular |
| T11–T15 | One cited consumer composition per task | ✅ Granular |
| T16–T21 | One feedback primitive or caller slice per task | ✅ Granular |
| T22–T24 | Rules harness, persistence model, and RSVP UI separated by dependency | ✅ Granular |
| T25–T28 | State contract, navigation UI, root composition, and collaborator presenter separated | ✅ Granular |
| T29–T30 | Matrix registration before legacy override removal | ✅ Granular |

## Diagram-Definition Cross-Check

| Phase | Task dependencies | Diagram | Status |
| --- | --- | --- | --- |
| 1 | T1→T2→T3→T4 | T1→T2→T3→T4 | ✅ Match |
| 2 | T5→T6→T7→T8→T9→T10 | T5→T6→T7→T8→T9→T10 | ✅ Match |
| 3 | T11→T12→T13→T14→T15 | T11→T12→T13→T14→T15 | ✅ Match |
| 4 | T16→T17→T18→T19→T20→T21 | T16→T17→T18→T19→T20→T21 | ✅ Match |
| 5 | T22→T23→T24 | T22→T23→T24 | ✅ Match |
| 6 | T25→T26→T27→T28 | T25→T26→T27→T28 | ✅ Match |
| 7 | T29→T30 | T29→T30 | ✅ Match |

## Test Co-location Validation

| Task group | Layer | Matrix requires | Task says | Status |
| --- | --- | --- | --- | --- |
| T1–T4 | Visual infrastructure | e2e + build | e2e / build | ✅ OK |
| T5–T10 | Shared UI | unit + e2e | unit + e2e | ✅ OK |
| T11–T15 | Feature consumer | unit + e2e | unit + e2e | ✅ OK |
| T16–T21 | Feedback component/service/consumers | unit + e2e | unit + e2e | ✅ OK |
| T22–T24 | Persistence and RSVP | unit + rules + e2e | unit + rules + e2e | ✅ OK |
| T25–T28 | Shell and drawers | unit + e2e | unit + e2e | ✅ OK |
| T29–T30 | Visual regression and styles | unit + rules + e2e | unit + rules + e2e | ✅ OK |
