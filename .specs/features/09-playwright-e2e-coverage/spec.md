# Playwright E2E Full Coverage & CI Pipeline Specification

## Problem Statement

The Organiza AI application currently contains only a minimal smoke test (`e2e/smoke.spec.ts`) covering static landmarks on the home and login pages. Critical user journeys — including organizer event creation and lifecycle management, 1-touch verified guest RSVP, item wishlist claiming, split estimation ("Rachadinha com Meta"), collaborator access, profile & family roster management, and dark/light/seasonal theming — lack automated end-to-end regression testing. Furthermore, visual design regressions (form input misalignment, broken Glassmorphism layering, padding inconsistencies against `DESIGN.md`), real-time multi-user concurrency synchronization, PWA offline resilience, QR code / WhatsApp sharing, and modal keyboard focus traps go untested. No automated CI pipeline currently runs Playwright on pull requests and pushes to protect production deployments.

## Goals

- Establish comprehensive Playwright E2E test suites covering 100% of user-facing application flows across desktop and mobile viewports.
- Create reusable test fixtures and mock authentication / Firestore state helpers to ensure fast, deterministic, and isolated test runs without external Firebase flakes.
- Automate testing for the 6 primary core flows: Public Discovery & Theming, Authentication & Route Protection, Event Organizer Lifecycle, Guest RSVP & Item Contribution, Profile & Family Roster, and Collaborator RBAC.
- Implement structured full-page screenshot baseline captures across all key UI states, with automated and agent-led visual layout inspection against `DESIGN.md` (form field alignment, color consistency, Glassmorphism hierarchy).
- Validate advanced use cases: real-time dual-context multi-user interplay (host + attendee), PWA offline caching resilience, QR code rendering & WhatsApp invite deep-linking, and keyboard navigation focus traps.
- Implement a robust GitHub Actions CI workflow executing Playwright tests on push and pull requests with report artifact uploads and PR failure annotations.
- Provide full WCAG 2.1 AA automated accessibility checks (axe-core integration) and full-page failure artifact captures (traces, screenshots, videos).

## Out of Scope

| Feature | Reason |
|---|---|
| Live production Firebase database seeding | E2E tests in CI run against local emulators or mocked state to prevent network flakiness and data pollution. |
| Paid visual regression SaaS (Percy, Chromatic) | Local Playwright screenshot baselines and failure captures meet current needs without third-party subscriptions. |
| Real SMS / WhatsApp message dispatch verification | WhatsApp sharing is verified at the generated link/URI schema level; real phone carrier delivery is out of scope. |
| Performance / Load stress testing (k6, JMeter) | Performance benchmarking is handled in a separate performance testing milestone. |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
|---|---|---|---|
| CI Runner Environment | GitHub Actions `ubuntu-latest` with Playwright container cache | Standard, zero-cost CI environment with official Playwright action support | Yes |
| Browser Matrix in CI | Chromium + Mobile Chrome for standard CI runs; Firefox and WebKit on nightly / release tags | Optimizes CI execution speed while guaranteeing cross-browser and mobile responsive fidelity | Yes |
| Auth & State Isolation | Custom Playwright fixtures injecting authenticated state / mock tokens via storageState & route mocking | Eliminates external Google OAuth popups and rate limits in headless test runners | Yes |
| WebServer Execution | `npm start` (or `ng serve`) orchestrated automatically via `webServer` block in `playwright.config.ts` | Zero-config local execution and deterministic startup in CI pipelines | Yes |
| Accessibility Assertion Gate | `@axe-core/playwright` assertions on key landmark pages during E2E runs | Enforces project-wide WCAG 2.1 AA rule automatically on all major views | Yes |
| Visual Layout Review Protocol | Full-page screenshot capture for every major view + manual/agent inspection against `DESIGN.md` | Guarantees form alignment, Glassmorphism layering, and color token fidelity on initial baseline | Yes |
| Dual-Context Concurrency Testing | Dedicated multi-user spec utilizing two isolated browser contexts in parallel | Verifies real-time Firestore stream synchronization between host and attendee seamlessly | Yes |

**Open questions: none**

---

## Implicit-Requirement Dimensions

| Dimension | Resolution & Requirements |
|---|---|
| Input validation & bounds | Form validation error states for CEP, required event fields, and invalid emails are tested in PW-06 and PW-08. |
| Failure / partial-failure states | Network failure recovery, offline indicators, and invalid route fallbacks (`/evento/not-found`) are tested in PW-03, PW-16, and PW-26. |
| Idempotency / retry / duplicate handling | Double-click prevention on RSVP submission and duplicate collaborator invitation handling are tested in PW-11 and PW-15. |
| Auth boundaries & rate limits | Unauthorized redirects to `/login` for `/meus-eventos` and `/perfil`, plus non-superadmin blocking on `/admin` are tested in PW-05 and PW-07. |
| Concurrency / ordering | Dynamic item claim status updates and real-time split estimation recalculation are tested in PW-10, PW-12, PW-23, and PW-24. |
| Data lifecycle / expiry | Event status transitions (Active -> Closed -> Cancelled) and deletion confirmation flows are tested in PW-09. |
| Observability | Playwright HTML reports, test traces on retry, failure screenshots, and GitHub Actions step summaries are tested in PW-17 and PW-18. |
| External-dependency failure | ViaCEP API failure fallback handling and Firebase offline timeout handling are tested in PW-08 and PW-26. |
| State-transition integrity | Dialog open/close states, drawer overlays, modal focus traps, and theme class application are tested in PW-02, PW-13, and PW-30. |

---

## User Stories

### P1 — Story 1: Playwright Infrastructure & Test Fixture Harness ⭐ MVP

**User Story**: As a developer, I want a robust Playwright configuration and test fixture library so that I can write and execute reliable E2E tests with automated web server management, authentication helpers, and network mocks.

**Why P1**: Foundation for all E2E testing across the project; ensures test isolation, determinism, and developer ergonomics.

**Acceptance Criteria**:

1. WHEN `npm run test:e2e` is executed THEN the system SHALL run all spec files matching the glob `e2e/**/*.spec.ts`.
2. WHEN E2E tests start and the local application server is not running THEN the system SHALL automatically launch the Angular application using the `webServer` configuration in `playwright.config.ts`.
3. The system SHALL provide authenticated test fixtures (`authenticatedPage`, `superAdminPage`, `guestPage`) that inject mock session state without invoking external OAuth popups.
4. WHEN a test fails in CI or on retry THEN the system SHALL save a trace zip file, screenshot, and video recording to the `test-results/` directory.
5. The system SHALL generate a standalone HTML report in `playwright-report/` containing step-by-step logs and artifact links upon test suite completion.

**Independent Test**: Run `npx playwright test e2e/fixtures.spec.ts` on a fresh checkout; confirm automatic server launch, fixture session injection, and HTML report generation.

---

### P1 — Story 2: Public Home, Theming & Discovery Flow ⭐ MVP

**User Story**: As an attendee or visitor, I want the home page and public discovery features to be fully verified by E2E tests so that navigation, theming, and event browsing remain flawless.

**Why P1**: The landing page is the first touchpoint for all users; theme switching and navigation regressions immediately harm user experience.

**Acceptance Criteria**:

1. WHEN a user navigates to `/` THEN the system SHALL display the main event feed, navigation header, and landmark section with `aria-label="Eventos disponíveis"`.
2. WHEN the user toggles the theme button THEN the system SHALL switch between light and dark modes, updating the `document.documentElement` theme class and persisting the preference in `localStorage`.
3. WHERE a seasonal theme is active THEN the system SHALL render the corresponding seasonal overlay and decorative graphics in the DOM.
4. WHEN a user clicks on an event card from the home feed THEN the system SHALL navigate to the corresponding `/evento/:id` route within 1000ms.
5. The system SHALL satisfy WCAG 2.1 AA accessibility standards on the home page with zero critical axe-core violations.

**Independent Test**: Run `npx playwright test e2e/home.spec.ts`; confirm theme toggle persistence, seasonal overlay rendering, card navigation, and axe-core accessibility checks.

---

### P1 — Story 3: Authentication, Registration & Route Guard Protection ⭐ MVP

**User Story**: As a user or organizer, I want the login, registration, and route security flows to be verified by E2E tests so that unauthorized users cannot access restricted areas and valid users can authenticate smoothly.

**Why P1**: Authentication and authorization guard the entire organizer and profile experience; regressions create critical security vulnerabilities.

**Acceptance Criteria**:

1. WHEN an unauthenticated user attempts to visit `/meus-eventos` or `/perfil` THEN the system SHALL redirect the user to `/login` preserving the return URL.
2. WHEN an unauthenticated or non-superadmin user attempts to visit `/admin` THEN the system SHALL block access and redirect to `/login` or `/`.
3. WHEN a user submits the email registration form with invalid credentials THEN the system SHALL display inline validation error messages and prevent form submission.
4. WHEN a user registers via email/password THEN the system SHALL display the email verification top banner with a "Reenviar Confirmação" button and 60-second cooldown timer.
5. WHEN an authenticated user clicks the logout action THEN the system SHALL terminate the session and redirect the user to `/login`.

**Independent Test**: Run `npx playwright test e2e/auth.spec.ts`; confirm guard redirects, validation errors, verification banner cooldown, and session termination.

---

### P1 — Story 4: Organizer Event Lifecycle & Dashboard Management ⭐ MVP

**User Story**: As an event organizer, I want the event creation, editing, and dashboard management flows to be tested end-to-end so that I can organize events without operational regressions.

**Why P1**: Core value proposition for event hosts; broken creation, ViaCEP lookup, or status updates halt event organization.

**Acceptance Criteria**:

1. WHEN an authenticated organizer navigates to `/meus-eventos` THEN the system SHALL render the dashboard containing status filter chips ("Todos", "Ativos", "Encerrados", "Cancelados") and event cards.
2. WHEN an organizer clicks the "Criar Evento" button THEN the system SHALL navigate to `/meus-eventos/evento/novo`.
3. WHEN an organizer inputs a valid 8-digit CEP during event creation THEN the system SHALL auto-populate the Street, Neighborhood, City, and State fields via ViaCEP integration.
4. WHEN an organizer completes all required fields and submits THEN the system SHALL create the event and navigate to the dashboard or editor with success notification.
5. WHEN an organizer updates event details or adds item wishlist entries in `/meus-eventos/evento/:id` THEN the system SHALL persist the updates and reflect them in the UI.
6. WHEN an organizer cancels or deletes an event THEN the system SHALL display a confirmation dialog before executing the status transition.

**Independent Test**: Run `npx playwright test e2e/event-management.spec.ts`; verify dashboard filtering, CEP auto-fill, creation submission, editing, and cancellation modal confirmation.

---

### P1 — Story 5: Guest RSVP, Item Contribution & Split Estimation Flow ⭐ MVP

**User Story**: As a guest attendee, I want the public event RSVP, item claiming, and split estimation features to be covered by E2E tests so that guest confirmations and contributions work reliably.

**Why P1**: Primary attendee journey; broken RSVPs directly cause guest drop-off and inaccurate attendee counts.

**Acceptance Criteria**:

1. WHEN a user navigates to `/evento/:id` for an active event THEN the system SHALL display the event header, date countdown, location details, and RSVP action button.
2. WHEN the user clicks the RSVP action THEN the system SHALL open the RSVP modal dialog with 1-touch verified identity options.
3. WHEN the guest confirms RSVP THEN the system SHALL record the confirmation, trigger a celebratory confetti animation, and display the guest's name in the confirmed guests list.
4. WHERE the event has an `estimatedBudget` configured THEN the system SHALL dynamically calculate and display the suggested split amount alongside the 1-click Pix copy button.
5. WHEN a guest selects an available item from the wishlist to claim THEN the system SHALL mark the item as claimed by that guest and update the remaining item counter in real time.
6. WHEN a guest unclaims their assigned item THEN the system SHALL return the item to the available wishlist pool.

**Independent Test**: Run `npx playwright test e2e/guest-rsvp.spec.ts`; verify countdown display, RSVP modal confirmation, confetti trigger, split calculation, and item claim/unclaim toggles.

---

### P1 — Story 6: Visual Layout & Design Inspection Baseline Capture ⭐ MVP

**User Story**: As a UI architect, I want visual screenshots captured across all key flow milestones so that the layout, form alignment, color tokens, and Glassmorphism hierarchy are verified against `DESIGN.md` on the initial baseline run.

**Why P1**: Prevents silent visual degradation, misaligned form inputs, clipped cards, or inconsistent colors from shipping to users.

**Acceptance Criteria**:

1. WHEN an E2E test completes a major journey milestone (Home, Login, Dashboard, Event Editor Form, Event Detail with RSVP Dialog, Profile) THEN the system SHALL capture a full-page visual screenshot to `e2e/screenshots/{journey}-{state}-{deviceSuffix}.png` (differentiating Desktop and Mobile resolutions).
2. WHEN screenshots are generated during the initial test execution run THEN the agent SHALL inspect each captured image as a critical UI/UX specialist to verify form field alignment, button paddings, typography scale, Glassmorphism backdrop-blur rendering per `DESIGN.md`, and compliance with Nielsen's 10 Usability Heuristics.
3. IF any visual or usability defect (misaligned inputs, broken contrast, unreadable text, missing status feedback, or overflowing containers) is identified during visual inspection THEN the system SHALL log the defect with remediation steps.
4. The system SHALL structure the `e2e/screenshots/` directory with organized baseline images categorized by flow and device.

**Independent Test**: Run the full E2E test suite; verify that `e2e/screenshots/` contains high-resolution snapshots for all key views and conduct visual inspection against `DESIGN.md`.

---

### P1 — Story 7: Modal Keyboard Navigation & Focus Trap (WCAG 2.1 AA) ⭐ MVP

**User Story**: As a keyboard-only user, I want all dialogs, drawers, and interactive forms to support seamless Tab cycling, focus trapping, and Escape key dismissal so that the app is fully accessible.

**Why P1**: Mandatory WCAG 2.1 AA standard per project architecture rules; missing focus traps cause severe accessibility failures.

**Acceptance Criteria**:

1. WHILE an RSVP modal dialog or admin drawer is open the system SHALL trap focus within the modal, cycling focus only across interactive elements within the dialog when Tab or Shift+Tab is pressed.
2. WHEN the user presses the Escape key WHILE a modal dialog is open THEN the system SHALL dismiss the modal and return focus to the triggering element.
3. The system SHALL allow users to activate buttons, checkboxes, and form controls using the Space and Enter keys without requiring mouse interaction.

**Independent Test**: Run `npx playwright test e2e/a11y-keyboard.spec.ts`; verify Tab cycling inside dialogs, Escape key closing, and focus restoration to trigger elements.

---

### P1 — Story 8: GitHub Actions CI Pipeline Integration ⭐ MVP

**User Story**: As a project maintainer, I want Playwright E2E tests to run automatically in a GitHub Actions CI pipeline on pull requests and pushes to `main` so that broken flows are prevented from merging.

**Why P1**: Continuous automated quality gate; without CI execution, tests will not prevent regressions across pull requests.

**Acceptance Criteria**:

1. WHEN a pull request is opened or updated against `main` THEN the GitHub Actions workflow SHALL install dependencies, build the application, and execute the Playwright test suite.
2. The workflow SHALL cache `node_modules` and Playwright browser binaries to ensure CI execution completes in under 5 minutes.
3. IF any Playwright test fails in CI THEN the workflow SHALL fail the pull request check and upload the `playwright-report/` and test traces as accessible workflow artifacts.
4. WHEN all E2E tests pass in CI THEN the workflow SHALL report a green checkmark status on the commit.
5. The system SHALL include a dedicated npm script `npm run test:e2e:ci` configured with headless execution, CI reporter, and retry settings.

**Independent Test**: Trigger workflow via `act` or push a test branch; confirm CI setup, Playwright execution, report artifact upload, and gate pass.

---

### P2 — Story 9: Real-Time Dual-Context Multi-User Concurrency

**User Story**: As an organizer and attendee interacting concurrently, I want real-time updates to be tested across simultaneous browser sessions so that live Firestore state synchronizations work smoothly.

**Why P2**: Real-time collaborative synchronization is a signature capability; verifies that multi-user events update dynamically without page reloads.

**Acceptance Criteria**:

1. WHEN an attendee confirms an RSVP in browser context A THEN the organizer dashboard open in browser context B SHALL reflect the updated guest count within 2000ms without a page reload.
2. WHEN an organizer adds a new wishlist item in browser context B THEN the public event view open in browser context A SHALL render the new item in real time.

**Independent Test**: Run `npx playwright test e2e/multi-user-sync.spec.ts`; verify real-time cross-context updates between host and attendee sessions.

---

### P2 — Story 10: QR Code Check-In & WhatsApp Invite Link Generation

**User Story**: As an event organizer, I want QR code rendering and WhatsApp invite link formatting to be verified by E2E tests so that sharing and check-ins are reliable.

**Why P2**: Primary virality and check-in channel; broken URLs or unrendered QR codes prevent guests from finding the event.

**Acceptance Criteria**:

1. WHEN an organizer opens the share panel on `/meus-eventos/evento/:id` THEN the system SHALL render a QR code element containing the public event URL.
2. WHEN the user activates the WhatsApp share button THEN the system SHALL construct the correct WhatsApp URI schema (`https://api.whatsapp.com/send?text=...`) containing the event title, date, location, and deep link.
3. WHEN the user clicks the copy link action THEN the system SHALL copy the public event URL to the system clipboard and display a visual confirmation toast.

**Independent Test**: Run `npx playwright test e2e/share-qr.spec.ts`; verify QR code rendering, WhatsApp link format, and clipboard copy feedback.

---

### P2 — Story 11: PWA Offline Resilience & Service Worker Caching

**User Story**: As a mobile attendee in a venue with spotty network, I want previously viewed events to load offline so that I can still check event times, addresses, and claimed items.

**Why P2**: PWA core requirement; prevents white-screen crashes when cellular connectivity drops.

**Acceptance Criteria**:

1. WHEN a user navigates to an event while online and the network is subsequently disabled via offline mode THEN the system SHALL continue to display the cached event details from the Angular Service Worker.
2. WHILE the application is offline the system SHALL display a non-intrusive offline status banner and disable write actions (RSVP confirmation, item claiming) gracefully.

**Independent Test**: Run `npx playwright test e2e/pwa-offline.spec.ts`; simulate offline mode via Playwright network throttling, verify cached view rendering and offline banner.

---

### P2 — Story 12: User Profile & Family Roster Management

**User Story**: As an authenticated user, I want the profile information and family roster management flows to be tested with Playwright so that family members can be maintained and batch-selected during RSVP.

**Why P2**: Enhances attendee convenience; supports multi-person family RSVPs without friction.

**Acceptance Criteria**:

1. WHEN an authenticated user navigates to `/perfil` THEN the system SHALL render the user's name, email, phone number, and family roster section.
2. WHEN the user adds a new family member THEN the system SHALL persist the member to the user's personal roster.
3. WHEN the user edits or removes a family member THEN the system SHALL update the roster display and persist the change.
4. WHEN an authenticated user with family members opens the RSVP dialog on an event THEN the system SHALL render a selectable family roster checkbox list allowing batch RSVP.

**Independent Test**: Run `npx playwright test e2e/profile-family.spec.ts`; verify profile updates, family member CRUD, and RSVP dialog roster selection.

---

### P2 — Story 13: Collaborator Invitation & RBAC Permissions

**User Story**: As an event organizer and collaborator, I want collaborator invitations and role-based permissions to be tested end-to-end so that event co-hosts have appropriate access without compromising ownership security.

**Why P2**: Multi-user collaboration feature; ensures non-owners can manage items and guests while preventing unauthorized deletions or core detail edits.

**Acceptance Criteria**:

1. WHEN an event owner opens the share panel on `/meus-eventos/evento/:id` and enters a collaborator email THEN the system SHALL register the pending invitation.
2. WHEN the invited user signs in with the matching email THEN the system SHALL automatically claim the invitation and add the user's UID to the event's `collaborators` array.
3. WHILE a collaborator views an event in `/meus-eventos` THEN the system SHALL allow the collaborator to manage wishlist items and guest confirmations.
4. WHILE a collaborator views an event THEN the system SHALL hide or disable the "Cancelar Evento", "Excluir Evento", and core detail edit controls.

**Independent Test**: Run `npx playwright test e2e/collaborator-rbac.spec.ts`; verify invitation creation, auto-claim on login, and collaborator RBAC permission boundaries.

---

### P3 — Story 14: Network Latency Throttling & Skeleton Shimmer States

**User Story**: As an attendee on a slow 3G connection, I want skeleton shimmer placeholders rendered during loading so that the layout does not suffer from Cumulative Layout Shift (CLS).

**Why P3**: Improves perceived performance and prevents layout jumping.

**Acceptance Criteria**:

1. WHEN an event page is requested under throttled network conditions THEN the system SHALL render skeleton loading cards before the final event data arrives.
2. WHEN the event data finishes loading THEN the system SHALL replace skeleton cards with rendered event content without layout shift.

**Independent Test**: Run `npx playwright test e2e/network-loading.spec.ts`; throttle network to Slow 3G and verify skeleton component visibility.

---

### P3 — Story 15: Cross-Browser & Mobile Emulation Matrix

**User Story**: As a mobile user, I want all critical flows tested under mobile viewport emulation so that mobile touch interactions, drawer modals, and responsive layouts function seamlessly.

**Why P3**: High mobile traffic for event RSVPs; ensures mobile-first UI stability.

**Acceptance Criteria**:

1. WHEN `npm run test:e2e:mobile` is executed THEN the system SHALL run the E2E suite against `Mobile Chrome` and `Mobile Safari` device profiles.
2. WHILE running on mobile viewports the system SHALL verify that bottom sheets and drawers open with appropriate touch gesture and viewport boundaries.
3. The system SHALL verify that the sticky RSVP footer button remains visible and clickable above mobile virtual keyboards.

**Independent Test**: Run `npx playwright test --project="Mobile Chrome"`; verify mobile layout rendering, touch targets, and sticky footer visibility.

---

## Edge Cases

- **ViaCEP Latency or Network Outage**: IF the ViaCEP API request times out or fails THEN the system SHALL allow manual address input without blocking event creation (tested in PW-08).
- **Concurrent RSVP Submissions**: IF two attendees RSVP simultaneously THEN the system SHALL record both confirmations without state overwrites (tested in PW-11 and PW-23).
- **Flaky Animations & Confetti Timing**: Tests must wait for element state stability and avoid fixed `page.waitForTimeout()` sleeps, using Playwright web-first assertions like `toBeVisible()` (tested in PW-10).
- **Slow CI DevServer Cold Boot**: IF `ng serve` takes up to 60 seconds on CI cold start THEN the Playwright `webServer.timeout` SHALL accommodate up to 120 seconds before failing (tested in PW-02).
- **Clipboard Permissions in Headless Browser**: When testing 1-click Pix copy and share links, Playwright browser context must be granted `clipboard-read` and `clipboard-write` permissions (tested in PW-12 and PW-28).
- **Visual Baseline Differences across OS / Font Rendering**: Baseline screenshot inspections must account for standard system font anti-aliasing variations across macOS and Ubuntu CI runners (tested in PW-21).
- **Service Worker Lifecycle Timing**: Tests must allow the Angular Service Worker to register before asserting offline caching behavior (tested in PW-25).

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
|---|---|---|---|
| PW-01 | Story 1: Playwright Infrastructure & Test Fixture Harness | P1 | Complete |
| PW-02 | Story 1: DevServer Auto-Start & Timeout Resilience | P1 | Complete |
| PW-03 | Story 1: Trace, Screenshot & Video Failure Capture | P1 | Complete |
| PW-04 | Story 2: Home Page Landmark & Feed Rendering | P1 | Complete |
| PW-05 | Story 2: Theme Switching & Seasonal Overlay | P1 | Complete |
| PW-06 | Story 3: Unauthenticated Route Guard Redirects | P1 | Complete |
| PW-07 | Story 3: SuperAdmin Route Guard Security | P1 | Complete |
| PW-08 | Story 4: Event Creation & ViaCEP Auto-fill | P1 | Complete |
| PW-09 | Story 4: Organizer Dashboard Filters & Status Changes | P1 | Complete |
| PW-10 | Story 5: Public Event Page & Countdown Timer | P1 | Complete |
| PW-11 | Story 5: 1-Touch Verified RSVP & Confetti Flow | P1 | Complete |
| PW-12 | Story 5: Smart Split Calculation & Pix Copy | P1 | Complete |
| PW-13 | Story 5: Wishlist Item Claiming & Unclaiming | P1 | Complete |
| PW-14 | Story 12: Profile Info & Family Roster CRUD | P2 | Complete |
| PW-15 | Story 13: Collaborator Invite & Auto-Claim on Login | P2 | Complete |
| PW-16 | Story 13: Collaborator RBAC UI Restrictions | P2 | Complete |
| PW-17 | Story 8: GitHub Actions CI Workflow Setup | P1 | Complete |
| PW-18 | Story 8: CI Artifact Upload & PR Failure Annotations | P1 | Complete |
| PW-19 | Story 15: Mobile Viewport Emulation (Pixel / iPhone) | P3 | Complete |
| PW-20 | Story 2: WCAG 2.1 AA Accessibility Gate with axe-core | P1 | Complete |
| PW-21 | Story 6: Visual Layout Screenshot Baseline Capture | P1 | Complete |
| PW-22 | Story 6: Agent/Developer Visual Inspection Against DESIGN.md | P1 | Complete |
| PW-23 | Story 9: Dual-Context Real-Time RSVP Attendee Sync | P2 | Complete |
| PW-24 | Story 9: Dual-Context Real-Time Wishlist Update Sync | P2 | Complete |
| PW-25 | Story 11: PWA Service Worker Offline Caching | P2 | Complete |
| PW-26 | Story 11: Offline Mode Status Banner & Graceful Action Guard | P2 | Complete |
| PW-27 | Story 10: QR Code Canvas / SVG Rendering | P2 | Complete |
| PW-28 | Story 10: WhatsApp Share Link Schema & Clipboard Action | P2 | Complete |
| PW-29 | Story 7: Modal Dialog Keyboard Focus Trap | P1 | Complete |
| PW-30 | Story 7: Modal Escape Key Dismissal & Focus Restoration | P1 | Complete |
| PW-31 | Story 14: Slow 3G Skeleton Shimmer State & CLS Prevention | P3 | Complete |

**Coverage:** 31 total, 31 mapped to stories, 0 unmapped

---

## Success Criteria

- [x] `npm run test:e2e` executes all core and advanced E2E spec suites locally and in CI with 100% pass rate.
- [x] Visual baseline screenshots for all key views are captured in `e2e/screenshots/` and verified against `DESIGN.md`.
- [x] Dual-context multi-user test verifies real-time Firestore stream synchronization without page reloads.
- [x] Keyboard navigation tests verify focus trapping in modals and `Escape` key dismissal across all dialogs.
- [x] PWA offline resilience is verified using Playwright offline network simulation.
- [x] CI workflow `.github/workflows/e2e.yml` runs automatically on PRs to `main` in under 5 minutes.
- [x] Authenticated fixtures provide isolated, repeatable sessions without external OAuth dependencies.
- [x] Failure captures (traces, screenshots, videos) are automatically uploaded as CI artifacts on test failure.
- [x] Key public and authenticated pages pass automated axe-core accessibility audits with zero violations.
