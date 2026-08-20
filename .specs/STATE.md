# Organiza AI — Project Memory

## Handoff Snapshot

**Last updated:** 2026-08-20  
**State:** Feature 08 (`08-playwright-e2e-coverage`) Tasks Breakdown Completed & Validated (34 tasks across 7 phases) — Playwright Infrastructure, Page Objects, Component Harnesses, Template data-testid Instrumentation, Core Journey Specs, Visual Layout & A11y Specs, Advanced Scenarios (Concurrency, Share, PWA, Throttling), and GitHub Actions CI Workflow.  
**Test Suite:** 29 test files, 199 unit tests defined, production build green (`npm run build`).  
**Validation Gate:** `validate_spec.py` (0 errors, 0 warnings) and `validate_tasks.py` (0 errors) passed.  
**Next step:** Execute `/tlc-spec-driven implement` to begin sequential task implementation (or batch sub-agent execution).  

**Active branches:** `main` (production)  
**What exists:**
- **Feature 01 (`01-core-auth`)**: Open Google & Email/Password registration, verification banner with 60s cooldown, `authGuard`, `superAdminGuard`.
- **Feature 02 (`02-event-management`)**: Full event CRUD, multi-stage reminders (7d & 1d countdowns), critical change & cancellation notifications, status filter chips on dashboard.
- **Feature 03 (`03-guest-experience`)**: 1-touch verified Google RSVP, atomic RSVP cancellation with item release, dynamic split estimation on `PixCardComponent` with 1-click copy, celebratory confetti.
- **Feature 04 (`04-testing-strategy`)**: Mock fixtures in `src/app/testing/mocks/`, LocationService CEP resolution tests, ThemeService tests, Playwright configuration & smoke tests.
- **Feature 05 (`05-event-collaboration`)**: Scoped feeds (owned + collaborated events), email invitation auto-claim via Firestore `writeBatch`, collaborator invite dialog with MatChips, role badges on event cards, field protection for non-owners.
- **Feature 06 (`06-guest-profile`)**: `UserProfile` model, `/perfil` route protected by `authGuard`, profile editing with `ProfileInfoCardComponent`, attended events history.
- **Feature 07 (`07-family-roster`)**: `FamilyMember` model, `FamilyService` for `users/{uid}/family` subcollection, `FamilyRosterManagerComponent` on Profile page, `FamilySelectorComponent` for batch RSVP, `GuestService.batchConfirmRsvp` atomically creating primary + linked guest records, cascading cancellation.
- **Feature 08 (`08-playwright-e2e-coverage`)**: Spec complete for full Playwright E2E coverage across all flows, GitHub Actions CI pipeline, visual layout inspection against `DESIGN.md`, real-time multi-user concurrency, and PWA offline resilience.

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
