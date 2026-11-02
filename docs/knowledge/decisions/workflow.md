---
type: decision
title: Development workflow
status: active
date: 2026-11-02
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
- The Gemini review runs once when the PR is opened and again only on a `/review` (or `/gemini review`) comment. It ranks findings P1 (blocker) / P2 (debt) / P3 (nit) and turns out-of-scope ideas into short GitHub issues (goal, acceptance check, the test that proves it, and a ready prompt for an agent). It reviews against AGENTS.md, DESIGN.md and this knowledge base, using the PR title and description as the stated goal. It calls `gemini-3.8-flash` (falling back to the `gemini-flash-latest` alias, or `GEMINI_MODEL` if set) with `thinkingLevel: 'high'` and default sampling. On 429/500/503 each model is retried after 10s and 30s before falling back.
- A `/review` runs only the Gemini review, not CI. `issue_comment` runs are not listed in the PR checks, so the workflow reacts 👀 to the comment and sets a `Gemini Review (/review)` commit status (pending, then success or failure, linking to the run). If it still fails, it comments the log link on the PR; the automatic review exits 0 instead, so a Gemini outage never turns CI red.
- CD (`cd.yml`) deploys hosting and Firestore rules/indexes after CI passes on `main`; `cd-preview.yml` deploys PR previews.
