# Firebase Hosting Deploy Tasks

## Execution Protocol (MANDATORY — do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user — do not proceed without it.**

---

**Design**: `.specs/features/24-firebase-hosting-deploy/design.md`
**Status**: Draft

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec — confirm before Execute. Guidelines found: `AGENTS.md`, `ci.yml`, `package.json`.

| Code Layer               | Required Test Type | Coverage Expectation                                            | Location Pattern            | Run Command        |
| ------------------------ | ------------------ | --------------------------------------------------------------- | --------------------------- | ------------------ |
| Firestore Security Rules | unit               | 1:1 mapping to rules ACs (invitations, family, collectionGroup) | `e2e/rules/*.rules.test.ts` | npm run test:rules |
| GitHub Actions Workflow  | none               | Structural validation only (YAML syntax, correct keys)          | `.github/workflows/*.yml`   | build gate only    |
| package.json scripts     | none               | Verified by running the script                                  | `package.json`              | build gate only    |
| README documentation     | none               | Human review                                                    | `README.md`                 | build gate only    |

## Gate Check Commands

> Generated from codebase — confirm before Execute.

| Gate Level | When to Use                             | Command              |
| ---------- | --------------------------------------- | -------------------- |
| Quick      | After tasks with unit tests only        | `npm run test:rules` |
| Build      | After all tasks (verify project builds) | `npm run build`      |
| Quality    | Final validation                        | `npm run quality`    |

---

## Execution Plan

Phases are ordered and run sequentially — each phase completes before the next begins, and tasks within a phase execute in order.

### Phase 1: Security Rules & CD Workflows

T1, T2, T3, and T4 create independent files and security rule fixes. T5 documents all four.

```
T1 -> T5
T2 -> T5
T3 -> T5
T4 -> T5
```

---

## Task Breakdown

### T1: Update Firestore Security Rules and Add Unit Tests

**What**: Update `firestore.rules` to cover `events/{id}/invitations/{email}`, collection group `/{path=**}/invitations/{email}`, and `users/{uid}/family/{memberId}`, with unit tests.
**Where**: `firestore.rules`
**Depends on**: None
**Reuses**: Existing `e2e/rules/rsvp.rules.test.ts` testing pattern with `@firebase/rules-unit-testing`

**Requirement**: DEPLOY-16, DEPLOY-17, DEPLOY-18, DEPLOY-19

**Tools**:

- MCP: NONE
- Skill: `firebase-security-rules-auditor`

**Done when**:

- [ ] `firestore.rules` includes match for `events/{eventId}/invitations/{email}`
- [ ] `firestore.rules` includes match for `/{path=**}/invitations/{email}` for collection group queries
- [ ] `firestore.rules` includes match for `users/{uid}/family/{memberId}`
- [ ] Unit tests in `e2e/rules/` cover invitation permissions, family roster permissions, and collection group query
- [ ] Gate check passes: `npm run test:rules` (or vitest unit testing against emulator)

**Tests**: unit
**Gate**: quick

---

### T2: Create Production Deploy Workflow (cd.yml)

**What**: Create `cd.yml` GitHub Actions workflow that deploys the app + Firestore rules to production on CI success.
**Where**: `.github/workflows/cd.yml`
**Depends on**: None
**Reuses**: costuraai `firebase-hosting-merge.yml` pattern; existing `ci.yml` Node.js/npm setup

**Requirement**: DEPLOY-01, DEPLOY-02, DEPLOY-03, DEPLOY-04, DEPLOY-05, DEPLOY-06, DEPLOY-14, DEPLOY-15

**Tools**:

- MCP: NONE
- Skill: `firebase-hosting-basics`

**Done when**:

- [ ] Workflow triggers on `workflow_run` of `CI Pipeline` (success, `main` branch)
- [ ] `paths-ignore` includes `**/*.md`
- [ ] Generates `public/runtime-config.js` from `FIREBASE_API_KEY` secret
- [ ] Runs `npm run build`
- [ ] Deploys Firestore rules via `npx firebase-tools deploy --only firestore`
- [ ] Deploys hosting via `FirebaseExtended/action-hosting-deploy@v0` with `channelId: live`
- [ ] Uses `FIREBASE_SERVICE_ACCOUNT_ORGANIZA_AI_3416F` secret
- [ ] Uses Node.js 22 with npm cache
- [ ] YAML is valid

**Tests**: none
**Gate**: build

---

### T3: Create PR Preview Deploy Workflow (cd-preview.yml)

**What**: Create `cd-preview.yml` GitHub Actions workflow that deploys to a preview channel on PRs.
**Where**: `.github/workflows/cd-preview.yml`
**Depends on**: None
**Reuses**: costuraai `firebase-hosting-pull-request.yml` pattern

**Requirement**: DEPLOY-07, DEPLOY-08, DEPLOY-09, DEPLOY-10, DEPLOY-11

**Tools**:

- MCP: NONE
- Skill: `firebase-hosting-basics`

**Done when**:

- [ ] Workflow triggers on `pull_request` against `main`
- [ ] `paths-ignore` includes `**/*.md`
- [ ] Guard: `if: github.event.pull_request.head.repo.full_name == github.repository`
- [ ] Generates `public/runtime-config.js` from `FIREBASE_API_KEY` secret
- [ ] Runs `npm run build`
- [ ] Deploys hosting only (no Firestore rules) via `FirebaseExtended/action-hosting-deploy@v0` (no `channelId`)
- [ ] Uses `FIREBASE_SERVICE_ACCOUNT_ORGANIZA_AI_3416F` secret
- [ ] Uses Node.js 22 with npm cache
- [ ] YAML is valid

**Tests**: none
**Gate**: build

---

### T4: Add Deploy Script to package.json

**What**: Add `"deploy"` npm script for manual local deployment.
**Where**: `package.json`
**Depends on**: None
**Reuses**: Existing `build` script

**Requirement**: DEPLOY-12, DEPLOY-13

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `"deploy": "npm run build && npx firebase-tools deploy --only hosting,firestore"` exists in `scripts`
- [ ] `npm run deploy` is runnable (script resolves without syntax error)

**Tests**: none
**Gate**: build

---

### T5: Update Project Documentation (README, AGENTS, GEMINI, STATE)

**What**: Update project documentation to record the CD pipeline, PR preview workflows, Firestore rules coverage, AD-043 decision, and local deploy instructions.
**Where**: `README.md`
**Depends on**: T1, T2, T3, T4
**Reuses**: Existing README and AGENTS.md structure

**Requirement**: DEPLOY-01, DEPLOY-07, DEPLOY-12

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `README.md` CI/CD section documents the pipeline (`ci.yml` → `cd.yml`), `cd-preview.yml`, required secrets, and `npm run deploy`
- [ ] `AGENTS.md` and `GEMINI.md` CI/CD section updated with automated deployment architecture
- [ ] `.specs/STATE.md` updated with AD-043 (Automated Firebase Hosting CD Pipeline & Firestore Rules Governance)
- [ ] Build gate passes: `npm run quality`

**Tests**: none
**Gate**: build

---

## Phase Execution Map

```
Phase 1:
  T1 -> T5
  T2 -> T5
  T3 -> T5
  T4 -> T5
```

Single phase, 5 tasks — fits a single inline execution (≤ 8 tasks).

---

## Task Granularity Check

| Task                                  | Scope                  | Status      |
| ------------------------------------- | ---------------------- | ----------- |
| T1: Update Firestore security rules   | 2 files (rules + test) | ✅ Granular |
| T2: Create production deploy workflow | 1 file                 | ✅ Granular |
| T3: Create PR preview deploy workflow | 1 file                 | ✅ Granular |
| T4: Add deploy script to package.json | 1 field change         | ✅ Granular |
| T5: Update README with deploy docs    | 1 file section         | ✅ Granular |

---

## Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows              | Status   |
| ---- | ---------------------- | -------------------------- | -------- |
| T1   | None                   | None (independent)         | ✅ Match |
| T2   | None                   | None (independent)         | ✅ Match |
| T3   | None                   | None (independent)         | ✅ Match |
| T4   | None                   | None (independent)         | ✅ Match |
| T5   | T1, T2, T3, T4         | T1→T5, T2→T5, T3→T5, T4→T5 | ✅ Match |

---

## Test Co-location Validation

| Task              | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
| ----------------- | --------------------------- | --------------- | --------- | ------ |
| T1: Rules fix     | Firestore Security Rules    | unit            | unit      | ✅ OK  |
| T2: Merge deploy  | GitHub Actions Workflow     | none            | none      | ✅ OK  |
| T3: PR preview    | GitHub Actions Workflow     | none            | none      | ✅ OK  |
| T4: Deploy script | package.json scripts        | none            | none      | ✅ OK  |
| T5: README docs   | README documentation        | none            | none      | ✅ OK  |
