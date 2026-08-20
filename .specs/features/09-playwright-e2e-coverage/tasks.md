# Playwright E2E Full Coverage & CI Pipeline Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Design**: `.specs/features/09-playwright-e2e-coverage/design.md`  
**Status**: Draft  

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec - confirm before Execute. Guidelines found: `AGENTS.md`, `GEMINI.md`, `DESIGN.md`.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Configuration / Scripts | none | - (build gate only) | `playwright.config.ts` | `npm run build` |
| Page Object Models (POM) | none | - (build gate only) | `e2e/pages/*.ts` | `npm run build` |
| Component Harnesses | none | - (build gate only) | `e2e/components/*.ts` | `npm run build` |
| Test Fixtures & Injections | none | - (build gate only) | `e2e/fixtures/*.ts` | `npm run build` |
| Template data-testid Markup | none | - (build gate only) | `src/app/**/*.html` | `npm run build` |
| E2E Spec Suites | e2e | All user journeys in scope: happy path + edge cases + failure paths + a11y + visual baseline captures | `e2e/**/*.spec.ts` | `npm run test:e2e` |
| CI/CD Pipeline Config | none | - (build gate only) | `.github/workflows/e2e.yml` | `npm run build` |

## Gate Check Commands

> Generated from codebase - confirm before Execute.

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | After POM, component harness, or template instrumentation tasks | `npm run build` |
| Full | After E2E spec suite implementation tasks | `npm run test:e2e` |
| Build | After phase completion or CI workflow tasks | `npm run build && npx playwright test e2e/smoke.spec.ts` |

---

## Execution Plan

Phases are ordered and run sequentially - each phase completes before the next begins, and tasks within a phase execute in order.

### Phase 1: Test Infrastructure & Fixture Harness

Foundational Playwright configuration, BasePage abstraction, custom fixtures, and smoke test migration.

```
T1 → T2 → T3 → T4
```

### Phase 2: Page Object Models

Encapsulating application views into maintainable Page Object Models with semantic and data-testid selectors.

```
T5
T6
T7
T8
T9
T10
```

### Phase 3: Component Harnesses & Dialog Handlers

Reusable harnesses for modal dialogs, item wishlists, share panels, and confirmation alerts.

```
T11
T12
T13
T14
T15
```

### Phase 4: Template data-testid Instrumentation

Adding standardized data-testid attributes to Angular component templates across all feature modules.

```
T16
T17
T18
T19
T20
T21
```

### Phase 5: Core User Journey E2E Spec Suites

End-to-end spec suites covering public discovery, authentication, organizer event management, guest RSVP, profile, and collaborator RBAC.

```
T22
T23
T24
T25
T26
T27
```

### Phase 6: Visual Layout, A11y & Advanced Scenarios

Visual layout baselines against DESIGN.md, keyboard WCAG 2.1 AA focus trap, dual-context concurrency, QR/WhatsApp sharing, PWA offline, and Slow 3G network states.

```
T28
T29
T30
T31
T32
T33
```

### Phase 7: GitHub Actions CI/CD Pipeline Integration

Automated GitHub Actions workflow for pull requests and pushes with artifact uploads and caching.

```
T34
```

---

## Task Breakdown

### Phase 1: Test Infrastructure & Fixture Harness

#### T1: Configure Playwright Runner and NPM Scripts

**What**: Update `playwright.config.ts` with `data-testid` attribute, HTML/List reporters, failure artifacts (trace, screenshot, video), webServer timeout (120s), and add mobile & CI scripts to `package.json`.  
**Where**: `playwright.config.ts`  
**Depends on**: None  
**Reuses**: `@playwright/test` configuration presets  
**Requirement**: PW-01, PW-02, PW-03, PW-19  

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `playwright.config.ts` configured with `testIdAttribute: 'data-testid'`, `trace: 'retain-on-failure'`, `screenshot: 'only-on-failure'`, `video: 'retain-on-failure'`
- [x] `webServer` block configured with `command: 'npm start'`, `timeout: 120 * 1000`, `reuseExistingServer: !process.env['CI']`
- [x] `package.json` contains scripts: `test:e2e`, `test:e2e:ci`, `test:e2e:mobile`
- [x] Build gate passes: `npm run build`

**Tests**: none  
**Gate**: build  
**Commit**: `feat(e2e): configure Playwright runner, reporters, and npm scripts`  

---

#### T2: Implement BasePage Abstraction Class

**What**: Create `BasePage` abstract class with navigation, URL assertion, `@axe-core/playwright` accessibility audit (`assertNoA11yViolations`), and full-page screenshot capture (`captureScreenshot`).  
**Where**: `e2e/pages/base.page.ts`  
**Depends on**: T1  
**Reuses**: `@playwright/test`, `@axe-core/playwright`  
**Requirement**: PW-01, PW-20, PW-21  

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `BasePage` abstract class exported with `page: Page` constructor
- [x] Methods implemented: `goto(path)`, `assertLoaded()`, `assertUrl(pattern)`, `assertNoA11yViolations(options)`, `captureScreenshot(name)`
- [x] Full-page screenshots saved to `e2e/screenshots/{name}.png`
- [x] Build gate passes: `npm run build`

**Tests**: none  
**Gate**: build  
**Commit**: `feat(e2e): implement BasePage abstraction class with a11y and screenshot helpers`  

---

#### T3: Implement Custom App Test Fixtures

**What**: Create `test.fixture.ts` extending base Playwright test with Page Object dependency injection, `makeAxeBuilder`, and authenticated session storageState helpers.  
**Where**: `e2e/fixtures/test.fixture.ts`  
**Depends on**: T2  
**Reuses**: `e2e/pages/base.page.ts`, `@playwright/test` `test.extend`  
**Requirement**: PW-01, PW-03  

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Extended `test` object provides `homePage`, `loginPage`, `dashboardPage`, `eventEditorPage`, `eventDetailPage`, `profilePage`, and `makeAxeBuilder` fixtures
- [x] Session injection helpers exported for authenticated host and guest contexts
- [x] Build gate passes: `npm run build`

**Tests**: none  
**Gate**: build  
**Commit**: `feat(e2e): implement custom test fixtures and axe builder extension`  

---

#### T4: Refactor Smoke Spec to Use Page Object Models

**What**: Refactor `e2e/smoke.spec.ts` to use custom fixtures, Page Object classes, and `data-testid` / semantic role selectors instead of CSS classes.  
**Where**: `e2e/smoke.spec.ts`  
**Depends on**: T3  
**Reuses**: `e2e/fixtures/test.fixture.ts`  
**Requirement**: PW-01, PW-04  

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `e2e/smoke.spec.ts` uses `test` from `e2e/fixtures/test.fixture.ts`
- [x] Replaces CSS class queries (`.home__title`, `.login__google-btn`) with `getByTestId` / `getByRole`
- [x] Smoke test passes: `npx playwright test e2e/smoke.spec.ts`
- [x] Full gate passes: `npm run test:e2e`

**Tests**: e2e  
**Gate**: full  
**Commit**: `refactor(e2e): migrate smoke spec to page objects and data-testid selectors`  

---

### Phase 2: Page Object Models

#### T5: Implement HomePage Page Object Model

**What**: Implement `HomePage` POM encapsulating public discovery feed, empty state, theme toggle button, seasonal overlay, and event card navigation.  
**Where**: `e2e/pages/home.page.ts`  
**Depends on**: None  
**Reuses**: `e2e/pages/base.page.ts`  
**Requirement**: PW-04, PW-05  

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `HomePage` extends `BasePage` and defines locators: `pageRoot`, `eventCards`, `emptyState`, `themeToggleBtn`, `seasonalOverlay`
- [x] Implements methods: `toggleTheme()`, `clickEventCard(index)`
- [x] Build gate passes: `npm run build`

**Tests**: none  
**Gate**: build  
**Commit**: `feat(e2e): implement HomePage page object model`  

---

#### T6: Implement LoginPage Page Object Model

**What**: Implement `LoginPage` POM encapsulating email/password inputs, Google login CTA, error alert, and email verification banner with resend timer.  
**Where**: `e2e/pages/login.page.ts`  
**Depends on**: None  
**Reuses**: `e2e/pages/base.page.ts`  
**Requirement**: PW-06, PW-07  

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `LoginPage` extends `BasePage` and defines locators: `emailInput`, `passwordInput`, `submitBtn`, `googleBtn`, `errorAlert`, `verificationBanner`
- [x] Implements methods: `login(email, password)`, `loginWithGoogle()`
- [x] Build gate passes: `npm run build`

**Tests**: none  
**Gate**: build  
**Commit**: `feat(e2e): implement LoginPage page object model`  

---

#### T7: Implement OrganizerDashboardPage Page Object Model

**What**: Implement `OrganizerDashboardPage` POM encapsulating `/meus-eventos` dashboard, status filter chips, owned/collaborated event cards, and "Criar Evento" CTA.  
**Where**: `e2e/pages/organizer-dashboard.page.ts`  
**Depends on**: None  
**Reuses**: `e2e/pages/base.page.ts`  
**Requirement**: PW-08, PW-09  

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `OrganizerDashboardPage` extends `BasePage` and defines locators: `filterChips`, `createEventBtn`, `eventCards`
- [x] Implements methods: `filterByStatus(status)`, `openEventEditor(eventId)`
- [x] Build gate passes: `npm run build`

**Tests**: none  
**Gate**: build  
**Commit**: `feat(e2e): implement OrganizerDashboardPage page object model`  

---

#### T8: Implement EventEditorPage Page Object Model

**What**: Implement `EventEditorPage` POM encapsulating `/meus-eventos/evento/novo` and `/meus-eventos/evento/:id` event creation, editing, ViaCEP auto-fill, and item wishlist forms.  
**Where**: `e2e/pages/event-editor.page.ts`  
**Depends on**: None  
**Reuses**: `e2e/pages/base.page.ts`  
**Requirement**: PW-08, PW-09  

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `EventEditorPage` extends `BasePage` and defines locators: `titleInput`, `dateInput`, `cepInput`, `streetInput`, `saveBtn`, `cancelEventBtn`
- [x] Implements methods: `fillBasicInfo(...)`, `fillCep(cep)`, `saveEvent()`, `addWishlistItem(...)`
- [x] Build gate passes: `npm run build`

**Tests**: none  
**Gate**: build  
**Commit**: `feat(e2e): implement EventEditorPage page object model`  

---

#### T9: Implement EventDetailPage Page Object Model

**What**: Implement `EventDetailPage` POM encapsulating attendee view at `/evento/:id`, countdown timer, RSVP button, Pix split card, copy button, and confetti trigger.  
**Where**: `e2e/pages/event-detail.page.ts`  
**Depends on**: None  
**Reuses**: `e2e/pages/base.page.ts`  
**Requirement**: PW-10, PW-11, PW-12, PW-13  

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `EventDetailPage` extends `BasePage` and defines locators: `countdownTimer`, `rsvpBtn`, `pixCard`, `copyPixBtn`, `confettiCanvas`
- [x] Implements methods: `openRsvpDialog()`, `copyPixKey()`
- [x] Build gate passes: `npm run build`

**Tests**: none  
**Gate**: build  
**Commit**: `feat(e2e): implement EventDetailPage page object model`  

---

#### T10: Implement ProfilePage Page Object Model

**What**: Implement `ProfilePage` POM encapsulating `/perfil` user profile fields and personal family roster management.  
**Where**: `e2e/pages/profile.page.ts`  
**Depends on**: None  
**Reuses**: `e2e/pages/base.page.ts`  
**Requirement**: PW-14  

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `ProfilePage` extends `BasePage` and defines locators: `nameInput`, `phoneInput`, `saveProfileBtn`
- [x] Implements methods: `updateProfile(name, phone)`
- [x] Build gate passes: `npm run build`

**Tests**: none  
**Gate**: build  
**Commit**: `feat(e2e): implement ProfilePage page object model`  

---

### Phase 3: Component Harnesses & Dialog Handlers

#### T11: Implement RsvpDialogHarness

**What**: Implement `RsvpDialogHarness` component harness encapsulating modal RSVP confirmation, 1-touch Google RSVP, contact phone input, family batch selector, and keyboard focus trap.  
**Where**: `e2e/components/rsvp-dialog.harness.ts`  
**Depends on**: None  
**Reuses**: `@playwright/test` `Locator`  
**Requirement**: PW-11, PW-29, PW-30  

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `RsvpDialogHarness` defines locators: `dialogRoot`, `confirmBtn`, `cancelBtn`, `phoneInput`, `familySelector`
- [x] Implements methods: `confirmRsvp()`, `cancel()`, `assertFocusTrapped()`, `dismissViaEscape()`
- [x] Build gate passes: `npm run build`

**Tests**: none  
**Gate**: build  
**Commit**: `feat(e2e): implement RsvpDialogHarness component harness`  

---

#### T12: Implement ItemListHarness

**What**: Implement `ItemListHarness` component harness encapsulating wishlist item claim toggle, unclaim action, and remaining item counter assertion.  
**Where**: `e2e/components/item-list.harness.ts`  
**Depends on**: None  
**Reuses**: `@playwright/test` `Locator`  
**Requirement**: PW-13, PW-24  

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `ItemListHarness` defines locators: `itemCards`, `claimBtns`, `unclaimBtns`, `remainingCount`
- [x] Implements methods: `claimItem(index)`, `unclaimItem(index)`, `assertRemaining(count)`
- [x] Build gate passes: `npm run build`

**Tests**: none  
**Gate**: build  
**Commit**: `feat(e2e): implement ItemListHarness component harness`  

---

#### T13: Implement SharePanelHarness

**What**: Implement `SharePanelHarness` component harness encapsulating QR code canvas verification, WhatsApp link generation inspection (`https://api.whatsapp.com/send?text=...`), copy link CTA, and collaborator email invite.  
**Where**: `e2e/components/share-panel.harness.ts`  
**Depends on**: None  
**Reuses**: `@playwright/test` `Locator`  
**Requirement**: PW-15, PW-27, PW-28  

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `SharePanelHarness` defines locators: `qrCanvas`, `whatsappBtn`, `copyLinkBtn`, `inviteEmailInput`, `sendInviteBtn`
- [x] Implements methods: `getWhatsAppHref()`, `copyLink()`, `inviteCollaborator(email)`
- [x] Build gate passes: `npm run build`

**Tests**: none  
**Gate**: build  
**Commit**: `feat(e2e): implement SharePanelHarness component harness`  

---

#### T14: Implement FamilyRosterHarness

**What**: Implement `FamilyRosterHarness` component harness encapsulating family member addition, relationship selection, deletion, and batch checkbox selection.  
**Where**: `e2e/components/family-roster.harness.ts`  
**Depends on**: None  
**Reuses**: `@playwright/test` `Locator`  
**Requirement**: PW-14  

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `FamilyRosterHarness` defines locators: `memberCards`, `nameInput`, `relationshipSelect`, `addMemberBtn`, `deleteMemberBtns`, `selectAllCheckbox`
- [x] Implements methods: `addMember(name, relationship)`, `deleteMember(index)`, `toggleSelectAll()`
- [x] Build gate passes: `npm run build`

**Tests**: none  
**Gate**: build  
**Commit**: `feat(e2e): implement FamilyRosterHarness component harness`  

---

#### T15: Implement ConfirmDialogHarness

**What**: Implement `ConfirmDialogHarness` component harness encapsulating confirmation and cancellation triggers for destructive operations (event cancellation, item deletion).  
**Where**: `e2e/components/confirm-dialog.harness.ts`  
**Depends on**: None  
**Reuses**: `@playwright/test` `Locator`  
**Requirement**: PW-09, PW-30  

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `ConfirmDialogHarness` defines locators: `dialogRoot`, `confirmBtn`, `cancelBtn`, `messageText`
- [x] Implements methods: `confirm()`, `cancel()`, `assertVisible()`
- [x] Build gate passes: `npm run build`

**Tests**: none  
**Gate**: build  
**Commit**: `feat(e2e): implement ConfirmDialogHarness component harness`  

---

### Phase 4: Template data-testid Instrumentation

#### T16: Instrument Home Template with data-testid

**What**: Add standardized `data-testid` attributes to `src/app/features/home/home.container.html` for home container, event cards, empty state, theme toggle, and seasonal overlay.  
**Where**: `src/app/features/home/home.container.html`  
**Depends on**: None  
**Reuses**: Kebab-case `data-testid` taxonomy from design  
**Requirement**: PW-04, PW-05  

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Attributes added: `data-testid="home-page"`, `data-testid="event-card"`, `data-testid="home-empty-state"`, `data-testid="theme-toggle-btn"`, `data-testid="seasonal-overlay"`
- [x] Preserves all existing SCSS BEM classes and Angular Signal bindings
- [x] Build gate passes: `npm run build`

**Tests**: none  
**Gate**: build  
**Commit**: `feat(a11y): add data-testid attributes to home template`  

---

#### T17: Instrument Auth Login Template with data-testid

**What**: Add standardized `data-testid` attributes to `src/app/features/auth/login/login.container.html` for login container, inputs, buttons, error alerts, and verification banner.  
**Where**: `src/app/features/auth/login/login.container.html`  
**Depends on**: None  
**Reuses**: Kebab-case `data-testid` taxonomy from design  
**Requirement**: PW-06, PW-07  

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Attributes added: `data-testid="login-page"`, `data-testid="login-email-input"`, `data-testid="login-password-input"`, `data-testid="login-submit-btn"`, `data-testid="google-login-btn"`, `data-testid="login-error-alert"`, `data-testid="email-verification-banner"`
- [x] Preserves existing Angular Material form field bindings
- [x] Build gate passes: `npm run build`

**Tests**: none  
**Gate**: build  
**Commit**: `feat(a11y): add data-testid attributes to auth login template`  

---

#### T18: Instrument Organizer Dashboard Template with data-testid

**What**: Add standardized `data-testid` attributes to `src/app/features/admin/dashboard/dashboard.container.html` for dashboard container, status filter chips, create event CTA, and event cards.  
**Where**: `src/app/features/admin/dashboard/dashboard.container.html`  
**Depends on**: None  
**Reuses**: Kebab-case `data-testid` taxonomy from design  
**Requirement**: PW-08, PW-09  

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Attributes added: `data-testid="dashboard-page"`, `data-testid="create-event-btn"`, `data-testid="status-filter-all-chip"`, `data-testid="status-filter-active-chip"`, `data-testid="organizer-event-card"`
- [x] Build gate passes: `npm run build`

**Tests**: none  
**Gate**: build  
**Commit**: `feat(a11y): add data-testid attributes to organizer dashboard template`  

---

#### T19: Instrument Event Editor Form Template with data-testid

**What**: Add standardized `data-testid` attributes to `src/app/features/admin/event-editor/event-editor.container.html` for event editor form, CEP input, address fields, save button, and cancellation controls.  
**Where**: `src/app/features/admin/event-editor/event-editor.container.html`  
**Depends on**: None  
**Reuses**: Kebab-case `data-testid` taxonomy from design  
**Requirement**: PW-08, PW-09  

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Attributes added: `data-testid="event-editor-page"`, `data-testid="event-title-input"`, `data-testid="event-cep-input"`, `data-testid="event-save-btn"`, `data-testid="event-cancel-btn"`
- [x] Build gate passes: `npm run build`

**Tests**: none  
**Gate**: build  
**Commit**: `feat(a11y): add data-testid attributes to event editor form template`  

---

#### T20: Instrument Event Detail and RSVP Templates with data-testid

**What**: Add standardized `data-testid` attributes to `src/app/features/event-detail/event-detail.container.html` and `src/app/features/event-detail/components/rsvp-dialog/rsvp-dialog.component.html` for event detail container, countdown timer, RSVP action, Pix card, copy button, and confetti canvas.  
**Where**: `src/app/features/event-detail/event-detail.container.html`  
**Depends on**: None  
**Reuses**: Kebab-case `data-testid` taxonomy from design  
**Requirement**: PW-10, PW-11, PW-12, PW-13  

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Attributes added: `data-testid="event-detail-page"`, `data-testid="countdown-timer"`, `data-testid="rsvp-action-btn"`, `data-testid="pix-card"`, `data-testid="copy-pix-btn"`, `data-testid="confetti-canvas"`
- [x] Build gate passes: `npm run build`

**Tests**: none  
**Gate**: build  
**Commit**: `feat(a11y): add data-testid attributes to event detail template`  

---

#### T21: Instrument Profile and Family Templates with data-testid

**What**: Add standardized `data-testid` attributes to `src/app/features/profile/profile.container.html` and `src/app/features/profile/components/family-roster-manager/family-roster-manager.component.html` for profile page container, family roster list, add member form, and delete buttons.  
**Where**: `src/app/features/profile/profile.container.html`  
**Depends on**: None  
**Reuses**: Kebab-case `data-testid` taxonomy from design  
**Requirement**: PW-14  

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Attributes added: `data-testid="profile-page"`, `data-testid="family-member-card"`, `data-testid="add-family-member-btn"`
- [x] Build gate passes: `npm run build`

**Tests**: none  
**Gate**: build  
**Commit**: `feat(a11y): add data-testid attributes to profile template`  

---

### Phase 5: Core User Journey E2E Spec Suites

#### T22: Implement Home Theming and A11y E2E Spec Suite

**What**: Implement `01-home-theming.spec.ts` covering home landmark, event feed card navigation, dark/light theme switching, seasonal overlay, and axe-core WCAG 2.1 AA accessibility audit.  
**Where**: `e2e/specs/01-home-theming.spec.ts`  
**Depends on**: None  
**Reuses**: `e2e/fixtures/test.fixture.ts`, `HomePage`  
**Requirement**: PW-04, PW-05, PW-20  

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Verifies landmark `aria-label="Eventos disponíveis"` and feed cards rendering
- [x] Verifies dark/light theme toggle, `document.documentElement` class update, and `localStorage` persistence
- [x] Verifies seasonal overlay rendering when active
- [x] Verifies card click navigates to `/evento/:id`
- [x] Verifies zero axe-core WCAG 2.1 AA violations on home view
- [x] Full gate passes: `npm run test:e2e`

**Tests**: e2e  
**Gate**: full  
**Commit**: `test(e2e): implement home theming and accessibility spec suite`  

---

#### T23: Implement Auth Guards and Registration E2E Spec Suite

**What**: Implement `02-auth-guards.spec.ts` covering unauthenticated route redirects for `/meus-eventos` & `/perfil`, superAdmin blocking on `/admin`, invalid form validations, and verification banner cooldown.  
**Where**: `e2e/specs/02-auth-guards.spec.ts`  
**Depends on**: None  
**Reuses**: `e2e/fixtures/test.fixture.ts`, `LoginPage`  
**Requirement**: PW-06, PW-07  

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Asserts unauthenticated access to `/meus-eventos` and `/perfil` redirects to `/login` with returnUrl
- [x] Asserts non-superadmin access to `/admin` is blocked and redirected
- [x] Asserts inline validation errors for invalid email/password inputs
- [x] Asserts email verification banner display and resend 60s cooldown timer
- [x] Full gate passes: `npm run test:e2e`

**Tests**: e2e  
**Gate**: full  
**Commit**: `test(e2e): implement authentication guards and registration spec suite`  

---

#### T24: Implement Organizer Event Lifecycle E2E Spec Suite

**What**: Implement `03-event-lifecycle.spec.ts` covering dashboard filtering, creation with ViaCEP auto-fill, editing details, item wishlist updates, and event cancellation confirmation dialog.  
**Where**: `e2e/specs/03-event-lifecycle.spec.ts`  
**Depends on**: None  
**Reuses**: `OrganizerDashboardPage`, `EventEditorPage`, `ConfirmDialogHarness`  
**Requirement**: PW-08, PW-09  

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Verifies status filter chips ("Todos", "Ativos", "Encerrados", "Cancelados")
- [x] Verifies ViaCEP auto-population of street/neighborhood/city/state upon 8-digit CEP entry
- [x] Verifies event creation submission and redirect to editor/dashboard
- [x] Verifies event update and item wishlist persistence
- [x] Verifies cancellation confirmation modal dialog before status transition
- [x] Full gate passes: `npm run test:e2e`

**Tests**: e2e  
**Gate**: full  
**Commit**: `test(e2e): implement organizer event lifecycle and ViaCEP spec suite`  

---

#### T25: Implement Guest RSVP and Split Estimation E2E Spec Suite

**What**: Implement `04-guest-rsvp.spec.ts` covering event countdown, 1-touch verified RSVP modal, celebratory confetti, smart split Pix estimation with 1-click copy, and wishlist item claim/unclaim.  
**Where**: `e2e/specs/04-guest-rsvp.spec.ts`  
**Depends on**: None  
**Reuses**: `EventDetailPage`, `RsvpDialogHarness`, `ItemListHarness`  
**Requirement**: PW-10, PW-11, PW-12, PW-13  

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Verifies countdown timer (7d/1d) rendering and location details
- [x] Verifies 1-touch verified RSVP modal confirmation and confetti trigger
- [x] Verifies dynamic split calculation (`estimatedBudget / guestCount`) and Pix copy button
- [x] Verifies wishlist item claim toggle and unclaim action updating remaining counter
- [x] Full gate passes: `npm run test:e2e`

**Tests**: e2e  
**Gate**: full  
**Commit**: `test(e2e): implement guest RSVP, smart split, and wishlist claim spec suite`  

---

#### T26: Implement Profile and Family Roster E2E Spec Suite

**What**: Implement `05-profile-family.spec.ts` covering profile info update, personal family member addition/deletion, and family roster batch selection inside RSVP modal.  
**Where**: `e2e/specs/05-profile-family.spec.ts`  
**Depends on**: None  
**Reuses**: `ProfilePage`, `FamilyRosterHarness`, `RsvpDialogHarness`  
**Requirement**: PW-14  

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Verifies profile name and phone number editing and persistence
- [x] Verifies adding, updating, and deleting family members in profile view
- [x] Verifies collapsible family roster batch selection in event RSVP modal
- [x] Full gate passes: `npm run test:e2e`

**Tests**: e2e  
**Gate**: full  
**Commit**: `test(e2e): implement user profile and family roster management spec suite`  

---

#### T27: Implement Collaborator RBAC Permissions E2E Spec Suite

**What**: Implement `06-collaborator-rbac.spec.ts` covering collaborator email invitation, auto-claim on sign-in, collaborator wishlist/guest management, and field protection against unauthorized core edits or cancellation.  
**Where**: `e2e/specs/06-collaborator-rbac.spec.ts`  
**Depends on**: None  
**Reuses**: `SharePanelHarness`, `EventEditorPage`, `OrganizerDashboardPage`  
**Requirement**: PW-15, PW-16  

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Verifies inviting collaborator email creates pending invitation
- [x] Verifies signing in with matching email auto-claims collaborator role
- [x] Verifies collaborator can manage items and view guest confirmations
- [x] Verifies collaborator is prevented from editing core fields or cancelling/deleting event
- [x] Full gate passes: `npm run test:e2e`

**Tests**: e2e  
**Gate**: full  
**Commit**: `test(e2e): implement collaborator invitation and RBAC permissions spec suite`  

---

### Phase 6: Visual Layout, A11y & Advanced Scenarios

#### T28: Implement Visual Layout Baseline & Heuristic Inspection Spec Suite

**What**: Implement `07-visual-layout.spec.ts` capturing full-page screenshots across all key flow milestones (Home light/dark, Login desktop/mobile, Dashboard, Event Editor CEP, RSVP dialog, Profile) and verify against `DESIGN.md` and Nielsen Heuristics.  
**Where**: `e2e/specs/07-visual-layout.spec.ts`  
**Depends on**: None  
**Reuses**: `BasePage.captureScreenshot`, `DESIGN.md` visual tokens  
**Requirement**: PW-21, PW-22  

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Captures full-page screenshots to `e2e/screenshots/` across all 7 milestone views with isolated desktop and mobile paths (`*-desktop.png` and `*-mobile.png`)
- [x] Audits captured screenshots against Nielsen Heuristics (form alignment, Glassmorphism, 48px touch targets)
- [x] Logs inspection report in test logs
- [x] Full gate passes: `npm run test:e2e`

**Tests**: e2e  
**Gate**: full  
**Commit**: `test(e2e): implement visual layout screenshot baselines and heuristic inspection suite`  

---

#### T29: Implement Keyboard Navigation & Modal Focus Trap Spec Suite

**What**: Implement `08-keyboard-a11y.spec.ts` asserting Tab cycling focus trap inside modal dialogs, Escape key dismissal with focus restoration, and keyboard form control activation.  
**Where**: `e2e/specs/08-keyboard-a11y.spec.ts`  
**Depends on**: None  
**Reuses**: `RsvpDialogHarness`, `ConfirmDialogHarness`  
**Requirement**: PW-29, PW-30  

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Verifies focus is trapped within RSVP modal and confirm dialog when cycling Tab / Shift+Tab
- [x] Verifies pressing Escape dismisses modal and restores focus to triggering element
- [x] Verifies activating buttons and checkboxes via Space and Enter keys
- [x] Full gate passes: `npm run test:e2e`

**Tests**: e2e  
**Gate**: full  
**Commit**: `test(e2e): implement keyboard navigation and modal focus trap spec suite`  

---

#### T30: Implement Real-Time Dual-Context Multi-User Concurrency Spec Suite

**What**: Implement `09-multi-user-sync.spec.ts` utilizing two isolated browser contexts to verify real-time Firestore stream synchronization of RSVP attendee count and wishlist item updates between host and attendee sessions.  
**Where**: `e2e/specs/09-multi-user-sync.spec.ts`  
**Depends on**: None  
**Reuses**: Playwright `browser.newContext()`  
**Requirement**: PW-23, PW-24  

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Launches Host in Context A and Attendee in Context B simultaneously
- [x] Asserts Attendee RSVP in Context B dynamically updates Host guest count in Context A without page reload
- [x] Asserts Host adding wishlist item in Context A dynamically renders on Attendee view in Context B
- [x] Full gate passes: `npm run test:e2e`

**Tests**: e2e  
**Gate**: full  
**Commit**: `test(e2e): implement real-time dual-context multi-user concurrency spec suite`  

---

#### T31: Implement QR Code & WhatsApp Share Deep Link Spec Suite

**What**: Implement `10-share-qr.spec.ts` verifying QR code canvas rendering, WhatsApp URI schema construction with event details, and clipboard copy action feedback.  
**Where**: `e2e/specs/10-share-qr.spec.ts`  
**Depends on**: None  
**Reuses**: `SharePanelHarness`  
**Requirement**: PW-27, PW-28  

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Verifies QR code canvas renders with valid data URI on share panel
- [x] Verifies WhatsApp share link constructs URI schema (`https://api.whatsapp.com/send?text=...`) containing title, date, location, and deep link
- [x] Verifies 1-click copy copies link to clipboard with confirmation toast
- [x] Full gate passes: `npm run test:e2e`

**Tests**: e2e  
**Gate**: full  
**Commit**: `test(e2e): implement QR code rendering and WhatsApp share link spec suite`  

---

#### T32: Implement PWA Offline Caching & Resilience Spec Suite

**What**: Implement `11-pwa-offline.spec.ts` verifying service worker cache retrieval in simulated offline mode, offline status banner display, and graceful write action disabling.  
**Where**: `e2e/specs/11-pwa-offline.spec.ts`  
**Depends on**: None  
**Reuses**: Playwright `context.setOffline(true)`  
**Requirement**: PW-25, PW-26  

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Simulates offline mode via Playwright network disconnection
- [x] Asserts previously loaded event page continues to render from Service Worker cache
- [x] Asserts non-intrusive offline banner display and graceful write guard
- [x] Full gate passes: `npm run test:e2e`

**Tests**: e2e  
**Gate**: full  
**Commit**: `test(e2e): implement PWA offline caching resilience and banner spec suite`  

---

#### T33: Implement Slow 3G Skeleton Shimmer Loading Spec Suite

**What**: Implement `12-network-loading.spec.ts` throttling network to Slow 3G to assert skeleton placeholder rendering and CLS prevention during event data loading.  
**Where**: `e2e/specs/12-network-loading.spec.ts`  
**Depends on**: None  
**Reuses**: Playwright CDP / route throttling  
**Requirement**: PW-31  

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Throttles network connection to Slow 3G profile
- [x] Asserts skeleton loading shimmer components are visible before data arrives
- [x] Asserts smooth content transition without layout shifting
- [x] Full gate passes: `npm run test:e2e`

**Tests**: e2e  
**Gate**: full  
**Commit**: `test(e2e): implement network loading and skeleton shimmer spec suite`  

---

### Phase 7: GitHub Actions CI/CD Pipeline Integration

#### T34: Implement GitHub Actions Playwright CI Workflow

**What**: Create `.github/workflows/e2e.yml` configured to trigger on pull requests and pushes to `main`, install Playwright browser dependencies with caching, execute `npm run test:e2e:ci`, and upload HTML reports and failure artifacts.  
**Where**: `.github/workflows/e2e.yml`  
**Depends on**: None  
**Reuses**: GitHub Actions `@actions/checkout`, `@actions/setup-node`, `@actions/upload-artifact`  
**Requirement**: PW-17, PW-18  

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Workflow triggers on `pull_request` to `main` and `push` to `main`
- [x] Caches `~/.cache/ms-playwright` and `node_modules` for fast execution (<5 min)
- [x] Executes `npm run test:e2e:ci` headless
- [x] Uploads `playwright-report/` and test failure traces as workflow artifacts on failure
- [x] Build gate passes: `npm run build`

**Tests**: none  
**Gate**: build  
**Commit**: `ci(e2e): configure GitHub Actions Playwright E2E test workflow`  

---

## Phase Execution Map

```
Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6 → Phase 7

Phase 1:  T1 ──────→ T2 ──────→ T3 ──────→ T4
Phase 2:  T5
          T6
          T7
          T8
          T9
          T10
Phase 3:  T11
          T12
          T13
          T14
          T15
Phase 4:  T16
          T17
          T18
          T19
          T20
          T21
Phase 5:  T22
          T23
          T24
          T25
          T26
          T27
Phase 6:  T28
          T29
          T30
          T31
          T32
          T33
Phase 7:  T34
```

Execution is strictly sequential - there is no intra-phase parallelism. A single agent (or batch worker) works one task at a time, in order.

---

## Task Granularity Check

| Task | Scope | Status |
| ---- | ----- | ------ |
| T1: Configure Playwright Runner and NPM Scripts | 1 config file + package scripts | ✅ Granular |
| T2: Implement BasePage Abstraction Class | 1 base class file | ✅ Granular |
| T3: Implement Custom App Test Fixtures | 1 test fixture file | ✅ Granular |
| T4: Refactor Smoke Spec to Use Page Object Models | 1 spec file refactor | ✅ Granular |
| T5: Implement HomePage Page Object Model | 1 page object class | ✅ Granular |
| T6: Implement LoginPage Page Object Model | 1 page object class | ✅ Granular |
| T7: Implement OrganizerDashboardPage Page Object Model | 1 page object class | ✅ Granular |
| T8: Implement EventEditorPage Page Object Model | 1 page object class | ✅ Granular |
| T9: Implement EventDetailPage Page Object Model | 1 page object class | ✅ Granular |
| T10: Implement ProfilePage Page Object Model | 1 page object class | ✅ Granular |
| T11: Implement RsvpDialogHarness | 1 component harness class | ✅ Granular |
| T12: Implement ItemListHarness | 1 component harness class | ✅ Granular |
| T13: Implement SharePanelHarness | 1 component harness class | ✅ Granular |
| T14: Implement FamilyRosterHarness | 1 component harness class | ✅ Granular |
| T15: Implement ConfirmDialogHarness | 1 component harness class | ✅ Granular |
| T16: Instrument Home Template with data-testid | 1 template file | ✅ Granular |
| T17: Instrument Auth Login Template with data-testid | 1 template file | ✅ Granular |
| T18: Instrument Organizer Dashboard Template with data-testid | 1 template file | ✅ Granular |
| T19: Instrument Event Editor Form Template with data-testid | 1 template file | ✅ Granular |
| T20: Instrument Event Detail and RSVP Templates with data-testid | 1 template file | ✅ Granular |
| T21: Instrument Profile and Family Templates with data-testid | 1 template file | ✅ Granular |
| T22: Implement Home Theming and A11y E2E Spec Suite | 1 spec file | ✅ Granular |
| T23: Implement Auth Guards and Registration E2E Spec Suite | 1 spec file | ✅ Granular |
| T24: Implement Organizer Event Lifecycle E2E Spec Suite | 1 spec file | ✅ Granular |
| T25: Implement Guest RSVP and Split Estimation E2E Spec Suite | 1 spec file | ✅ Granular |
| T26: Implement Profile and Family Roster E2E Spec Suite | 1 spec file | ✅ Granular |
| T27: Implement Collaborator RBAC Permissions E2E Spec Suite | 1 spec file | ✅ Granular |
| T28: Implement Visual Layout Baseline & Heuristic Inspection Spec Suite | 1 spec file | ✅ Granular |
| T29: Implement Keyboard Navigation & Modal Focus Trap Spec Suite | 1 spec file | ✅ Granular |
| T30: Implement Real-Time Dual-Context Multi-User Concurrency Spec Suite | 1 spec file | ✅ Granular |
| T31: Implement QR Code & WhatsApp Share Deep Link Spec Suite | 1 spec file | ✅ Granular |
| T32: Implement PWA Offline Caching & Resilience Spec Suite | 1 spec file | ✅ Granular |
| T33: Implement Slow 3G Skeleton Shimmer Loading Spec Suite | 1 spec file | ✅ Granular |
| T34: Implement GitHub Actions Playwright CI Workflow | 1 CI workflow file | ✅ Granular |

---

## Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
| ---- | ---------------------- | ------------- | ------ |
| T1 | None | None | ✅ Match |
| T2 | T1 | T1 → T2 | ✅ Match |
| T3 | T2 | T2 → T3 | ✅ Match |
| T4 | T3 | T3 → T4 | ✅ Match |
| T5 | None | None | ✅ Match |
| T6 | None | None | ✅ Match |
| T7 | None | None | ✅ Match |
| T8 | None | None | ✅ Match |
| T9 | None | None | ✅ Match |
| T10 | None | None | ✅ Match |
| T11 | None | None | ✅ Match |
| T12 | None | None | ✅ Match |
| T13 | None | None | ✅ Match |
| T14 | None | None | ✅ Match |
| T15 | None | None | ✅ Match |
| T16 | None | None | ✅ Match |
| T17 | None | None | ✅ Match |
| T18 | None | None | ✅ Match |
| T19 | None | None | ✅ Match |
| T20 | None | None | ✅ Match |
| T21 | None | None | ✅ Match |
| T22 | None | None | ✅ Match |
| T23 | None | None | ✅ Match |
| T24 | None | None | ✅ Match |
| T25 | None | None | ✅ Match |
| T26 | None | None | ✅ Match |
| T27 | None | None | ✅ Match |
| T28 | None | None | ✅ Match |
| T29 | None | None | ✅ Match |
| T30 | None | None | ✅ Match |
| T31 | None | None | ✅ Match |
| T32 | None | None | ✅ Match |
| T33 | None | None | ✅ Match |
| T34 | None | None | ✅ Match |

---

## Test Co-location Validation

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
| ---- | --------------------------- | --------------- | --------- | ------ |
| T1: Configure Playwright Runner and NPM Scripts | Configuration / Scripts | none | none | ✅ OK |
| T2: Implement BasePage Abstraction Class | Page Object Models (POM) | none | none | ✅ OK |
| T3: Implement Custom App Test Fixtures | Test Fixtures & Injections | none | none | ✅ OK |
| T4: Refactor Smoke Spec to Use Page Object Models | E2E Spec Suites | e2e | e2e | ✅ OK |
| T5: Implement HomePage Page Object Model | Page Object Models (POM) | none | none | ✅ OK |
| T6: Implement LoginPage Page Object Model | Page Object Models (POM) | none | none | ✅ OK |
| T7: Implement OrganizerDashboardPage Page Object Model | Page Object Models (POM) | none | none | ✅ OK |
| T8: Implement EventEditorPage Page Object Model | Page Object Models (POM) | none | none | ✅ OK |
| T9: Implement EventDetailPage Page Object Model | Page Object Models (POM) | none | none | ✅ OK |
| T10: Implement ProfilePage Page Object Model | Page Object Models (POM) | none | none | ✅ OK |
| T11: Implement RsvpDialogHarness | Component Harnesses | none | none | ✅ OK |
| T12: Implement ItemListHarness | Component Harnesses | none | none | ✅ OK |
| T13: Implement SharePanelHarness | Component Harnesses | none | none | ✅ OK |
| T14: Implement FamilyRosterHarness | Component Harnesses | none | none | ✅ OK |
| T15: Implement ConfirmDialogHarness | Component Harnesses | none | none | ✅ OK |
| T16: Instrument Home Template with data-testid | Template data-testid Markup | none | none | ✅ OK |
| T17: Instrument Auth Login Template with data-testid | Template data-testid Markup | none | none | ✅ OK |
| T18: Instrument Organizer Dashboard Template with data-testid | Template data-testid Markup | none | none | ✅ OK |
| T19: Instrument Event Editor Form Template with data-testid | Template data-testid Markup | none | none | ✅ OK |
| T20: Instrument Event Detail and RSVP Templates with data-testid | Template data-testid Markup | none | none | ✅ OK |
| T21: Instrument Profile and Family Templates with data-testid | Template data-testid Markup | none | none | ✅ OK |
| T22: Implement Home Theming and A11y E2E Spec Suite | E2E Spec Suites | e2e | e2e | ✅ OK |
| T23: Implement Auth Guards and Registration E2E Spec Suite | E2E Spec Suites | e2e | e2e | ✅ OK |
| T24: Implement Organizer Event Lifecycle E2E Spec Suite | E2E Spec Suites | e2e | e2e | ✅ OK |
| T25: Implement Guest RSVP and Split Estimation E2E Spec Suite | E2E Spec Suites | e2e | e2e | ✅ OK |
| T26: Implement Profile and Family Roster E2E Spec Suite | E2E Spec Suites | e2e | e2e | ✅ OK |
| T27: Implement Collaborator RBAC Permissions E2E Spec Suite | E2E Spec Suites | e2e | e2e | ✅ OK |
| T28: Implement Visual Layout Baseline & Heuristic Inspection Spec Suite | E2E Spec Suites | e2e | e2e | ✅ OK |
| T29: Implement Keyboard Navigation & Modal Focus Trap Spec Suite | E2E Spec Suites | e2e | e2e | ✅ OK |
| T30: Implement Real-Time Dual-Context Multi-User Concurrency Spec Suite | E2E Spec Suites | e2e | e2e | ✅ OK |
| T31: Implement QR Code & WhatsApp Share Deep Link Spec Suite | E2E Spec Suites | e2e | e2e | ✅ OK |
| T32: Implement PWA Offline Caching & Resilience Spec Suite | E2E Spec Suites | e2e | e2e | ✅ OK |
| T33: Implement Slow 3G Skeleton Shimmer Loading Spec Suite | E2E Spec Suites | e2e | e2e | ✅ OK |
| T34: Implement GitHub Actions Playwright CI Workflow | CI/CD Pipeline Config | none | none | ✅ OK |
