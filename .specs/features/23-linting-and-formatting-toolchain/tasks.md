# Feature 23: Linting, Formatting & Developer Style Guide Toolchain Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Spec**: `.specs/features/23-linting-and-formatting-toolchain/spec.md`  
**Design**: `.specs/features/23-linting-and-formatting-toolchain/design.md`  
**Status**: Draft  

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec - confirm before Execute. Guidelines found: `AGENTS.md`, `DESIGN.md`, `.specs/STATE.md`.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Tooling & Linter Configs | none | Build gate passes; linter/formatter execution verified with zero config errors | `eslint.config.mjs`, `stylelint.config.mjs`, `.prettierignore`, `.lintstagedrc.json`, `commitlint.config.mjs` | `npm run quality` |
| CI / CD Automation | none | YAML syntax valid; quality gate runs fail-fast ahead of E2E | `.github/workflows/quality.yml`, `.github/workflows/e2e.yml` | `npm run build` |
| Documentation & Skills | none | Markdown valid; recipes, DOs/DON'Ts, smart/dumb patterns, and verification checklists complete | `.agents/skills/**/*.md`, `docs/STYLE_GUIDE.md` | `npm run format:check` |
| Application & Test Suites | none | All linters and formatters pass clean; existing 426 unit tests & 158 E2E tests maintain 100% pass rate | `src/**/*.{ts,html,scss}`, `e2e/**/*.ts` | `npm run quality && npm test -- --watch=false` |

## Gate Check Commands

> Generated from codebase - confirm before Execute.

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | After tasks modifying formatting or skill documentation | `npm run format:check` |
| Full | After tasks modifying linters, git hooks, or CI workflows | `npm run quality` |
| Build | After phase completion or codebase-wide sweep tasks | `npm run quality && npm run build && npm test -- --watch=false` |

---

## Execution Plan

Phases are ordered and run sequentially - each phase completes before the next begins, and tasks within a phase execute in order.

### Phase 1: Foundation Tooling (ESLint, Stylelint, Prettier)

Install core quality dependencies and configure Flat Config ESLint, Stylelint for SCSS BEM/tokens, Prettier multi-format ignore/scripts, and Angular CLI architect target.

```
T1 → T2 → T3 → T4
```

### Phase 2: Git Hooks & CI Quality Gate

Configure commitlint for Conventional Commits, lint-staged for automated pre-commit fixing, and the fail-fast `quality.yml` GitHub Actions workflow.

```
T5 → T6 → T7
```

### Phase 3: Developer Style Guide & .agents AI Skills

Create project-local AI agent skills (`style-guide`, `creating-pages`, `creating-components`, `design-system-usage`) and mirror to `docs/STYLE_GUIDE.md`.

```
T8 → T9 → T10 → T11
```

### Phase 4: Integration, Unified Quality Script & Verification Gate

Wire the unified `npm run quality` script and execute a codebase-wide sweep ensuring clean linter execution across all TypeScript, SCSS, HTML, and E2E files.

```
T12 → T13
```

---

## Task Breakdown

### T1: Configure ESLint Flat Config for TypeScript, Templates & Playwright

**What**: Create `eslint.config.mjs` with Angular ESLint, TypeScript-ESLint, template a11y rules, test file overrides, `eslint-plugin-playwright`, and `eslint-config-prettier`.  
**Where**: `eslint.config.mjs`  
**Depends on**: None  
**Reuses**: `spec.md` P1 ESLint ACs, `eslint-config-prettier`  
**Requirement**: LINT-01, LINT-02, LINT-03, LINT-04, LINT-05, LINT-06, LINT-07, LINT-09, LINT-10, LINT-11  

**Tools**:
- MCP: `filesystem`
- Skill: NONE

**Done when**:
- [x] `eslint.config.mjs` exports flat config with TypeScript, HTML template, test override, and Playwright blocks
- [x] `@angular-eslint/prefer-on-push-component-change-detection`, `@angular-eslint/prefer-standalone`, and `@typescript-eslint/no-explicit-any` set to `error` for production code
- [x] Test files (`*.spec.ts`, `*.mock.ts`) configure `no-explicit-any: warn`
- [x] Playwright E2E files (`e2e/**/*.ts`) configure `eslint-plugin-playwright` rules
- [x] Template a11y rules configured at warning level
- [x] Gate check passes: `npx eslint --version`

**Tests**: none  
**Gate**: Build  
**Commit**: `chore(lint): configure flat config eslint for typescript templates and playwright`

---

### T2: Configure Stylelint SCSS Rules for BEM and Design Tokens

**What**: Create `stylelint.config.mjs` enforcing `declaration-no-important: true`, `color-no-hex` with `#fff`/`#000`/`#ffffff` allowlist, strict BEM regex, and `--org-*`/`--mat-*`/`--mdc-*` custom property patterns.  
**Where**: `stylelint.config.mjs`  
**Depends on**: T1  
**Reuses**: `DESIGN.md` §2, `stylelint-config-standard-scss`  
**Requirement**: LINT-12, LINT-13, LINT-14, LINT-15, LINT-16, LINT-17  

**Tools**:
- MCP: `filesystem`
- Skill: `bem-css`

**Done when**:
- [x] `stylelint.config.mjs` created with `stylelint-config-standard-scss`
- [x] `declaration-no-important` set to `true` for component stylesheets
- [x] `color-no-hex` set to `true` with allowlist for `#fff`, `#000`, and `#ffffff`
- [x] `selector-class-pattern` set to strict BEM regex: `^[a-z][a-z0-9]*(?:-[a-z0-9]+)*(?:__[a-z0-9]+(?:-[a-z0-9]+)*)?(?:--[a-z0-9]+(?:-[a-z0-9]+)*)?$`
- [x] `custom-property-pattern` allows `--org-`, `--mat-`, `--mdc-`, `--mat-sys-`, and `--showcase-`
- [x] Gate check passes: `npx stylelint --version`

**Tests**: none  
**Gate**: Build  
**Commit**: `chore(stylelint): configure scss linting for bem and design tokens`

---

### T3: Configure Prettier Multi-Format Formatting & Ignore

**What**: Create `.prettierignore` (excluding `dist/`, `node_modules/`, `.angular/`, `coverage/`, `e2e/screenshots/`, `graphify-out/`, `*.min.*`) and verify `.prettierrc` handles TS, HTML, SCSS, JSON, YML, MD files.  
**Where**: `.prettierignore`  
**Depends on**: T2  
**Reuses**: `/.prettierrc`  
**Requirement**: LINT-18, LINT-19, LINT-20  

**Tools**:
- MCP: `filesystem`
- Skill: NONE

**Done when**:
- [x] `.prettierignore` excludes build outputs, coverage, and screenshot baselines
- [x] `.prettierrc` configured with 100 print width, single quotes, and Angular HTML parser
- [x] Gate check passes: `npx prettier --check package.json`

**Tests**: none  
**Gate**: Quick  
**Commit**: `chore(prettier): configure prettierignore and multi format rules`

---

### T4: Configure Angular.json Lint Architect & Package Scripts

**What**: Add `@angular-eslint/builder:lint` target under `architect.lint` in `angular.json` and add `lint`, `lint:fix`, `lint:styles`, `lint:styles:fix`, `format:check`, and `format:write` scripts to `package.json`.  
**Where**: `angular.json`  
**Depends on**: T3  
**Reuses**: `/package.json`  
**Requirement**: LINT-01, LINT-02, LINT-08, LINT-12, LINT-13, LINT-18, LINT-19  

**Tools**:
- MCP: `filesystem`
- Skill: NONE

**Done when**:
- [ ] `angular.json` contains `architect.lint` target using `@angular-eslint/builder:lint`
- [ ] `package.json` contains scripts: `lint`, `lint:fix`, `lint:styles`, `lint:styles:fix`, `format:check`, `format:write`
- [ ] Required dev dependencies installed in `package.json`
- [ ] Gate check passes: `npm run lint || true`

**Tests**: none  
**Gate**: Build  
**Commit**: `chore(toolchain): configure angular lint architect target and npm scripts`

---

### T5: Configure Commitlint & Husky Hooks

**What**: Create `commitlint.config.mjs` extending `@commitlint/config-conventional` and initialize Husky `.husky/commit-msg` hook to validate commit messages.  
**Where**: `commitlint.config.mjs`  
**Depends on**: None  
**Reuses**: AD-012 Conventional Commits standard  
**Requirement**: LINT-22  

**Tools**:
- MCP: `filesystem`
- Skill: NONE

**Done when**:
- [ ] `commitlint.config.mjs` created extending `@commitlint/config-conventional`
- [ ] `.husky/commit-msg` hook invokes `npx --no -- commitlint --edit "${1}"`
- [ ] `package.json` contains `"prepare": "husky"`
- [ ] Gate check passes: `echo "feat(test): valid message" | npx commitlint`

**Tests**: none  
**Gate**: Build  
**Commit**: `chore(git-hooks): configure commitlint and husky commit msg hook`

---

### T6: Configure lint-staged & Pre-Commit Hook

**What**: Create `.lintstagedrc.json` mapping staged files to ESLint, Stylelint, and Prettier, and configure `.husky/pre-commit` to execute `npx lint-staged`.  
**Where**: `.lintstagedrc.json`  
**Depends on**: T5  
**Reuses**: `eslint.config.mjs`, `stylelint.config.mjs`, `.prettierrc`  
**Requirement**: LINT-21, LINT-23  

**Tools**:
- MCP: `filesystem`
- Skill: NONE

**Done when**:
- [ ] `.lintstagedrc.json` maps `*.{ts,html}` to ESLint + Prettier, `*.scss` to Stylelint + Prettier, `*.{json,yml,yaml,md}` to Prettier
- [ ] `.husky/pre-commit` hook runs `npx lint-staged`
- [ ] Gate check passes: `npx lint-staged --help`

**Tests**: none  
**Gate**: Build  
**Commit**: `chore(git-hooks): configure lint staged pre commit hook`

---

### T7: Create CI Quality Gate Workflow & Chain E2E

**What**: Create `.github/workflows/quality.yml` running lint, styles, contracts, format, and build, and update `.github/workflows/e2e.yml` to run downstream of quality checks.  
**Where**: `.github/workflows/quality.yml`  
**Depends on**: T6  
**Reuses**: `.github/workflows/e2e.yml`  
**Requirement**: LINT-29, LINT-30, LINT-31  

**Tools**:
- MCP: `filesystem`
- Skill: NONE

**Done when**:
- [ ] `.github/workflows/quality.yml` created executing `lint`, `lint:styles`, `lint:contracts`, `format:check`, and `build`
- [ ] Workflow triggers on pull requests and pushes to `main`
- [ ] `.github/workflows/e2e.yml` updated with workflow alignment
- [ ] Gate check passes: `npm run build`

**Tests**: none  
**Gate**: Build  
**Commit**: `ci(workflows): add quality gate workflow and chain e2e execution`

---

### T8: Create Developer & AI Style Guide Skill & Mirror

**What**: Remove broken `.agents` symlink, create `.agents/skills/style-guide/SKILL.md` and `docs/STYLE_GUIDE.md` containing TypeScript/Angular/SCSS/Firebase DOs and DON'Ts, verification checklist (`npm run quality`, `npm run build`), and references to `tdd`, `bem-css`, `tlc-spec-driven`.  
**Where**: `.agents/skills/style-guide/SKILL.md`  
**Depends on**: None  
**Reuses**: `AGENTS.md`, `DESIGN.md`, `.specs/STATE.md`  
**Requirement**: LINT-24, LINT-28, LINT-33, LINT-34  

**Tools**:
- MCP: `filesystem`
- Skill: NONE

**Done when**:
- [ ] Broken symlink removed and directory `.agents/skills/style-guide/` created
- [ ] `SKILL.md` contains comprehensive DOs and DON'Ts for TS, Angular, SCSS/BEM, Firebase, and a11y
- [ ] Verification checklist mandates `npm run quality` and `npm run build`
- [ ] Mirrored into `docs/STYLE_GUIDE.md`
- [ ] Gate check passes: `npm run format:check`

**Tests**: none  
**Gate**: Quick  
**Commit**: `docs(skills): create style guide skill and exportable documentation`

---

### T9: Create Routed Page Creation Guide Skill

**What**: Create `.agents/skills/creating-pages/SKILL.md` describing step-by-step routed page creation (smart container, routes, guards, layout primitives, dumb child wiring) referencing `tlc-spec-driven` and `tdd`.  
**Where**: `.agents/skills/creating-pages/SKILL.md`  
**Depends on**: T8  
**Reuses**: AD-011, AD-027, AD-031  
**Requirement**: LINT-25, LINT-28  

**Tools**:
- MCP: `filesystem`
- Skill: NONE

**Done when**:
- [ ] `.agents/skills/creating-pages/SKILL.md` created with step-by-step recipes
- [ ] References `tlc-spec-driven` and `tdd` methodology skills by name
- [ ] Covers container creation, route registration, guards, and dumb child wiring
- [ ] Gate check passes: `npm run format:check`

**Tests**: none  
**Gate**: Quick  
**Commit**: `docs(skills): create page creation guide skill`

---

### T10: Create Smart/Dumb Component Architecture Skill

**What**: Create `.agents/skills/creating-components/SKILL.md` defining smart container vs dumb presentational components, Signals `input()`/`output()`, zero service injection in dumb components, and referencing `tdd` and `bem-css`.  
**Where**: `.agents/skills/creating-components/SKILL.md`  
**Depends on**: T9  
**Reuses**: AD-002, AD-003, AD-011  
**Requirement**: LINT-26, LINT-28  

**Tools**:
- MCP: `filesystem`
- Skill: `bem-css`

**Done when**:
- [ ] `.agents/skills/creating-components/SKILL.md` created with clear smart vs dumb rules
- [ ] Includes concrete code examples using `input()`, `output()`, and `ChangeDetectionStrategy.OnPush`
- [ ] References `tdd` and `bem-css` methodology skills by name
- [ ] Gate check passes: `npm run format:check`

**Tests**: none  
**Gate**: Quick  
**Commit**: `docs(skills): create component architecture skill`

---

### T11: Create Design System Usage Reference Skill

**What**: Create `.agents/skills/design-system-usage/SKILL.md` cataloging all 32 `Org*` components with APIs, import paths (`@shared/ui`), replacement mappings for raw Material tags, and referencing `bem-css`.  
**Where**: `.agents/skills/design-system-usage/SKILL.md`  
**Depends on**: T10  
**Reuses**: `src/app/shared/ui/index.ts`, `DESIGN.md`  
**Requirement**: LINT-27, LINT-28  

**Tools**:
- MCP: `filesystem`
- Skill: `bem-css`

**Done when**:
- [ ] `.agents/skills/design-system-usage/SKILL.md` catalogs all 32 `Org*` components with properties, events, and examples
- [ ] Provides direct replacement guide for raw Material elements
- [ ] References `bem-css` methodology skill by name
- [ ] Gate check passes: `npm run format:check`

**Tests**: none  
**Gate**: Quick  
**Commit**: `docs(skills): create design system usage skill`

---

### T12: Integrate Unified Quality Script & Contract Validation

**What**: Add `quality` script (`npm run lint && npm run lint:styles && npm run lint:contracts && npm run format:check`) and `lint:contracts` script (`node scripts/validate-ui-contracts.mjs --strict`) in `package.json`.  
**Where**: `package.json`  
**Depends on**: None  
**Reuses**: `scripts/validate-ui-contracts.mjs`  
**Requirement**: LINT-31, LINT-32  

**Tools**:
- MCP: `filesystem`
- Skill: NONE

**Done when**:
- [ ] `package.json` includes `lint:contracts` and `quality` scripts
- [ ] `npm run lint:contracts` executes `node scripts/validate-ui-contracts.mjs --strict`
- [ ] `npm run quality` executes all 4 checks in sequence
- [ ] Gate check passes: `npm run quality`

**Tests**: none  
**Gate**: Full  
**Commit**: `chore(scripts): add unified quality and ui contracts npm scripts`

---

### T13: Execute Baseline Quality Sweep & Verify Full Toolchain

**What**: Run `npm run quality`, resolve any baseline formatting or linting discrepancies across `src/` and `e2e/`, and verify all quality checks, unit tests, and production build succeed.  
**Where**: `src/styles.scss`  
**Depends on**: T12  
**Reuses**: All toolchain configs created in T1-T12  
**Requirement**: LINT-01, LINT-06, LINT-12, LINT-18, LINT-29, LINT-32  

**Tools**:
- MCP: `filesystem`
- Skill: NONE

**Done when**:
- [ ] `npm run quality` passes with 0 errors across all linters, formatters, and contracts
- [ ] `npm test -- --watch=false` passes (426 unit tests green)
- [ ] `npm run build` succeeds with zero errors
- [ ] Gate check passes: `npm run quality && npm run build && npm test -- --watch=false`

**Tests**: none  
**Gate**: Build  
**Commit**: `chore(toolchain): execute baseline quality sweep and verify green build`

---

## Phase Execution Map

```
Phase 1 → Phase 2 → Phase 3 → Phase 4

Phase 1:  T1 ──→ T2 ──→ T3 ──→ T4
Phase 2:  T5 ──→ T6 ──→ T7
Phase 3:  T8 ──→ T9 ──→ T10 ──→ T11
Phase 4:  T12 ──→ T13
```

---

## Task Granularity Check

| Task | Scope | Status |
| ---- | ----- | ------ |
| T1: Configure ESLint Flat Config | 1 config file (`eslint.config.mjs`) | ✅ Granular |
| T2: Configure Stylelint SCSS Rules | 1 config file (`stylelint.config.mjs`) | ✅ Granular |
| T3: Configure Prettier Multi-Format | 1 ignore file (`.prettierignore`) | ✅ Granular |
| T4: Configure Angular.json Architect Target & Scripts | 1 config file (`angular.json`) | ✅ Granular |
| T5: Configure Commitlint & Husky | 1 config file (`commitlint.config.mjs`) | ✅ Granular |
| T6: Configure lint-staged & Pre-Commit | 1 config file (`.lintstagedrc.json`) | ✅ Granular |
| T7: Create CI Quality Gate Workflow | 1 workflow file (`.github/workflows/quality.yml`) | ✅ Granular |
| T8: Create Developer & AI Style Guide Skill | 1 skill file (`.agents/skills/style-guide/SKILL.md`) | ✅ Granular |
| T9: Create Routed Page Creation Guide Skill | 1 skill file (`.agents/skills/creating-pages/SKILL.md`) | ✅ Granular |
| T10: Create Smart/Dumb Component Skill | 1 skill file (`.agents/skills/creating-components/SKILL.md`) | ✅ Granular |
| T11: Create Design System Usage Skill | 1 skill file (`.agents/skills/design-system-usage/SKILL.md`) | ✅ Granular |
| T12: Integrate Unified Quality Script | 1 manifest file (`package.json`) | ✅ Granular |
| T13: Execute Baseline Quality Sweep | Toolchain verification & stylesheet baseline | ✅ Granular |

---

## Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
| ---- | ---------------------- | ------------- | ------ |
| T1 | None | Entry point (Phase 1) | ✅ Match |
| T2 | T1 | T1 → T2 | ✅ Match |
| T3 | T2 | T2 → T3 | ✅ Match |
| T4 | T3 | T3 → T4 | ✅ Match |
| T5 | None | Entry point (Phase 2) | ✅ Match |
| T6 | T5 | T5 → T6 | ✅ Match |
| T7 | T6 | T6 → T7 | ✅ Match |
| T8 | None | Entry point (Phase 3) | ✅ Match |
| T9 | T8 | T8 → T9 | ✅ Match |
| T10 | T9 | T9 → T10 | ✅ Match |
| T11 | T10 | T10 → T11 | ✅ Match |
| T12 | None | Entry point (Phase 4) | ✅ Match |
| T13 | T12 | T12 → T13 | ✅ Match |

---

## Test Co-location Validation

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
| ---- | --------------------------- | --------------- | --------- | ------ |
| T1: Configure ESLint Flat Config | Tooling / Config | none (Build gate) | none | ✅ OK |
| T2: Configure Stylelint SCSS Rules | Tooling / Config | none (Build gate) | none | ✅ OK |
| T3: Configure Prettier Multi-Format | Tooling / Config | none (Quick gate) | none | ✅ OK |
| T4: Configure Angular.json Architect & Scripts | Tooling / Config | none (Build gate) | none | ✅ OK |
| T5: Configure Commitlint & Husky | Tooling / Hooks | none (Build gate) | none | ✅ OK |
| T6: Configure lint-staged & Pre-Commit | Tooling / Hooks | none (Build gate) | none | ✅ OK |
| T7: Create CI Quality Gate Workflow | CI / Workflows | none (Build gate) | none | ✅ OK |
| T8: Create Developer & AI Style Guide Skill | Documentation / Skills | none (Quick gate) | none | ✅ OK |
| T9: Create Routed Page Creation Guide Skill | Documentation / Skills | none (Quick gate) | none | ✅ OK |
| T10: Create Smart/Dumb Component Skill | Documentation / Skills | none (Quick gate) | none | ✅ OK |
| T11: Create Design System Usage Skill | Documentation / Skills | none (Quick gate) | none | ✅ OK |
| T12: Integrate Unified Quality Script | Tooling / Scripts | none (Full gate) | none | ✅ OK |
| T13: Execute Baseline Quality Sweep | Application & Tests | none (Build gate) | none | ✅ OK |
