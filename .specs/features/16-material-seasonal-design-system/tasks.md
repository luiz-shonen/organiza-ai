# Material Seasonal Design System Tasks

**Design**: `.specs/features/16-material-seasonal-design-system/design.md`
**Status**: In Progress (T1 complete)

## Test Coverage Matrix

> Generated from `AGENTS.md`, `README.md`, `package.json`, the existing showcase unit spec, and `e2e/specs/design-system-showcase.spec.ts`.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| --- | --- | --- | --- | --- |
| Global tokens | build | Seasonal classes expose one shared token contract | `src/styles.scss` | `npm run build` |
| Showcase container | unit | Each AC-backed interaction and rendered anchor family | `src/app/features/design-system/*.spec.ts` | `npm test -- --watch=false` |
| Showcase route | e2e | Guarded access, anchor navigation, theme controls, no overflow and 48px controls | `e2e/specs/design-system-showcase.spec.ts` | `npm run test:e2e:ci` |

## Gate Check Commands

| Gate Level | When to Use | Command |
| --- | --- | --- |
| Quick | Showcase unit task | `npm test -- --watch=false` |
| Full | E2E task | `npm test -- --watch=false && npm run test:e2e:ci` |
| Build | Token task and final phase | `npm run build && npm test -- --watch=false` |

## Execution Plan

### Phase 1: Token foundation

`T1`

### Phase 2: Catalog implementation

`T2 -> T3 -> T4`

## Task Breakdown

### T1: Define the seasonal Material token contract

**What**: Extend the root and each seasonal theme with canvas and glass-ring tokens consumed by the Material-first catalog.
**Where**: `src/styles.scss`
**Depends on**: None
**Requirement**: MSDS-03, MSDS-04
**Tests**: build
**Gate**: build

**Completed**: 2026-08-22 — `npm run build` passed.

### T2: Rebuild the showcase as a Material-first catalog

**What**: Replace the current specimen-heavy template with a focused Material catalog with stable anchor sections and live theme controls.
**Where**: `src/app/features/design-system/`
**Depends on**: T1
**Requirement**: MSDS-01, MSDS-02, MSDS-04, MSDS-05, MSDS-06
**Tests**: unit
**Gate**: quick

### T3: Assert showcase behavior and accessibility contracts

**What**: Replace stale unit expectations with requirements-derived assertions for Material families, anchor navigation, and root theme controls.
**Where**: `src/app/features/design-system/design-system-showcase.container.spec.ts`
**Depends on**: T2
**Requirement**: MSDS-01, MSDS-02, MSDS-03, MSDS-06
**Tests**: unit
**Gate**: quick

### T4: Update browser-level catalog coverage

**What**: Update the atomic E2E assertions for the anchored Material catalog and responsive accessibility contract.
**Where**: `e2e/specs/design-system-showcase.spec.ts`
**Depends on**: T3
**Requirement**: MSDS-01, MSDS-02, MSDS-05, MSDS-06
**Tests**: e2e
**Gate**: full
