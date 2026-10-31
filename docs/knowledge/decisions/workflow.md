---
type: decision
title: Development workflow
status: active
date: 2026-10-31
supersedes: [AD-012, AD-013, AD-042, AD-043]
enforced_by:
  - package.json#scripts.quality
  - .husky/commit-msg
  - .github/workflows/ci.yml
  - .github/workflows/cd.yml
related: [testing.md]
---

# Development workflow

Spec-Driven Development (spec.md → design.md → tasks.md → validation.md per feature) is retired. The specs went stale after the first change and the executable checks were what actually protected the code. They are kept in git history under the tag `archive/sdd`.

## How a change is made now

1. State the goal and the acceptance check in the issue or PR description (a few lines).
2. Write or adjust the test that proves it (unit, rules or E2E).
3. Implement.
4. Run `npm run quality` (ESLint, Stylelint, `lint:contracts`, Prettier) and `npm run build`.
5. If the change taught something non-obvious, add or update one file in `docs/knowledge/` (`type: decision` or `type: gotcha`). If the rule can be checked by a script, add the check and list it in `enforced_by`.

## Toolchain

- Conventional Commits (commitlint); Husky runs lint-staged on pre-commit.
- CI (`ci.yml`) runs `quality` then E2E; markdown-only changes skip the heavy jobs.
- CD (`cd.yml`) deploys hosting and Firestore rules/indexes after CI passes on `main`; `cd-preview.yml` deploys PR previews.
