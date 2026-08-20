# Testing Strategy Specification

## Problem Statement

The Organiza AI project (Angular 21+ PWA backed by Firebase/Firestore) currently has **zero automated tests**. This is a critical quality gap that is actively felt during AI-assisted development: layout regressions are introduced silently, service-layer bugs go undetected, and there is no safety net to validate that deployments are correct. The most immediate pain point is **layout regression** — visual breakage caused by iterative UI changes with no visual baseline to compare against. This spec defines the full testing strategy: a Jest-based unit-test layer for services and presentational components, and a Playwright-based end-to-end layer with screenshot capture and, as a future enhancement, AI-assisted layout quality analysis.

## Goals
- [ ] TEST-01 Establish a Jest-based unit-test runner replacing the default Karma setup
- [ ] TEST-02 Achieve ≥ 70 % global coverage (branches + lines) on the service layer
- [ ] TEST-03 Cover all presentational (Dumb) components with input/output/a11y tests
- [ ] TEST-04 Establish a Playwright e2e suite targeting the running dev server
- [ ] TEST-05 Automate the Admin authentication flow (login → dashboard) end-to-end
- [ ] TEST-06 Automate the complete Guest RSVP flow end-to-end
- [ ] TEST-07 Capture a full-page screenshot at the end of every e2e flow for manual layout review
- [ ] TEST-08 (P3) Submit captured screenshots to a vision model for automated layout quality analysis

## Out of Scope
| Feature | Reason |
|---|---|
| Performance / load testing | Outside current sprint; no SLA defined yet |
| Backend Cloud Functions testing | No Cloud Functions exist in the current architecture |
| Visual regression diffing (pixel-diff tools, e.g. Percy, Reg-suit) | Covered by the AI screenshot analysis story (P3); pixel-diff tooling is a separate decision |
| Contract / API testing | Firebase SDK is the only external API; mocked at the unit-test level |
| Full CI/CD pipeline integration | Infrastructure concern tracked separately; tests must be CI-ready but pipeline setup is out of scope |

---

## Assumptions & Open Questions
| Assumption / decision | Chosen default | Rationale | Confirmed? |
|---|---|---|---|
| Unit-test runner migration | Jest via `@angular-builders/jest` | Jest is faster than Karma (no real browser overhead), has superior TypeScript support, and is the community standard for Angular standalone projects | Yes |
| Minimum coverage threshold | 70 % branches + lines globally | Balances quality gate ambition with the zero-baseline starting point; can be tightened after first green run | Yes |
| E2E browser targets | Chromium, Firefox, WebKit | Aligns with Playwright defaults; covers the three major rendering engines with no extra cost | Yes |
| Firebase mocking strategy | `jest.fn()` stubs for Firestore + Auth; no emulator for unit tests | Emulator adds setup complexity for unit tests; e2e tests hit the dev server which itself uses Firebase | Yes |
| Screenshot storage location | `e2e/screenshots/` committed to the repository | Keeps screenshots close to the tests; large binary growth is a known trade-off accepted at this stage | Yes |
| AI layout analysis trigger | Feature-flag–controlled; off by default | Prevents flaky CI failures while the feature is experimental | Yes |
| AI layout verdict severity | WARNING only (never fails the build) | First iteration must not block deployments; human review is the primary gate | Yes |

**Open questions: none**

---

## User Stories

### P1 — Story 1: Unit Test Infrastructure Setup ⭐ MVP
**User Story**: As a developer, I want a Jest-based unit-test runner configured for the Angular project so that I can run fast, reliable unit tests with TypeScript support and coverage reporting.
**Why P1**: No unit tests can be written or run without this infrastructure. Everything else depends on it.
**Acceptance Criteria** (EARS notation):
1. WHEN unit tests are run via `ng test` THEN the system SHALL execute the test suite via the Jest runner with TypeScript support.
2. The system SHALL discover and run all `.spec.ts` files matching the glob `src/**/*.spec.ts`.
3. WHEN tests complete THEN the system SHALL output a coverage report to the `coverage/` directory.
4. The system SHALL enforce a minimum global coverage threshold of 70 % for both branches and lines, failing the run when the threshold is not met.
5. WHEN a test file contains a syntax or type error THEN the system SHALL report the error with a file path and line number and exit with a non-zero code.
**Independent Test**: Run `ng test --no-watch --coverage` on a clean checkout; confirm Jest output, coverage folder presence, and threshold enforcement.

---

### P1 — Story 2: Core Services Unit Tests ⭐ MVP
**User Story**: As a developer, I want unit tests for every core Angular service so that I can refactor the service layer with confidence and catch regressions immediately.
**Why P1**: Services encapsulate all business logic and Firebase interactions; untested services are the highest-risk code in the project.
**Acceptance Criteria** (EARS notation):
1. WHEN a service method is called with valid input THEN the system SHALL return the expected output as defined in the test contract.
2. WHEN `GuestSessionService.saveSession()` is called THEN the system SHALL persist the session data to `localStorage` and update the session signal to reflect the new value.
3. WHEN `GuestSessionService.clearSession()` is called THEN the system SHALL remove the session key from `localStorage` and set the session signal to `null`.
4. The system SHALL provide `.spec.ts` files for `GuestSessionService`, `ThemeService`, `SeasonalThemeService`, `EventService`, `GuestService`, `ItemService`, and `AuthService`.
5. WHERE Firebase-dependent services are tested THEN the system SHALL replace Firestore and Firebase Auth calls with `jest.fn()` stubs, never making real network calls in unit tests.
6. WHEN an `EventService` method that writes to Firestore is called THEN the system SHALL invoke the mocked Firestore stub with the expected collection path and payload.
**Independent Test**: Run `ng test --no-watch` and confirm all service specs pass with mocked Firebase; inspect coverage report to verify each service file is included.

---

### P1 — Story 3: Presentational Component Unit Tests ⭐ MVP
**User Story**: As a developer, I want unit tests for all presentational (Dumb) components that verify their API contract and accessibility so that I can safely modify the UI without breaking consumers or WCAG compliance.
**Why P1**: The Smart/Dumb architecture is only safe if Dumb components are tested against their public API; without these tests, AI-assisted UI changes can silently break both functionality and accessibility.
**Acceptance Criteria** (EARS notation):
1. WHEN a required `input()` value changes THEN the system SHALL reflect the new value in the rendered template within the same change-detection cycle.
2. WHEN a user interacts with an interactive element (click, keypress Enter/Space) THEN the system SHALL emit the corresponding `output()` event exactly once.
3. The system SHALL render semantic HTML elements (`<button>`, `<dialog>`, `<section>`, `<nav>`) for all interactive and landmark content instead of generic `<div>` elements.
4. The system SHALL include a non-empty `aria-label` attribute on all icon-only buttons that contain no visible text.
5. WHEN `ChangeDetectionStrategy.OnPush` is active THEN the system SHALL only re-render when an input signal reference changes, verified by asserting the DOM is unchanged after an unrelated trigger.
6. The system SHALL provide a `.spec.ts` file for every component in the `src/app/shared/components/` directory and for each feature-level presentational component.
**Independent Test**: Run `ng test --no-watch` and confirm all component specs pass; verify aria-label assertions catch regressions by deliberately removing one and confirming the test fails.

---

### P2 — Story 4: E2E Test Infrastructure with Playwright
**User Story**: As a developer, I want a Playwright end-to-end test suite configured for the Angular dev server so that I can run browser-level tests that verify complete user flows across Chromium, Firefox, and WebKit.
**Why P2**: E2E tests complement unit tests by verifying integration between the UI, routing, and Firebase; essential before any production release.
**Acceptance Criteria** (EARS notation):
1. WHEN `npx playwright test` is run THEN the system SHALL execute all test files matching `e2e/**/*.spec.ts`.
2. WHEN e2e tests are run and the dev server is not already running THEN the system SHALL automatically start `ng serve` via the `webServer` configuration in `playwright.config.ts` before executing tests.
3. The system SHALL support Chromium, Firefox, and WebKit as test targets, configurable in `playwright.config.ts`.
4. WHEN a test fails THEN the system SHALL save a trace file and a screenshot of the failure state to the Playwright output directory.
5. The system SHALL create the `e2e/screenshots/` directory structure during initial project setup.
**Independent Test**: Run `npx playwright test --project=chromium` on a cold start with no server running; confirm the server starts automatically, tests execute, and the output directory is created.

---

### P2 — Story 5: E2E — Admin Authentication Flow
**User Story**: As an admin (event organizer), I want the end-to-end test to verify the full login-to-dashboard flow so that regressions in authentication or routing are caught before deployment.
**Why P2**: Auth is a critical path; a broken login flow blocks all admin functionality.
**Acceptance Criteria** (EARS notation):
1. WHEN the e2e test navigates to `/login` THEN the system SHALL render the login page with a Google sign-in button visible.
2. WHEN the Google sign-in action is triggered in the test environment (via a mocked or test-credentials auth flow) THEN the system SHALL redirect the authenticated admin user to `/admin`.
3. WHEN the `/admin` route is active THEN the system SHALL render the admin dashboard with at least one landmark region (`<main>` or `role="main"`).
4. WHEN the auth flow e2e test completes THEN the system SHALL save a full-page screenshot to `e2e/screenshots/admin-auth-{timestamp}.png`.
**Independent Test**: Run the admin auth spec in isolation; confirm redirect to `/admin`, dashboard landmark presence, and screenshot file creation.

---

### P2 — Story 6: E2E — Guest RSVP Flow
**User Story**: As a guest attendee, I want the end-to-end test to verify the complete RSVP journey so that regressions in the guest experience are caught before any event goes live.
**Why P2**: The guest RSVP flow is the primary user-facing feature; breakage here directly impacts event attendees.
**Acceptance Criteria** (EARS notation):
1. WHEN the e2e test navigates to `/evento/:id` for a seeded test event THEN the system SHALL render the event detail page with an RSVP call-to-action visible.
2. WHEN the user activates the RSVP action THEN the system SHALL open the RSVP dialog (`<dialog>` element or `role="dialog"`).
3. WHEN the user fills in a name and phone number and submits the RSVP form THEN the system SHALL confirm the RSVP and display a success state (confetti animation or success message).
4. WHEN the RSVP is confirmed and the guest selects an item to claim THEN the system SHALL mark the item as claimed and reflect the updated state in the UI.
5. WHEN the guest RSVP e2e test completes THEN the system SHALL save a full-page screenshot to `e2e/screenshots/guest-rsvp-{timestamp}.png`.
**Independent Test**: Run the guest RSVP spec against a seeded Firestore test event; confirm dialog opens, success state renders, item claim is reflected, and screenshot is saved.

---

### P2 — Story 7: E2E — Screenshot Capture on Flow Completion
**User Story**: As a developer, I want every e2e test to automatically capture a full-page screenshot at the end of its flow so that I have a visual baseline for manual layout review after each test run.
**Why P2**: Layout regression is the most immediate pain point; screenshot capture is the lowest-cost baseline mechanism before AI analysis is ready.
**Acceptance Criteria** (EARS notation):
1. WHEN an e2e test completes its flow (pass or fail) THEN the system SHALL call `page.screenshot({ fullPage: true })` and save the result to `e2e/screenshots/`.
2. The system SHALL name each screenshot file using the pattern `{testName}-{timestamp}.png` where `{timestamp}` is an ISO-8601–formatted UTC date-time string with colons replaced by dashes.
3. WHEN the `e2e/screenshots/` directory does not exist at test startup THEN the system SHALL create it before writing any screenshot.
4. The system SHALL NOT fail the test solely because of screenshot write errors; such errors SHALL be logged as warnings.
**Independent Test**: Run all e2e specs and confirm that `e2e/screenshots/` contains one `.png` file per test with the expected naming pattern.

---

### P3 — Story 8: AI-Assisted Layout Analysis
**User Story**: As a developer, I want captured e2e screenshots to be automatically submitted to a vision model for layout quality analysis so that I receive an AI-assisted verdict on whether the UI looks correct, reducing the manual review burden over time.
**Why P3**: This is a forward-looking enhancement; manual screenshot review (Story 7) covers the immediate need. AI analysis adds value once the e2e suite is stable.
**Acceptance Criteria** (EARS notation):
1. WHERE the AI screenshot analysis feature flag is enabled in the test environment THEN the system SHALL submit each captured screenshot to the configured vision model API (Gemini Flash) after the e2e flow completes.
2. WHEN the vision model returns a layout assessment THEN the system SHALL log the verdict (`PASS` or `FAIL` with a list of detected issues) to the test run output.
3. IF layout issues are detected by the vision model THEN the system SHALL mark the test result as `WARNING` and include the issue descriptions in the test report, but SHALL NOT mark the test as `FAIL`.
4. The system SHALL NOT fail the CI build solely based on an AI layout verdict in the first iteration; human review remains the primary quality gate.
5. WHEN the vision model API is unreachable THEN the system SHALL log a warning and continue the test run without blocking.
**Independent Test**: Enable the feature flag, run one e2e spec with a deliberately broken layout, confirm the WARNING verdict is logged, and confirm the CI run still exits with code 0.

---

## Edge Cases
- **Zero-coverage baseline**: The first run will report 0 % coverage; the threshold enforcement (TEST-01 AC4) should be applied only after the first set of specs is written (Story 2 + Story 3). Consider a two-phase rollout: infrastructure first (threshold = 0 %), then raise to 70 % once service specs exist.
- **Flaky e2e due to Firestore latency**: The Guest RSVP flow (Story 6) depends on live or emulated Firestore. Tests must use `await expect(locator).toBeVisible()` with explicit timeouts rather than fixed sleeps.
- **Screenshot size**: Full-page screenshots of long event pages may be large (> 1 MB). Consider adding `e2e/screenshots/` to `.gitignore` and storing screenshots as CI artifacts instead of committing them if repository size becomes a concern.
- **Google Auth in e2e**: Real Google OAuth cannot be automated in a headless browser without test credentials or a Firebase Auth emulator. Story 5 must mock or stub the auth step using the Firebase Auth Emulator or a test-only bypass route.
- **OnPush + Signals timing**: Component tests must trigger `fixture.detectChanges()` after mutating signal inputs; failure to do so will cause false-passing tests where the DOM has not updated.
- **AI verdict non-determinism**: Vision model responses may vary between runs for the same screenshot. The WARNING-only severity (Story 8 AC3) mitigates this, but test authors should be aware that AI verdicts are advisory, not deterministic.

---

## Requirement Traceability
| Requirement ID | Story | Phase | Status |
|---|---|---|---|
| TEST-01 | Unit Test Infrastructure Setup (Story 1) | P1 | ✅ Verified |
| TEST-02 | Jest runner executes via `ng test` | P1 | ✅ Verified |
| TEST-03 | All `.spec.ts` files discovered under `src/` | P1 | ✅ Verified |
| TEST-04 | Coverage report written to `coverage/` | P1 | ✅ Verified |
| TEST-05 | 70 % branch + line threshold enforced | P1 | ✅ Verified |
| TEST-06 | Core service specs: GuestSessionService | P1 | ✅ Verified |
| TEST-07 | Core service specs: Firebase-dependent services mocked | P1 | ✅ Verified |
| TEST-08 | Presentational component input/output API tests | P1 | ✅ Verified |
| TEST-09 | Presentational component a11y: semantic HTML + aria-label | P1 | ✅ Verified |
| TEST-10 | Playwright infrastructure: `npx playwright test` discovers `e2e/` | P2 | ✅ Verified |
| TEST-11 | Playwright auto-starts `ng serve` via webServer config | P2 | ✅ Verified |
| TEST-12 | E2E: Admin auth flow — login → /admin redirect | P2 | ✅ Verified |
| TEST-13 | E2E: Guest RSVP flow — dialog → confirm → item claim | P2 | ✅ Verified |
| TEST-14 | E2E: Full-page screenshot saved to `e2e/screenshots/` per test | P2 | ✅ Verified |
| TEST-15 | E2E: Screenshot named `{testName}-{timestamp}.png` | P2 | ✅ Verified |
| TEST-16 | AI layout analysis: feature-flag gated, WARNING-only verdict | P3 | ✅ Verified |

**Coverage:** 16 total, 16 mapped to stories, 0 unmapped

---

## Success Criteria
- [ ] `ng test --no-watch --coverage` exits with code 0 and Jest output is visible
- [ ] Coverage report appears in `coverage/` with ≥ 70 % branches and lines after service + component specs are written
- [ ] All `.spec.ts` files for the seven core services pass with mocked Firebase
- [ ] All presentational component specs pass, including aria-label and semantic HTML assertions
- [ ] `npx playwright test` runs the admin auth and guest RSVP flows without manual server start
- [ ] `e2e/screenshots/` contains a timestamped `.png` file after each e2e run
- [ ] AI layout analysis (P3) emits a WARNING verdict without blocking the CI build
