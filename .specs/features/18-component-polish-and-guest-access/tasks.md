# Feature 18 — Component polish and guest access tasks

## Execution Protocol

Each task includes its production code, tests, and matching requirement status
update in its Conventional Commit. Shared UI owns reusable appearance; feature
styles remain page layout and domain content only.

## Test Coverage Matrix

> Generated from `AGENTS.md`, `DESIGN.md`, `package.json`, component specs, and
> Playwright specs. These are the required minimums for this feature.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| --- | --- | --- | --- | --- |
| Auth guard | Vitest unit | identified, null, loading, and anonymous branches | `src/app/core/guards/*.spec.ts` | `npx ng test organizaai --no-watch --include src/app/core/guards/auth.guard.spec.ts` |
| Shared `Org*` component | Vitest component API | every changed input/output/state plus visual semantic class | `src/app/shared/ui/**/*.spec.ts` | `npx ng test organizaai --no-watch --include <spec>` |
| Product consumer | Vitest + targeted E2E | preserved user action and reviewed visible contract | adjacent `*.spec.ts`, `e2e/specs/*.spec.ts` | `npx playwright test <spec>` |
| Design-system showcase | Vitest + Playwright | code disclosure, active states, interactions, themes, and no overflow | `src/app/features/design-system/*.spec.ts`, `e2e/specs/design-system-showcase.spec.ts` | `npx playwright test e2e/specs/design-system-showcase.spec.ts` |

## Gate Check Commands

| Gate Level | When to Use | Command |
| --- | --- | --- |
| Quick | Component/guard task | `npx ng test organizaai --no-watch --include <task spec>` |
| Contract | Shared UI task | `node scripts/validate-ui-contracts.mjs --strict` |
| Full | Route/showcase behavior task | `npx playwright test <target spec>` |
| Build | After every phase | `npm run build` |

## Execution Plan

### Phase 1 — Access and semantic action controls (T1–T2)

```text
T1 -> T2
```

### Phase 2 — Form and navigation behavior (T3–T4)

```text
T2 -> T3 -> T4
```

### Phase 3 — Surface, data, feedback, and product consumers (T5–T6)

```text
T4 -> T5 -> T6
```

### Phase 4 — Showcase evidence and closure (T7–T8)

```text
T6 -> T7 -> T8
```

## Task Breakdown

### T1: Reject anonymous RSVP sessions at organizer route boundaries

**Where**: `src/app/core/guards/auth.guard.*`  
**Depends on**: none  
**Tests**: Covers `AUTH-01` through `AUTH-03`, including direct anonymous navigation.  
**Gate**: Quick + Full  
**Status**: Complete

### T2: Make chip and action appearance semantics explicit

**Where**: `src/app/shared/ui/actions/`  
**Depends on**: T1  
**Tests**: Covers static/selectable chips, spacing, gradient foregrounds, and gradient opt-out for `CMP-01` through `CMP-03`.  
**Gate**: Quick + Contract  
**Status**: Complete

### T3: Complete field component geometry and content contracts

**Where**: `src/app/shared/ui/forms/`  
**Depends on**: T2  
**Tests**: Covers time suffix spacing/normal Material height, select option contrast hook, and textarea optional counter/bounds for `CMP-04`.  
**Gate**: Quick + Contract  
**Status**: Complete

### T4: Make navigation component interactions real and semantic

**Where**: `src/app/shared/ui/navigation/`  
**Depends on**: T3  
**Tests**: Covers tabs content changes, action/list semantics, menu surface, and vertical stepper for `CMP-05` and `DOC-03`.  
**Gate**: Quick + Contract  
**Status**: Complete

### T5: Repair single-surface composition, metric, banner, dialog, and feedback contracts

**Where**: `src/app/shared/ui/surface/`, `src/app/shared/ui/data-display/`, `src/app/shared/ui/feedback/`  
**Depends on**: T4  
**Tests**: Covers one-ring structure, readable trend/token foregrounds, dialog action spacing, and theme-aware feedback for `CMP-02`, `CMP-03`, and `CMP-06`.  
**Gate**: Quick + Contract  
**Status**: Complete

### T6: Migrate reviewed home, dashboard, and editor consumers to the repaired owners

**Where**: `src/app/features/home/`, `src/app/features/organizer/dashboard/`, `src/app/features/admin/event-editor/`  
**Depends on**: T5  
**Tests**: Covers `APP-01` through `APP-03` with component tests and target screenshots.  
**Gate**: Full + Build  
**Status**: Complete

### T7: Make the showcase accurate, active, and exactly documented

**Where**: `src/app/features/design-system/`  
**Depends on**: T6  
**Tests**: Covers `DOC-01` through `DOC-05`, reviewed chip/button examples, typography/iconography documentation, foundation token copy, and responsive title width.  
**Gate**: Full + Build  
**Status**: Complete

### T8: Run visual matrix and close traceability

**Where**: `e2e/specs/`, `.specs/features/18-component-polish-and-guest-access/`  
**Depends on**: T7  
**Tests**: Runs all changed component/route suites, desktop/mobile light/dark showcase checks, strict contract validation, and build.  
**Gate**: Full + Contract + Build  
**Status**: Complete

## Granularity Check

| Task | One deliverable family | Result |
| --- | --- | --- |
| T1 | Auth boundary | Pass |
| T2 | Action/selection family | Pass |
| T3 | Field family | Pass |
| T4 | Navigation family | Pass |
| T5 | Single-surface/data/feedback family | Pass |
| T6 | Reviewed product consumers | Pass |
| T7 | Showcase consumer/documentation | Pass |
| T8 | Independent verification and traceability | Pass |

## Diagram-Definition Cross-Check

| Edge | Matching dependency | Result |
| --- | --- | --- |
| T1 → T2 | T2 depends on T1 | Pass |
| T2 → T3 | T3 depends on T2 | Pass |
| T3 → T4 | T4 depends on T3 | Pass |
| T4 → T5 | T5 depends on T4 | Pass |
| T5 → T6 | T6 depends on T5 | Pass |
| T6 → T7 | T7 depends on T6 | Pass |
| T7 → T8 | T8 depends on T7 | Pass |

## Test Co-location Validation

| Task | Required layer | Tests included | Result |
| --- | --- | --- | --- |
| T1 | Guard + route | Unit + E2E | Pass |
| T2–T5 | Shared component | Component API tests | Pass |
| T6 | Product consumer | Unit + E2E | Pass |
| T7 | Showcase | Unit + E2E | Pass |
| T8 | Verification | Full matrix | Pass |
