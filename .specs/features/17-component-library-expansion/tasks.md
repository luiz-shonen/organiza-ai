# Feature 17 — Component-First Library Expansion Tasks

## Execution Protocol

Each task is implemented and tested before it is marked complete. Its `tasks.md` status update is committed with the production code and tests in one Conventional Commit. No feature stylesheet receives a reusable component visual rule.

## Test Coverage Matrix

> Generated from `AGENTS.md`, `DESIGN.md`, `package.json`, Angular/Vitest component specs, and Playwright specs. The component and route expectations below are the minimum for this feature.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| --- | --- | --- | --- | --- |
| Public `Org*` component | Vitest component API | Every explicit input/output, disabled path, invalid/default fallback, and listed edge case | `src/app/shared/ui/**/org-*.component.spec.ts` | `npm test -- --watch=false --include='<task spec path>'` |
| UI contract validator | Node structural test | Fails for legacy directive consumer or feature-owned reusable component visual rule; passes for shared UI owner | `scripts/validate-ui-contracts.mjs` and its fixture/spec | `node scripts/validate-ui-contracts.mjs` |
| Migrated feature container/component | Vitest + targeted E2E where interaction changes | Existing business handler, accessible name, and route-visible outcome remain intact | adjacent `*.spec.ts`, `e2e/specs/*.spec.ts` | task-specific Vitest command and targeted Playwright suite |
| Design-system showcase | Vitest + Playwright desktop/mobile | Every public family has a live component instance, "Uso recomendado" code, theme token resolution, 48px target, and no horizontal overflow | `src/app/features/design-system/*.spec.ts`, `e2e/specs/design-system-showcase.spec.ts` | `npm test -- --watch=false --include='src/app/features/design-system/**/*.spec.ts'` and `npx playwright test e2e/specs/design-system-showcase.spec.ts` |
| Shared tokens / SCSS | Build + contract validator | No feature-owned Material appearance rule; light/dark/seasonal tokens resolve through shared tokens | `src/styles.scss`, `src/app/shared/ui/**` | `node scripts/validate-ui-contracts.mjs` and `npm run build` |

Guidelines applied: `AGENTS.md` requires OnPush, standalone components, BEM SCSS, Material tokens, 48px controls, zero overflow, and unit/E2E coverage. `DESIGN.md` requires component-first authoring and forbids feature-local Material overrides. No lint command is configured in `package.json`; the build gate is used instead.

## Gate Check Commands

| Gate Level | When to Use | Command |
| --- | --- | --- |
| Quick | After one component or one consumer migration | `npm test -- --watch=false --include='<task-specific spec path>'` |
| Contract | After a shared style, API, or migration task | `node scripts/validate-ui-contracts.mjs` (reports the migration baseline) |
| Strict contract | Before removing legacy infrastructure and at feature close | `node scripts/validate-ui-contracts.mjs --strict` |
| Full | After a phase with user-visible behavior | `npm test -- --watch=false --include='<relevant specs>' && npx playwright test <relevant e2e spec>` |
| Build | After each completed phase | `npm run build` |

## Execution Plan

### Phase 1 — Public action foundation (T1–T4)

```text
T1 -> T2 -> T3 -> T4
```

### Phase 2 — Field and selection foundation (T5–T11)

```text
T5 -> T6 -> T7 -> T8 -> T9 -> T10 -> T11
```

### Phase 3 — Navigation and data-display foundation (T12–T18)

```text
T12 -> T13 -> T14 -> T15 -> T16 -> T17 -> T18
```

### Phase 4 — Feedback, showcase, and documentation (T19–T21)

```text
T19 -> T20 -> T21
```

### Phase 5 — Application migration and legacy removal (T22–T26)

```text
T22 -> T23 -> T24 -> T25 -> T26
```

## Task Breakdown

### Phase 1 — Public action foundation

### T1: Create the deterministic UI source-of-truth validator

**Where**: `scripts/validate-ui-contracts.mjs`  
**Depends on**: none  
**Tests**: Node fixtures prove the validator rejects a legacy directive consumer, feature-owned Material appearance selector, and feature-owned MDC token, while accepting shared UI ownership.  
**Gate**: Contract
**Status**: ✅ Complete

### T2: Create `OrgButtonComponent`

**Status**: ✅ Complete

**Where**: `src/app/shared/ui/actions/`  
**Depends on**: T1  
**Tests**: Variant, gradient opt-out, loading, disabled non-emission, required label, and `pressed` output map to ACT-01 through ACT-03.  
**Gate**: Quick + Contract

### T3: Create `OrgIconButtonComponent`

**Status**: ✅ Complete

**Where**: `src/app/shared/ui/actions/`  
**Depends on**: T2  
**Tests**: Required accessible label, icon rendering, variant/default fallback, 48px target contract, disabled non-emission, and gradient opt-out map to ACT-01 through ACT-03.  
**Gate**: Quick + Contract

### T4: Create `OrgChipComponent`

**Status**: ✅ Complete

**Where**: `src/app/shared/ui/actions/`  
**Depends on**: T3  
**Tests**: Selection output, disabled non-emission, semantic variants, default fallback, and non-gradient treatment map to ACT-01 through ACT-03.  
**Gate**: Quick + Contract

### Phase 2 — Field and selection foundation

### T5: Create `OrgTextFieldComponent`

**Status**: ✅ Complete

**Where**: `src/app/shared/ui/forms/`  
**Depends on**: T4  
**Tests**: Label, model value, disabled behavior, hint/error semantics, and default text type map to FLD-01, FLD-03, and FLD-04.  
**Gate**: Quick + Contract

### T6: Create `OrgTextareaFieldComponent`

**Status**: ✅ Complete

**Where**: `src/app/shared/ui/forms/`  
**Depends on**: T5  
**Tests**: Label, rows, model value, disabled behavior, hint/error semantics, and empty value map to FLD-01, FLD-03, and FLD-04.  
**Gate**: Quick + Contract

### T7: Create `OrgSelectFieldComponent`

**Status**: ✅ Complete

**Where**: `src/app/shared/ui/forms/`  
**Depends on**: T6  
**Tests**: Typed options, model selection, disabled behavior, empty collection, hint/error semantics, and default fallback map to FLD-01, FLD-03, and FLD-04.  
**Gate**: Quick + Contract

### T8: Consolidate date and time field geometry under shared field ownership

**Status**: ✅ Complete

**Where**: `src/app/shared/ui/forms/`  
**Depends on**: T7  
**Tests**: Existing date/time field tests are extended to assert native Material geometry, centered value/control contract, labels, and no clipping beside the text field, mapping to FLD-01 and FLD-02.  
**Gate**: Quick + Contract

### T9: Create `OrgToggleComponent`

**Status**: ✅ Complete

**Where**: `src/app/shared/ui/selection/`  
**Depends on**: T8  
**Tests**: Checked model, label, disabled non-change, accessible Material toggle, and 48px target map to SEL-01 and ACT-03.  
**Gate**: Quick + Contract

### T10: Create `OrgCheckboxComponent`

**Status**: ✅ Complete

**Where**: `src/app/shared/ui/selection/`  
**Depends on**: T9  
**Tests**: Checked/indeterminate states, label, disabled non-change, and semantic checkbox behavior map to SEL-01 and ACT-03.  
**Gate**: Quick + Contract

### T11: Create `OrgRadioGroupComponent`

**Status**: ✅ Complete

**Where**: `src/app/shared/ui/selection/`  
**Depends on**: T10  
**Tests**: Typed option rendering, model selection, empty options, disabled option/group, label, and 48px target map to SEL-01.  
**Gate**: Quick + Contract

### Phase 3 — Navigation and data-display foundation

### T12: Create `OrgTabsComponent`

**Status**: ✅ Complete

**Where**: `src/app/shared/ui/navigation/`  
**Depends on**: T11  
**Tests**: Typed tab items, selected-id model, change output, empty list, keyboard-ready Material tab semantics, and gradient opt-out map to NAV-01 and DATA-02.  
**Gate**: Quick + Contract

### T13: Create `OrgStepperComponent` and closed `OrgStepComponent`

**Status**: ✅ Complete

**Where**: `src/app/shared/ui/navigation/`  
**Depends on**: T12  
**Tests**: Projected closed steps, selected-index model, meaningful labels, compact orientation below 600px, and no overflow map to NAV-01 and NAV-02.  
**Gate**: Quick + Contract

### T14: Create `OrgMenuComponent`

**Status**: ✅ Complete

**Where**: `src/app/shared/ui/navigation/`  
**Depends on**: T13  
**Tests**: Trigger label/icon, typed actions, empty actions, action selection output, and shared glass menu surface map to NAV-01 and OVR-01.  
**Gate**: Quick + Contract

### T15: Create `OrgNavigationListComponent`

**Status**: ✅ Complete

**Where**: `src/app/shared/ui/navigation/`  
**Depends on**: T14  
**Tests**: Typed items, active state, accessible links/items, empty collection, selected-item output, and drawer token use map to NAV-01.  
**Gate**: Quick + Contract

### T16: Create `OrgProgressComponent`

**Where**: `src/app/shared/ui/data-display/`  
**Depends on**: T15  
**Tests**: Value clamping at 0 and 100, semantic variant, gradient opt-out, and accessible progress value map to DATA-01 and DATA-02.  
**Gate**: Quick + Contract

### T17: Create `OrgMetricCardComponent`

**Where**: `src/app/shared/ui/data-display/`  
**Depends on**: T16  
**Tests**: Label/value/description/trend, atmosphere input, gradient opt-out, and semantic surface map to DATA-01 and DATA-02.  
**Gate**: Quick + Contract

### T18: Create `OrgBadgeComponent`

**Where**: `src/app/shared/ui/data-display/`  
**Depends on**: T17  
**Tests**: Label, optional icon, semantic variant/default fallback, and non-gradient treatment map to DATA-01 and DATA-02.  
**Gate**: Quick + Contract

### Phase 4 — Feedback, showcase, and documentation

### T19: Create `OrgConfirmDialogComponent` and `OrgDialogService`

**Where**: `src/app/shared/ui/feedback/`  
**Depends on**: T18  
**Tests**: Typed confirmation config, confirm/cancel boolean result, dialog accessibility, and theme token surface map to OVR-01.  
**Gate**: Quick + Contract

### T20: Convert design-system demonstrations to public `Org*` APIs

**Where**: `src/app/features/design-system/`  
**Depends on**: T19  
**Tests**: Showcase fixture asserts every new family renders through `Org*`, every family has "Uso recomendado", and themes resolve shared tokens, mapping to DOC-01 through DOC-03.  
**Gate**: Full + Contract

### T21: Rewrite `DESIGN.md` as the component-first public catalog

**Where**: `DESIGN.md`  
**Depends on**: T20  
**Tests**: UI contract validator asserts every public export has a documented recommended component usage and no legacy directive is advertised as the default, mapping to DOC-01 and DOC-03.  
**Gate**: Contract

### Phase 5 — Application migration and legacy removal

### T22: Migrate all action and surface consumers to closed components

**Where**: `src/app/features/`  
**Depends on**: T21  
**Tests**: Existing route/component tests are updated only for DOM API changes and preserve existing business handlers, accessible names, and visible actions, mapping to MIG-01 and MIG-03.  
**Gate**: Full + Contract

### T23: Migrate all field and selection consumers to closed components

**Where**: `src/app/features/`  
**Depends on**: T22  
**Tests**: Existing form tests prove the same submit values, validation states, disabled states, and labels after migration, mapping to MIG-02 and FLD-01 through FLD-04.  
**Gate**: Full + Contract

### T24: Migrate navigation, data display, and confirmation overlay consumers

**Where**: `src/app/features/`  
**Depends on**: T23  
**Tests**: Route and component tests prove active navigation, workflow selection, metric/progress values, and confirm/cancel behavior remain unchanged, mapping to MIG-03 and OVR-01.  
**Gate**: Full + Contract

### T25: Remove legacy directives and obsolete visual overrides

**Where**: `src/app/shared/ui/`  
**Depends on**: T24  
**Tests**: The contract validator proves no application imports/selectors remain for legacy UI directives and no feature-owned in-scope Material appearance rules remain, mapping to CSS-01 and CSS-02.  
**Gate**: Strict contract + Build

### T26: Run the complete responsive and visual migration verification

**Where**: `e2e/specs/`  
**Depends on**: T25  
**Tests**: Desktop and mobile light/dark route checks cover the showcase and each migrated route, with zero overflow, 48px targets, and source-of-truth contract results, mapping to MIG-01 through MIG-03 and DOC-01 through DOC-02.  
**Gate**: Full + Build + Strict contract

## Granularity Check

| Range | Check | Result |
| --- | --- | --- |
| T1 | One validator | ✅ Atomic |
| T2–T4 | One public action component per task | ✅ Atomic |
| T5–T11 | One field/selection component or one shared field-geometry concern per task | ✅ Atomic |
| T12–T18 | One navigation/data contract per task; T13 contains inseparable parent/child step pair | ✅ Atomic |
| T19 | One dialog contract consisting of its component and service boundary | ✅ Atomic |
| T20–T21 | One catalog conversion and one documentation catalog deliverable | ✅ Atomic |
| T22–T24 | One application consumer family migration per task | ✅ Atomic |
| T25–T26 | One legacy-removal contract and one visual-verification deliverable | ✅ Atomic |

## Diagram-Definition Cross-Check

| Phase | Diagram edge | Matching dependency | Result |
| --- | --- | --- | --- |
| 1 | T1 → T2 → T3 → T4 | T2→T1, T3→T2, T4→T3 | ✅ |
| 2 | T5 → T6 → T7 → T8 → T9 → T10 → T11 | T6→T5 through T11→T10 | ✅ |
| 3 | T12 → T13 → T14 → T15 → T16 → T17 → T18 | T13→T12 through T18→T17 | ✅ |
| 4 | T19 → T20 → T21 | T20→T19, T21→T20 | ✅ |
| 5 | T22 → T23 → T24 → T25 → T26 | T23→T22 through T26→T25 | ✅ |

## Test Co-location Validation

| Task Range | Component / layer required by matrix | Tests included in the same task | Result |
| --- | --- | --- | --- |
| T1 | Structural validator | Node fixtures and validator run | ✅ |
| T2–T19 | Shared UI component | Adjacent Vitest component API spec | ✅ |
| T20 | Showcase | Showcase Vitest and Playwright contract | ✅ |
| T21 | Documentation / public API | Contract validator documentation check | ✅ |
| T22–T24 | Product consumer migration | Adjacent feature tests and affected E2E routes | ✅ |
| T25 | Shared UI removal | Contract validator and build | ✅ |
| T26 | Responsive visual integration | Desktop/mobile Playwright and build | ✅ |
