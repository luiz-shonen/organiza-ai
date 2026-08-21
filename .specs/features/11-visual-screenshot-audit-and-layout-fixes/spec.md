# Visual Screenshot Audit & Responsive Layout Fixes (Mobile-First) Spec

## Problem Statement

Playwright E2E visual baseline screenshots (`e2e/screenshots/`) and layout inspections on mobile (375px–480px) and desktop (1280px+) viewports reveal several layout bugs, visual clipping, and responsive regressions:

1. **Toolbar & Header on Mobile:** The "Entrar / Cadastrar" CTA label overflows and is clipped on mobile viewports (<480px) due to fixed margins and lack of responsive label handling.
2. **Event Editor Stepper & Form Blowout:** The event editor stepper headers and multi-column address/date grids (`date-time-row`, `address-row-top`, `address-row`) force a fixed multi-column layout on small screens, causing severe horizontal overflow and truncated form fields on mobile viewports.
3. **Organizer Dashboard Filter Chips:** The status filter chips listbox on mobile viewports is clipped at the right edge without smooth horizontal scroll or responsive wrapping.
4. **Profile & Family Roster Form Layout:** The 3-field family roster addition form and member card items have overflow and alignment defects on mobile viewports.
5. **Home & Event Detail Consistency:** Single-event home states and event detail headers require mobile-first layout rules, fluid margins, and consistent glassmorphism tokens (`backdrop-filter: blur(24px)`, rounded corners, and `--org-*` tokens) across light and dark themes.

Applying a strict **mobile-first** approach (base CSS for mobile, progressively enhanced for tablets and desktops via `@media (min-width: ...)`) will eliminate these visual defects while ensuring full adherence to `DESIGN.md` and WCAG 2.1 AA touch target standards.

## Goals

- [ ] Eliminate all horizontal page overflow and layout clipping across mobile (320px–480px), tablet (768px), and desktop (1280px+) viewports.
- [ ] Refactor toolbar, event editor forms, dashboard filters, profile roster, and detail views to follow strict mobile-first SCSS architecture.
- [ ] Ensure all interactive buttons, inputs, and chips satisfy WCAG 2.5.5 AA touch target standards (height ≥ 48 px or accessible touch area).
- [ ] Maintain consistent Glassmorphism tokens (`backdrop-filter: blur(...)`, `--org-glass-bg`, `--org-gradient-border`) across light and dark themes.
- [ ] Re-generate and verify all Playwright visual baseline screenshots in `e2e/screenshots/` to confirm layout correctness and zero visual regressions.

## Out of Scope

| Feature | Reason |
| --- | --- |
| Tailwind CSS integration | Forbidden per AD-007 (SCSS BEM + Angular Material only) |
| Backend Firestore schema modifications | Visual/layout refactor only |
| New business logic or auth permission changes | Preserves AD-017, AD-020, and AD-024 architecture |
| Third-party visual regression SaaS tools (Percy/Chromatic) | Local Playwright screenshot generation and test assertions are used |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --- | --- | --- | --- |
| Mobile-first SCSS breakpoint standard | Base styles for `< 600px`, `@media (min-width: 600px)` for tablet, `@media (min-width: 900px)` for desktop | Angular Material / MDC standard responsive grid breakpoints | y |
| Toolbar login button behavior on mobile (<480px) | Show icon + shortened label ("Entrar") or compact CTA without text overflow | Prevents header clipping while preserving accessible CTA | y |
| Event editor address & date form rows on mobile | Single column (`grid-template-columns: 1fr`) on mobile, expanding to multi-column on `min-width: 600px` | Eliminates horizontal blowout on mobile viewports | y |
| Dashboard filter chips container on mobile | Smooth horizontal scrolling (`overflow-x: auto`) with hidden scrollbar and padding | Allows thumb-friendly chip selection without cutting off chips | y |
| Family roster manager form grid on mobile | Single column stacked fields on mobile, expanding to 3-column row on `min-width: 640px` | Prevents input squishing and clipping on small devices | y |
| Screenshot resolution & test device coverage | Desktop Chromium (1280x720) and Mobile Chrome (375x667 / 390x844) | Matches existing Playwright config & CI pipeline | y |

**Open questions:** none — all resolved or logged above.

---

## User Stories

### P1: Toolbar & App Header Mobile-First Responsiveness ⭐ MVP

**User Story**: As a mobile user, I want the top navigation toolbar to fit cleanly on my screen without text clipping or overlapping icons, so that I can easily navigate and authenticate.

**Why P1**: The toolbar is visible on every screen and currently suffers from text clipping on mobile devices.

**Acceptance Criteria**:

1. WHEN the application is loaded on a mobile viewport (<480px) THEN the toolbar SHALL display the logo, theme toggle, and login CTA without horizontal overflow or clipped text. `[LAYOUT-01]`
2. WHEN the user is unauthenticated on a mobile viewport THEN the login CTA SHALL render with accessible dimensions (touch target height ≥ 48 px) and readable text. `[LAYOUT-02]`
3. WHILE dark mode is active THEN the toolbar SHALL render with dark glassmorphic styling (`backdrop-filter` with blur and dark background tint). `[LAYOUT-03]`
4. The toolbar brand logo and navigation buttons SHALL maintain a minimum spacing of 8 px from viewport edges across all device widths. `[LAYOUT-04]`

**Independent Test**: Can demo by navigating to `/` on Mobile Chrome and asserting zero horizontal scrollbar and toolbar bounding box within viewport width.

---

### P1: Event Editor Stepper & Form Responsiveness ⭐ MVP

**User Story**: As an event organizer using a mobile phone, I want the event creation and editing stepper forms to fit my screen without horizontal scrolling, so that I can comfortably enter event details, address, and Pix settings.

**Why P1**: Step 2 (Address) and Step 1 (Date/Time) currently overflow the viewport horizontally on mobile, making the form unusable.

**Acceptance Criteria**:

1. WHEN an organizer opens `/meus-eventos/evento/novo` on a mobile viewport (<600px) THEN the stepper header and active step form SHALL fit within 100% of the viewport width without horizontal document overflow. `[LAYOUT-05]`
2. WHEN the organizer views Step 1 (Informações) on a mobile viewport THEN the Date and Time form fields SHALL stack vertically (`1fr`) with equal width. `[LAYOUT-06]`
3. WHEN the organizer views Step 2 (Endereço) on a mobile viewport THEN the CEP, Number, Address, Neighborhood, and City/UF fields SHALL stack in a clean single-column layout without clipping. `[LAYOUT-07]`
4. WHEN the screen width is ≥ 600px THEN the Date/Time and Address fields SHALL adapt to multi-column grid layouts for efficient desktop space utilization. `[LAYOUT-08]`

**Independent Test**: Can demo by navigating to `/meus-eventos/evento/novo` on mobile viewport, advancing through Steps 1–3, and verifying document `scrollWidth === clientWidth`.

---

### P1: Organizer Dashboard & Filter Chips Responsiveness ⭐ MVP

**User Story**: As an organizer, I want the dashboard event cards and filter chips to adapt smoothly to my device size, so that I can filter and manage my events with one thumb on mobile and in a structured view on desktop.

**Why P1**: Filter chips clip on mobile and card layouts need clear visual separation.

**Acceptance Criteria**:

1. WHEN the organizer views the dashboard on a mobile viewport THEN the event filter chips container SHALL allow smooth horizontal scrolling without clipping chip text. `[LAYOUT-09]`
2. WHEN viewed on mobile (<768px) THEN events SHALL render as individual mobile cards with stacked metadata and full-width touch-friendly actions. `[LAYOUT-10]`
3. WHEN viewed on desktop (≥768px) THEN events SHALL render in the glassmorphic table layout with aligned columns and hover states. `[LAYOUT-11]`
4. The "Novo Evento" action button SHALL maintain a height ≥ 48 px and remain prominently visible on both mobile and desktop viewports. `[LAYOUT-12]`

**Independent Test**: Can demo by opening `/meus-eventos` on mobile and desktop viewports and verifying filter chip interaction and card/table responsive display.

---

### P1: Profile & Family Roster Mobile-First Layout ⭐ MVP

**User Story**: As a user on a mobile device, I want to manage my profile and family roster without horizontal clipping or awkward form breaks, so that I can easily register family members.

**Why P1**: The family roster form currently overflows horizontally on mobile screens.

**Acceptance Criteria**:

1. WHEN a user visits `/perfil` on a mobile viewport THEN the profile info card, family roster manager, and attended events sections SHALL render with single-column mobile-friendly padding (16px outer margin). `[LAYOUT-13]`
2. WHEN the user views the family member addition form on a mobile viewport (<640px) THEN the Name, Relationship select, and Phone inputs SHALL stack vertically in full width. `[LAYOUT-14]`
3. WHEN the user views the family member addition form on a desktop viewport (≥640px) THEN the form fields SHALL align horizontally in a 3-column grid. `[LAYOUT-15]`
4. The "Adicionar Familiar" submit button and member delete action buttons SHALL have touch targets ≥ 48 px. `[LAYOUT-16]`

**Independent Test**: Can demo by navigating to `/perfil` on mobile, adding a family member, and verifying form inputs and roster item layouts.

---

### P2: Home & Event Detail Visual Alignment

**User Story**: As a guest, I want the home page event feed and the public event detail page to display balanced glassmorphism cards and typography, so that the experience feels festive and polished on any device.

**Why P2**: Enhances brand fidelity and visual aesthetics per `DESIGN.md`.

**Acceptance Criteria**:

1. WHEN the home page renders on desktop with 1 or more events THEN the event cards grid SHALL display balanced column sizing without stretching single cards awkwardly. `[LAYOUT-17]`
2. WHEN the event detail page is viewed on mobile THEN the hero banner, date pill, location card, and RSVP trigger button SHALL fit the screen with 16px lateral padding. `[LAYOUT-18]`
3. WHEN the RSVP confirmation modal is opened on mobile THEN the dialog surface SHALL render centered with rounded corners (border-radius ≥ 20px) and glassmorphism backdrop blur. `[LAYOUT-19]`
4. All text headings across Home and Event Detail SHALL use Plus Jakarta Sans with proper font-weight hierarchy (800 for display, 700 for headlines). `[LAYOUT-20]`

**Independent Test**: Can demo by viewing `/` and `/evento/:id` on both mobile and desktop viewports.

---

### P2: Screenshot Baseline Refresh & Automated Visual Verification

**User Story**: As a developer/agent, I want Playwright to capture high-fidelity screenshot baselines across desktop and mobile, so that visual defects are automatically detected and verified.

**Why P2**: Guarantees CI regression safety and continuous visual quality.

**Acceptance Criteria**:

1. WHEN `npm run test:e2e` executes THEN Playwright SHALL generate full-page screenshots for all milestone views in `e2e/screenshots/` for both `-desktop` and `-mobile` suffixes. `[LAYOUT-21]`
2. WHEN screenshots are generated THEN every mobile screenshot SHALL show zero horizontal overflow (`document.documentElement.scrollWidth <= window.innerWidth`). `[LAYOUT-22]`
3. IF any visual layout assertion fails (touch target < 48 px, missing `backdrop-filter`, missing font) THEN the test runner SHALL fail with a descriptive error. `[LAYOUT-23]`
4. The entire E2E test suite (Chromium + Mobile Chrome) SHALL pass with 0 errors. `[LAYOUT-24]`

**Independent Test**: Run `npm run test:e2e` and verify all tests pass and screenshots are refreshed in `e2e/screenshots/`.

---

## Edge Cases

- IF the viewport width is as narrow as 320px (iPhone SE 1st gen) THEN the system SHALL maintain readable text and accessible buttons without clipping or horizontal scrollbars.
- IF an input field receives focus on mobile THEN the system SHALL maintain proper visual borders (`--org-primary`) without breaking the parent card's glassmorphism layout.
- IF an event title or address is unusually long (>100 characters) THEN the text SHALL wrap gracefully with `overflow-wrap: break-word` or ellipsis where specified.
- WHILE dark mode is toggled dynamically THEN all cards, inputs, buttons, and dialogs SHALL transition their glassmorphic backgrounds and text colors smoothly without layout shift.

---

## Requirement Traceability

| Requirement ID | Story | Task | Status |
| --- | --- | --- | --- |
| LAYOUT-01 | Toolbar – mobile layout & no overflow | T2, T3 | Verified |
| LAYOUT-02 | Toolbar – mobile login CTA touch target | T2, T3 | Verified |
| LAYOUT-03 | Toolbar – dark mode glassmorphism | T3 | Verified |
| LAYOUT-04 | Toolbar – viewport margin spacing | T2, T3 | Verified |
| LAYOUT-05 | Event Editor – mobile no overflow | T4 | Verified |
| LAYOUT-06 | Event Editor – Step 1 date/time stacking | T5 | Verified |
| LAYOUT-07 | Event Editor – Step 2 address stacking | T6 | Verified |
| LAYOUT-08 | Event Editor – desktop multi-column grid | T5, T6 | Verified |
| LAYOUT-09 | Dashboard – filter chips mobile scroll | T7 | Verified |
| LAYOUT-10 | Dashboard – mobile cards layout | T8 | Verified |
| LAYOUT-11 | Dashboard – desktop table layout | T8 | Verified |
| LAYOUT-12 | Dashboard – CTA touch target ≥ 48px | T7, T8 | Verified |
| LAYOUT-13 | Profile – mobile single-column layout | T9 | Verified |
| LAYOUT-14 | Family Roster – mobile stacked form | T10 | Verified |
| LAYOUT-15 | Family Roster – desktop 3-column form | T10 | Verified |
| LAYOUT-16 | Family Roster – button touch targets | T10 | Verified |
| LAYOUT-17 | Home – balanced grid layout | T11 | Verified |
| LAYOUT-18 | Event Detail – mobile hero & cards | T12 | Verified |
| LAYOUT-19 | RSVP Modal – mobile glassmorphism | T13 | Verified |
| LAYOUT-20 | Typography – Plus Jakarta Sans hierarchy | T11, T12 | Verified |
| LAYOUT-21 | Screenshots – desktop & mobile baseline refresh | T14, T15 | Verified |
| LAYOUT-22 | Screenshots – mobile zero overflow assertion | T1, T14, T15 | Verified |
| LAYOUT-23 | Visual Invariants – touch target & token checks | T1, T14, T15 | Verified |
| LAYOUT-24 | Suite Integrity – 100% green test run | T15 | Verified |

**Coverage:** 24 total, 24 mapped to tasks (100%), 0 unmapped ✅

---

## Success Criteria

- [x] `npm run test:e2e` passes 100% on both Desktop Chromium and Mobile Chrome.
- [x] All 14+ baseline screenshots in `e2e/screenshots/` show clean, unclipped, beautifully aligned UI in light and dark modes.
- [x] Zero horizontal overflow (`scrollWidth > clientWidth`) on mobile viewports across all pages.
- [x] `npm test -- --watch=false` passes with 42 test suites / 298+ unit tests green.
- [x] `npm run build` succeeds with zero TypeScript or SCSS compilation errors.
