# Guest Profile & Pre-Registration Specification

## Problem Statement

Currently, anonymous guest sessions reside solely in localStorage. If a guest uses multiple devices or clears browsing data, their RSVP identity and attendance history are lost. Organiza AI will provide automatic lightweight pre-registration upon RSVP and allow guests to optionally claim their phone/identity and upgrade to a full Google account.

## Goals

- [ ] Automatically save guest pre-registration data (name, phone) to Firestore on RSVP
- [ ] Allow guests to optionally upgrade from an anonymous session to a verified Google account
- [ ] Verify phone ownership via Firebase Phone Auth (free tier reCAPTCHA) only when claiming an account
- [ ] Merge pre-registration event history cleanly into the full user profile upon upgrade
- [ ] Default to Google account profile name upon upgrade, allowing post-upgrade editing

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| Paid SMS verification services | Firebase Phone Auth free reCAPTCHA tier is sufficient |
| Mandatory account registration for guests | RSVP must remain frictionless and anonymous-friendly |
| Complex GDPR/LGPD data export/deletion portals | Deferred beyond initial MVP release |
| Social feeds across guest profiles | Out of scope for event coordination |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| Automatic pre-registration on RSVP | Write to guest_profiles/{phone} automatically | Zero friction, builds identity graph transparently | y |
| Phone verification on upgrade only | Firebase Phone Auth (free tier) during account claim | Avoids SMS costs while preventing account hijacking | y |
| Google name wins on upgrade | Set user profile name to Google displayName initially | Standard OAuth convention; user can edit afterwards | y |
| Multiple guests sharing phone | Last-write-wins until phone is officially claimed via SMS | Simple MVP resolution for family members sharing numbers | y |

**Open questions:** none - all resolved or logged above (required before the spec is confirmed).

---

## User Stories

### P1: Guest Local Session Management ⭐ MVP

**User Story**: As a guest, I want my RSVP info remembered on my device so that I don't have to re-type my name for every item I claim.

**Why P1**: Immediate usability in the public event view.

**Acceptance Criteria**:

1. WHEN guest submits the RSVP form THEN system SHALL store { name, phone } in localStorage via GuestSessionService
2. WHILE session data exists in localStorage THEN system SHALL automatically populate identity for item claiming
3. WHEN guest clicks "Cancelar Presença" THEN system SHALL clear the localStorage session

**Independent Test**: Complete RSVP, reload page, verify that item claiming does not prompt for name again.

---

### P2: Automatic Guest Pre-Registration on RSVP

**User Story**: As the system, I want to record guest contact details in Firestore upon RSVP so that guest attendance history is tracked.

**Why P2**: Prepares the foundation for account upgrades and repeat guest recognition.

**Acceptance Criteria**:

1. WHEN any guest submits an RSVP with a valid phone number THEN system SHALL write or update a document in guest_profiles/{phone} containing name, phone, and updatedAt
2. WHEN an RSVP is confirmed THEN system SHALL append the eventId to the rsvpEvents array in guest_profiles/{phone} using arrayUnion
3. IF the Firestore pre-registration write fails due to network error THEN system SHALL NOT fail the core RSVP flow

**Independent Test**: RSVP as an anonymous guest and check Firestore for the creation of .

---

### P2: Account Upgrade with Google & Phone Claim

**User Story**: As a repeat guest, I want to upgrade my anonymous participation to a full Google account so that I can manage all events I attend in one place.

**Why P2**: Bridges the gap between passive guest and active platform user.

**Acceptance Criteria**:

1. WHEN a pre-registered guest initiates account upgrade THEN system SHALL prompt for Google sign-in
2. WHEN Google sign-in completes THEN system SHALL trigger Firebase Phone Auth reCAPTCHA to verify the pre-registered phone number
3. WHEN phone verification succeeds THEN system SHALL merge the guest_profiles/{phone} history into users/{uid} and set name to Google displayName
4. WHEN account upgrade completes THEN system SHALL mark the guest profile as claimed: true

**Independent Test**: Simulate upgrade flow from an anonymous guest session, verify that users/{uid} inherits all attended event IDs.

---

### P3: Guest Profile View

**User Story**: As an authenticated user, I want to view my profile page so that I can see the list of events I have attended or organized.

**Why P3**: Provides long-term value and retention for registered users.

**Acceptance Criteria**:

1. WHEN user navigates to /perfil THEN system SHALL display user name, email, phone, and a list of RSVP'd events
2. WHEN user edits their profile name THEN system SHALL update users/{uid} in Firestore
3. IF user is not authenticated THEN system SHALL redirect /perfil to /login

**Independent Test**: Open /perfil as a logged-in user and verify that past confirmed events are listed.

---

## Edge Cases

- IF a user cancels an RSVP after upgrading THEN system SHALL remove the event reference from their active attendance list
- IF two unverified guests share a phone number THEN system SHALL update the name on the latest RSVP (last-write-wins) until claimed
- IF Google OAuth succeeds but phone verification is cancelled THEN system SHALL keep the Google account but defer history merging

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| GPROF-01 | P1: Local Session Storage | - | Verified (built) |
| GPROF-02 | P1: Session Clear on Cancel | - | Verified (built) |
| GPROF-03 | P2: Auto Pre-Registration | Design | Pending |
| GPROF-04 | P2: Event History Union | Design | Pending |
| GPROF-05 | P2: Non-blocking Pre-reg | Design | Pending |
| GPROF-06 | P2: Google Account Upgrade | Design | Pending |
| GPROF-07 | P2: Phone Verification Claim | Design | Pending |
| GPROF-08 | P3: Profile Page Dashboard | Design | Pending |

**Coverage:** 8 total, 2 verified built, 6 pending future phases.

---

## Success Criteria

- [ ] 100% of successful RSVPs create or update a record in guest_profiles/{phone}
- [ ] Upgrading to a Google account links previous anonymous RSVPs to the new user UID
- [ ] Pre-registration background failures never block or delay the immediate guest confirmation experience
