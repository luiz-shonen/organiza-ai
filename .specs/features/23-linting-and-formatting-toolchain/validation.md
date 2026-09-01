# Feature 23: Linting, Formatting & Developer Style Guide Toolchain Validation

**Date**: 2026-09-01  
**Spec**: `.specs/features/23-linting-and-formatting-toolchain/spec.md`  
**Diff range**: `origin/main..HEAD`  
**Verifier**: independent sub-agent (author ≠ verifier)

---

## Task Completion

| Task                                                                    | Status  | Notes                                                                                        |
| ----------------------------------------------------------------------- | ------- | -------------------------------------------------------------------------------------------- |
| T1: Configure ESLint Flat Config for TypeScript, Templates & Playwright | ✅ Done | `eslint.config.mjs` with Angular, TS, Playwright, and template a11y rules                    |
| T2: Configure Stylelint SCSS Rules for BEM and Design Tokens            | ✅ Done | `stylelint.config.mjs` with `declaration-no-important`, `color-no-hex`, BEM selector pattern |
| T3: Configure Prettier Multi-Format Formatting & Ignore                 | ✅ Done | `.prettierignore` and `.prettierrc` configured for TS, HTML, SCSS, JSON, YML, MD             |
| T4: Configure Angular.json Lint Architect & Package Scripts             | ✅ Done | `angular.json` architect lint target and `package.json` lint/format scripts                  |
| T5: Configure Commitlint & Husky Hooks                                  | ✅ Done | `commitlint.config.mjs` with conventional config and `.husky/commit-msg` hook                |
| T6: Configure lint-staged & Pre-Commit Hook                             | ✅ Done | `.lintstagedrc.json` and `.husky/pre-commit` hook                                            |
| T7: Create CI Quality Gate Workflow & Chain E2E                         | ✅ Done | `.github/workflows/ci.yml` running quality and chaining Playwright E2E                       |
| T8: Create Developer & AI Style Guide Skill & Mirror                    | ✅ Done | `.agents/skills/style-guide/SKILL.md` and `docs/STYLE_GUIDE.md`                              |
| T9: Create Routed Page Creation Guide Skill                             | ✅ Done | `.agents/skills/creating-pages/SKILL.md`                                                     |
| T10: Create Smart/Dumb Component Architecture Skill                     | ✅ Done | `.agents/skills/creating-components/SKILL.md`                                                |
| T11: Create Design System Usage Reference Skill                         | ✅ Done | `.agents/skills/design-system-usage/SKILL.md`                                                |
| T12: Integrate Unified Quality Script & Contract Validation             | ✅ Done | `npm run quality` and `npm run lint:contracts` in `package.json`                             |
| T13: Execute Baseline Quality Sweep & Verify Full Toolchain             | ✅ Done | Baseline sweep clean across codebase with 0 errors                                           |

---

## Spec-Anchored Acceptance Criteria

| Criterion (WHEN X THEN Y)                                                                                                                                   | Spec-defined outcome                                           | `file:line` + assertion / config expression                                                                                                                                                                       | Result  |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| **LINT-01 (AC 1)**: WHEN developer runs `npm run lint` THEN execute `@angular-eslint/builder:lint` against `src/**/*.ts` and `src/**/*.html`                | Lint execution against TS and HTML templates                   | `package.json:14` (`"lint": "ng lint"`), `angular.json:78-83` (`builder: "@angular-eslint/builder:lint"`)                                                                                                         | ✅ PASS |
| **LINT-02 (AC 2)**: WHEN developer runs `npm run lint:fix` THEN execute ESLint with `--fix`                                                                 | Auto-correct fixable lint violations                           | `package.json:15` (`"lint:fix": "ng lint --fix"`)                                                                                                                                                                 | ✅ PASS |
| **LINT-03 (AC 3)**: Enforce `@angular-eslint/prefer-on-push-component-change-detection` as error-level rule                                                 | Error on components missing OnPush                             | `eslint.config.mjs:44` (`'@angular-eslint/prefer-on-push-component-change-detection': 'error'`)                                                                                                                   | ✅ PASS |
| **LINT-04 (AC 4)**: Enforce `@angular-eslint/prefer-standalone` as error-level rule                                                                         | Error on non-standalone components                             | `eslint.config.mjs:45` (`'@angular-eslint/prefer-standalone': 'error'`)                                                                                                                                           | ✅ PASS |
| **LINT-05 (AC 5)**: Enforce `@angular-eslint/component-selector` with prefix `org`/`app` and `kebab-case`                                                   | Error on non-standard component selectors                      | `eslint.config.mjs:36-43` (`'@angular-eslint/component-selector': ['error', { type: 'element', prefix: ['app', 'org'], style: 'kebab-case' }]`)                                                                   | ✅ PASS |
| **LINT-06 (AC 6)**: Enforce `@typescript-eslint/no-explicit-any` as error-level rule for production code                                                    | Error on explicit `any` in production code                     | `eslint.config.mjs:46` (`'@typescript-eslint/no-explicit-any': 'error'`)                                                                                                                                          | ✅ PASS |
| **LINT-07 (AC 7)**: Include `eslint-config-prettier` to disable conflicting formatting rules                                                                | Prettier rules override conflicting ESLint rules               | `eslint.config.mjs:5,118` (`import eslintConfigPrettier from 'eslint-config-prettier'`, `eslintConfigPrettier`)                                                                                                   | ✅ PASS |
| **LINT-08 (AC 8)**: Configure `angular.json` lint architect target using `@angular-eslint/builder:lint`                                                     | `ng lint` enabled via Angular CLI architect                    | `angular.json:78-83` (`"lint": { "builder": "@angular-eslint/builder:lint", "options": { "lintFilePatterns": ["src/**/*.ts", "src/**/*.html"] } }`)                                                               | ✅ PASS |
| **LINT-09 (AC 9)**: Separate ESLint override for test files (`*.spec.ts`, `*.mock.ts`) with `no-explicit-any: warn`                                         | Test mocks allowed `any` with warning                          | `eslint.config.mjs:59-73` (`files: ['src/**/*.spec.ts', ...]`, `'@typescript-eslint/no-explicit-any': 'warn'`)                                                                                                    | ✅ PASS |
| **LINT-10 (AC 10)**: Separate ESLint override for Playwright E2E files (`e2e/**/*.ts`) with `eslint-plugin-playwright`                                      | Enforce Playwright web-first assertions and timeouts           | `eslint.config.mjs:75-103` (`playwright/no-wait-for-timeout: 'warn'`, `playwright/prefer-web-first-assertions: 'warn'`, `playwright/no-focused-test: 'error'`)                                                    | ✅ PASS |
| **LINT-11 (AC 11)**: Enforce template a11y rules at warning level for HTML templates                                                                        | Warnings for alt-text, label-associated controls, click events | `eslint.config.mjs:105-117` (`'@angular-eslint/template/alt-text': 'warn'`, `'@angular-eslint/template/label-has-associated-control': 'warn'`, `'@angular-eslint/template/click-events-have-key-events': 'warn'`) | ✅ PASS |
| **LINT-12 (AC 12)**: WHEN developer runs `npm run lint:styles` THEN execute Stylelint against all `src/**/*.scss`                                           | Stylelint validation across SCSS files                         | `package.json:16` (`"lint:styles": "stylelint \"src/**/*.scss\""`)                                                                                                                                                | ✅ PASS |
| **LINT-13 (AC 13)**: WHEN developer runs `npm run lint:styles:fix` THEN execute Stylelint with `--fix`                                                      | Auto-correct fixable SCSS violations                           | `package.json:17` (`"lint:styles:fix": "stylelint \"src/**/*.scss\" --fix"`)                                                                                                                                      | ✅ PASS |
| **LINT-14 (AC 14)**: Enforce `declaration-no-important` as error-level rule for component stylesheets                                                       | Prohibition of `!important` in component SCSS                  | `stylelint.config.mjs:4` (`'declaration-no-important': true`)                                                                                                                                                     | ✅ PASS |
| **LINT-15 (AC 15)**: Allow custom properties prefixed with `--org-`, `--mat-`, `--mdc-`, `--mat-sys-`, `--showcase-`                                        | Permit custom CSS variables                                    | `stylelint.config.mjs:8` (`'custom-property-pattern': null`)                                                                                                                                                      | ✅ PASS |
| **LINT-16 (AC 16)**: Enforce `color-no-hex` as error-level rule to require `--org-*` tokens                                                                 | Prohibition of raw hex colors in components                    | `stylelint.config.mjs:5` (`'color-no-hex': true`)                                                                                                                                                                 | ✅ PASS |
| **LINT-17 (AC 17)**: Enforce `selector-class-pattern` matching strict BEM naming conventions                                                                | Enforce `.block__element--modifier` BEM class regex            | `stylelint.config.mjs:6-7` (`'selector-class-pattern': '^[a-z][a-z0-9]*(?:-[a-z0-9]+)*(?:__[a-z0-9]+(?:-[a-z0-9]+)*)?(?:--[a-z0-9]+(?:-[a-z0-9]+)*)?$'`)                                                          | ✅ PASS |
| **LINT-18 (AC 18)**: WHEN developer runs `npm run format:check` THEN execute Prettier check mode across TS, HTML, SCSS, JSON, YML, MD, E2E                  | Exit non-zero if files unformatted                             | `package.json:19` (`"format:check": "prettier --check \"src/**/*.{ts,html,scss,json}\" \"*.{yml,yaml,md,json}\" \"e2e/**/*.ts\""`)                                                                                | ✅ PASS |
| **LINT-19 (AC 19)**: WHEN developer runs `npm run format:write` THEN execute Prettier write mode                                                            | In-place code formatting                                       | `package.json:20` (`"format:write": "prettier --write \"src/**/*.{ts,html,scss,json}\" \"*.{yml,yaml,md,json}\" \"e2e/**/*.ts\""`)                                                                                | ✅ PASS |
| **LINT-20 (AC 20)**: Include `.prettierignore` excluding `dist/`, `node_modules/`, `.angular/`, `coverage/`, `e2e/screenshots/`, `graphify-out/`, `*.min.*` | Exclude generated artifacts from formatting                    | `.prettierignore:1-7` (`dist/`, `node_modules/`, `.angular/`, `coverage/`, `e2e/screenshots/`, `graphify-out/`, `*.min.*`)                                                                                        | ✅ PASS |
| **LINT-21 (AC 21)**: WHEN staging files and running `git commit` THEN execute lint-staged with ESLint, Stylelint, Prettier                                  | Pre-commit automated lint/format on staged files               | `.husky/pre-commit:1` (`npx lint-staged`), `.lintstagedrc.json:1-5`                                                                                                                                               | ✅ PASS |
| **LINT-22 (AC 22)**: WHEN writing commit message THEN validate against Conventional Commits via commitlint                                                  | Reject non-conventional commit messages                        | `.husky/commit-msg:1` (`npx --no -- commitlint --edit "${1}"`), `commitlint.config.mjs:1-3` (`extends: ['@commitlint/config-conventional']`)                                                                      | ✅ PASS |
| **LINT-23 (AC 23)**: Configure lint-staged to process `*.{ts,html}` via ESLint, `*.scss` via Stylelint, all via Prettier                                    | File-type specific staged lint/format pipeline                 | `.lintstagedrc.json:2-4` (`"*.{ts,html}": ["eslint --fix", "prettier --write"]`, `"*.scss": ["stylelint --fix", "prettier --write"]`, `"*.{json,yml,yaml,md}": ["prettier --write"]`)                             | ✅ PASS |
| **LINT-24 (AC 24)**: Provide `.agents/skills/style-guide/SKILL.md` with DOs/DON'Ts and mirror to `docs/STYLE_GUIDE.md`                                      | Standard engineering style guide and exportable docs           | `.agents/skills/style-guide/SKILL.md:1-174`, `docs/STYLE_GUIDE.md:1-174`                                                                                                                                          | ✅ PASS |
| **LINT-25 (AC 25)**: Provide `.agents/skills/creating-pages/SKILL.md` with step-by-step routed page creation                                                | Routed Smart Container authoring recipe                        | `.agents/skills/creating-pages/SKILL.md:1-283`                                                                                                                                                                    | ✅ PASS |
| **LINT-26 (AC 26)**: Provide `.agents/skills/creating-components/SKILL.md` with smart/dumb architecture rules                                               | Pure presentational Dumb component recipe                      | `.agents/skills/creating-components/SKILL.md:1-223`                                                                                                                                                               | ✅ PASS |
| **LINT-27 (AC 27)**: Provide `.agents/skills/design-system-usage/SKILL.md` cataloging 32 `Org*` components and Material replacement guide                   | Canonical design system catalog and Material replacements      | `.agents/skills/design-system-usage/SKILL.md:1-185`                                                                                                                                                               | ✅ PASS |
| **LINT-28 (AC 28)**: Each `.agents/skills/*/SKILL.md` references `tdd`, `bem-css`, `tlc-spec-driven` by name                                                | Core methodology skill references across all skills            | `.agents/skills/style-guide/SKILL.md:14-16`, `.agents/skills/creating-pages/SKILL.md:14-16`, `.agents/skills/creating-components/SKILL.md:14-16`, `.agents/skills/design-system-usage/SKILL.md:14-16`             | ✅ PASS |
| **LINT-29 (AC 29)**: WHEN PR is opened or pushed to `main` THEN execute `quality` job in `ci.yml` running lint, styles, contracts, format, and build        | Fail-fast CI quality gate                                      | `.github/workflows/ci.yml:10-41` (`run: npm run lint`, `run: npm run lint:styles`, `run: npm run lint:contracts`, `run: npm run format:check`, `run: npm run build`)                                              | ✅ PASS |
| **LINT-30 (AC 30)**: `e2e` job in `ci.yml` depends on quality passing before running Playwright tests (`needs: quality`)                                    | E2E runs downstream of quality checks                          | `.github/workflows/ci.yml:43-77` (`e2e: needs: quality`)                                                                                                                                                          | ✅ PASS |
| **LINT-31 (AC 31)**: `quality` job in `ci.yml` executes `npm run lint:contracts` (`validate-ui-contracts.mjs`)                                              | Automated design system contract enforcement                   | `.github/workflows/ci.yml:34-35` (`run: npm run lint:contracts`), `package.json:18`                                                                                                                               | ✅ PASS |
| **LINT-32 (AC 32)**: WHEN developer runs `npm run quality` THEN execute `lint`, `lint:styles`, `lint:contracts`, and `format:check`                         | Unified local quality command                                  | `package.json:21` (`"quality": "npm run lint && npm run lint:styles && npm run lint:contracts && npm run format:check"`)                                                                                          | ✅ PASS |
| **LINT-33 (AC 33)**: `.agents/skills/style-guide/SKILL.md` includes mandatory Verification Checklist requiring `npm run quality`                            | Mandatory AI/developer self-verification checklist             | `.agents/skills/style-guide/SKILL.md:163-174` (Section 7)                                                                                                                                                         | ✅ PASS |
| **LINT-34 (AC 34)**: `.agents/skills/style-guide/SKILL.md` documents `npm run build` must succeed                                                           | Mandatory build check step                                     | `.agents/skills/style-guide/SKILL.md:172` (`6. Production Build Gate: npm run build`)                                                                                                                             | ✅ PASS |

**Status**: ✅ All 34 ACs covered (34/34 PASS, 0 spec-precision gaps)

---

## Discrimination Sensor

| Mutation       | File:line                                       | Description                                                                   | Killed?                                                             |
| -------------- | ----------------------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| 1 (ESLint)     | `src/app/features/home/home.container.ts:41`    | Injected explicit `any` parameter `val: any`                                  | ✅ Killed (`@typescript-eslint/no-explicit-any` error, exit code 1) |
| 2 (Stylelint)  | `src/app/features/home/home.container.scss:174` | Injected raw hex color `#ff00ff`                                              | ✅ Killed (`color-no-hex` error, exit code 2)                       |
| 3 (Commitlint) | CLI stdin via `npx commitlint`                  | Provided non-conventional message `"bad message without conventional format"` | ✅ Killed (`type-empty`, `subject-empty` errors, exit code 1)       |

**Sensor depth**: lightweight (3 targeted behavior-level mutations in isolated git worktree `/tmp/organizaai-sensor`)  
**Result**: 3/3 killed — ✅ PASS  
**Isolation check**: `git status --porcelain` verified identical to pre-sensor baseline (clean working tree).

---

## Code Quality

| Principle                                                                   | Status |
| --------------------------------------------------------------------------- | ------ |
| Minimum code                                                                | ✅     |
| Surgical changes                                                            | ✅     |
| No scope creep                                                              | ✅     |
| Matches patterns                                                            | ✅     |
| Spec-anchored outcome check (asserted values match spec)                    | ✅     |
| Per-layer Coverage Expectation met                                          | ✅     |
| Every test maps to a spec requirement - no unclaimed tests                  | ✅     |
| Documented guidelines followed: `AGENTS.md`, `DESIGN.md`, `.specs/STATE.md` | ✅     |

---

## Edge Cases

- [x] **Husky CI detection**: Husky `prepare` script skips gracefully in CI environments.
- [x] **Git commit `--no-verify` bypass**: CI `quality` job in `.github/workflows/ci.yml` enforces all checks server-side on pull requests.
- [x] **Lint-staged ordering**: ESLint `--fix` and Stylelint `--fix` run before Prettier `--write` to eliminate conflicts.
- [x] **Playwright ESLint flat config compatibility**: `eslint-plugin-playwright` configured with `flat/recommended` and rule overrides.

---

## Gate Check

- **Gate command**: `npm run quality && npm run build && npm test -- --watch=false`
- **Result**: 446 passed, 0 failed, 0 skipped across 80 test suites
- **Lint status**:
  - `npm run lint`: 0 errors (251 expected warnings in test mock casts and template a11y)
  - `npm run lint:styles`: 0 errors
  - `npm run lint:contracts`: 0 violations
  - `npm run format:check`: 0 formatting discrepancies
  - `npm run build`: Success (0 TypeScript or bundle errors)
- **Test count before feature**: 446
- **Test count after feature**: 446
- **Delta**: +0 tests (Tooling, configuration, git hooks, CI workflows, and documentation feature)
- **Skipped tests**: 0
- **Failures**: 0

---

## Requirement Traceability Update

| Requirement | Previous Status | New Status  |
| ----------- | --------------- | ----------- |
| LINT-01     | Implementing    | ✅ Verified |
| LINT-02     | Implementing    | ✅ Verified |
| LINT-03     | Implementing    | ✅ Verified |
| LINT-04     | Implementing    | ✅ Verified |
| LINT-05     | Implementing    | ✅ Verified |
| LINT-06     | Implementing    | ✅ Verified |
| LINT-07     | Implementing    | ✅ Verified |
| LINT-08     | Implementing    | ✅ Verified |
| LINT-09     | Implementing    | ✅ Verified |
| LINT-10     | Implementing    | ✅ Verified |
| LINT-11     | Implementing    | ✅ Verified |
| LINT-12     | Implementing    | ✅ Verified |
| LINT-13     | Implementing    | ✅ Verified |
| LINT-14     | Implementing    | ✅ Verified |
| LINT-15     | Implementing    | ✅ Verified |
| LINT-16     | Implementing    | ✅ Verified |
| LINT-17     | Implementing    | ✅ Verified |
| LINT-18     | Implementing    | ✅ Verified |
| LINT-19     | Implementing    | ✅ Verified |
| LINT-20     | Implementing    | ✅ Verified |
| LINT-21     | Implementing    | ✅ Verified |
| LINT-22     | Implementing    | ✅ Verified |
| LINT-23     | Implementing    | ✅ Verified |
| LINT-24     | Implementing    | ✅ Verified |
| LINT-25     | Implementing    | ✅ Verified |
| LINT-26     | Implementing    | ✅ Verified |
| LINT-27     | Implementing    | ✅ Verified |
| LINT-28     | Implementing    | ✅ Verified |
| LINT-29     | Implementing    | ✅ Verified |
| LINT-30     | Implementing    | ✅ Verified |
| LINT-31     | Implementing    | ✅ Verified |
| LINT-32     | Implementing    | ✅ Verified |
| LINT-33     | Implementing    | ✅ Verified |
| LINT-34     | Implementing    | ✅ Verified |

---

## Summary

**Overall**: ✅ Ready (PASS)

**Spec-anchored check**: 34/34 ACs matched spec outcome (0 spec-precision gaps)  
**Sensor**: 3/3 mutations killed (0 survived)  
**Gate**: 446 unit tests passed, 0 failed; `quality` and `build` passed 100%

**What works**:

- Complete ESLint Flat Config with Angular, TypeScript, and Playwright plugins.
- Stylelint enforcing BEM SCSS, `!important` ban, and design tokens (`--org-*`).
- Prettier multi-format support (`.ts`, `.html`, `.scss`, `.json`, `.yml`, `.md`).
- Husky hooks (`pre-commit` via lint-staged, `commit-msg` via commitlint).
- GitHub Actions `.github/workflows/ci.yml` fail-fast pipeline with `quality` job chaining `e2e`.
- Canonical `.agents/skills/` and mirrored `docs/STYLE_GUIDE.md` for AI/human developer guidance.
- Unified `npm run quality` script chaining all checks.

**Issues found**: None.  
**Next steps**: Ready to merge and deploy.
