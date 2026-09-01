# Firebase Hosting Deploy (Feature 24) Validation

**Date**: 2026-09-01
**Spec**: `.specs/features/24-firebase-hosting-deploy/spec.md`
**Diff range**: `79f05a4..bb8b2d1`
**Verifier**: independent sub-agent (author ≠ verifier)

---

## Task Completion

| Task                                                             | Status  | Notes                                                                                                            |
| ---------------------------------------------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------- |
| T1: Update Firestore Security Rules and Add Unit Tests           | ✅ Done | Covered `events/{id}/invitations/{email}`, `/{path=**}/invitations/{email}`, and `users/{uid}/family/{memberId}` |
| T2: Configure Smart CI Path Filtering in ci.yml                  | ✅ Done | `dorny/paths-filter@v3` filters code vs markdown, always running `format:check`                                  |
| T3: Create Production Deploy Workflow (cd.yml)                   | ✅ Done | Chained via `workflow_run` on CI success, injects runtime config, deploys rules & hosting to live channel        |
| T4: Create PR Preview Deploy Workflow (cd-preview.yml)           | ✅ Done | Deploys hosting preview for PRs from same repo, posts preview URL comment                                        |
| T5: Add Deploy Script to package.json                            | ✅ Done | Added `"deploy": "npm run build && firebase deploy --only hosting,firestore"`                                    |
| T6: Update Project Documentation (README, AGENTS, GEMINI, STATE) | ✅ Done | Updated README.md, AGENTS.md, GEMINI.md, and STATE.md (AD-043)                                                   |

---

## Spec-Anchored Acceptance Criteria

| Criterion (WHEN X THEN Y)                                              | Spec-defined outcome                                                                               | `file:line` + assertion                                                                                                                                                                                                                                                                                                      | Result  |
| ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| DEPLOY-01: Push to `main` with green CI deploys to live channel        | Deploy Angular SPA to Firebase Hosting `organiza-ai-3416f` on `live` channel                       | `.github/workflows/cd.yml:4-12,65-73` - `workflow_run` on `CI Pipeline` success; `channelId: live`, `projectId: organiza-ai-3416f`                                                                                                                                                                                           | ✅ PASS |
| DEPLOY-02: Deploy workflow generates `runtime-config.js`               | Injects `FIREBASE_API_KEY` into `public/runtime-config.js` before `npm run build`                  | `.github/workflows/cd.yml:39-55` - `cat <<EOF > public/runtime-config.js` with `${FIREBASE_API_KEY}` prior to `npm run build`                                                                                                                                                                                                | ✅ PASS |
| DEPLOY-03: Deploy workflow deploys Firestore rules & indexes           | Runs `firebase deploy --only hosting,firestore`                                                    | `.github/workflows/cd.yml:56-64,65-73` - `GOOGLE_APPLICATION_CREDENTIALS=/tmp/sa.json npx firebase-tools deploy --only firestore --project organiza-ai-3416f` & hosting action                                                                                                                                               | ✅ PASS |
| DEPLOY-04: Markdown-only push skips deploy workflow                    | Skips deploy when changes match `**/*.md`                                                          | `.github/workflows/cd.yml:21-27,29,66` - `dorny/paths-filter@v3` with filter `code: ['!**/*.md']` gating all run steps                                                                                                                                                                                                       | ✅ PASS |
| DEPLOY-05: Action uses `action-hosting-deploy@v0` with service account | Uses `FirebaseExtended/action-hosting-deploy@v0` with `FIREBASE_SERVICE_ACCOUNT_ORGANIZA_AI_3416F` | `.github/workflows/cd.yml:67-70` - `uses: FirebaseExtended/action-hosting-deploy@v0`, `firebaseServiceAccount: ${{ secrets.FIREBASE_SERVICE_ACCOUNT_ORGANIZA_AI_3416F }}`                                                                                                                                                    | ✅ PASS |
| DEPLOY-06: Quality or E2E failure blocks deploy                        | Deploy does not trigger if CI pipeline fails                                                       | `.github/workflows/cd.yml:12` - `if: ${{ github.event.workflow_run.conclusion == 'success' }}`                                                                                                                                                                                                                               | ✅ PASS |
| DEPLOY-07: PR opened/updated deploys preview channel & comments URL    | Deploys PR preview channel and posts preview URL comment                                           | `.github/workflows/cd-preview.yml:3-5,44-50` - `on: pull_request: branches: [main]`, `action-hosting-deploy@v0`                                                                                                                                                                                                              | ✅ PASS |
| DEPLOY-08: PR preview workflow generates `runtime-config.js`           | Injects `FIREBASE_API_KEY` before building                                                         | `.github/workflows/cd-preview.yml:29-43` - Injects `public/runtime-config.js` with `${FIREBASE_API_KEY}` before `npm run build`                                                                                                                                                                                              | ✅ PASS |
| DEPLOY-09: PR preview deploys hosting only                             | No Firestore rules deployed from PR preview                                                        | `.github/workflows/cd-preview.yml:44-50` - `FirebaseExtended/action-hosting-deploy@v0` hosting only; no firestore deploy step                                                                                                                                                                                                | ✅ PASS |
| DEPLOY-10: PR preview only runs on origin repo                         | Fork PRs are prevented from running deploy workflow                                                | `.github/workflows/cd-preview.yml:12` - `if: github.event.pull_request.head.repo.full_name == github.repository`                                                                                                                                                                                                             | ✅ PASS |
| DEPLOY-11: Markdown-only PR skips preview deploy                       | Skips workflow on `**/*.md` changes                                                                | `.github/workflows/cd-preview.yml:6-8` - `paths-ignore: ['**/*.md']`                                                                                                                                                                                                                                                         | ✅ PASS |
| DEPLOY-12: `npm run deploy` builds and deploys                         | Executes `npm run build` then `firebase deploy --only hosting,firestore`                           | `package.json:8` - `"deploy": "npm run build && firebase deploy --only hosting,firestore"`                                                                                                                                                                                                                                   | ✅ PASS |
| DEPLOY-13: `deploy` script in package.json                             | Defined in `scripts`                                                                               | `package.json:8` - `"deploy": "npm run build && firebase deploy --only hosting,firestore"`                                                                                                                                                                                                                                   | ✅ PASS |
| DEPLOY-14: CI always executes `format:check`                           | `npm run format:check` runs unconditionally                                                        | `.github/workflows/ci.yml:38-39` - Unconditional step `run: npm run format:check`                                                                                                                                                                                                                                            | ✅ PASS |
| DEPLOY-15: Markdown-only commits skip linters/build/E2E                | Skips ESLint, Stylelint, contract lint, build, E2E                                                 | `.github/workflows/ci.yml:22-28,42,46,50,54,60` - `dorny/paths-filter@v3` filters code; `quality` steps and `e2e` job check filter output                                                                                                                                                                                    | ✅ PASS |
| DEPLOY-16: Match for `events/{eventId}/invitations/{email}`            | Admins write; invited user reads/deletes own invitation                                            | `firestore.rules:40-44` - `allow read, delete: if isAdmin() \|\| (request.auth != null && request.auth.token.get('email', '').lower() == email.lower()); allow create, update: if isAdmin();` (verified in `e2e/rules/invitations.rules.test.ts:39-98`)                                                                      | ✅ PASS |
| DEPLOY-17: Collection group match `/{path=**}/invitations/{email}`     | Authenticated user reads invitations matching email                                                | `firestore.rules:27-32` - `allow read: if request.auth != null && (request.auth.token.get('email', '').lower() == email.lower() \|\| (resource != null && resource.data.get('invitedEmail', '').lower() == request.auth.token.get('email', '').lower()));` (verified in `e2e/rules/invitations.rules.test.ts:89-91,112-114`) | ✅ PASS |
| DEPLOY-18: Match for `users/{uid}/family/{memberId}`                   | Read/write allowed only when `request.auth.uid == uid`                                             | `firestore.rules:21-23` - `allow read, write: if request.auth != null && request.auth.uid == uid;` (verified in `e2e/rules/family.rules.test.ts:35-88`)                                                                                                                                                                      | ✅ PASS |
| DEPLOY-19: Updated rules pass `npm run test:rules`                     | All Firestore rules tests pass in emulator                                                         | `e2e/rules/*.rules.test.ts` - 13/13 tests pass in `npm run test:rules`                                                                                                                                                                                                                                                       | ✅ PASS |
| DEPLOY-20: Non-markdown changes run full gate + E2E                    | Code changes trigger quality gate and E2E                                                          | `.github/workflows/ci.yml:15,22-28,42-55,59-60` - `steps.filter.outputs.code` triggers linters, build, and downstream `e2e` job                                                                                                                                                                                              | ✅ PASS |
| DEPLOY-21: CD deploy reuses Node.js 22 & npm cache setup               | Node.js 22 with `cache: 'npm'` and `npm ci`                                                        | `.github/workflows/cd.yml:29-37` - `actions/setup-node@v4` with `node-version: 22`, `cache: 'npm'`, `npm ci` matching `ci.yml:29-37`                                                                                                                                                                                         | ✅ PASS |

**Status**: ✅ All 21 ACs covered with exact citations and verified tests.

---

## Discrimination Sensor

| Mutation | File:line            | Description                                                                                                   | Killed?                                                                                                     |
| -------- | -------------------- | ------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| 1        | `firestore.rules:22` | Flipped family roster ownership `request.auth.uid == uid` → `request.auth.uid != uid`                         | ✅ Killed (`e2e/rules/family.rules.test.ts` failed 2 tests: owner denied write & foreign user allowed read) |
| 2        | `firestore.rules:42` | Disabled admin invitation creation: `allow create, update: if isAdmin();` → `allow create, update: if false;` | ✅ Killed (`e2e/rules/invitations.rules.test.ts` failed test: allows admin to create invitation)            |
| 3        | `firestore.rules:28` | Disabled collection group query: `allow read: if request.auth != null && ...` → `allow read: if false;`       | ✅ Killed (`e2e/rules/invitations.rules.test.ts` failed test: allows invited user to read own invitation)   |

**Sensor depth**: Lightweight behavior-level fault injection on new security rules contract surface (3/3 targeted mutations).
**Result**: 3/3 killed — [PASS ✅]

---

## Code Quality

| Principle                             | Status | Notes                                                                                               |
| ------------------------------------- | ------ | --------------------------------------------------------------------------------------------------- |
| Minimum code                          | ✅     | Standard actions and rules without boilerplate                                                      |
| Surgical changes                      | ✅     | Only modified CI workflows, rules, tests, and documentation                                         |
| No scope creep                        | ✅     | Staging environments, SSR hosting, and functions properly excluded per spec                         |
| Matches patterns                      | ✅     | Reuses existing `@firebase/rules-unit-testing` and GitHub Actions patterns                          |
| Spec-anchored outcome check           | ✅     | All 21 ACs map to precise asserted outcomes                                                         |
| Per-layer Coverage Expectation met    | ✅     | 1:1 test mapping for Firestore rules; structural validation for workflows                           |
| Every test maps to a spec requirement | ✅     | `e2e/rules/family.rules.test.ts` (DEPLOY-18) and `invitations.rules.test.ts` (DEPLOY-16, DEPLOY-17) |
| Documented guidelines followed        | ✅     | Adheres to `AGENTS.md` CI/CD standards and AD-043                                                   |

---

## Edge Cases

- [x] Missing `FIREBASE_SERVICE_ACCOUNT_ORGANIZA_AI_3416F` secret: Handled by GitHub Actions secret injection; deploy step will fail fast on auth error.
- [x] Missing `FIREBASE_API_KEY` secret: `runtime-config.js` generates empty apiKey string; Firebase SDK initialization fails visibly at review/runtime.
- [x] Build failure during deployment: GitHub Actions sequential step execution halts workflow before deploy step.

---

## Gate Check

- **Gate commands**:
  - `npm run test:rules`: 13 passed, 0 failed, 0 skipped (3 test files: `family.rules.test.ts`, `invitations.rules.test.ts`, `rsvp.rules.test.ts`)
  - `npm run quality`: 0 errors (ESLint, Stylelint, validate-ui-contracts, Prettier format check all passed)
  - `npm run build`: Angular production build completed successfully in 5.4s
- **Test count before feature**: 6 rules tests
- **Test count after feature**: 13 rules tests
- **Delta**: +7 new unit tests covering family and collaborator invitation rules
- **Skipped tests**: 0
- **Failures**: 0

---

## Requirement Traceability Update

| Requirement ID | Story                            | Previous Status | New Status  |
| -------------- | -------------------------------- | --------------- | ----------- |
| DEPLOY-01      | P1: Automated Production Deploy  | Implementing    | ✅ Verified |
| DEPLOY-02      | P1: Automated Production Deploy  | Implementing    | ✅ Verified |
| DEPLOY-03      | P1: Automated Production Deploy  | Implementing    | ✅ Verified |
| DEPLOY-04      | P1: Automated Production Deploy  | Implementing    | ✅ Verified |
| DEPLOY-05      | P1: Automated Production Deploy  | Implementing    | ✅ Verified |
| DEPLOY-06      | P1: Automated Production Deploy  | Implementing    | ✅ Verified |
| DEPLOY-07      | P1: PR Preview Deploy            | Implementing    | ✅ Verified |
| DEPLOY-08      | P1: PR Preview Deploy            | Implementing    | ✅ Verified |
| DEPLOY-09      | P1: PR Preview Deploy            | Implementing    | ✅ Verified |
| DEPLOY-10      | P1: PR Preview Deploy            | Implementing    | ✅ Verified |
| DEPLOY-11      | P1: PR Preview Deploy            | Implementing    | ✅ Verified |
| DEPLOY-12      | P2: Local Deploy Script          | Implementing    | ✅ Verified |
| DEPLOY-13      | P2: Local Deploy Script          | Implementing    | ✅ Verified |
| DEPLOY-14      | P2: CI Pipeline Optimization     | Implementing    | ✅ Verified |
| DEPLOY-15      | P2: CI Pipeline Optimization     | Implementing    | ✅ Verified |
| DEPLOY-16      | P1: Firestore Security Rules Fix | Implementing    | ✅ Verified |
| DEPLOY-17      | P1: Firestore Security Rules Fix | Implementing    | ✅ Verified |
| DEPLOY-18      | P1: Firestore Security Rules Fix | Implementing    | ✅ Verified |
| DEPLOY-19      | P1: Firestore Security Rules Fix | Implementing    | ✅ Verified |
| DEPLOY-20      | P2: CI Pipeline Optimization     | Implementing    | ✅ Verified |
| DEPLOY-21      | P2: CI Pipeline Optimization     | Implementing    | ✅ Verified |

---

## Summary

**Overall**: ✅ Ready (Verdict: PASS)

**Spec-anchored check**: 21/21 ACs matched spec outcome | 0 spec-precision gaps
**Sensor**: 3/3 mutations killed
**Gate**: `npm run test:rules` (13/13 passed), `npm run quality` (0 errors), `npm run build` (success)

**What works**:

- Automated production CD pipeline (`cd.yml`) triggered on CI Pipeline success for `main`
- PR preview deployment (`cd-preview.yml`) for pull requests from same repo
- Smart CI path filtering (`ci.yml`) skipping heavy jobs on markdown-only changes while enforcing formatting
- Firestore security rules for `events/{id}/invitations/{email}`, `/{path=**}/invitations/{email}`, and `users/{uid}/family/{memberId}` with 13 passing emulator tests
- `npm run deploy` convenience script for local deployment
- AD-043 decision and architecture documented across `README.md`, `AGENTS.md`, `GEMINI.md`, and `STATE.md`
