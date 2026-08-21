# Feature 12 — Design System, RBAC, Visual Polish & Responsive Layout Architecture

## Problem Statement

A comprehensive visual and functional inspection across the Organiza AI application and its 47 Playwright screenshot baselines revealed critical inconsistencies, design debt, and permission boundary violations:
1. **RBAC & Authorization Bleed**: The Organizer Dashboard contains a retired `+ Novo Admin` button and drawer triggering logic, mistakenly implying normal organizers can grant system administrator roles, and the top navbar exposes a "Painel Admin" link to `/admin` instead of cleanly scoping organizers to `/meus-eventos` and Super Admins to platform governance. Event Detail also hardcodes "Você (Admin)".
2. **Visual & Design System Degradation**: The Home page features a minimal, uninspired header ("🎉 Eventos") and isolated cards rather than the vibrant, high-energy hero and elevated glassmorphic cards dictated by `DESIGN.md`. Dialogs (e.g. Collaborator Invite) suffer from unreadable `#ffffff` text contrast bugs in light mode and lack dimmed, blurred backdrop scrims. Form inputs have inconsistent heights, placeholders, and truncation issues (e.g. Family Roster on desktop).
3. **Mobile Responsiveness & Viewport Shifts**: The Event Editor Stepper exhibits a negative horizontal offset on mobile screens that clips 15–20px from the left edge of cards, labels, and inputs, while titles suffer from letter squishing due to aggressive negative tracking.
4. **E2E Screenshot Capture Timing**: Automated screenshot captures in Playwright tests execute prematurely during active Angular Material transitions or while the page is scrolled into sub-inputs, resulting in blank cards, clipped headers, and misleading visual regression baselines.

## Goals

- [ ] Eliminate all admin-creation and global admin UI from the Organizer Dashboard (`/meus-eventos`) and clean up the role boundary between Organizer (`/meus-eventos`) and Super Admin (`/admin`).
- [ ] Transform the Home page into a festive, modern, highly polished experience with an engaging Hero section and elevated glassmorphic event cards.
- [ ] Establish a unified, accessible glassmorphic form input token system conforming to Material 3 MDC and `DESIGN.md` across all views and dialogs.
- [ ] Fix dialog backdrops (`.cdk-overlay-dark-backdrop`) and light/dark mode text contrast in all modals.
- [ ] Resolve mobile horizontal viewport offsets and title letter-spacing collisions in the Event Editor and Stepper.
- [ ] Enhance Playwright screenshot capture helpers to guarantee full page stabilization, animation settling, and scroll reset before taking baseline screenshots.

## Out of Scope

| Feature | Reason |
| --- | --- |
| Dynamic backend custom roles | Organiza AI enforces a streamlined 3-role permission model: Owner, Collaborator, Guest + Global Super Admin. |
| Multi-step wizard restructuring | The 3-step linear stepper is preserved and optimized; no steps are added or removed. |
| External transactional email provider | Collaborator invites continue using the 100% free Firestore email invitation + WhatsApp sharing pattern (AD-022). |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --- | --- | --- | --- |
| Organizer navigation link in toolbar | Add "Meus Eventos" link to desktop toolbar and user dropdown menu for all authenticated users | Organizers need 1-click access to their dashboard, while "Painel Admin" is strictly gated to `isSuperAdmin()` | Yes |
| Collaborator permissions vs Admin | Organizers invite collaborators only; "+ Novo Admin" button and drawer are completely removed from organizer views | Aligns with AD-017, AD-020, AD-021, and AD-027; organizers manage events, not system admins | Yes |
| Home page Hero design | Festive hero banner with gradient accent badge, bold typography, and elevated glass cards | Transforms the landing experience into a modern festive showcase conforming to `DESIGN.md` | Yes |
| Dialog scrim backdrop | Global `cdk-overlay-dark-backdrop` with `background: rgba(15, 10, 20, 0.45)` and `backdrop-filter: blur(6px)` | Prevents background page elements from clashing with translucent modal contents | Yes |
| Screenshot timing synchronization | Explicitly wait for step containers, animations, and reset `window.scrollTo(0,0)` before capturing | Ensures 100% stable, fully rendered visual baselines across desktop and mobile viewports | Yes |

**Open questions:** none - all resolved or logged above.

---

## User Stories

### P1: RBAC Boundary & Organizer Navigation Enforcement ⭐ MVP

**User Story**: As an authenticated event organizer or guest, I want clear, role-appropriate navigation and views so that I never see administrative controls meant for Super Admins or confuse event collaboration with system administration.

**Why P1**: Core security, architectural integrity (AD-020, AD-021, AD-027), and clean user experience.

**Acceptance Criteria**:

1. WHEN an authenticated user views the Organizer Dashboard (`/meus-eventos`) THEN the system SHALL NOT render any "Novo Admin" button or admin creation drawer triggers.  <!-- event-driven -->
2. WHERE a user is not a Super Admin (`!isSuperAdmin()`) the system SHALL NOT render the "Painel Admin" link in the toolbar or user menu.  <!-- optional-feature -->
3. WHERE a user is authenticated (`user() && !user().isAnonymous`) the system SHALL render a direct "Meus Eventos" link in the toolbar and within the user menu.  <!-- optional-feature -->
4. WHEN an event detail view is rendered THEN the system SHALL display "Você (Organizador)" or the organizer's identity rather than "Você (Admin)".  <!-- event-driven -->
5. The system SHALL enforce route guards ensuring `/admin` requires `superAdminGuard` and `/meus-eventos` requires `authGuard`.  <!-- ubiquitous -->

**Independent Test**: Log in as a non-superadmin user, verify `/meus-eventos` has no "Novo Admin" button, verify the toolbar displays "Meus Eventos", and verify `/admin` redirects or denies access.

---

### P1: Visual Elegance, Home Hero & Glassmorphic Component Polish ⭐ MVP

**User Story**: As a visitor or organizer, I want a visually stunning, festive, and cohesive UI with high-contrast readable modals and standardized form inputs so that using Organiza AI feels modern and delightful.

**Why P1**: Direct user requirement to transform the plain "Eventos" landing page into a clean, beautiful experience and fix critical modal contrast bugs.

**Acceptance Criteria**:

1. WHEN a visitor navigates to the Home page (`/`) THEN the system SHALL render a festive Hero section featuring an accent badge, a bold gradient heading, and an engaging subtitle.  <!-- event-driven -->
2. The system SHALL render Home event cards with glassmorphism surfaces (`backdrop-filter: blur(24px)`), date pill badges displaying month and day, and smooth hover elevation.  <!-- ubiquitous -->
3. WHEN the Collaborator Invite Dialog or RSVP Dialog opens THEN the system SHALL render all dialog text with high contrast (`--mat-sys-on-surface`) and apply a blurred dark scrim backdrop (`.cdk-overlay-dark-backdrop`).  <!-- event-driven -->
4. The system SHALL render all text inputs, selects, textareas, and number inputs with unified Material 3 MDC tokens, `--org-primary` focus rings, and non-truncated placeholders across desktop and mobile.  <!-- ubiquitous -->
5. WHEN an event address is populated via ViaCEP THEN the system SHALL style read-only address fields with a distinct, subtle glass container and locked state indicator.  <!-- event-driven -->

**Independent Test**: Open the Home page to inspect the new Hero section and event cards, and open both the Collaborator and RSVP dialogs in Light mode to verify crisp text contrast and scrim backdrop.

---

### P1: Mobile Responsiveness & Viewport Invariant Fixes ⭐ MVP

**User Story**: As a mobile user, I want the Event Editor, Stepper, and Profile views to fit seamlessly within my device screen without horizontal clipping, letter collisions, or awkward overflow.

**Why P1**: Fixes the 15–20px left-edge clipping bug on mobile and guarantees the Zero Horizontal Overflow invariant (AD-031).

**Acceptance Criteria**:

1. WHILE rendering the Event Editor on mobile viewports (< 600px) the system SHALL maintain zero horizontal offset and ensure all form cards, inputs, and stepper indicators have at least 12px padding from viewport edges.  <!-- state-driven -->
2. The system SHALL render page headings without negative letter-spacing collisions across all device widths.  <!-- ubiquitous -->
3. WHILE viewing the Organizer Dashboard or Stepper on mobile viewports the system SHALL allow horizontal scrolling on chipsets and stepper headers with `max-width: 100%` and `-webkit-overflow-scrolling: touch`.  <!-- state-driven -->
4. The system SHALL maintain `document.documentElement.scrollWidth <= window.innerWidth + 1` across all views on both desktop and mobile viewports.  <!-- ubiquitous -->

**Independent Test**: Load `/meus-eventos/evento/novo` and `/perfil` on Mobile Chrome viewport (390x844), verify zero left-side clipping, and assert `assertNoHorizontalOverflow`.

---

### P2: E2E Test Synchronization & Flawless Screenshot Baselines

**User Story**: As a developer and CI pipeline, I want E2E tests to wait for full page and animation stabilization before capturing screenshots so that visual baselines are deterministic and 100% representative of rendered UI.

**Why P2**: Eliminates blank screenshots (Step 3 Pix), scrolled-away headers (Step 1 Filled), and ensures screenshot regression suites reflect true visual state.

**Acceptance Criteria**:

1. WHEN capturing a visual screenshot baseline THEN the test runner SHALL reset the scroll position to `(0, 0)` and wait for all pending step transitions and DOM updates to stabilize.  <!-- event-driven -->
2. WHEN capturing Step 3 Pix or Wishlist in the Event Editor THEN the test runner SHALL wait for the Step 3 container and inputs to become fully visible before triggering the screenshot.  <!-- event-driven -->
3. The test suite SHALL regenerate all 47 screenshot baselines in `e2e/screenshots/` with zero blank surfaces, zero clipped headers, and zero white-text contrast defects.  <!-- ubiquitous -->

**Independent Test**: Execute `npm run test:e2e` across Desktop Chromium and Mobile Chrome and inspect the generated screenshots in `e2e/screenshots/`.

---

## Edge Cases

- IF a user logs in with an email that is not in the Super Admin list THEN the system SHALL restrict access strictly to `/meus-eventos` and `/perfil`, omitting all `/admin` entry points.
- IF an event address lookup via ViaCEP is slow or throttled THEN the system SHALL keep address fields disabled until resolution or permit manual entry gracefully without layout distortion.
- IF a modal dialog is opened on a small mobile device THEN the system SHALL constrain the dialog surface to `max-width: calc(100vw - 24px)` and `max-height: 85vh` with smooth internal scrolling.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| RBAC-01 | P1: RBAC Boundary & Organizer Navigation | Design | Pending |
| RBAC-02 | P1: RBAC Boundary & Organizer Navigation | Design | Pending |
| RBAC-03 | P1: RBAC Boundary & Organizer Navigation | Design | Pending |
| RBAC-04 | P1: RBAC Boundary & Organizer Navigation | Design | Pending |
| RBAC-05 | P1: RBAC Boundary & Organizer Navigation | Design | Pending |
| VISUAL-01 | P1: Visual Elegance, Home Hero & Polish | Design | Pending |
| VISUAL-02 | P1: Visual Elegance, Home Hero & Polish | Design | Pending |
| VISUAL-03 | P1: Visual Elegance, Home Hero & Polish | Design | Pending |
| VISUAL-04 | P1: Visual Elegance, Home Hero & Polish | Design | Pending |
| VISUAL-05 | P1: Visual Elegance, Home Hero & Polish | Design | Pending |
| RESP-01 | P1: Mobile Responsiveness & Viewport Fixes | Design | Pending |
| RESP-02 | P1: Mobile Responsiveness & Viewport Fixes | Design | Pending |
| RESP-03 | P1: Mobile Responsiveness & Viewport Fixes | Design | Pending |
| RESP-04 | P1: Mobile Responsiveness & Viewport Fixes | Design | Pending |
| E2E-01 | P2: E2E Test Synchronization & Baselines | Design | Pending |
| E2E-02 | P2: E2E Test Synchronization & Baselines | Design | Pending |
| E2E-03 | P2: E2E Test Synchronization & Baselines | Design | Pending |

**Coverage:** 17 total, 17 mapped to design, 0 unmapped.

---

## Success Criteria

- [ ] 0 occurrences of "Novo Admin" in the Organizer Dashboard and 0 admin-related actions exposed to non-superadmin users.
- [ ] Home page displays a polished, modern Hero section with gradient typography and elevated event cards.
- [ ] 100% of dialogs (Collaborator, RSVP, Confirm) exhibit crisp text contrast in Light and Dark modes and are backed by a dimmed blurred scrim.
- [ ] Zero horizontal overflow and zero left-edge clipping on mobile viewports across all routes.
- [ ] All 42 unit test files (298+ tests) and all Playwright E2E suites pass with updated, pristine screenshots in `e2e/screenshots/`.
