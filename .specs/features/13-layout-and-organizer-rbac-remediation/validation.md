# Feature 13 — Layout Remediation and Organizer RBAC Regression Coverage: Validation

**Date**: 2026-08-21  
**Spec**: `.specs/features/13-layout-and-organizer-rbac-remediation/spec.md`  
**Diff range**: `7b3288e..worktree` (`4f9f764` plus the pending dialog-regression correction)  
**Verifier**: independent sub-agent (author != verifier)

---

## Verdict: PASS

All Feature 13 requirements have direct evidence. The dialog regression contract now selects the component surface itself, asserts exact computed mobile/desktop horizontal padding, constrains horizontal content/action margins, and kills the original `16px -> 4px` padding mutation.

## Task Completion

| Task | Status | Notes |
| --- | --- | --- |
| T1 | ✅ Done | Scroll reset is implemented and its mutation was killed. |
| T2 | ✅ Done | E2E-28 now rejects insufficient local padding. |
| T3 | ✅ Done | Signal input binding and full-row editor are exercised. |
| T4 | ✅ Done | Mobile surface gutter and overflow are asserted. |
| T5 | ✅ Done | Editor inset, stepper scrolling, and overflow are asserted. |
| T6 | ✅ Done | Organizer routes use a non-Super-Admin fixture and `/admin` redirects. |

## Spec-Anchored Acceptance Criteria

| Criterion | Spec-defined outcome | `file:line` + assertion | Result |
| --- | --- | --- | --- |
| LAYOUT-01 | Mobile title, content, input, action, and close control are at least 16px inside the dialog surface. | `e2e/specs/13-organizer-happy-path.spec.ts:933-950` selects `.collaborator-dialog`, asserts 16px computed horizontal padding, zero content/action horizontal margins, and 48px submit/close targets. The `padding: 16px -> 4px` mutation failed at `:943`. | ✅ PASS |
| LAYOUT-02 | At >=600px, dialog inset is 24px and actions are >=48px high. | `e2e/specs/13-organizer-happy-path.spec.ts:942-950` derives 24px on desktop, asserts both computed horizontal paddings and 48px action targets; Chromium E2E-28 passed. | ✅ PASS |
| LAYOUT-03 | Profile editor uses shared outlined field and primary focus treatment. | `e2e/specs/13-organizer-happy-path.spec.ts:802-827` asserts symmetric card insets, focus, 48px actions, and save result; `src/app/features/profile/components/profile-info-card/profile-info-card.component.html:27-39` uses signal input binding. | ✅ PASS |
| LAYOUT-04 | Mobile editor/detail cards and fields have >=12px viewport inset without clipping. | `e2e/specs/13-organizer-happy-path.spec.ts:228-248` asserts editor region bounds and document overflow; `e2e/specs/13-organizer-happy-path.spec.ts:577-598` aligns event-detail surfaces and asserts overflow. | ✅ PASS |
| LAYOUT-05 | Modified states use project `--org-*` / `--mat-sys-*` colors. | `src/app/features/organizer/event-editor/components/collaborator-invite-dialog/collaborator-invite-dialog.component.scss:8-34`, `src/app/features/profile/components/profile-info-card/profile-info-card.component.scss:37-70`, and `e2e/specs/13-organizer-happy-path.spec.ts:820` show token use and focused control behavior. | ✅ PASS |
| CAPTURE-01 | Screenshot helper resets window and app-shell horizontal/vertical scroll before capture. | `e2e/pages/base.page.ts:33-45`; mutation removing line 36 made E2E-06 fail at `e2e/specs/13-organizer-happy-path.spec.ts:260-262`. | ✅ PASS |
| CAPTURE-02 | ViaCEP mobile capture has `scrollLeft === 0` and fully visible left edge. | `e2e/specs/13-organizer-happy-path.spec.ts:250-262` asserts zero origin after capture; `:228-248` asserts visible 12px bounds. | ✅ PASS |
| CAPTURE-03 | Mobile flows assert no document horizontal overflow and affected surface insets. | `e2e/specs/13-organizer-happy-path.spec.ts:228-248,577-598,942-950` asserts overflow and editor/detail/dialog insets. | ✅ PASS |
| RBAC-01 | A non-Super-Admin can use organizer flows at `/meus-eventos` without admin navigation. | `e2e/specs/06-collaborator-rbac.spec.ts:20-38,56-94` supplies `organizer@organizaai.test` and uses organizer paths; `e2e/specs/02-auth-guards.spec.ts:69-85` loads the organizer dashboard. | ✅ PASS |
| RBAC-02 | A non-Super-Admin visiting `/admin` is redirected to `/meus-eventos`. | `e2e/specs/02-auth-guards.spec.ts:69-85` asserts the exact final URL; `src/app/core/guards/super-admin.guard.ts:25-29` returns that UrlTree. | ✅ PASS |
| RBAC-03 | `/meus-eventos` has `authGuard`; `/admin` has `superAdminGuard`. | `src/app/app.routes.ts:26-35` assigns the guards; `e2e/specs/02-auth-guards.spec.ts:5-15,69-85` covers unauthenticated and authenticated behavior. | ✅ PASS |

**Status**: 11/11 requirements matched their spec outcome.

## Discrimination Sensor

Scratch worktrees: `/private/tmp/organizaai-f13-sensor` and `/private/tmp/organizaai-f13-reverify` (both removed after testing). The real worktree was never mutated by sensor work.

| Mutation | File:line | Targeted test | Killed? |
| --- | --- | --- | --- |
| Removed `main.app-content` scroll reset | `e2e/pages/base.page.ts:36` | Mobile E2E-06 | ✅ Killed — post-capture `scrollTop` stayed `72` rather than `0`. |
| Changed collaborator root padding `16px` to `4px` against the corrected assertion | `src/app/features/organizer/event-editor/components/collaborator-invite-dialog/collaborator-invite-dialog.component.scss:7` | Mobile E2E-28 | ✅ Killed — computed `padding-left` was `4px`, not the required `16px`. |

**Sensor depth**: lightweight  
**Result**: 2/2 killed — **PASS**

## Gate Check

| Gate | Result |
| --- | --- |
| `validate_spec.py 13-layout-and-organizer-rbac-remediation` | ✅ 0 errors, 0 warnings |
| `validate_tasks.py 13-layout-and-organizer-rbac-remediation` | ✅ 0 errors, 0 warnings |
| `npm run build` | ✅ exit 0 |
| `npm test -- --watch=false` | ✅ 42 files, 301 tests passed |
| `npm run test:e2e` | ✅ exit 0; 148 tests started, 0 failures reported |
| Sensor E2E-06 | ✅ fault killed |
| Reverification E2E-28, Mobile Chrome + Chromium | ✅ 2 passed |
| Sensor E2E-28 after `padding: 16px -> 4px` | ✅ fault killed |

## Edge Cases

- [x] App-shell scroll recovery after interaction: covered by the killed E2E-06 mutation.
- [x] Small-viewport dialog content/close/input insets: exact component padding and zero content/action horizontal margins are asserted; the 4px regression is killed.
- [x] Non-Super-Admin route boundary: covered by the exact organizer and `/admin` redirect URL assertions.

## RBAC Scope Note

The client route boundary is correctly exercised by this feature. It is **not** server-side authorization proof. `firestore.rules:14-16` currently lets any authenticated user write their own `/admins/{email}` document; `firestore.rules:23-25` then grants every `isAdmin()` user event writes. Owner/collaborator rules and invitation subcollection rules are also absent. This critical Firestore authorization issue remains outside Feature 13's approved route/layout scope and needs a separate rules/emulator-backed work item.

## Code Quality

| Principle | Status |
| --- | --- |
| Minimum/surgical implementation | ✅ |
| No unrelated product behavior beyond organizer login routing | ✅ |
| Angular signals and OnPush conventions retained | ✅ |
| Mobile-first/token conventions followed by modified component rules | ✅ |
| Tests map to requirements | ✅ Dialog test is discriminating for the reported padding regression |
| AGENTS.md and DESIGN.md requirements considered | ✅ |

## Requirement Traceability Update

| Requirement | Previous status | Validation status |
| --- | --- | --- |
| All Feature 13 requirements | Implemented | ✅ Verified |
