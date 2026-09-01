# Firebase Hosting Deploy Specification

## Problem Statement

Organiza AI has a complete CI pipeline (quality + E2E) on GitHub Actions, but no automated deployment. The built Angular SPA and Firestore security rules must be deployed to Firebase Hosting and Firestore whenever code merges to `main`, and pull requests need ephemeral preview URLs for visual review before merge.

## Goals

- [ ] Automate production deployment to Firebase Hosting on every merge to `main` (after quality + E2E gates pass)
- [ ] Automate Firestore security rules and indexes deployment alongside hosting
- [ ] Provide ephemeral preview URLs for pull requests
- [ ] Inject the production `runtime-config.js` (API key) via GitHub Secrets during CI
- [ ] Add a convenience `npm run deploy` script for manual local deployment

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature                                | Reason                                                                |
| -------------------------------------- | --------------------------------------------------------------------- |
| Firebase App Hosting (SSR backend)     | Organiza AI is a client-side SPA; classic Hosting is sufficient       |
| Cloud Functions deployment             | No Cloud Functions exist in the project                               |
| Custom domain configuration            | DNS setup is a manual, one-time step done in Firebase Console         |
| Firebase Authentication configuration  | Auth is configured via Firebase Console, not deployed via CI          |
| Preview channel expiration tuning      | Default 7-day expiry is acceptable                                    |
| Multi-environment (staging) deployment | Single production environment is sufficient for current project scope |

---

## Assumptions & Open Questions

Every ambiguity is resolved or recorded here — nothing is left silently unclear.

| Assumption / decision                                       | Chosen default                                                                        | Rationale                                                                                                       | Confirmed? |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ---------- |
| Firebase project ID is `organiza-ai-3416f`                  | Use existing `.firebaserc` value                                                      | Already configured; `.firebaserc` confirms `organiza-ai-3416f`                                                  | y          |
| Service account secret name                                 | `FIREBASE_SERVICE_ACCOUNT_ORGANIZA_AI_3416F`                                          | Follows Firebase convention; user will configure manually in GitHub Settings                                    | y          |
| Deploy action uses `FirebaseExtended/action-hosting-deploy` | Use `@v0` (same as costuraai)                                                         | Proven pattern in sibling project; official Firebase action                                                     | y          |
| Runtime config injection via heredoc in CI                  | Generate `public/runtime-config.js` from `FIREBASE_API_KEY` secret before build       | Organiza AI uses runtime config pattern (not environment.ts) for key rotation without rebuild                   | y          |
| Deploy workflow runs after quality + E2E                    | Separate workflow file with `workflow_run` trigger on CI Pipeline success             | Deployment must not proceed if tests fail; separate file keeps CI and CD concerns decoupled                     | y          |
| Firestore rules/indexes deploy alongside hosting            | Single `firebase deploy --only hosting,firestore` in the same workflow                | Rules changes ship with the code that expects them; keeps deployments atomic                                    | y          |
| PR preview deploys Firestore rules                          | No — preview deploys hosting only (rules target production and cannot be per-channel) | Firestore rules are global; deploying from a PR would affect production immediately; rules deploy only on merge | y          |
| `paths-ignore` for markdown-only changes                    | Skip deploy for `**/*.md` changes                                                     | Documentation changes do not affect the deployed application                                                    | y          |
| Existing `ci.yml` remains unchanged                         | Do not rename or modify `ci.yml`; deploy is a separate workflow file                  | Keeps CI and CD as independent concerns; deploy triggers via `workflow_run`                                     | y          |

**Open questions:** none — all resolved or logged above (required before the spec is confirmed).

---

## User Stories

### P1: Automated Production Deploy ⭐ MVP

**User Story**: As a developer, I want the application to be automatically deployed to Firebase Hosting when code merges to `main` so that production is always up to date without manual intervention.

**Why P1**: Core value of the feature — eliminates manual deploys and guarantees production parity with `main`.

**Acceptance Criteria** (each line is one EARS pattern):

1. WHEN a push to `main` triggers the CI pipeline and the quality + E2E jobs succeed THEN the system SHALL deploy the built Angular SPA to Firebase Hosting project `organiza-ai-3416f` on the `live` channel. <!-- DEPLOY-01, event-driven -->
2. WHEN the deploy workflow runs THEN the system SHALL generate `public/runtime-config.js` from the `FIREBASE_API_KEY` GitHub Secret before executing `npm run build`. <!-- DEPLOY-02, event-driven -->
3. WHEN the deploy workflow runs THEN the system SHALL deploy Firestore security rules and indexes alongside hosting using `firebase deploy --only hosting,firestore`. <!-- DEPLOY-03, event-driven -->
4. WHEN a push to `main` modifies only markdown files (`**/*.md`) THEN the system SHALL skip the deploy workflow. <!-- DEPLOY-04, event-driven -->
5. The deploy workflow SHALL use the `FirebaseExtended/action-hosting-deploy@v0` GitHub Action with the Firebase service account stored in `FIREBASE_SERVICE_ACCOUNT_ORGANIZA_AI_3416F`. <!-- DEPLOY-05, ubiquitous -->
6. IF the quality or E2E job fails THEN the system SHALL not trigger the deploy workflow. <!-- DEPLOY-06, unwanted-behavior -->

**Independent Test**: Merge a commit to `main` → GitHub Actions runs quality + E2E → deploy job runs → site is live at `organiza-ai-3416f.web.app`.

---

### P1: Pull Request Preview Deploy ⭐ MVP

**User Story**: As a reviewer, I want pull requests to generate an ephemeral Firebase Hosting preview URL so that I can visually verify changes before approving.

**Why P1**: Critical for code review quality — reviewers can test the actual deployed application.

**Acceptance Criteria**:

1. WHEN a pull request is opened or updated against `main` THEN the system SHALL deploy the built application to a Firebase Hosting preview channel and post the preview URL as a PR comment. <!-- DEPLOY-07, event-driven -->
2. WHEN the PR preview workflow runs THEN the system SHALL generate `public/runtime-config.js` from the `FIREBASE_API_KEY` GitHub Secret before executing `npm run build`. <!-- DEPLOY-08, event-driven -->
3. WHEN the PR preview workflow deploys THEN the system SHALL deploy hosting only (no Firestore rules). <!-- DEPLOY-09, event-driven -->
4. The PR preview workflow SHALL only run for PRs from the same repository (not forks) to protect secrets. <!-- DEPLOY-10, ubiquitous -->
5. IF a pull request modifies only markdown files THEN the system SHALL skip the preview deploy. <!-- DEPLOY-11, unwanted-behavior -->

**Independent Test**: Open a PR → GitHub Actions deploys to preview → PR comment shows clickable preview URL.

---

### P1: Firestore Security Rules Fix ⭐ MVP

**User Story**: As the system, I want Firestore security rules to cover all subcollections the app uses so that the deployed rules enforce correct access control for invitations and family rosters.

**Why P1**: Without rules, `events/{id}/invitations/{email}` and `users/{uid}/family/{id}` default to deny-all, which silently breaks collaborator invitations and family roster persistence in production when rules are enforced.

**Acceptance Criteria**:

1. The Firestore rules SHALL include a match for `events/{eventId}/invitations/{email}` that allows admins to create and manage invitations and allows the invited user (matching `request.auth.token.email`) to read and delete their own invitation. <!-- DEPLOY-16, ubiquitous -->
2. The Firestore rules SHALL include a collection group match `/{path=**}/invitations/{email}` that allows an authenticated user to read invitations where `invitedEmail` matches their own email, enabling the `claimPendingInvitations` collection group query. <!-- DEPLOY-17, ubiquitous -->
3. The Firestore rules SHALL include a match for `users/{uid}/family/{memberId}` that allows read and write only when `request.auth.uid == uid`. <!-- DEPLOY-18, ubiquitous -->
4. WHEN the updated `firestore.rules` is deployed THEN the system SHALL pass the existing Firestore rules unit tests (`npm run test:rules`). <!-- DEPLOY-19, event-driven -->

**Independent Test**: Deploy updated rules → collaborator invitation flow works → family roster CRUD works → `test:rules` passes.

---

### P2: Local Deploy Convenience Script

**User Story**: As a developer, I want an `npm run deploy` script so that I can manually deploy from my local machine when needed.

**Why P2**: Useful for emergency hotfixes or initial setup verification, but not critical for day-to-day workflow.

**Acceptance Criteria**:

1. WHEN a developer runs `npm run deploy` THEN the system SHALL execute `npm run build` followed by `firebase deploy --only hosting,firestore`. <!-- DEPLOY-12, event-driven -->
2. The `deploy` script SHALL be defined in `package.json` `scripts`. <!-- DEPLOY-13, ubiquitous -->

**Independent Test**: Run `npm run deploy` locally → site deploys to `organiza-ai-3416f.web.app`.

---

### P2: CI Pipeline Optimization & Integration

**User Story**: As a developer, I want the CI pipeline to always format-check markdown files while skipping heavy build and E2E jobs for markdown-only changes, and I want CD workflows to integrate cleanly after CI passes.

**Why P2**: Saves minutes of CI runner time on documentation updates while maintaining 100% format validation across all files.

**Acceptance Criteria**:

1. WHEN a commit is pushed or PR created THEN the CI pipeline SHALL always execute `npm run format:check` across all files including markdown. <!-- DEPLOY-14, event-driven -->
2. IF only markdown files (`**/*.md`) are modified in a commit or PR THEN the CI pipeline SHALL skip ESLint, Stylelint, contract linting, Angular build, and Playwright E2E tests. <!-- DEPLOY-15, unwanted-behavior -->
3. WHEN non-markdown code files are modified THEN the CI pipeline SHALL execute the full quality gate (lint, styles, contracts, format, build) and the downstream Playwright E2E test suite. <!-- DEPLOY-20, event-driven -->
4. WHEN the CD deploy workflow triggers THEN the system SHALL reuse the same Node.js 22 and `npm ci` setup pattern as the existing CI pipeline. <!-- DEPLOY-21, event-driven -->

**Independent Test**: Push markdown-only commit → CI runs `format:check` and passes in ~15s, skipping E2E → Push code commit → CI runs full quality + E2E.

---

## Edge Cases

- IF the `FIREBASE_SERVICE_ACCOUNT_ORGANIZA_AI_3416F` secret is missing THEN the deploy step SHALL fail with a clear authentication error from the Firebase action. <!-- DEPLOY-06 covers -->
- IF the `FIREBASE_API_KEY` secret is missing THEN the generated `runtime-config.js` SHALL contain an empty string, causing the application to fail at Firebase initialization (visible at review time). <!-- caught by build or runtime -->
- IF `npm run build` fails during deploy THEN the workflow SHALL fail and not proceed to the deploy step. <!-- standard GitHub Actions behavior -->

---

## Requirement Traceability

| Requirement ID | Story                            | Phase   | Status   |
| -------------- | -------------------------------- | ------- | -------- |
| DEPLOY-01      | P1: Automated Production Deploy  | Execute | Verified |
| DEPLOY-02      | P1: Automated Production Deploy  | Execute | Verified |
| DEPLOY-03      | P1: Automated Production Deploy  | Execute | Verified |
| DEPLOY-04      | P1: Automated Production Deploy  | Execute | Verified |
| DEPLOY-05      | P1: Automated Production Deploy  | Execute | Verified |
| DEPLOY-06      | P1: Automated Production Deploy  | Execute | Verified |
| DEPLOY-07      | P1: PR Preview Deploy            | Execute | Verified |
| DEPLOY-08      | P1: PR Preview Deploy            | Execute | Verified |
| DEPLOY-09      | P1: PR Preview Deploy            | Execute | Verified |
| DEPLOY-10      | P1: PR Preview Deploy            | Execute | Verified |
| DEPLOY-11      | P1: PR Preview Deploy            | Execute | Verified |
| DEPLOY-12      | P2: Local Deploy Script          | Design  | Pending  |
| DEPLOY-13      | P2: Local Deploy Script          | Design  | Pending  |
| DEPLOY-14      | P2: CI Pipeline Optimization     | Execute | Verified |
| DEPLOY-15      | P2: CI Pipeline Optimization     | Execute | Verified |
| DEPLOY-16      | P1: Firestore Security Rules Fix | Execute | Verified |
| DEPLOY-17      | P1: Firestore Security Rules Fix | Execute | Verified |
| DEPLOY-18      | P1: Firestore Security Rules Fix | Execute | Verified |
| DEPLOY-19      | P1: Firestore Security Rules Fix | Execute | Verified |
| DEPLOY-20      | P2: CI Pipeline Optimization     | Execute | Verified |
| DEPLOY-21      | P2: CI Pipeline Optimization     | Execute | Verified |

**ID format:** `DEPLOY-[NUMBER]`

**Status values:** Pending → In Design → In Tasks → Implementing → Verified

**Coverage:** 21 total, 0 mapped to tasks, 21 unmapped ⚠️

---

## Success Criteria

How we know the feature is successful:

- [ ] Pushing to `main` automatically deploys the app to `organiza-ai-3416f.web.app` after CI passes
- [ ] Pull requests show a preview URL comment with a working preview deployment
- [ ] Firestore security rules cover invitations and family subcollections and pass all rule tests
- [ ] Firestore security rules are deployed alongside the application on merge to `main`
- [ ] Markdown-only changes run `format:check` and skip heavy build and E2E jobs
- [ ] `npm run deploy` works for manual local deployment
