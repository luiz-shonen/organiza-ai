# Organiza AI — Project Memory

## Handoff Snapshot

**Last updated:** 2026-08-17  
**State:** Spec phase — retroactive SDD applied to existing MVP & new architecture pivot defined.  
**Next step:** User review of updated feature specs under .specs/features/. Proceed to Design and Tasks for 04-testing-strategy and new features.

**Active branches:** main (production; PWA deployed to Firebase Hosting)  
**What exists:** Auth, Event CRUD, Guest RSVP, Item claiming, Admin dashboard, Export, PWA, Dark mode, Seasonal themes.  
**Open gaps:** Zero test coverage (critical); Open registration & event collaborator model to implement; Personal family roster to design.

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
**Status:** In force. All Firebase calls go through EventService, GuestService, ItemService, AuthService, UserService.

---

### AD-005 — Hardcoded Super Admin Whitelist
**Date:** Project inception (narrowed 2026-08-17)  
**Decision:** Super Admin emails (luiz.gmr.dev@gmail.com, jessica.calm.dev@gmail.com) are hardcoded in the frontend (AuthService.isSuperAdmin) and mirrored in firestore.rules for global system management privileges only.  
**Rationale:** Super Admins oversee global health and administrative tools, not event creation gating.  
**Status:** In force (system management scope).

---

### AD-006 — Guest Session via localStorage Only (No Firestore for Anonymous Guests)
**Date:** Project inception  
**Decision:** Guest identity (name + phone) is stored in localStorage via GuestSessionService. Firestore users collection is NOT written for anonymous guests. The upsertProfile call only executes when !user.isAnonymous.  
**Rationale:** Privacy-first for anonymous users; avoids polluting the users collection with unverified records.  
**Status:** In force. Evolution to automatic guest pre-registration specified in 06-guest-profile (P2).

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

### AD-009 — Anonymous Firebase Auth for Guests
**Date:** Project inception  
**Decision:** When a guest opens the event detail page, AuthService.loginAnonymously() is called automatically. This gives the guest a Firebase UID for Firestore write rules, without requiring account creation.  
**Rationale:** Reduces friction to zero for RSVPs. Firestore rules allow anonymous writes to events/{id}/guests and events/{id}/items (claim only).  
**Status:** In force.

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
**Date:** 2026-08-17 (retroactive, replaced by AD-017)  
**Decision:** The unauthenticated global event query on the home page is recognized as an architectural smell and replaced by a scoped user feed (owned + collaborated events).  
**Status:** Replaced by AD-017 & spec 05-event-collaboration.

---

### AD-015 — No Automated Tests (Critical Gap)
**Date:** 2026-08-17 (documented)  
**Decision:** The project currently has zero automated tests. This is a critical gap. Testing strategy (unit + Playwright e2e) specified in 04-testing-strategy.  
**Status:** Gap — execution pending.

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
**Status:** In force. Specified in 05-event-collaboration.

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
**Status:** Specified in 07-family-roster.
