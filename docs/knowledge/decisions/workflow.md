---
type: decision
title: Development workflow
status: active
date: 2026-10-31
supersedes: [AD-012, AD-013, AD-042, AD-043, AD-045]
enforced_by:
  - package.json#scripts.quality
  - .husky/commit-msg
  - .github/workflows/ci.yml
  - .github/workflows/cd.yml
  - .github/workflows/gemini-review-comment.yml
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
- `npm run quality` also runs the repository script tests (`npm run test:scripts`).
- `npm run pr:create` pushes the branch and opens the PR with the personal `GH_TOKEN` from `.env.local`, so a corporate `gh` login is never used.
- CI (`ci.yml`) runs `quality`, then E2E, then `gemini-review` (`scripts/gemini-pr-review.mjs`); markdown-only changes skip the heavy jobs.
- The Gemini review runs once when the PR is opened and again only on a `/review` (or `/gemini review`) comment. It ranks findings P1 (blocker) / P2 (debt) / P3 (nit) and turns out-of-scope ideas into GitHub issues. It reviews against AGENTS.md, DESIGN.md and this knowledge base, using the PR title and description as the stated goal. It calls `gemini-3.8-flash` (falling back to the `gemini-flash-latest` alias, or `GEMINI_MODEL` if set) with `thinkingLevel: 'high'` and default sampling.
- CD (`cd.yml`) deploys hosting and Firestore rules/indexes after CI passes on `main`; `cd-preview.yml` deploys PR previews.
