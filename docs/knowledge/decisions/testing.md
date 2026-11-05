---
type: decision
title: Testing strategy
status: active
supersedes: [AD-015, AD-029, AD-030]
enforced_by:
  - .github/workflows/ci.yml
  - .github/workflows/e2e-videos-cleanup.yml
  - scripts/e2e-changed-videos.mjs
related: [workflow.md]
---

# Testing strategy

- **Unit (Vitest, `npm test`)**: every component and service ships a `.spec.ts`. Test the public API: inputs update the template, interactions emit outputs, ARIA attributes are present.
- **Firestore rules (`npm run test:rules`)**: every collection in `firestore.rules` is covered under `e2e/rules/`, including the field checks (`field-validation.rules.test.ts`). Runs in the Firestore emulator, which needs Java 21 or newer on the PATH; CI runs it in the `firestore-rules` job. `events.rules.test.ts` covers who may create, edit, delete and join an event (account holder, owner, invited collaborator, stranger, anonymous).
- **E2E (Playwright, `npm run test:e2e`)**: Desktop Chromium and Pixel 5. Suites live in `e2e/tests/` grouped by product area (`home/`, `auth/`, `invites/`, `event-page/`, `organizer/`, `profile/`, `journeys/`, `quality/`, `design-system/`), never numbered: a new test goes in the folder of the area it checks. Each test is atomic: it builds its own state (mock auth via `addInitScript`, mock Firestore via `__MOCK_DOCUMENTS__`), checks one screen or step, saves a screenshot to `e2e/screenshots/` and ends. Page objects in `e2e/pages/`, harnesses in `e2e/components/`. Titles use today's words (drawer, item list, flat surfaces), not old spec ids.
- `e2e/tests/invites/invites-and-guests.spec.ts` covers the redesign's product rules end to end: filter chips, Em breve / Agendado / Realizado by start time, category vs status tags, sign-in redirect, the RSVP drawer, declining with a message, "Quem vai" for guests and organizers, the header theme switch and the profile companion history.
- The Firestore mock (`__MOCK_DOCUMENTS__`) ignores `where` filters: list queries return every document, so a test seeds only what the screen should see.
- **PR videos (`npm run test:e2e:video`, CI job `e2e-videos`)**: a PR's comment shows a slowed-down video of each E2E test it adds or changes, so a reviewer watches the new behaviour instead of testing it by hand. `scripts/e2e-changed-videos.mjs` diffs `e2e/tests/` against the merge base with the PR's base branch (locally also uncommitted and untracked specs), keeps the tests whose lines changed (all tests of a new file, of a file whose code above the first test changed, or of a spec importing a changed helper in `e2e/tests/`; at most 25), and runs them in the `demo` project that `E2E_DEMO=1` switches `playwright.config.ts` to: 1280×800 (`--mobile` adds Pixel 5), `slowMo` 500 ms, Playwright's action highlights and step overlay, no retries, snapshots ignored, and a 1.5 s hold on the last frame (`demoHold` in `e2e/fixtures/test.fixture.ts`). Videos land in `e2e-videos/<area>-<test-title>.webm` with `manifest.json`. Without `E2E_DEMO` the config only has `chromium` and `mobile-chrome`, which record nothing, so the normal run is as fast as before.
- **How CI shows them**: GitHub only plays videos inline that a person uploaded through the web editor (there is no API for it), and artifacts are zip downloads behind a login, which a comment cannot embed. So the job converts each video with ffmpeg to a small GIF (640 px, 6 fps, shown inline in a collapsed `<details>` per test) and an MP4 (full quality, opens in the browser player), and `scripts/e2e-videos-branch.sh` pushes them to `pr-<n>/<sha>/` on the orphan `e2e-videos` branch, which the comment links through `raw.githubusercontent.com` (the repository is public). The branch is one force-pushed parentless commit, so old media do not grow the history, and `e2e-videos-cleanup.yml` drops a PR's folder when it closes. The original `.webm` files are also uploaded as the `e2e-videos` artifact (30 days). Trade-offs: the GIFs are lower quality than the video; media of open PRs live in the repository; a private repository would need another host, because raw URLs then require a login. Fork PRs are skipped (their token cannot push or comment). The job never fails a PR for a failing test, the `e2e` job does; a failing test still gets its video, marked ❌.
- Visual checks assert tokens and invariants (no horizontal overflow, 48px targets, focus colour = `--org-primary`), not pixels.

A behaviour change starts with a failing test that describes it; the test is the specification. When a product rule changes, update [events-and-invites](events-and-invites.md) and the E2E that checks it in the same commit, so regressions are caught without manual testing.
