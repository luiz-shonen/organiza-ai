# Organiza AI — Project Memory

## Handoff Snapshot

**Last updated:** 2026-09-01  
**State:** Feature 22 (`22-dry-solid-docs-and-route-separation`) 100% complete across all 4 phases (T01-T20). DRY models extracted, domain routes decoupled (`/meus-eventos` organizer vs `/admin` Super Admin), and documentation/agent skills fully synchronized.  
**Test Suite:** 80 unit test files (446 tests) green (`npm test -- --watch=false`), production build green (`npm run build`).  
**Validation Gate:** Feature 22 tasks complete (20/20 tasks PASS).  
**Next step:** Execute Feature 23 (`23-linting-and-formatting-toolchain`).  

**Active branches:** `main` (production)  
**What exists:**
- **Feature 01 (`01-core-auth`)**: Open Google & Email/Password registration, verification banner with 60s cooldown, `authGuard`, `superAdminGuard`.
- **Feature 02 (`02-event-management`)**: Full event CRUD, multi-stage reminders (7d & 1d countdowns), critical change & cancellation notifications, status filter chips on dashboard.
- **Feature 03 (`03-guest-experience`)**: 1-touch verified Google RSVP, atomic RSVP cancellation with item release, dynamic split estimation on `PixCardComponent` with 1-click copy, celebratory confetti.
- **Feature 04 (`04-testing-strategy`)**: Mock fixtures in `src/app/testing/mocks/`, LocationService CEP resolution tests, ThemeService tests, Playwright configuration & smoke tests.
- **Feature 05 (`05-event-collaboration`)**: Scoped feeds (owned + collaborated events), email invitation auto-claim via Firestore `writeBatch`, collaborator invite dialog with MatChips, role badges on event cards, field protection for non-owners.
- **Feature 06 (`06-guest-profile`)**: `UserProfile` model, `/perfil` route protected by `authGuard`, profile editing with `ProfileInfoCardComponent`, attended events history.
- **Feature 07 (`07-family-roster`)**: `FamilyMember` model, `FamilyService` for `users/{uid}/family` subcollection, `FamilyRosterManagerComponent` on Profile page, `FamilySelectorComponent` for batch RSVP, `GuestService.batchConfirmRsvp` atomically creating primary + linked guest records, cascading cancellation.
- **Feature 08 (`08-codebase-refactoring-and-quality`)**: Domain separation (`auth`, `admin`, `organizer`), Angular Signals alignment (`output<T>()`, `toSignal()`), dead code pruning, SOLID model extraction, zero untyped `any`, MDC tokens, WCAG 2.1 AA keyboard a11y, 42 test suites / 296 unit tests passing with full validation report.
- **Feature 09 (`09-playwright-e2e-coverage`)**: 
  - **Infrastructure & POM Layer**: `playwright.config.ts`, `BasePage` (`e2e/pages/base.page.ts`), custom `test.fixture.ts` with Page Object dependency injection and `@axe-core/playwright` accessibility integration, Page Object Models (`HomePage`, `LoginPage`, `OrganizerDashboardPage`, `EventEditorPage`, `EventDetailPage`, `ProfilePage`), and migrated smoke test suite (`e2e/smoke.spec.ts`).
  - **Component Harnesses**: `RsvpDialogHarness` (`e2e/components/rsvp-dialog.harness.ts`), `ItemListHarness` (`e2e/components/item-list.harness.ts`), `SharePanelHarness` (`e2e/components/share-panel.harness.ts`), `FamilyRosterHarness` (`e2e/components/family-roster.harness.ts`), `ConfirmDialogHarness` (`e2e/components/confirm-dialog.harness.ts`).
  - **Template data-testid Instrumentation**: Standardized semantic `data-testid` attributes added across Home, Auth Login, Organizer Dashboard, Event Editor Stepper, Event Detail & RSVP Dialogs, and Profile & Family Roster views.
  - **E2E Spec Suites (88 tests passing on Chromium + Mobile Chrome)**:
    1. `01-home-theming.spec.ts`: Feed landmarks, light/dark theme persistence, seasonal overlay, WCAG 2.1 AA zero-violation audit.
    2. `02-auth-guards.spec.ts`: Unauthenticated route guards, form validations, Google sign-in, superadmin guard.
    3. `03-event-lifecycle.spec.ts`: Dashboard filter chips, ViaCEP auto-population, stepper validation, cancellation dialogs.
    4. `04-guest-rsvp.spec.ts`: Event header/countdown, 1-touch verified RSVP modal, Pix split estimation, wishlist item claim/unclaim toggles.
    5. `05-profile-family.spec.ts`: Profile management, family roster manager CRUD, batch family RSVP modal selection.
    6. `06-collaborator-rbac.spec.ts`: Share panel, collaborator email invitations, clipboard invite link copy.
    7. `07-visual-layout.spec.ts`: 7 milestone visual screenshot baselines, 48px touch targets, Nielsen Heuristics audit against `DESIGN.md`.
    8. `08-keyboard-a11y.spec.ts`: Keyboard focus cycling, modal focus trapping, Escape key dismissal with focus restoration.
    9. `09-multi-user-sync.spec.ts`: Dual-context Host and Guest simultaneous real-time sync without session crosstalk.
    10. `10-share-qr.spec.ts`: QR code canvas rendering dimensions, WhatsApp URI schema construction, clipboard copy feedback toast.
    11. `11-pwa-offline.spec.ts`: PWA offline caching resilience, form interactivity retention, seamless online recovery.
    12. `12-network-loading.spec.ts`: Throttled network latency handling, layout shift prevention, skeleton shimmer stability.
  - **CI/CD Automation**: `.github/workflows/e2e.yml` running on pull requests and pushes to `main` with npm/Playwright browser caching and failure artifact uploads.
- **Feature 10 (`10-e2e-organizer-create-event`)**: Spec written and gate-validated (29 EARS ACs, 0 errors). Covers atomic happy-path E2E tests for all major user journeys.
- **Feature 11 (`11-visual-screenshot-audit-and-layout-fixes`)**: Spec written and gate-validated (24 EARS ACs, 0 errors). Design written and approved (`design.md`) establishing Mobile-First SCSS architecture, responsive component layouts (Toolbar, Event Editor Stepper & Address Forms, Organizer Dashboard Filter Chips, Profile Family Roster Manager, Event Detail & Modals), WCAG 2.5.5 AA 48px touch targets, and `assertNoHorizontalOverflow` Playwright assertion helper.
- **Feature 21 (`21-css-design-token-and-component-architecture`)**: Full design token unification in `_semantic.scss` (org-export ready), spacing showcase section, complete purge of legacy purple palette and hardcoded hex values, 0 component-level `!important` occurrences, standardized mobile-first breakpoint mixins (`semantic.tablet`, `semantic.desktop`, `semantic.wide`), smart/dumb refactoring of dialogs and drawers, complete migration of all feature templates to closed `Org*` design system components, and deletion of obsolete component folders. Validated by independent Verifier sub-agent (32/32 ACs PASS, 3/3 sensor mutants killed).

---

## Decisions Log

### AD-001 — Standalone Components Only (No NgModules)
**Date:** Project inception  
**Decision:** All Angular components are Standalone. NgModules are forbidden.  
**Rationale:** Angular 21+ standard; reduces boilerplate, enables tree-shaking per component.  
**Status:** In force.

---

### AD-002 — OnPush Change Detection Everywhere
**Date:** Project inception  
**Decision:** ChangeDetectionStrategy.OnPush is mandatory on every component, with no exceptions.  
**Rationale:** Prevents runaway re-renders in a reactive Signals architecture; enforces immutable data flow.  
**Status:** In force.

---

### AD-003 — Angular Signals for State (RxJS Only for Firestore Streams)
**Date:** Project inception  
**Decision:** Local UI state uses signal(), computed(), effect(), input(), output(), model(). RxJS is permitted exclusively for Firestore Observable streams (converted via toSignal()) and async service operations.  
**Rationale:** Signals are the Angular 21+ primitive for reactivity; RxJS for UI state is over-engineered.  
**Status:** In force.

---

### AD-004 — Firebase Modular SDK Direct (No @angular/fire)
**Date:** Project inception  
**Decision:** Firebase is initialized manually in FirebaseService. @angular/fire is NOT used.  
**Rationale:** Dependency conflicts with Angular 21+. Direct SDK injection gives full control.  
**Status:** In force. All Firebase calls go through EventService, GuestService, ItemService, AuthService, UserService, FamilyService.

---

### AD-005 — Hardcoded Super Admin Whitelist
**Date:** Project inception (narrowed 2026-08-17)  
**Decision:** Super Admin emails (luiz.gmr.dev@gmail.com, jessica.calm.dev@gmail.com) are hardcoded in the frontend (AuthService.isSuperAdmin) and mirrored in firestore.rules for global system management privileges and analytics dashboard access only.  
**Rationale:** Super Admins oversee global health, metrics and administrative tools, not event creation gating.  
**Status:** In force (system management scope).

---

### AD-006 — Guest Session via localStorage Only (No Firestore for Anonymous Guests)
**Date:** Project inception (Superceded by AD-024)  
**Decision:** Guest identity is anchored in verified profile authentication (Google / verified account) rather than anonymous unverified phone numbers.  
**Status:** Superceded by AD-024.

---

### AD-007 — Tailwind CSS Removed; SCSS BEM + Angular Material Only
**Date:** Mid-development (refactor)  
**Decision:** Tailwind CSS was completely removed from the project. Styling is done exclusively via SCSS with BEM methodology + Angular Material components customized via CSS Custom Properties (--org-*, --mat-sys-*).  
**Rationale:** Tailwind caused class-bloat conflicts with Angular Material component encapsulation; SCSS BEM provides cleaner encapsulation aligned with the design system.  
**Impact:** Any doc referencing Tailwind is outdated. CSS variables are the single theming layer.  
**Status:** In force.

---

### AD-008 — Passwordless Admin Onboarding (Email Whitelist - Retired for Events)
**Date:** Mid-development (Superceded by AD-016 for general users)  
**Decision:** Whitelist in admins/{email} is retired for general event creation. It is retained solely if Super Admins need to grant system-level privileges to specific accounts.  
**Status:** Superceded by AD-016.

---

### AD-009 — Anonymous Firebase Auth for Guests (Superceded by AD-024)
**Date:** Project inception (Superceded by AD-024)  
**Decision:** Anonymous unverified guest RSVP is replaced by 1-touch verified identity (Google OAuth / verified profile) to prevent identity forgery (e.g. entering another person's contact number).  
**Status:** Superceded by AD-024.

---

### AD-010 — PWA with Angular NGSW
**Date:** Mid-development  
**Decision:** The app is a PWA using Angular Service Worker (@angular/pwa). Config in ngsw-config.json. Installable on iOS and Android.  
**Rationale:** Core product requirement; enables home screen install and offline resilience.  
**Status:** In force.

---

### AD-011 — Smart / Dumb Component Pattern
**Date:** Project inception  
**Decision:** Smart (Container) components handle service injection, Firebase calls, and state orchestration. Dumb (Presentational) components receive data via input() and emit via output() with zero business logic. Containers use the suffix .container.ts; presentational use .component.ts.  
**Status:** In force.

---

### AD-012 — Conventional Commits Mandatory
**Date:** Project inception  
**Decision:** All git commits must follow Conventional Commits format: feat(scope): message, fix(scope): message, chore(scope): message, etc.  
**Status:** In force.

---

### AD-013 — Retroactive SDD Applied (2026-08-17)
**Date:** 2026-08-17  
**Decision:** Spec-Driven Development (TLC Spec-Driven v3.3.0) adopted retroactively. All existing features receive retroactive specs. New features must go through Specify -> (Design) -> (Tasks) -> Execute before implementation.  
**Status:** In force.

---

### AD-014 — Home Page Shows All Events (Architectural Smell - Replaced)
**Date:** 2026-08-17 (retroactive, replaced by AD-017 & AD-020)  
**Decision:** The unauthenticated global event query on the home page is recognized as an architectural smell and replaced by a scoped user feed (owned + collaborated events).  
**Status:** Replaced by AD-017 & AD-020.

---

### AD-015 — No Automated Tests (Resolved)
**Date:** 2026-08-17 (Resolved in 04-testing-strategy)  
**Decision:** Automated test suite established with Vitest for unit & component API testing (199 tests) and Playwright for E2E smoke journeys.  
**Status:** Resolved.

---

### AD-016 — Open User Registration (Event Creation for Any Authenticated User)
**Date:** 2026-08-17  
**Decision:** Any Google-authenticated user can register and create events without Super Admin intervention. The admin whitelist (admins/{email}) is retired for event creation.  
**Rationale:** The original whitelist required manual human intervention. Self-serve event planning allows anyone to organize events immediately.  
**Status:** In force.

---

### AD-017 — Event-Centric Permissions (Single Owner + Collaborators)
**Date:** 2026-08-17  
**Decision:** Each event has exactly one owner (creator) and zero or more collaborators (invited by owner). The owner has full control (edit core details, cancel, delete). Collaborators can manage items and guest lists, but cannot edit core details (title, date, location, description, pixKey) or delete the event.  
**Rationale:** Simple, robust permission model that eliminates artificial organizational hierarchies.  
**Status:** In force. Specified and verified in 05-event-collaboration.

---

### AD-018 — Family/Group Concept Dropped
**Date:** 2026-08-17  
**Decision:** The shared family/group entity concept is dropped in favor of direct event-level collaboration (AD-017).  
**Rationale:** Avoids unnecessary data model complexity while satisfying the actual collaboration needs.  
**Status:** In force.

---

### AD-019 — Personal Family Roster
**Date:** 2026-08-17  
**Decision:** Users can manage a private list of family members in their personal account profile. In RSVP flows, a collapsible 'Adicionar Família' toggle allows one-click or selective batch confirmation for family members.  
**Rationale:** Drastically speeds up multi-person RSVPs without exposing family member data globally.  
**Status:** In force. Specified and verified in 07-family-roster.

---

### AD-020 — Route Renaming: /meus-eventos for Organizers and /admin for Super Admin Metrics
**Date:** 2026-08-17  
**Decision:** The organizer dashboard route is renamed from /admin to /meus-eventos. The /admin route is repurposed exclusively as a global platform analytics & system insights dashboard for Super Admins.  
**Rationale:** /admin misrepresents normal event organizers as system administrators; /meus-eventos reflects user-owned event feeds.  
**Status:** In force.

---

### AD-021 — Retirement of Manual Admin Management UI Drawer
**Date:** 2026-08-17  
**Decision:** The admin-form-drawer component and the "Novo Admin" button in the organizer UI are retired.  
**Rationale:** With open registration (AD-016), any authenticated user can organize events, making manual admin promotion obsolete.  
**Status:** In force.

---

### AD-022 — Collaborator Email Invitations with Auto-Claim on Login
**Date:** 2026-08-17  
**Decision:** Event owners invite collaborators by email (events/{id}/invitations/{email}). When the invited user signs in (Google or Email/Password), the app automatically associates their UID into collaborators: [uid] and removes the pending invitation.  
**Rationale:** 100% free, requires zero paid transactional email infrastructure, and integrates seamlessly with WhatsApp link sharing.  
**Status:** In force.

---

### AD-023 — Non-Blocking Email Verification for Email/Password Accounts
**Date:** 2026-08-17  
**Decision:** For users registering via Email/Password, Firebase Auth's native sendEmailVerification is triggered automatically. The user is immediately granted access to /meus-eventos with an informational top banner displaying verification status and a "Reenviar Confirmação" button with a 60s cooldown.  
**Rationale:** Eliminates sign-up drop-off while providing zero-cost email ownership verification.  
**Status:** In force.

---

### AD-024 — Verified RSVP Identity (1-Touch Google / Verified Profile)
**Date:** 2026-08-17  
**Decision:** Guest RSVP confirmations require verified identity (1-touch Google sign-in or authenticated profile) instead of unverified arbitrary phone number text inputs. If the Google account has an associated phone number, it is automatically reused as the contact.  
**Rationale:** Completely eliminates impersonation, fake numbers, and prank RSVPs from Day 1 at zero infrastructure cost.  
**Status:** In force.

---

### AD-025 — Smart Contribution / Split Estimation (Rachadinha com Meta)
**Date:** 2026-08-17  
**Decision:** Event organizers can optionally define an estimated total budget for the event (estimatedBudget). The public event page dynamically calculates and displays the suggested split per confirmed guest (estimatedBudget / guestCount) alongside the 1-click Pix copy button.  
**Rationale:** Empowers transparent group cost-sharing and increases financial contribution conversion.  
**Status:** In force.

---

### AD-026 — Automated Event Change, Cancellation & Countdown Notifications (7 Days & 1 Day)
**Date:** 2026-08-17 (Updated 2026-08-19)  
**Decision:** The notification system triggers automated notifications (Web Push via PWA / In-App) for: (1) Event cancellation or critical updates (date, time, address) to all confirmed guests; (2) 7-day reminder before the event; (3) 1-day (24 hours) countdown reminder before the event for both organizers and confirmed attendees.  
**Rationale:** Keeps attendees informed in real time and drastically minimizes event no-shows without requiring manual organizer messaging.  
**Status:** In force.

---

### AD-027 — Clean 3-Domain Separation (Organizer, Super Admin, Auth)
**Date:** 2026-08-20  
**Decision:** The frontend folder structure strictly separates three distinct domains: (1) `src/app/features/organizer/` for all event organizing and collaboration features (`/meus-eventos`) available to any authenticated user; (2) `src/app/features/admin/` exclusively for Super Admin platform metrics and governance (`/admin`); and (3) `src/app/features/auth/` for universal login/registration (`/login`).  
**Rationale:** Eliminates domain confusion between regular event planning and global platform administration, keeping components modular and cohesive.  
**Status:** In force.

---

### AD-028 — Angular Material 3 MDC Design Tokens (Eliminate !important Form Overrides)
**Date:** 2026-08-20  
**Decision:** Styling of form fields, inputs, dialogs, and surfaces must leverage official Material 3 / MDC design tokens (`--mdc-outlined-text-field-*`, `--mdc-dialog-*`, `--mat-menu-*`) and `--org-*` variables instead of manual CSS overrides using `!important`.  
**Rationale:** Conforms to official Angular Material 3 / MDC architecture standards, prevents style leakage, and ensures seamless theming.  
**Status:** In force.

---

### AD-029 — Comprehensive Playwright E2E Architecture & CI Automation
**Date:** 2026-08-20  
**Decision:** Automated regression testing leverages Playwright with Page Object Models (`e2e/pages/`), Component Test Harnesses (`e2e/components/`), deterministic mock authentication/Firestore injection (`e2e/helpers/`), `@axe-core/playwright` accessibility audits, and GitHub Actions CI (`.github/workflows/e2e.yml`) across Desktop Chromium and Mobile Chrome viewports.  
**Rationale:** Eliminates external Firebase rate-limiting flakes, guarantees 100% core flow coverage across devices, verifies WCAG 2.1 AA accessibility, and protects production releases automatically on pull requests.  
**Status:** In force. Specified and verified in 09-playwright-e2e-coverage.

---

### AD-030 — Atomic E2E Test Philosophy (One Test = One State = One Screenshot)
**Date:** 2026-08-20  
**Decision:** Every Playwright E2E test is atomic: it sets up its own state independently (mock session + navigation), asserts exactly one flow step or screen state, captures a full-page screenshot, and ends. No test chains multiple steps. To reach step N, that test's own `beforeEach` fills and advances all preceding steps independently, without relying on any prior test having run. Visual design-token assertions (`backdrop-filter`, `--org-primary`, `font-family`, ≥ 48 px touch targets) are included in each happy-path test.  
**Rationale:** Atomic tests are independently runnable, failures pinpoint the exact broken step, screenshots are granular enough to detect visual regressions per state (not just per page), and test suites remain maintainable as the app grows.  
**Status:** In force. Specified in 10-e2e-organizer-create-event.

---

### AD-031 — Mobile-First Responsive Layouts & Zero-Overflow Invariant
**Date:** 2026-08-21  
**Decision:** All UI layouts across Organiza AI (Home, Login, Dashboard, Event Editor Stepper, Event Detail, RSVP Modal, Profile, Family Roster) enforce a mobile-first responsive architecture: (1) single-column fluid stacking on mobile (`<600px`), expanding to balanced multi-column CSS grids on desktop (`>=600px`/`>=640px`); (2) horizontal scrolling containers (stepper headers, filter chipsets) explicitly declare `max-width: 100%`, `overflow-x: auto`, and `-webkit-overflow-scrolling: touch`; (3) touch targets for all primary buttons, chips, and toggles strictly maintain `>=48px` dimensions (WCAG 2.5.5 AA); (4) every page view is guarded by automated `assertNoHorizontalOverflow` Playwright assertions and visual screenshot baselines across both desktop and mobile viewports.  
**Rationale:** Eliminates accidental horizontal page blowout on narrow mobile devices, guarantees touch accessibility, and provides deterministic visual regression protection across form steps and glassmorphic surfaces.  
**Status:** In force. Specified and verified in 11-visual-screenshot-audit-and-layout-fixes.

---

### AD-032 — Internal UI Foundation, Seasonal Atmosphere Governance, and Visual Matrix
**Date:** 2026-08-21
**Decision:** Organiza AI will maintain a product-owned UI foundation at `src/app/shared/ui/` with a public API for semantic tokens, single-ring glassmorphic surfaces (`OrgSurface`), native Material form-field directives (`OrgFormField`, `OrgFieldLabel`), actions/chips/icons (`OrgButton`, `OrgIconButton`, `OrgChip`, `OrgIcon`), feedback (`FeedbackService`, `FeedbackSnackbar`, `OrgBanner`), and workflow drawers (`AppDrawerService`, `NavigationDrawer`). It will not be extracted into a distributable package until a second application proves the API. Shared form and surface styling must use component-owned custom properties and official Angular Material MDC tokens; global internal-selector overrides and competing borders are forbidden. Seasonal theme classes (`theme-junina`, `theme-natal`, `theme-pascoa`, `theme-ano-novo`) remain on `html` to theme primary colors, celebration gradients, and festive overlays while maintaining solid surface glassmorphism, readable contrast, and standard feedback states (success green, error red). Every registered visual scenario runs as a deterministic desktop/mobile × light/dark matrix across semantic anchors in the actual application scroll owner.
**Rationale:** Preserves the festive celebration identity of Organiza AI while eliminating duplicate borders, segmented input outlines, theme leakage into feedback components, and incomplete screenshot coverage.
**Status:** In force. Specified in 14-design-system-foundation-and-experience-quality.

---

### AD-033 — Preserve the Original Pink-Orange-Yellow Brand Direction
**Date:** 2026-08-21
**Decision:** The UI foundation uses the established pink (`#ff4d94`), orange (`#ff8c42`), and yellow (`#ffc837`) product palette as its canonical semantic-brand values. Light and dark themes adapt surfaces and contrast, not the brand identity. A technical fixture cannot produce an artifact in the public product screenshot baseline directory. On mobile, the event editor exposes a compact active-step summary instead of horizontally scrolling truncated step labels.
**Rationale:** The purple semantic override replaced the existing visual identity, hid theme evidence behind non-product artifacts, and left the mobile stepper unreadable. A single token source and real-screen light/dark evidence prevent recurrence.
**Status:** In force. Supersedes the purple-to-orange visual direction in Feature 14.

---

### AD-034 — Surface as Directive (`[orgSurface]`), Not Component
**Date:** 2026-08-21  
**Decision:** `OrgSurface` is implemented as an attribute directive (`[orgSurface]`) rather than a wrapper component (`<org-surface>`). The directive can be applied directly to any HTML or Angular Material element (e.g., `<div [orgSurface]="'card'">`, `<mat-card [orgSurface]="'panel'">`, `<section orgSurface>`). The directive supports variants (`'card'`, `'panel'`, `'hero'`, `'drawer'`, `'dialog'`), defaulting to `'card'`. Cross-project theming is exposed via standard CSS custom properties (`--org-gradient-border`, `--org-glass-bg`, `--org-glass-blur`, `--org-glass-shadow`, `--org-glass-ring-width`, `--org-radius-lg`). The existing `OrgSurfaceComponent` is migrated to `OrgSurfaceDirective`.  
**Rationale:** Eliminates redundant DOM container wrapper elements, preserves semantic HTML elements (`<section>`, `<article>`, `<dialog>`, `<mat-card>`), avoids style inheritance issues, and provides seamless glassmorphic styling via host class bindings.  
**Status:** In force.

---

### AD-035 — Total Removal of Legacy Utility and Glass Classes
**Date:** 2026-08-21  
**Decision:** Legacy style classes (`.glass-card`, `.org-glass`, `.org-legacy-form-field`, `.glass-input`) and leftover utility classes (`.h-4`, `.h-5`, `.h-6`, `.h-10`, `.h-14`, `.h-28`, `.w-10`, `.w-16`, `.w-20`, `.w-24`, `.w-32`, `.w-40`, `.w-48`, `.w-full`, `.rounded-full`, `.items-center`, `.mb-2`, `.mt-2`, `.flex`, `.gap-2`) are completely removed from `src/styles.scss` and feature stylesheets without maintaining backward-compatibility aliases. All views must exclusively use canonical primitives from `src/app/shared/ui/`.  
**Rationale:** Deprecation aliases perpetuate ambiguity and encourage inconsistent styling patterns. Complete removal enforces a single canonical source of truth for all layout and surface styling across the entire codebase.  
**Status:** In force.

---

### AD-036 — Standardized Mobile-First Breakpoints
**Date:** 2026-08-21  
**Decision:** All responsive styling across the application strictly adheres to three standardized mobile-first breakpoints: Small/Tablet (`--org-bp-sm: 600px`), Medium/Desktop (`--org-bp-md: 900px`), and Large/Wide (`--org-bp-lg: 1200px`). All SCSS media queries must exclusively use these canonical thresholds (`@media (min-width: 600px)`, `@media (min-width: 900px)`, `@media (min-width: 1200px)`). Arbitrary thresholds (such as 640px, 768px, 960px, 1024px) are prohibited.  
**Rationale:** Eliminates fragmented, inconsistent responsive behavior across pages and establishes a clean, predictable layout grid hierarchy.  
**Status:** In force.

---

### AD-037 — Design System Showcase Route (`/design-system`)
**Date:** 2026-08-21  
**Decision:** A dedicated visual showcase page is introduced at route `/design-system`, protected by `superAdminGuard` and lazy-loaded via `app.routes.ts`. The showcase renders an interactive, living catalog of all 14 design system primitive and token categories in both Light and Dark themes, complete with live component previews, interactive controls, copyable code snippets, and API property/event tables.  
**Rationale:** Provides maintainers and super administrators with an interactive visual playground and living specification to audit, test, and govern all UI foundation primitives, preventing token drift and visual regressions.  
**Status:** In force.

---

### AD-038 — Isolated Design-System Validation Before Product Migration
**Date:** 2026-08-22
**Decision:** The design-system showcase is the sole surface for validating the new warm editorial direction inspired by the supplied Convívio reference: Fraunces display typography, Inter body typography, coral/amber invitation gradients, porcelain canvases, plum depth, and restrained glass. Existing product components, their existing token contract, and their rendered screens are not migrated during this validation phase. The approved migration direction is component-first: closed Angular components with explicit inputs and projected slots replace styling directives for new product primitives; existing directives remain unchanged until a dedicated migration is approved.
**Rationale:** Separating visual approval from application migration avoids visual drift and lets the design be evaluated without changing a working product. Component APIs provide a constrained, discoverable contract that prevents arbitrary application-level styling.
**Status:** In force for Feature 16. Supersedes AD-033 only for the isolated showcase and future approved migration; AD-033 remains in force for existing product screens.

---

### AD-039 — Component-First UI Source of Truth and Consumer Migration
**Date:** 2026-08-24
**Decision:** Public UI authoring uses standalone `Org*` components only. Shared semantic tokens and the owning component stylesheet are the exclusive owners of reusable component color, border, radius, focus, hover, density, glass, atmosphere, and Angular Material token rules. Feature stylesheets may own page layout and domain content only. The application will migrate every current consumer of the priority UI families to the component API, then remove the legacy surface, action, chip, and form styling directives and their public exports. A deterministic contract check will reject legacy UI directive consumers and feature-owned Material component appearance rules outside documented showcase fixtures.
**Rationale:** A directive plus per-feature SCSS contract creates multiple competing sources of truth. Closed components make behavior discoverable, let a visual fix propagate consistently, and prevent AI-assisted feature work from inventing another visual system.
**Status:** In force. Supersedes AD-034 and expands AD-038 from showcase validation to application migration.

---

### AD-040 — Unified Design Token Architecture in `_semantic.scss`
**Date:** 2026-08-31  
**Decision:** All `--org-*` CSS custom properties (brand & status colors, glassmorphism, standardized spacing scale `--org-space-*`, border radius `--org-radius-*`, and typography), seasonal theme classes, and breakpoint mixins are exclusively defined in `src/app/shared/ui/tokens/_semantic.scss`. `src/styles.scss` must delegate 100% of token declarations to `_semantic.scss` via `@include semantic.apply;` with zero duplicate `:root` definitions.  
**Rationale:** Eliminates silent divergence between globals and component tokens, and prepares `@shared/ui` tokens for modular, standalone export across the organization.  
**Status:** In force.

---

### AD-041 — Zero `!important` and Ubiquitous Design System Migration
**Date:** 2026-08-31  
**Decision:** All feature templates across the application must exclusively consume `Org*` components from `@shared/ui` (e.g. `<org-surface>`, `<org-button>`, `<org-icon-button>`, `<org-text-field>`, `<org-chip>`). Raw Angular Material tags (`<mat-card>`, `<button mat-button>`, `<mat-form-field>`) in feature templates are prohibited. Component stylesheets must contain zero `!important` flags and zero hardcoded arbitrary hex values, managing styling purely through BEM classes and `--org-*` CSS custom properties.  
**Rationale:** Guarantees visual consistency, clean specificity without specificity wars, and complete encapsulation matching the design system contracts.  
**Status:** In force.

---

### AD-042 — Comprehensive Code Quality Toolchain & Developer Style Guide
**Date:** 2026-08-31  
**Decision:** The project adopts a 4-tier automated code quality enforcement toolchain: (1) ESLint 9+ Flat Config enforcing TypeScript strict typing (`no-explicit-any: error` in prod), Angular Standalone/OnPush, template a11y, and Playwright E2E standards; (2) Stylelint enforcing SCSS BEM conventions, zero component `!important`, and `--org-*` token usage via `color-no-hex`; (3) Husky pre-commit (lint-staged) and commit-msg (commitlint Conventional Commits); (4) Fail-fast CI quality gate (`quality.yml`) executing ahead of E2E; and (5) Project-local skills in `.agents/skills/` (`style-guide`, `creating-pages`, `creating-components`, `design-system-usage`) mirrored to `docs/STYLE_GUIDE.md`.  
**Rationale:** Eliminates regressions across human and AI contributions, provides deterministic pre-commit correction, saves CI compute resources, and provides actionable smart/dumb and design system playbooks.  
**Status:** In force. Specified in 23-linting-and-formatting-toolchain.


