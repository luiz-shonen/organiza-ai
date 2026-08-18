# Core Auth & RBAC Specification

## Problem Statement

Organiza AI needs to provide self-serve access for event organizers and zero-friction access for guests. Any user can sign in via Google to create and organize events without manual whitelist approval (AD-016). Guests access public event pages with seamless anonymous authentication. Super Admins retain global administrative privileges.

## Goals

- [ ] Allow any user to authenticate via Google OAuth and create events immediately
- [ ] Protect organizer dashboard routes with an authGuard for authenticated users
- [ ] Automatically start an anonymous session for guests opening /evento/:id
- [ ] Distinguish Super Admins to gate global system management tools
- [ ] Allow users to sign out cleanly on shared devices

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| Manual Super Admin approval for event creation | Dropped in favor of open self-service registration (AD-016) |
| Social login for guests | Guests participate anonymously without accounts (AD-006) |
| Two-factor authentication (2FA) | Unnecessary complexity for MVP |
| Custom Email/Password registration | Google OAuth is the primary IdP (AD-008) |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| Super Admin emails remain hardcoded | luiz.gmr.dev@gmail.com, jessica.calm.dev@gmail.com in AuthService & rules | System oversight & maintenance only (AD-005) | y |
| Open registration for all Google users | Any valid Google account can create events | Eliminates manual onboarding friction (AD-016) | y |
| Anonymous guest auth is automatic | Silent background login on /evento/:id | Zero barrier to entry for RSVPs (AD-009) | y |
| Route /admin represents organizer dashboard | Retained for now, candidate for rename to /dashboard in future design | Existing route convention | y |

**Open questions:** none - all resolved or logged above (required before the spec is confirmed).

---

## User Stories

### P1: Organizer Sign-in via Google (Open Registration) ⭐ MVP

**User Story**: As an Event Organizer, I want to sign in with my Google account so that I can immediately create and manage my events.

**Why P1**: Core entry point for any user wanting to organize an event.

**Acceptance Criteria**:

1. WHEN user clicks "Entrar com Google" on /login THEN system SHALL initiate Firebase Google OAuth authentication
2. WHEN Google OAuth completes successfully THEN system SHALL redirect the user to the organizer dashboard (/admin)
3. WHEN a new user signs in for the first time THEN system SHALL create or update the user record in users/{uid}
4. IF Google OAuth is cancelled or fails THEN system SHALL return to the login screen with an appropriate notification

**Independent Test**: Sign in with a new Google account and verify immediate access to the dashboard.

---

### P1: Organizer Route Protection via authGuard ⭐ MVP

**User Story**: As the system, I want to protect all organizer dashboard routes so that unauthenticated visitors cannot access private management features.

**Why P1**: Essential access boundary protection.

**Acceptance Criteria**:

1. WHILE user is NOT authenticated, WHEN user attempts to navigate to any /admin/* route THEN system SHALL redirect to /login
2. WHEN an authenticated user accesses /admin/* THEN system SHALL permit route activation and render the container
3. The system SHALL apply authGuard to all organizer routes via canActivate
4. WHEN user session expires THEN system SHALL redirect to /login preserving the target URL in query parameters

**Independent Test**: Attempt direct navigation to /admin in a private tab and verify redirect to /login.

---

### P1: Automatic Anonymous Guest Session ⭐ MVP

**User Story**: As a guest, I want to view event details and RSVP without logging in so that I can confirm attendance with zero friction.

**Why P1**: Zero-friction guest participation is the fundamental product differentiator.

**Acceptance Criteria**:

1. WHEN guest navigates to /evento/:id THEN system SHALL call loginAnonymously() in the background
2. WHEN loginAnonymously() succeeds THEN system SHALL assign an anonymous Firebase UID for Firestore write permissions
3. IF loginAnonymously() encounters a network failure THEN system SHALL render the event in read-only mode
4. The system SHALL NOT show login modals or barriers to guests on /evento/:id

**Independent Test**: Open /evento/:id in incognito mode and confirm anonymous session creation without UI popups.

---

### P1: Super Admin System Role ⭐ MVP

**User Story**: As a Super Admin, I want system-level administrative privileges so that I can oversee application health.

**Why P1**: Enables operational governance by product owners.

**Acceptance Criteria**:

1. WHEN authenticated user email matches the hardcoded Super Admin list THEN system SHALL set isSuperAdmin signal to true
2. WHILE isSuperAdmin is true THEN system SHALL display global administrative tools in the navigation
3. WHILE isSuperAdmin is false THEN system SHALL hide all system management menus

**Independent Test**: Log in with a Super Admin email and verify system controls appear.

---

### P2: User Sign Out

**User Story**: As an Organizer, I want to log out so that my session is cleared from shared devices.

**Why P2**: Standard session hygiene.

**Acceptance Criteria**:

1. WHEN user clicks "Sair" THEN system SHALL call authService.logout() terminating the Firebase session
2. WHEN logout succeeds THEN system SHALL redirect the user to /login
3. IF logout fails THEN system SHALL display an error snackbar and retain the current view

**Independent Test**: Click logout from the user menu and verify redirect to /login.

---

## Edge Cases

- IF Firebase Auth service is unreachable THEN system SHALL display an error message on the login screen
- IF guest has disabled storage/cookies THEN system SHALL allow event viewing but explain that RSVP requires local storage
- WHEN an authenticated organizer opens /evento/:id THEN system SHALL allow public viewing without downgrading their session

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| AUTH-01 | P1: Google Login (Open) | - | Verified (built) |
| AUTH-02 | P1: User Profile Record | - | Verified (built) |
| AUTH-03 | P1: authGuard Protection | - | Verified (built) |
| AUTH-04 | P1: Anonymous Guest Auth | - | Verified (built) |
| AUTH-05 | P1: Anonymous Fallback | - | Verified (built) |
| AUTH-06 | P1: Super Admin Role | - | Verified (built) |
| AUTH-07 | P2: User Logout | - | Verified (built) |

**Coverage:** 7 total, 0 mapped to tasks (retroactive), 0 unmapped.

---

## Success Criteria

- [ ] Any user with a Google account can sign in and access the organizer dashboard in < 3 seconds
- [ ] Unauthenticated access to /admin redirects to /login in 100% of test attempts
- [ ] Public event links initialize an anonymous session transparently without user prompts
