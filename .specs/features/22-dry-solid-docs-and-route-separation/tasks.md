# Feature 22: DRY/SOLID Architecture, Route Separation & Documentation Sync Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Design**: `.specs/features/22-dry-solid-docs-and-route-separation/design.md`  
**Status**: Draft  

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec - confirm before Execute. Guidelines found: `AGENTS.md`, `DESIGN.md`, `.specs/STATE.md` (AD-001..AD-041).

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
|---|---|---|---|---|
| Core Utilities | unit | All pure functions; 1:1 with helper requirements and edge cases | `src/app/core/utils/**/*.spec.ts` | `npm test -- --watch=false` |
| Models & Types | none | - (build gate and strict TypeScript compiler check) | `src/app/core/models/**/*.ts` | `npm run build` |
| Core Services | unit | 1:1 to spec ACs, all branches, error handling | `src/app/core/services/**/*.spec.ts` | `npm test -- --watch=false` |
| Route Guards | unit | `authGuard` and `superAdminGuard` with `waitForAuthReady()` resolution | `src/app/core/guards/**/*.spec.ts` | `npm test -- --watch=false` |
| Feature Containers & Components | unit | Component API, inputs, outputs, OnPush change detection | `src/app/features/**/*.spec.ts` | `npm test -- --watch=false` |
| Documentation & Skills | none | - (build gate and structural markdown check) | `.agents/skills/**/*.md`, `docs/**/*.md` | `npm run build` |
| E2E Test Suites & Harnesses | e2e | All user journeys, mock auth deduplication, no legacy fallback selectors | `e2e/specs/**/*.spec.ts` | `npm run test:e2e` |

## Gate Check Commands

> Generated from codebase - confirm before Execute.

| Gate Level | When to Use | Command |
|---|---|---|
| Quick | After tasks with unit tests only | `npm test -- --watch=false` |
| Full | After tasks with e2e/integration tests | `npm test -- --watch=false && npm run test:e2e` |
| Build | After phase completion or config/model/doc tasks | `npm run build && npm test -- --watch=false` |

---

## Execution Plan

Phases are ordered and run sequentially - each phase completes before the next begins, and tasks within a phase execute in order.

### Phase 1: Core Utilities & Granular Models

Pure utility functions, comprehensive unit tests, consumer adoption, and granular model decomposition.

```
T1 -> T2 -> T3 -> T4 -> T5
```

### Phase 2: Service SRP, Reactive Auth & Type Safety

`FirestoreGateway` typed mock store, `$any` elimination, `AuthService` signals, and `UserService` SRP refactoring.

```
T6 -> T7 -> T8 -> T9 -> T10
```

### Phase 3: Route & Domain Decoupling (/admin vs /meus-eventos)

Container relocation, `ORGANIZER_ROUTES`, dedicated Super Admin `AdminDashboardContainer`, and route tree registration.

```
T11 -> T12 -> T13 -> T14 -> T15
```

### Phase 4: Documentation Synchronization & Agent Skills Library

Agent skills library in `.agents/skills/`, `docs/STYLE_GUIDE.md`, and project documentation sync across all channels.

```
T16 -> T17 -> T18 -> T19 -> T20
```

### Phase 5: Playwright E2E Mock Setup Deduplication & Harness Refactoring

Mock session deduplication across E2E specs and cleanup of legacy selector fallbacks in harnesses.

```
T21 -> T22 -> T23 -> T24 -> T25
```

---

## Task Breakdown

### Phase 1: Core Utilities & Granular Models

#### T1: Create Pure Shared Utility Functions in `src/app/core/utils/`

**What**: Create pure utility modules for date formatting, sharing helpers, crypto ID generation, CEP formatting, and relationship options.  
**Where**: `src/app/core/utils/index.ts`  
**Depends on**: None  
**Reuses**: Native `Intl`, `crypto.randomUUID()`, and regex helpers  
**Requirement**: DRY-01  

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] `src/app/core/utils/date.utils.ts` exports `formatDate`, `getDay`, `getMonth`, `formatTime`
- [ ] `src/app/core/utils/sharing.utils.ts` exports `buildWhatsAppShareUrl`, `shareWhatsApp`, `copyToClipboard`
- [ ] `src/app/core/utils/id.utils.ts` exports `generateId`, `generateNotificationId`
- [ ] `src/app/core/utils/cep.utils.ts` exports `formatCep`, `cleanCep`, `isValidCep`
- [ ] `src/app/core/utils/relationship.utils.ts` exports `RELATIONSHIP_OPTIONS`, `getRelationshipLabel`
- [ ] `src/app/core/utils/index.ts` re-exports all utility functions cleanly
- [ ] Gate check passes: `npm test -- --watch=false`

**Tests**: unit  
**Gate**: quick  
**Commit**: `feat(core): add shared pure utility modules in core/utils`

---

#### T2: Add Comprehensive Unit Tests for Core Utility Functions

**What**: Create unit test suite verifying formatting, parsing, edge cases, and fallbacks for all utility functions in `src/app/core/utils/`.  
**Where**: `src/app/core/utils/utils.spec.ts`  
**Depends on**: T1  
**Reuses**: Testing fixtures and mock utilities  
**Requirement**: DRY-01, DRY-02  

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] Tests verify `date.utils.ts` with valid dates, invalid strings, and boundary values
- [ ] Tests verify `sharing.utils.ts` WhatsApp URI construction and clipboard operations
- [ ] Tests verify `id.utils.ts` unique generation and prefix format
- [ ] Tests verify `cep.utils.ts` masking, digit stripping, and length checks
- [ ] Tests verify `relationship.utils.ts` label mappings for all 6 relation types
- [ ] Gate check passes: `npm test -- --watch=false`

**Tests**: unit  
**Gate**: quick  
**Commit**: `test(core): add unit tests for shared core utilities`

---

#### T3: Consume Shared Utilities Across Feature Containers and Components

**What**: Refactor `HomeContainer`, `DashboardContainer`, `SharePanelComponent`, `EventEditorContainer`, and `FamilySelectorComponent` to import utilities from `src/app/core/utils/`.  
**Where**: `src/app/features/home/home.container.ts`  
**Depends on**: T2  
**Reuses**: `src/app/core/utils/`  
**Requirement**: DRY-02  

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] Local duplicate `formatDate`, `getDay`, `getMonth` removed and replaced by `@core/utils`
- [ ] Local duplicate `shareWhatsApp`, `copyLink` removed and replaced by `@core/utils`
- [ ] Local duplicate `formatCep` removed and replaced by `@core/utils`
- [ ] Gate check passes: `npm test -- --watch=false`

**Tests**: unit  
**Gate**: quick  
**Commit**: `refactor(features): consume shared utilities from core/utils`

---

#### T4: Create Granular Model Definitions in `src/app/core/models/`

**What**: Decompose monolithic model files into granular one-file-per-interface models for dialogs, relationships, family creations, and showcase navigation.  
**Where**: `src/app/core/models/relationship-option.model.ts`  
**Depends on**: T3  
**Reuses**: Existing model interfaces  
**Requirement**: DRY-03  

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] Create `src/app/core/models/batch-primary-guest-input.model.ts`
- [ ] Create `src/app/core/models/guest-form-dialog-data.model.ts`
- [ ] Create `src/app/core/models/guest-form-dialog-result.model.ts`
- [ ] Create `src/app/core/models/relationship-option.model.ts`
- [ ] Create `src/app/core/models/family-member-create.model.ts`
- [ ] Create `src/app/core/models/org-confirm-dialog-data.model.ts`
- [ ] Create `src/app/core/models/via-cep-response.model.ts`
- [ ] Create `src/app/core/models/design-system-navigation-item.model.ts`
- [ ] Create `src/app/core/models/design-system-navigation-group.model.ts`
- [ ] Gate check passes: `npm run build && npm test -- --watch=false`

**Tests**: none  
**Gate**: build  
**Commit**: `refactor(core): create granular one-file-per-interface models`

---

#### T5: Export Consolidated Models from `models/index.ts` and Clean Consumers

**What**: Update `src/app/core/models/index.ts` to export all granular models and eliminate duplicate local interface declarations in components and services.  
**Where**: `src/app/core/models/index.ts`  
**Depends on**: T4  
**Reuses**: `src/app/core/models/`  
**Requirement**: DRY-04  

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] `src/app/core/models/index.ts` exports all consolidated models
- [ ] Components (`OrgConfirmDialogComponent`, `FamilySelectorComponent`, etc.) import models from `@core/models`
- [ ] Zero duplicate interface declarations exist across models, services, and components
- [ ] Gate check passes: `npm test -- --watch=false`

**Tests**: unit  
**Gate**: quick  
**Commit**: `refactor(core): export consolidated models via index.ts barrel`

---

### Phase 2: Service SRP, Reactive Auth & Type Safety

#### T6: Create Typed `mock-window.d.ts` and Remove `any` from `firestore.gateway.ts`

**What**: Declare global `Window.__MOCK_DOCUMENTS__` type definition and eliminate all 21 `(window as any)` type casts in `firestore.gateway.ts`.  
**Where**: `src/app/core/services/firestore.gateway.ts`  
**Depends on**: T5  
**Reuses**: TypeScript declaration files  
**Requirement**: DRY-13, DRY-14  

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] `src/app/testing/types/mock-window.d.ts` created defining `MockDocumentStore` and augmenting `Window`
- [ ] `firestore.gateway.ts` accesses `window.__MOCK_DOCUMENTS__` with zero `(window as any)` or `any` casts
- [ ] `grep -rn '(window as any)' src/app/` returns 0 results
- [ ] Gate check passes: `npm test -- --watch=false`

**Tests**: unit  
**Gate**: quick  
**Commit**: `refactor(core): declare typed mock window and eliminate any in firestore gateway`

---

#### T7: Remove `$any()` Casting from `org-date-field.component.html`

**What**: Replace `$any($event.target).value` in `org-date-field.component.html` with typed DOM event handling in `org-date-field.component.ts`.  
**Where**: `src/app/shared/ui/forms/org-date-field.component.html`  
**Depends on**: T6  
**Reuses**: Angular template event binding  
**Requirement**: DRY-15  

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] Template event binding uses typed `(input)="onInputChange($event)"`
- [ ] Component method safely extracts `(event.target as HTMLInputElement | null)?.value`
- [ ] Zero occurrences of `$any` remain in `src/app/` templates
- [ ] Gate check passes: `npm test -- --watch=false`

**Tests**: unit  
**Gate**: quick  
**Commit**: `refactor(ui): eliminate $any casting in date-field component template`

---

#### T8: Add `isAuthenticated` and `waitForAuthReady()` to `AuthService`

**What**: Add computed `isAuthenticated` signal and promise-based `waitForAuthReady()` to `AuthService` and update unit tests.  
**Where**: `src/app/core/services/auth.service.ts`  
**Depends on**: T7  
**Reuses**: Firebase Auth `authStateReady()`  
**Requirement**: DRY-05, DRY-06  

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] `isAuthenticated` computed signal returns true for non-null, non-anonymous users
- [ ] `waitForAuthReady()` returns Promise resolving when auth state is ready
- [ ] `src/app/core/services/auth.service.spec.ts` covers `isAuthenticated` and `waitForAuthReady`
- [ ] Gate check passes: `npm test -- --watch=false`

**Tests**: unit  
**Gate**: quick  
**Commit**: `feat(auth): add isAuthenticated signal and waitForAuthReady to AuthService`

---

#### T9: Refactor `auth.guard.ts` and `super-admin.guard.ts` to Use `waitForAuthReady()`

**What**: Remove manual `effect()` polling waiters in `auth.guard.ts` and `super-admin.guard.ts`, consuming `AuthService.waitForAuthReady()` directly.  
**Where**: `src/app/core/guards/auth.guard.ts`  
**Depends on**: T8  
**Reuses**: `AuthService.waitForAuthReady()`  
**Requirement**: DRY-07  

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] `auth.guard.ts` awaits `waitForAuthReady()` and checks `authService.isAuthenticated()`
- [ ] `super-admin.guard.ts` awaits `waitForAuthReady()` and checks `authService.isSuperAdmin()`
- [ ] Guard unit test suites `auth.guard.spec.ts` and `super-admin.guard.spec.ts` updated and green
- [ ] Gate check passes: `npm test -- --watch=false`

**Tests**: unit  
**Gate**: quick  
**Commit**: `refactor(guards): streamline auth and super admin guards with waitForAuthReady`

---

#### T10: Refactor `UserService` for SRP (Remove Passthroughs and Duplicate Mappers)

**What**: Remove `getFamilyMembers`, `addFamilyMember`, and `deleteFamilyMember` passthroughs from `UserService`, and delegate event data mapping to `EventService`.  
**Where**: `src/app/core/services/user.service.ts`  
**Depends on**: T9  
**Reuses**: `FamilyService` and `EventService`  
**Requirement**: DRY-08, DRY-09  

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] Family passthrough methods removed from `UserService`
- [ ] Private `mapEventData` removed from `UserService`; delegates mapping to `EventService`
- [ ] `UserService` unit tests updated to verify clean single responsibility
- [ ] Gate check passes: `npm test -- --watch=false`

**Tests**: unit  
**Gate**: quick  
**Commit**: `refactor(services): enforce SRP in UserService by delegating to FamilyService and EventService`

---

### Phase 3: Route & Domain Decoupling (/admin vs /meus-eventos)

#### T11: Relocate Organizer Dashboard and Event Editor Containers to `src/app/features/organizer/`

**What**: Move `DashboardContainer`, `EventEditorContainer`, and `SharePanelComponent` from `features/admin/` to `features/organizer/` and update internal imports.  
**Where**: `src/app/features/organizer/dashboard/dashboard.container.ts`  
**Depends on**: T10  
**Reuses**: Existing organizer dashboard and event editor implementations  
**Requirement**: DRY-10  

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] `DashboardContainer` files relocated to `src/app/features/organizer/dashboard/`
- [ ] `EventEditorContainer` files relocated to `src/app/features/organizer/event-editor/`
- [ ] `SharePanelComponent` relocated to `src/app/features/organizer/event-editor/components/share-panel/`
- [ ] All relative imports updated cleanly
- [ ] Gate check passes: `npm test -- --watch=false`

**Tests**: unit  
**Gate**: quick  
**Commit**: `refactor(organizer): relocate dashboard and event editor containers to organizer feature`

---

#### T12: Create `ORGANIZER_ROUTES` in `src/app/features/organizer/organizer.routes.ts`

**What**: Define `ORGANIZER_ROUTES` route configuration mapping `''` to `DashboardContainer` and `'evento/novo'`, `'evento/:id'` to `EventEditorContainer`.  
**Where**: `src/app/features/organizer/organizer.routes.ts`  
**Depends on**: T11  
**Reuses**: Angular Router `Routes`  
**Requirement**: DRY-10, DRY-12  

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] `ORGANIZER_ROUTES` created and exported in `src/app/features/organizer/organizer.routes.ts`
- [ ] Lazy-load route definitions correctly load organizer containers
- [ ] Unit test verifies route definitions
- [ ] Gate check passes: `npm test -- --watch=false`

**Tests**: unit  
**Gate**: quick  
**Commit**: `feat(organizer): create dedicated ORGANIZER_ROUTES for organizer domain`

---

#### T13: Create Dedicated `AdminDashboardContainer` in `src/app/features/admin/`

**What**: Implement dedicated Super Admin management container in `src/app/features/admin/admin-dashboard.container.ts` for platform overview, metrics, and admin management.  
**Where**: `src/app/features/admin/admin-dashboard.container.ts`  
**Depends on**: T12  
**Reuses**: `AuthService.listAdmins()`, `AuthService.removeAdmin()`, and `AdminFormDrawerComponent`  
**Requirement**: DRY-11  

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] `AdminDashboardContainer` created with template, styles, and unit tests
- [ ] Displays Super Admin header, platform metrics cards, and admin users list
- [ ] Integrates `AdminFormDrawerComponent` for adding admins
- [ ] Gate check passes: `npm test -- --watch=false`

**Tests**: unit  
**Gate**: quick  
**Commit**: `feat(admin): create dedicated AdminDashboardContainer for Super Admin governance`

---

#### T14: Create `ADMIN_ROUTES` in `src/app/features/admin/admin.routes.ts` for Super Admin

**What**: Update `ADMIN_ROUTES` in `src/app/features/admin/admin.routes.ts` to route exclusively to `AdminDashboardContainer`.  
**Where**: `src/app/features/admin/admin.routes.ts`  
**Depends on**: T13  
**Reuses**: Angular Router `Routes`  
**Requirement**: DRY-11, DRY-12  

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] `ADMIN_ROUTES` maps `path: ''` to `AdminDashboardContainer`
- [ ] Removed organizer event routes from `ADMIN_ROUTES`
- [ ] Unit tests for admin routes updated
- [ ] Gate check passes: `npm test -- --watch=false`

**Tests**: unit  
**Gate**: quick  
**Commit**: `feat(admin): configure dedicated ADMIN_ROUTES for Super Admin platform domain`

---

#### T15: Update `app.routes.ts` and Route Tests for Domain Separation

**What**: Update `src/app/app.routes.ts` to map `/meus-eventos` to `ORGANIZER_ROUTES` and `/admin` to `ADMIN_ROUTES`, updating route unit tests.  
**Where**: `src/app/app.routes.ts`  
**Depends on**: T14  
**Reuses**: Angular Router  
**Requirement**: DRY-10, DRY-11, DRY-12  

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] `/meus-eventos` lazy-loads `ORGANIZER_ROUTES` under `authGuard`
- [ ] `/admin` lazy-loads `ADMIN_ROUTES` under `superAdminGuard`
- [ ] `src/app/app.routes.spec.ts` passes with 100% assertions
- [ ] Gate check passes: `npm test -- --watch=false`

**Tests**: unit  
**Gate**: quick  
**Commit**: `refactor(routes): wire decoupled organizer and admin route domains in app.routes`

---

### Phase 4: Documentation Synchronization & Agent Skills Library

#### T16: Create `.agents/skills/style-guide/SKILL.md` and Mirror `docs/STYLE_GUIDE.md`

**What**: Create comprehensive engineering style guide with concrete code DOs/DON'Ts for TypeScript strictness, OnPush Signals, BEM SCSS, Firebase, and WCAG accessibility, referencing `tdd`, `bem-css`, and `tlc-spec-driven`.  
**Where**: `docs/STYLE_GUIDE.md`  
**Depends on**: T15  
**Reuses**: Project design tokens and architecture rules  
**Requirement**: DRY-19, DRY-23  

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] `.agents/skills/style-guide/SKILL.md` created with YAML frontmatter, rules, and code snippets
- [ ] `docs/STYLE_GUIDE.md` mirrored for human contributors and showcase documentation
- [ ] References `tdd`, `bem-css`, and `tlc-spec-driven`
- [ ] Gate check passes: `npm run build && npm test -- --watch=false`

**Tests**: none  
**Gate**: build  
**Commit**: `docs(skills): create engineering style-guide skill and docs mirror`

---

#### T17: Create `.agents/skills/creating-pages/SKILL.md`

**What**: Create actionable step-by-step skill guide for authoring routed Smart Container pages, layout primitives, routing, and guards.  
**Where**: `.agents/skills/creating-pages/SKILL.md`  
**Depends on**: T16  
**Reuses**: Smart/Dumb pattern, layout primitives (`OrgPageLayout`, `OrgPageHeader`, `OrgSection`)  
**Requirement**: DRY-20, DRY-23  

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] `.agents/skills/creating-pages/SKILL.md` created with container recipe, state handling, and route setup
- [ ] References `tdd`, `bem-css`, and `tlc-spec-driven`
- [ ] Gate check passes: `npm run build && npm test -- --watch=false`

**Tests**: none  
**Gate**: build  
**Commit**: `docs(skills): create creating-pages agent skill guide`

---

#### T18: Create `.agents/skills/creating-components/SKILL.md`

**What**: Create actionable step-by-step skill guide for authoring pure Dumb Presentational components with `input()`, `output()`, and `ChangeDetectionStrategy.OnPush`.  
**Where**: `.agents/skills/creating-components/SKILL.md`  
**Depends on**: T17  
**Reuses**: Presentational component conventions  
**Requirement**: DRY-21, DRY-23  

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] `.agents/skills/creating-components/SKILL.md` created with OnPush, signal inputs/outputs, and BEM SCSS
- [ ] References `tdd`, `bem-css`, and `tlc-spec-driven`
- [ ] Gate check passes: `npm run build && npm test -- --watch=false`

**Tests**: none  
**Gate**: build  
**Commit**: `docs(skills): create creating-components agent skill guide`

---

#### T19: Create `.agents/skills/design-system-usage/SKILL.md`

**What**: Create complete component catalog guide documenting all 32 `Org*` design system primitives and their imports from `@shared/ui`.  
**Where**: `.agents/skills/design-system-usage/SKILL.md`  
**Depends on**: T18  
**Reuses**: `@shared/ui` catalog  
**Requirement**: DRY-22, DRY-23  

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] `.agents/skills/design-system-usage/SKILL.md` catalogs all 32 components with input/output contracts
- [ ] Replaces raw Angular Material tag references with canonical `Org*` components
- [ ] References `tdd`, `bem-css`, and `tlc-spec-driven`
- [ ] Gate check passes: `npm run build && npm test -- --watch=false`

**Tests**: none  
**Gate**: build  
**Commit**: `docs(skills): create design-system-usage agent skill catalog`

---

#### T20: Synchronize `README.md`, `AGENTS.md`, `CONTEXT.md`, `DESIGN.md`, `.gemini/GEMINI.md`, `.claude/CLAUDE.md`, and `STATE.md`

**What**: Update all project documentation files to eliminate outdated references, synchronize test metrics (79 unit suites / 426 tests, 15 E2E suites / 158 tests), document AD-001 through AD-041, and enforce `DESIGN.md` as the sole source of truth for design tokens.  
**Where**: `README.md`  
**Depends on**: T19  
**Reuses**: `.specs/STATE.md` ADRs and verified metrics  
**Requirement**: DRY-16, DRY-17, DRY-18  

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] `README.md` documents verified test counts (79 unit suites / 426 tests, 15 E2E suites / 158 tests) and 17 core services
- [ ] `DESIGN.md` serves as exclusive source of truth for design tokens and component catalog
- [ ] `AGENTS.md`, `CONTEXT.md`, `.gemini/GEMINI.md`, `.claude/CLAUDE.md`, and `STATE.md` aligned with AD-001..AD-041
- [ ] Gate check passes: `npm run build && npm test -- --watch=false`

**Tests**: none  
**Gate**: build  
**Commit**: `docs: synchronize README, AGENTS, CONTEXT, and STATE with verified project metrics`

---

### Phase 5: Playwright E2E Mock Setup Deduplication & Harness Refactoring

#### T21: Deduplicate Mock Auth Setup in `e2e/specs/07-visual-layout.spec.ts`

**What**: Replace custom `setupVisualMockSession()` in `e2e/specs/07-visual-layout.spec.ts` with centralized `setupMockAuthSession()` from `auth-mock.helper.ts`.  
**Where**: `e2e/specs/07-visual-layout.spec.ts`  
**Depends on**: T20  
**Reuses**: `e2e/helpers/auth-mock.helper.ts`  
**Requirement**: DRY-24  

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] `07-visual-layout.spec.ts` uses `setupMockAuthSession()`
- [ ] Redundant 40-line route mocking helper removed
- [ ] Gate check passes: `npm test -- --watch=false && npm run test:e2e`

**Tests**: e2e  
**Gate**: full  
**Commit**: `test(e2e): use setupMockAuthSession in visual layout spec`

---

#### T22: Deduplicate Mock Auth Setup in `e2e/specs/08-keyboard-a11y.spec.ts`

**What**: Replace custom `setupA11yMockSession()` in `e2e/specs/08-keyboard-a11y.spec.ts` with centralized `setupMockAuthSession()` from `auth-mock.helper.ts`.  
**Where**: `e2e/specs/08-keyboard-a11y.spec.ts`  
**Depends on**: T21  
**Reuses**: `e2e/helpers/auth-mock.helper.ts`  
**Requirement**: DRY-24  

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] `08-keyboard-a11y.spec.ts` uses `setupMockAuthSession()`
- [ ] Redundant 40-line route mocking helper removed
- [ ] Gate check passes: `npm test -- --watch=false && npm run test:e2e`

**Tests**: e2e  
**Gate**: full  
**Commit**: `test(e2e): use setupMockAuthSession in keyboard a11y spec`

---

#### T23: Deduplicate Mock Auth Setup in `e2e/specs/09-multi-user-sync.spec.ts`

**What**: Replace custom `setupHostSession()` and guest mock setup in `e2e/specs/09-multi-user-sync.spec.ts` with `setupMockAuthSession()`.  
**Where**: `e2e/specs/09-multi-user-sync.spec.ts`  
**Depends on**: T22  
**Reuses**: `e2e/helpers/auth-mock.helper.ts`  
**Requirement**: DRY-24  

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] `09-multi-user-sync.spec.ts` uses `setupMockAuthSession()` with context-scoped options
- [ ] Redundant session setup code removed
- [ ] Gate check passes: `npm test -- --watch=false && npm run test:e2e`

**Tests**: e2e  
**Gate**: full  
**Commit**: `test(e2e): use setupMockAuthSession in multi-user sync spec`

---

#### T24: Refactor `ConfirmDialogHarness` to Remove Legacy Fallback Selectors

**What**: Clean up `e2e/components/confirm-dialog.harness.ts` to directly locate active `org-confirm-dialog` elements and remove legacy fallback locators.  
**Where**: `e2e/components/confirm-dialog.harness.ts`  
**Depends on**: T23  
**Reuses**: Playwright `getByTestId` locators  
**Requirement**: DRY-25  

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] `ConfirmDialogHarness` targets `org-confirm-dialog`, `org-confirm-submit`, `org-confirm-cancel`
- [ ] Legacy selectors (`.confirm-dialog__confirm-btn`, `app-confirm-dialog`, etc.) removed
- [ ] Gate check passes: `npm test -- --watch=false && npm run test:e2e`

**Tests**: e2e  
**Gate**: full  
**Commit**: `test(e2e): clean up confirm dialog harness to target active Org components`

---

#### T25: Refactor `RsvpDialogHarness` to Remove Legacy Fallback Selectors

**What**: Clean up `e2e/components/rsvp-dialog.harness.ts` to directly locate active `rsvp-drawer` and `Org*` form controls, removing legacy fallback locators.  
**Where**: `e2e/components/rsvp-dialog.harness.ts`  
**Depends on**: T24  
**Reuses**: Playwright `getByTestId` locators  
**Requirement**: DRY-25  

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] `RsvpDialogHarness` targets `rsvp-drawer`, `rsvp-confirm-btn`, `rsvp-phone-input`, `rsvp-name-input`
- [ ] Legacy selectors (`app-guest-form-dialog`, `input[formcontrolname="phone"]`, etc.) removed
- [ ] Gate check passes: `npm test -- --watch=false && npm run test:e2e`

**Tests**: e2e  
**Gate**: full  
**Commit**: `test(e2e): clean up rsvp dialog harness to target active Org components`

---

## Phase Execution Map

Visual representation of task ordering. Phases run in sequence, and tasks within a phase run in order:

```
Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5

Phase 1:  T1 ──────→ T2 ──────→ T3 ──────→ T4 ──────→ T5
Phase 2:  T6 ──────→ T7 ──────→ T8 ──────→ T9 ──────→ T10
Phase 3:  T11 ─────→ T12 ─────→ T13 ─────→ T14 ─────→ T15
Phase 4:  T16 ─────→ T17 ─────→ T18 ─────→ T19 ─────→ T20
Phase 5:  T21 ─────→ T22 ─────→ T23 ─────→ T24 ─────→ T25
```

---

## Task Granularity Check

Before approving tasks, verify they are granular enough:

| Task | Scope | Status |
|---|---|---|
| T1: Create Pure Shared Utility Functions | 1 directory / pure modules | ✅ Granular |
| T2: Add Comprehensive Unit Tests for Core Utilities | 1 test suite | ✅ Granular |
| T3: Consume Shared Utilities Across Feature Containers | 1 primary container | ✅ Granular |
| T4: Create Granular Model Definitions | 1 model interface file | ✅ Granular |
| T5: Export Consolidated Models from `models/index.ts` | 1 barrel file | ✅ Granular |
| T6: Create Typed `mock-window.d.ts` and Clean `firestore.gateway.ts` | 1 service file | ✅ Granular |
| T7: Remove `$any()` Casting from `org-date-field.component.html` | 1 component template | ✅ Granular |
| T8: Add `isAuthenticated` and `waitForAuthReady()` to `AuthService` | 1 service file | ✅ Granular |
| T9: Refactor Guards to Use `waitForAuthReady()` | 1 guard file | ✅ Granular |
| T10: Refactor `UserService` for SRP | 1 service file | ✅ Granular |
| T11: Relocate Organizer Dashboard and Event Editor | 1 container file | ✅ Granular |
| T12: Create `ORGANIZER_ROUTES` in `organizer.routes.ts` | 1 route file | ✅ Granular |
| T13: Create Dedicated `AdminDashboardContainer` | 1 container file | ✅ Granular |
| T14: Create `ADMIN_ROUTES` in `admin.routes.ts` | 1 route file | ✅ Granular |
| T15: Update `app.routes.ts` for Domain Separation | 1 route file | ✅ Granular |
| T16: Create `style-guide/SKILL.md` and Mirror `docs/STYLE_GUIDE.md` | 1 doc file | ✅ Granular |
| T17: Create `creating-pages/SKILL.md` | 1 skill file | ✅ Granular |
| T18: Create `creating-components/SKILL.md` | 1 skill file | ✅ Granular |
| T19: Create `design-system-usage/SKILL.md` | 1 skill file | ✅ Granular |
| T20: Synchronize Project Documentation Across Files | 1 readme file | ✅ Granular |
| T21: Deduplicate Mock Auth in `07-visual-layout.spec.ts` | 1 E2E spec | ✅ Granular |
| T22: Deduplicate Mock Auth in `08-keyboard-a11y.spec.ts` | 1 E2E spec | ✅ Granular |
| T23: Deduplicate Mock Auth in `09-multi-user-sync.spec.ts` | 1 E2E spec | ✅ Granular |
| T24: Refactor `ConfirmDialogHarness` | 1 harness file | ✅ Granular |
| T25: Refactor `RsvpDialogHarness` | 1 harness file | ✅ Granular |

---

## Diagram-Definition Cross-Check

Before approving tasks, verify the execution diagram is consistent with the task definitions:

| Task | Depends On (task body) | Diagram Shows | Status |
|---|---|---|---|
| T1 | None | None (starts Phase 1) | ✅ Match |
| T2 | T1 | T1 -> T2 | ✅ Match |
| T3 | T2 | T2 -> T3 | ✅ Match |
| T4 | T3 | T3 -> T4 | ✅ Match |
| T5 | T4 | T4 -> T5 | ✅ Match |
| T6 | T5 | None (starts Phase 2) | ✅ Match |
| T7 | T6 | T6 -> T7 | ✅ Match |
| T8 | T7 | T7 -> T8 | ✅ Match |
| T9 | T8 | T8 -> T9 | ✅ Match |
| T10 | T9 | T9 -> T10 | ✅ Match |
| T11 | T10 | None (starts Phase 3) | ✅ Match |
| T12 | T11 | T11 -> T12 | ✅ Match |
| T13 | T12 | T12 -> T13 | ✅ Match |
| T14 | T13 | T13 -> T14 | ✅ Match |
| T15 | T14 | T14 -> T15 | ✅ Match |
| T16 | T15 | None (starts Phase 4) | ✅ Match |
| T17 | T16 | T16 -> T17 | ✅ Match |
| T18 | T17 | T17 -> T18 | ✅ Match |
| T19 | T18 | T18 -> T19 | ✅ Match |
| T20 | T19 | T19 -> T20 | ✅ Match |
| T21 | T20 | None (starts Phase 5) | ✅ Match |
| T22 | T21 | T21 -> T22 | ✅ Match |
| T23 | T22 | T22 -> T23 | ✅ Match |
| T24 | T23 | T23 -> T24 | ✅ Match |
| T25 | T24 | T24 -> T25 | ✅ Match |

---

## Test Co-location Validation

Before approving tasks, verify EVERY task's `Tests` field is consistent with the **Test Coverage Matrix**:

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
|---|---|---|---|---|
| T1: Create Pure Shared Utility Functions | Core Utilities | unit | unit | ✅ OK |
| T2: Add Comprehensive Unit Tests for Core Utilities | Core Utilities | unit | unit | ✅ OK |
| T3: Consume Shared Utilities Across Feature Containers | Feature Containers & Components | unit | unit | ✅ OK |
| T4: Create Granular Model Definitions | Models & Types | none | none | ✅ OK |
| T5: Export Consolidated Models from `models/index.ts` | Models & Types | unit | unit | ✅ OK |
| T6: Create Typed `mock-window.d.ts` and Clean `firestore.gateway.ts` | Core Services | unit | unit | ✅ OK |
| T7: Remove `$any()` Casting from `org-date-field.component.html` | Feature Containers & Components | unit | unit | ✅ OK |
| T8: Add `isAuthenticated` and `waitForAuthReady()` to `AuthService` | Core Services | unit | unit | ✅ OK |
| T9: Refactor Guards to Use `waitForAuthReady()` | Route Guards | unit | unit | ✅ OK |
| T10: Refactor `UserService` for SRP | Core Services | unit | unit | ✅ OK |
| T11: Relocate Organizer Dashboard and Event Editor | Feature Containers & Components | unit | unit | ✅ OK |
| T12: Create `ORGANIZER_ROUTES` in `organizer.routes.ts` | Feature Containers & Components | unit | unit | ✅ OK |
| T13: Create Dedicated `AdminDashboardContainer` | Feature Containers & Components | unit | unit | ✅ OK |
| T14: Create `ADMIN_ROUTES` in `admin.routes.ts` | Feature Containers & Components | unit | unit | ✅ OK |
| T15: Update `app.routes.ts` for Domain Separation | Feature Containers & Components | unit | unit | ✅ OK |
| T16: Create `style-guide/SKILL.md` and Mirror `docs/STYLE_GUIDE.md` | Documentation & Skills | none | none | ✅ OK |
| T17: Create `creating-pages/SKILL.md` | Documentation & Skills | none | none | ✅ OK |
| T18: Create `creating-components/SKILL.md` | Documentation & Skills | none | none | ✅ OK |
| T19: Create `design-system-usage/SKILL.md` | Documentation & Skills | none | none | ✅ OK |
| T20: Synchronize Project Documentation Across Files | Documentation & Skills | none | none | ✅ OK |
| T21: Deduplicate Mock Auth in `07-visual-layout.spec.ts` | E2E Test Suites & Harnesses | e2e | e2e | ✅ OK |
| T22: Deduplicate Mock Auth in `08-keyboard-a11y.spec.ts` | E2E Test Suites & Harnesses | e2e | e2e | ✅ OK |
| T23: Deduplicate Mock Auth in `09-multi-user-sync.spec.ts` | E2E Test Suites & Harnesses | e2e | e2e | ✅ OK |
| T24: Refactor `ConfirmDialogHarness` | E2E Test Suites & Harnesses | e2e | e2e | ✅ OK |
| T25: Refactor `RsvpDialogHarness` | E2E Test Suites & Harnesses | e2e | e2e | ✅ OK |

---

## Task Verification Standards

Every task follows the `Done when` + `Tests` + `Gate` fields defined in the **Task Breakdown** above. Each `Done when` entry is binary pass/fail and references the exact gate check command from the `Gate Check Commands` section.

---
