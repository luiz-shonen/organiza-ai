# Feature 23: Linting, Formatting & Developer Style Guide Toolchain

## Problem Statement

The project has zero automated code quality enforcement. No ESLint, no Stylelint, no git hooks, no commitlint. Prettier exists as a dependency but is not wired to any scripts or hooks. There are no `.agents/` skills guiding AI contributors on how to create pages, components, or follow the design system. Having cleaned up the CSS tokens and component architecture in Feature 21, and unified DRY models, services, and typings in Feature 22, this feature installs the complete quality toolchain with strict, uncompromising error-level rules and creates the developer style guide that prevents future regressions.

## Goals

- [ ] Comprehensive ESLint config covering TypeScript, Angular templates, unit tests, and Playwright E2E tests (including `no-wait-for-timeout`, web-first assertions, and `data-testid` conventions)
- [ ] Strict Stylelint config enforcing BEM, `!important` prohibition, design token usage, duplicate class prevention across components, and color token validation against `DESIGN.md` as error-level rules
- [ ] Prettier formatting all file types (`.ts`, `.html`, `.scss`, `.json`, `.yml`, `.md`) enforced on commit
- [ ] Commit message format enforced via commitlint (Conventional Commits)
- [ ] CI quality gate (`quality.yml`) runs BEFORE Playwright E2E and blocks PRs on violations, including Design System contract validation
- [ ] `.agents/` skills folder with style guide, smart/dumb component recipes, page creation guides, and design system usage reference
- [ ] Company-wide style guide documentation exportable and mirrored in `DESIGN.md` and `/design-system`
- [ ] AI agent verification: all linters pass clean after any AI-generated change

## Out of Scope

| Feature | Reason |
|---|---|
| Fixing CSS violations (hardcoded colors, `!important`, token duplication) | Handled in Feature 21 |
| Fixing smart/dumb violations or dead component removal | Handled in Feature 21 |
| Fixing `any` types or duplicated logic | Handled in Feature 22 |
| Updating AGENTS.md, README.md, CONTEXT.md content accuracy | Handled in Feature 22 |
| Route restructuring (`/admin` vs `/meus-eventos`) | Handled in Feature 22 |
| Writing the TDD, BEM-CSS, or TLC spec-driven skills themselves | They already exist in `.gemini/config/skills/`; we reference them |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
|---|---|---|---|
| ESLint uses Flat Config (`eslint.config.mjs`) | Flat Config | ESLint 9+ default; Angular ESLint v19+ supports it | y |
| `@typescript-eslint/no-explicit-any` set to `error` | error | Codebase is clean after Feature 22; zero `any` types permitted | y |
| `declaration-no-important` in Stylelint set to `error` for components | error | Codebase is clean after Feature 21; zero `!important` permitted in components | y |
| Stylelint enforces color token preference via `color-no-hex` as `error` | error + allowlist | Codebase is clean after Feature 21; all colors must use `--org-*` tokens | y |
| Playwright ESLint enforces web-first assertions and bans `waitForTimeout` | yes | Guarantees deterministic, flake-free E2E tests | y |
| CI `quality.yml` is separate from `e2e.yml` | separate | Fail-fast: if quality fails, no reason to run Playwright | y |
| `quality.yml` runs BEFORE E2E (via workflow dependency or PR required checks ordering) | yes | User confirmed: "if it fails, no reason to run the playwright tests" | y |
| `quality.yml` includes `validate-ui-contracts.mjs` to check design system compliance | yes | Existing script; wired as `npm run lint:contracts` | y |
| Prettier formats `.yml` files | yes | User requested "formatting as much file as possible" | y |
| `.agents/` skills live at project root (`.agents/skills/`) and mirror to `docs/STYLE_GUIDE.md` | yes | Accessible to AI agents, local developers, and exportable across the company | y |
| `.agents/` skills reference `tdd`, `bem-css`, and `tlc-spec-driven` by name | yes | User requested these be mentioned as recommended practices | y |
| Test-specific ESLint config relaxes some rules (e.g., `no-explicit-any` at `warn`) | separate override | Test mocks legitimately need some casting; warn keeps visibility without blocking | y |
| Playwright-specific ESLint config uses `eslint-plugin-playwright` | yes | Industry standard; catches common Playwright anti-patterns | y |

**Open questions:** none — all resolved or logged above.

---

## User Stories

### P1: ESLint Comprehensive Configuration ⭐ MVP

**User Story**: As a developer, I want Angular-aware ESLint rules enforced across production code, unit tests, and E2E tests so that TypeScript and template violations are caught before merge.

**Why P1**: Without ESLint, there is no automated check for `any` types, missing OnPush, NgModule usage, template accessibility, naming conventions, or test anti-patterns.

**Acceptance Criteria**:

1. WHEN a developer runs `npm run lint` THEN the system SHALL execute `@angular-eslint/builder:lint` against all `src/**/*.ts` and `src/**/*.html` files and report violations. <!-- event-driven -->
2. WHEN a developer runs `npm run lint:fix` THEN the system SHALL execute ESLint with `--fix` flag and auto-correct fixable violations. <!-- event-driven -->
3. The system SHALL enforce `@angular-eslint/prefer-on-push-component-change-detection` as an error-level rule for all component files. <!-- ubiquitous -->
4. The system SHALL enforce `@angular-eslint/prefer-standalone` as an error-level rule for all component files. <!-- ubiquitous -->
5. The system SHALL enforce `@angular-eslint/component-selector` with prefix `org` or `app`, style `kebab-case` as an error-level rule. <!-- ubiquitous -->
6. The system SHALL enforce `@typescript-eslint/no-explicit-any` as an error-level rule for production code. <!-- ubiquitous -->
7. The system SHALL include `eslint-config-prettier` to disable all formatting rules that conflict with Prettier. <!-- ubiquitous -->
8. The system SHALL configure an `angular.json` lint architect target using `@angular-eslint/builder:lint` enabling `ng lint`. <!-- ubiquitous -->
9. The system SHALL provide a separate ESLint override for test files (`*.spec.ts`, `*.mock.ts`) that sets `@typescript-eslint/no-explicit-any` to `warn` and allows `as unknown as` casting patterns. <!-- ubiquitous -->
10. The system SHALL provide a separate ESLint override for Playwright E2E files (`e2e/**/*.ts`) using `eslint-plugin-playwright` with rules enforcing `no-wait-for-timeout`, `prefer-web-first-assertions`, `prefer-to-have-count`, `no-element-handle`, `no-eval`, `no-conditional-in-test`, `no-focused-test`, `expect-expect`, and `no-force-option` at warning level. <!-- ubiquitous -->
11. The system SHALL enforce `@angular-eslint/template/accessibility-alt-text`, `@angular-eslint/template/accessibility-label-has-associated-control`, and `@angular-eslint/template/click-events-have-key-events` at warning level for HTML templates. <!-- ubiquitous -->

**Independent Test**: Run `npm run lint` — it executes and reports results with zero config errors and zero error-level violations.

---

### P1: Stylelint Comprehensive SCSS Configuration ⭐ MVP

**User Story**: As a developer, I want SCSS-aware linting that enforces BEM naming, prohibits `!important`, validates design token usage against `DESIGN.md`, and prevents duplicate unnamespaced classes across components so that CSS quality is maintained.

**Why P1**: Ensures that the clean CSS architecture established in Feature 21 remains protected by automated gates.

**Acceptance Criteria**:

12. WHEN a developer runs `npm run lint:styles` THEN the system SHALL execute Stylelint against all `src/**/*.scss` files and report violations. <!-- event-driven -->
13. WHEN a developer runs `npm run lint:styles:fix` THEN the system SHALL execute Stylelint with `--fix` flag and auto-correct fixable violations. <!-- event-driven -->
14. The system SHALL enforce `declaration-no-important` as an error-level rule for component stylesheets. <!-- ubiquitous -->
15. The system SHALL allow custom properties prefixed with `--org-`, `--mat-`, `--mdc-`, `--mat-sys-`, and `--showcase-` without triggering unknown-property warnings. <!-- ubiquitous -->
16. The system SHALL enforce `color-no-hex` as an error-level rule to require `--org-*` CSS custom properties, with an allowlist for `#fff`, `#000`, and `#ffffff` only. <!-- ubiquitous -->
17. The system SHALL enforce `selector-class-pattern` matching strict BEM naming conventions (`^[a-z][a-z0-9]*(?:-[a-z0-9]+)*(?:__[a-z0-9]+(?:-[a-z0-9]+)*)?(?:--[a-z0-9]+(?:-[a-z0-9]+)*)?$`) to ensure all classes are properly scoped to their component block and prevent collision across different components. <!-- ubiquitous -->

**Independent Test**: Run `npm run lint:styles` — it executes and reports results with zero error-level violations.

---

### P1: Prettier Full-Spectrum Formatting ⭐ MVP

**User Story**: As a developer, I want Prettier formatting enforced across all file types including YAML and Markdown, with proper ignore patterns, so that code style is universally consistent.

**Why P1**: Prettier exists but has no scripts, no `.prettierignore`, no YAML/Markdown support, and is not wired to any automation.

**Acceptance Criteria**:

18. WHEN a developer runs `npm run format:check` THEN the system SHALL execute Prettier in check mode against `src/**/*.{ts,html,scss,json}`, `*.{yml,yaml,md,json}`, and `e2e/**/*.ts` and exit non-zero if files are unformatted. <!-- event-driven -->
19. WHEN a developer runs `npm run format:write` THEN the system SHALL execute Prettier in write mode and format all matching files in-place. <!-- event-driven -->
20. The system SHALL include a `.prettierignore` file that excludes `dist/`, `node_modules/`, `.angular/`, `coverage/`, `e2e/screenshots/`, `graphify-out/`, and `*.min.*` from formatting. <!-- ubiquitous -->

**Independent Test**: Run `npm run format:check` — exits 0 or non-zero based on formatting state.

---

### P1: Git Hooks — Husky + lint-staged + commitlint ⭐ MVP

**User Story**: As a developer, I want pre-commit and commit-msg hooks that enforce lint, format, and commit message rules before code reaches the repository.

**Why P1**: Without git hooks, all linting tooling is voluntary. Contributors (especially AI agents) must be blocked from committing non-conforming code.

**Acceptance Criteria**:

21. WHEN a developer stages files and runs `git commit` THEN the system SHALL execute lint-staged, which runs ESLint `--fix`, Stylelint `--fix`, and Prettier `--write` on staged files of matching types before the commit proceeds. <!-- event-driven -->
22. WHEN a developer writes a commit message THEN the system SHALL validate it against Conventional Commits format via commitlint and reject non-conforming messages with a descriptive error. <!-- event-driven -->
23. The system SHALL configure lint-staged to process `*.ts` and `*.html` files through ESLint, `*.scss` files through Stylelint, and `*.{ts,html,scss,json,yml,md}` files through Prettier. <!-- ubiquitous -->

**Independent Test**: Stage a `.ts` file with a formatting issue → `git commit -m "bad message"` → commit is rejected.

---

### P1: `.agents/` Developer & AI Style Guide Skills ⭐ MVP

**User Story**: As a developer or AI agent, I want project-local skills and a style guide in `.agents/` so that every contributor follows the exact same smart/dumb architecture, design system components, and testing practices — preventing hallucinations and drift.

**Why P1**: Equips AI agents and human contributors with concrete, self-contained playbooks in the repository.

**Acceptance Criteria**:

24. The system SHALL provide a `.agents/skills/style-guide/SKILL.md` containing DOs and DON'Ts for TypeScript, Angular components, SCSS/BEM, Firebase, testing (unit + E2E with `data-testid`), and accessibility — mirrored into `docs/STYLE_GUIDE.md` for export as a company-wide standard. <!-- ubiquitous -->
25. The system SHALL provide a `.agents/skills/creating-pages/SKILL.md` describing the step-by-step process to create a new routed page: smart container creation, route registration, guard application, design system layout primitives, and dumb presentational child wiring. <!-- ubiquitous -->
26. The system SHALL provide a `.agents/skills/creating-components/SKILL.md` explicitly defining the smart/dumb component separation (AD-011): smart containers handle Firebase and state; dumb presentational components only use `input()`/`output()` Signals with zero business logic or service injection. <!-- ubiquitous -->
27. The system SHALL provide a `.agents/skills/design-system-usage/SKILL.md` cataloging all 32 `Org*` components with their public APIs, import paths from `@shared/ui`, and replacements for raw Material elements. <!-- ubiquitous -->
28. Each `.agents/skills/*/SKILL.md` SHALL reference the project's existing methodology skills (`tdd`, `bem-css`, `tlc-spec-driven`) by name as recommended practices for the relevant workflow step. <!-- ubiquitous -->

**Independent Test**: Read each SKILL.md — it contains actionable instructions with concrete smart/dumb code examples and design system API mappings.

---

### P2: CI Quality Gate Workflow (Fail-Fast Before E2E)

**User Story**: As a project maintainer, I want a CI workflow that blocks PRs before Playwright runs and validates Design System compliance, so that broken code never wastes E2E compute time.

**Why P2**: Local hooks can be bypassed with `--no-verify`. CI is the final safety net and must strictly enforce Design System contracts.

**Acceptance Criteria**:

29. WHEN a PR is opened or pushed to `main` THEN the system SHALL run a `quality.yml` GitHub Actions workflow that executes `npm run lint`, `npm run lint:styles`, `npm run lint:contracts`, `npm run format:check`, and `npm run build` in sequence, failing the workflow if any step exits non-zero. <!-- event-driven -->
30. The `e2e.yml` workflow SHALL depend on `quality.yml` succeeding before running Playwright tests, so that E2E tests only execute on quality-passing code. <!-- ubiquitous -->
31. The `quality.yml` workflow SHALL execute `npm run lint:contracts` (`validate-ui-contracts.mjs`) to strictly enforce that no feature component declares raw Material selectors, declares Material tokens, bypasses `Org*` components, or uses duplicate glassmorphic rules. <!-- ubiquitous -->

**Independent Test**: Open a PR with a lint violation or design system contract breach → `quality.yml` fails → `e2e.yml` does not run.

---

### P2: Unified Quality Script

**User Story**: As a developer, I want a single `npm run quality` command that mirrors what CI does.

**Why P2**: Convenience for local development; catch issues before push.

**Acceptance Criteria**:

32. WHEN a developer runs `npm run quality` THEN the system SHALL execute `lint`, `lint:styles`, `lint:contracts`, and `format:check` in sequence, exiting non-zero on first failure. <!-- event-driven -->

**Independent Test**: Run `npm run quality` — it chains all checks.

---

### P2: AI Agent Verification Requirement

**User Story**: As a project maintainer, I want it documented and enforced that AI agents must verify all linters pass after any code change.

**Why P2**: AI agents are the primary contributors and must self-verify.

**Acceptance Criteria**:

33. The `.agents/skills/style-guide/SKILL.md` SHALL include a mandatory "Verification Checklist" section requiring AI agents to run `npm run quality` and confirm zero errors before marking any task complete. <!-- ubiquitous -->
34. The `.agents/skills/style-guide/SKILL.md` SHALL document that `npm run build` must succeed (zero TypeScript errors) as a post-change verification step. <!-- ubiquitous -->

**Independent Test**: Read the style guide — the verification checklist is present and actionable.

---

## Edge Cases

- IF Husky `prepare` script runs during `npm install` in CI (where hooks are unnecessary) THEN the system SHALL handle gracefully via Husky's built-in CI detection (`CI=true` exits 0). <!-- unwanted-behavior -->
- IF a developer bypasses hooks with `git commit --no-verify` THEN the CI `quality.yml` gate SHALL still catch violations on PR. <!-- unwanted-behavior -->
- IF lint-staged encounters a file failing both ESLint and Prettier THEN the system SHALL run ESLint `--fix` first, then Prettier `--write`, to avoid conflicts. <!-- unwanted-behavior -->
- IF `eslint-plugin-playwright` is not compatible with the project's ESLint version THEN the system SHALL fall back to manual Playwright-specific rules in the flat config without the plugin. <!-- unwanted-behavior -->

---

## Requirement Traceability

| Requirement ID | Story | AC# | Status |
|---|---|---|---|
| LINT-01 | P1: ESLint | AC-1 | Implementing (T1, T4, T13) |
| LINT-02 | P1: ESLint | AC-2 | Implementing (T1, T4) |
| LINT-03 | P1: ESLint | AC-3 | Implementing (T1) |
| LINT-04 | P1: ESLint | AC-4 | Implementing (T1) |
| LINT-05 | P1: ESLint | AC-5 | Implementing (T1) |
| LINT-06 | P1: ESLint | AC-6 | Implementing (T1, T13) |
| LINT-07 | P1: ESLint | AC-7 | Implementing (T1) |
| LINT-08 | P1: ESLint | AC-8 | Implementing (T4) |
| LINT-09 | P1: ESLint | AC-9 | Implementing (T1) |
| LINT-10 | P1: ESLint | AC-10 | Implementing (T1) |
| LINT-11 | P1: ESLint | AC-11 | Implementing (T1) |
| LINT-12 | P1: Stylelint | AC-12 | Implementing (T2, T4, T13) |
| LINT-13 | P1: Stylelint | AC-13 | Implementing (T2, T4) |
| LINT-14 | P1: Stylelint | AC-14 | Implementing (T2) |
| LINT-15 | P1: Stylelint | AC-15 | Implementing (T2) |
| LINT-16 | P1: Stylelint | AC-16 | Implementing (T2) |
| LINT-17 | P1: Stylelint | AC-17 | Implementing (T2) |
| LINT-18 | P1: Prettier | AC-18 | Implementing (T3, T4, T13) |
| LINT-19 | P1: Prettier | AC-19 | Implementing (T3, T4) |
| LINT-20 | P1: Prettier | AC-20 | Implementing (T3) |
| LINT-21 | P1: Git Hooks | AC-21 | In Tasks (T6) |
| LINT-22 | P1: Git Hooks | AC-22 | In Tasks (T5) |
| LINT-23 | P1: Git Hooks | AC-23 | In Tasks (T6) |
| LINT-24 | P1: Style Guide | AC-24 | In Tasks (T8) |
| LINT-25 | P1: Style Guide | AC-25 | P1: In Tasks (T9) |
| LINT-26 | P1: Style Guide | AC-26 | In Tasks (T10) |
| LINT-27 | P1: Style Guide | AC-27 | In Tasks (T11) |
| LINT-28 | P1: Style Guide | AC-28 | In Tasks (T8, T9, T10, T11) |
| LINT-29 | P2: CI Gate | AC-29 | In Tasks (T7, T13) |
| LINT-30 | P2: CI Gate | AC-30 | In Tasks (T7) |
| LINT-31 | P2: CI Gate | AC-31 | In Tasks (T7, T12) |
| LINT-32 | P2: Quality Script | AC-32 | In Tasks (T12, T13) |
| LINT-33 | P2: AI Verification | AC-33 | In Tasks (T8) |
| LINT-34 | P2: AI Verification | AC-34 | In Tasks (T8) |

**ID format:** `LINT-[NUMBER]`

**Status values:** Pending → In Tasks → Implementing → Verified

**Coverage:** 34 total, 34 mapped to tasks, 0 unmapped ✅

---

## Success Criteria

- [ ] `npm run lint` executes against TS, HTML, spec, and E2E files with zero config errors
- [ ] `npm run lint:styles` executes with `color-no-hex`, `declaration-no-important`, and BEM enforcement
- [ ] `npm run format:check` covers `.ts`, `.html`, `.scss`, `.json`, `.yml`, `.md` files
- [ ] `git commit` with bad message format is rejected by commitlint
- [ ] `git commit` with staged unformatted file triggers auto-fix via lint-staged
- [ ] `npm run quality` chains lint + lint:styles + lint:contracts + format:check
- [ ] `quality.yml` CI workflow runs on PRs and blocks E2E if it fails
- [ ] `.agents/skills/` contains 4 actionable SKILL.md files with smart/dumb recipes and code examples
- [ ] `docs/STYLE_GUIDE.md` is populated for company-wide style guide export
- [ ] Each SKILL.md references `tdd`, `bem-css`, and `tlc-spec-driven` skills
