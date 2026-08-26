# Design-system information architecture tasks

## Execution Protocol

Implement these tasks with `tlc-spec-driven`. Each task updates its co-located tests, passes its gate, updates this file before committing, and uses an atomic Conventional Commit.

**Design**: `.specs/features/20-design-system-information-architecture/design.md`
**Status**: Complete

## Test Coverage Matrix

> Generated from `AGENTS.md`, `README.md`, `src/app/**/*.spec.ts`, and `e2e/specs/design-system-showcase.spec.ts`.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| --- | --- | --- | --- | --- |
| Shared navigation component | unit | Group names, semantic anchors, active location, and shared theme controls | `src/app/shared/ui/drawer/*.spec.ts` | `npx ng test organizaai --no-watch --include src/app/shared/ui/drawer/navigation-drawer.component.spec.ts` |
| Design-system showcase | unit | Every documented family and anchor maps to its explicit public API | `src/app/features/design-system/*.spec.ts` | `npx ng test organizaai --no-watch --include src/app/features/design-system/design-system-showcase.container.spec.ts` |
| Design-system route | e2e | Guard, grouped navigation, component examples, and 320px no-overflow | `e2e/specs/design-system-showcase.spec.ts` | `npx playwright test e2e/specs/design-system-showcase.spec.ts` |
| Styles and documentation | none | Build and deterministic UI contract only | `src/**/*.scss`, `DESIGN.md` | `npm run build && node scripts/validate-ui-contracts.mjs --strict` |

## Gate Check Commands

| Gate Level | When to Use | Command |
| --- | --- | --- |
| Quick | Shared component or showcase task | `npx ng test organizaai --no-watch --include src/app/shared/ui/drawer/navigation-drawer.component.spec.ts --include src/app/features/design-system/design-system-showcase.container.spec.ts` |
| Full | Catalog interaction task | `npx playwright test e2e/specs/design-system-showcase.spec.ts` |
| Build | Final validation | `npm run build && node scripts/validate-ui-contracts.mjs --strict` |

## Execution Plan

### Phase 1: Navigation source of truth

```
T1
```

### Phase 2: Structured catalog

```
T1 → T2 → T3
```

### Phase 3: Public verification

```
T3 → T4
```

## Task Breakdown

### T1: Centralize grouped catalog navigation

**What**: Create one typed Brand, Foundations, and Product navigation model, then render it through the shared design-system drawer mode.
**Where**: `src/app/core/models/design-system-navigation.model.ts`, `src/app/shared/ui/drawer/navigation-drawer.component.*`
**Depends on**: None
**Reuses**: `NavigationDrawerLinkComponent` and existing fragment active-state logic.
**Requirement**: DSIA-01

**Tools**:

- MCP: NONE
- Skill: `tlc-spec-driven`

**Done when**:

- [x] Drawer groups are `Marca`, `Fundações`, and `Produto` in order.
- [x] Every grouped item is an anchor to a stable design-system fragment.
- [x] Existing theme controls remain available in design-system mode.

**Tests**: unit
**Gate**: quick
**Commit**: `feat(design-system): group catalog navigation`

### T2: Split Brand and Foundations documentation

**What**: Separate colors, typography, iconography, tokens, and fundamentals into anchored sections with their own copyable explanations.
**Where**: `src/app/features/design-system/design-system-showcase.container.*`
**Depends on**: T1
**Reuses**: `DesignSystemCodeExampleComponent`, existing seasonal state, and existing token/type styles.
**Requirement**: DSIA-02, DSIA-04

**Tools**:

- MCP: NONE
- Skill: `tlc-spec-driven`

**Done when**:

- [x] Five foundation anchors match the shared navigation model.
- [x] Typography names all three type roles and iconography identifies Material Icons.
- [x] Each new section has one collapsed `Uso recomendado` disclosure.

**Tests**: unit
**Gate**: quick
**Commit**: `feat(design-system): structure brand foundations`

### T3: Complete product-family documentation

**What**: Make the Product catalog explicit, add the missing data-table preview, and ensure each family’s exact component selectors appear in its recommended usage example.
**Where**: `src/app/features/design-system/design-system-showcase.container.*`
**Depends on**: T2
**Reuses**: exported `Org*` components and `DesignSystemCodeExampleComponent`.
**Requirement**: DSIA-03, DSIA-04

**Tools**:

- MCP: NONE
- Skill: `tlc-spec-driven`

**Done when**:

- [x] Product index documents component families and their public API ownership.
- [x] Data display renders `org-data-table` with typed rows and columns.
- [x] Every Product family’s usage disclosure names every component rendered by that family.

**Tests**: unit
**Gate**: quick
**Commit**: `feat(design-system): complete component documentation`

### T4: Cover grouped catalog behaviour

**What**: Add route-level coverage for the new information architecture.
**Where**: `e2e/specs/design-system-showcase.spec.ts`
**Depends on**: T3
**Reuses**: existing mock-super-admin and design-token helpers.
**Requirement**: DSIA-01, DSIA-02, DSIA-03, DSIA-04

**Tools**:

- MCP: NONE
- Skill: `tlc-spec-driven`

**Done when**:

- [x] E2E asserts grouped drawer labels, foundation anchors, code disclosures, and the data-table preview.

**Tests**: e2e
**Gate**: full
**Commit**: `test(design-system): cover catalog information architecture`

## Phase Execution Map

```
Phase 1: T1
Phase 2: T1 → T2 → T3
Phase 3: T3 → T4
```

## Task Granularity Check

| Task | Scope | Status |
| --- | --- | --- |
| T1 | One shared navigation contract | ✅ Granular |
| T2 | One catalog documentation layer | ✅ Granular |
| T3 | One product catalog layer | ✅ Granular |
| T4 | One route-level verification update | ✅ Granular |

## Diagram-Definition Cross-Check

| Task | Depends On | Diagram Shows | Status |
| --- | --- | --- | --- |
| T1 | None | Start | ✅ Match |
| T2 | T1 | T1 → T2 | ✅ Match |
| T3 | T2 | T2 → T3 | ✅ Match |
| T4 | T3 | T3 → T4 | ✅ Match |

## Test Co-location Validation

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
| --- | --- | --- | --- | --- |
| T1 | Shared navigation component | unit | unit | ✅ OK |
| T2 | Design-system showcase | unit | unit | ✅ OK |
| T3 | Design-system showcase | unit | unit | ✅ OK |
| T4 | Route | e2e | e2e | ✅ OK |
