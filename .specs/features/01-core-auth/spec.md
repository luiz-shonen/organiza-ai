# Core Auth & RBAC Specification

## Problem Statement

Organiza AI needs to provide self-serve access for event organizers and zero-friction, verified identity access for guests. Any user can sign in via Google to create and organize events without manual whitelist approval (AD-016). Users registering via Email/Password receive native Firebase email verification without blocking immediate use (AD-023). Guests confirm attendance with 1-touch verified Google identity (AD-024). Super Admins retain platform analytics privileges on /admin (AD-005, AD-020).

## Goals

- [ ] Allow any user to authenticate via Google OAuth (1-click) or Email/Password and create events immediately
- [ ] Provide non-blocking email verification for Email/Password accounts with a resend banner (AD-023)
- [ ] Protect organizer routes (/meus-eventos) and super admin routes (/admin) with authGuard
- [ ] Allow guests to confirm RSVP with verified Google identity or verified account (AD-024)
- [ ] Distinguish Super Admins to gate global platform analytics and system monitoring tools (/admin)
- [ ] Allow users to sign out cleanly on shared devices

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| Manual Super Admin approval for event creation | Dropped in favor of open self-service registration (AD-016) |
| Manual UI drawer for admin management | Retired in favor of open registration (AD-021) |
| Paid SMS-based phone verification | Replaced by 1-touch Google verified identity (AD-024) |
| Two-factor authentication (2FA) | Unnecessary complexity for MVP |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| Super Admin emails remain hardcoded | luiz.gmr.dev@gmail.com, jessica.calm.dev@gmail.com in AuthService & rules | System oversight & analytics only (AD-005) | y |
| Open registration for all Google users | Any valid Google account can create events | Eliminates manual onboarding friction (AD-016) | y |
| Email/password registration includes verification | sendEmailVerification triggered automatically | Free native Firebase verification without blocking (AD-023) | y |
| Route /meus-eventos represents organizer dashboard | Renamed from /admin to /meus-eventos | Scoped user-owned event feed (AD-020) | y |
| Route /admin represents Super Admin analytics | Restricted to isSuperAdmin() | System health & usage metrics (AD-020) | y |

**Open questions:** none - all resolved or logged above (required before the spec is confirmed).

---

## User Stories

### P1: Organizer Sign-in via Google (Open Registration) ⭐ MVP

**User Story**: As an Event Organizer, I want to sign in with my Google account so that I can immediately create and manage my events in /meus-eventos.

**Why P1**: Core entry point for any user wanting to organize an event.

**Acceptance Criteria**:

1. WHEN user clicks "Entrar com Google" on /login THEN system SHALL initiate Firebase Google OAuth authentication
2. WHEN Google OAuth completes successfully THEN system SHALL redirect the user to the organizer dashboard (/meus-eventos)
3. WHEN a new user signs in for the first time THEN system SHALL create or update the user record in users/{uid}
4. IF Google OAuth is cancelled or fails THEN system SHALL return to the login screen with an appropriate notification

**Independent Test**: Sign in with a new Google account and verify immediate access to /meus-eventos.

---

### P1: Email & Password Registration with Verification Banner ⭐ MVP

**User Story**: As a user who prefers email/password, I want to create an account and immediately access the app while receiving a verification email.

**Why P1**: Fallback authentication method for users without Google accounts.

**Acceptance Criteria**:

1. WHEN user registers with email and password THEN system SHALL create the account and call sendEmailVerification
2. WHEN registration completes THEN system SHALL log the user in and redirect to /meus-eventos
3. WHILE user email is unverified (emailVerified is false) THEN system SHALL render an informational verification banner on /meus-eventos with a "Reenviar Confirmação" button
4. WHEN user clicks "Reenviar Confirmação" THEN system SHALL dispatch a new verification email and activate a 60-second cooldown timer on the button

**Independent Test**: Register with a new email/password; verify immediate redirect to /meus-eventos and presence of the verification banner.

---

### P1: Route Protection via authGuard ⭐ MVP

**User Story**: As the system, I want to protect all organizer and admin routes so that unauthenticated visitors cannot access private management features.

**Why P1**: Essential access boundary protection.

**Acceptance Criteria**:

1. WHILE user is NOT authenticated, WHEN user attempts to navigate to any /meus-eventos/* or /admin route THEN system SHALL redirect to /login
2. WHEN an authenticated user accesses /meus-eventos THEN system SHALL permit route activation and render the container
3. IF an authenticated user who is NOT a super admin attempts to access /admin THEN system SHALL redirect to /meus-eventos
4. The system SHALL apply authGuard to all organizer and admin routes via canActivate

**Independent Test**: Attempt direct navigation to /meus-eventos in a private tab and verify redirect to /login.

---

### P1: Super Admin System Role ⭐ MVP

**User Story**: As a Super Admin, I want system-level administrative privileges and analytics access on /admin so that I can oversee application health.

**Why P1**: Enables operational governance by product owners.

**Acceptance Criteria**:

1. WHEN authenticated user email matches the hardcoded Super Admin list THEN system SHALL set isSuperAdmin signal to true
2. WHILE isSuperAdmin is true THEN system SHALL display global analytics link to /admin in the navigation
3. WHILE isSuperAdmin is false THEN system SHALL hide all system management and analytics menus

**Independent Test**: Log in with a Super Admin email and verify system analytics controls appear.

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
- IF an unverified email user resets their password THEN system SHALL send the password reset email via Firebase Auth
- WHEN an authenticated organizer opens /evento/:id THEN system SHALL preserve their authenticated identity for instant 1-touch RSVP

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| AUTH-01 | P1: Google Login (Open) | Phase 2 | Verified (built) |
| AUTH-02 | P1: User Profile Record | Phase 1 | Verified (built) |
| AUTH-03 | P1: Email/Password + Banner | Phase 2, 3 | Verified (built) |
| AUTH-04 | P1: authGuard Protection | Phase 1, 3 | Verified (built) |
| AUTH-05 | P1: Super Admin Analytics Role | Phase 1, 3 | Verified (built) |
| AUTH-06 | P2: User Logout | Phase 2 | Verified (built) |

**Coverage:** 6 total, 6 verified built, 0 pending.

---

## Success Criteria

- [ ] Any user with a Google account can sign in and access /meus-eventos in < 3 seconds
- [ ] Email/password registrations log in immediately and display the verification banner with functional resend cooldown
- [ ] Unauthenticated access to /meus-eventos redirects to /login in 100% of test attempts
- [ ] Non-super-admins attempting to access /admin are redirected to /meus-eventos

