# Event Collaboration Specification

## Problem Statement

Organiza AI needs a clear event-centric ownership and collaboration model. The home page currently queries all events globally. In the new model (AD-017), each event has exactly one owner (the creator) and can have multiple collaborators explicitly invited by the owner. The home/dashboard feed displays only events the user owns or collaborates on.

## Goals

- [ ] Ensure every event created has a single owner (createdBy: string)
- [ ] Allow event owners to invite collaborators by email (collaborators: string[])
- [ ] Enable collaborators to add/remove items and manage guest-level details
- [ ] Prevent collaborators from modifying core event details (title, date, location, pixKey) or deleting the event
- [ ] Filter the user event feed to show owned and collaborated events only

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| Shared Organization/Family entities | Dropped in favor of direct event-level collaboration (AD-018) |
| Ownership transfer | Not needed for MVP |
| Collaborator inviting other collaborators | Only the single owner can invite collaborators |
| Public event discovery feed | Events are private to organizers/collaborators and accessible via direct public link |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| Single owner per event | createdBy = creator UID | Clear, unambiguous authority and simple data model (AD-017) | y |
| Collaborators list on event doc | collaborators: string[] (UIDs) | Fast queries using array-contains in Firestore | y |
| Collaborator invite by email | Lookup UID from users collection or store email invitation | Friendly invite UX without needing internal IDs | y |
| Collaborators cannot delete event | Owner only can delete or cancel | Protects event integrity against accidental destruction | y |
| Home page shows scoped feed | Owned events + Collaborated events | Replaces global unauthenticated query (AD-014) | y |

**Open questions:** none - all resolved or logged above (required before the spec is confirmed).

---

## User Stories

### P1: Scoped Event Feed on Home/Dashboard ⭐ MVP

**User Story**: As an Organizer, I want to see only my events and collaborated events on my home dashboard so that I have a clean, personalized overview.

**Why P1**: Solves the architectural smell of showing all global events to all visitors.

**Acceptance Criteria**:

1. WHEN an authenticated user views the dashboard THEN system SHALL query events where createdBy equals user.uid OR collaborators array-contains user.uid
2. WHEN the user has no owned or collaborated events THEN system SHALL display a welcoming empty state with a "Criar Evento" CTA
3. The system SHALL display an ownership badge ("Organizador" vs "Colaborador") on each event card
4. IF user is not authenticated THEN system SHALL prompt for login before showing private event feeds

**Independent Test**: User A creates Event 1; User B creates Event 2. User A only sees Event 1 on their dashboard.

---

### P2: Event Ownership Assignment on Creation

**User Story**: As an Organizer, I want the system to assign me as the owner when I create an event so that I retain full administrative control.

**Why P2**: Fundamental for the permission model.

**Acceptance Criteria**:

1. WHEN user creates an event THEN system SHALL automatically populate createdBy with the authenticated user UID and initialize collaborators as an empty array
2. The system SHALL record the owner email and display it in the event administration view
3. WHILE user is the event owner THEN system SHALL allow full editing of title, date, location, description, items, and event deletion

**Independent Test**: Create an event and verify the Firestore document contains createdBy matching the user UID.

---

### P2: Invite Event Collaborators

**User Story**: As an Event Owner, I want to invite collaborators by email so that friends or co-organizers can help manage the event.

**Why P2**: Key collaborative capability for group events.

**Acceptance Criteria**:

1. WHEN owner enters a collaborator email and submits the invite THEN system SHALL add the corresponding user UID to the event collaborators array
2. WHEN an invite is processed successfully THEN system SHALL display a confirmation snackbar
3. IF the invited email does not have an account THEN system SHALL record a pending invitation in events/{id}/invitations/{email}
4. IF a non-owner attempts to invite a collaborator THEN system SHALL reject the request with a permission error

**Independent Test**: Owner invites a collaborator email; the invited user sees the event on their dashboard.

---

### P2: Scoped Collaborator Permissions

**User Story**: As a Collaborator, I want to add and organize items without being able to accidentally delete or reschedule the event.

**Why P2**: Safety and clear separation of concerns between owner and helpers.

**Acceptance Criteria**:

1. WHILE a user UID is present in event collaborators THEN system SHALL permit adding, editing, and deleting items
2. WHILE a user UID is present in event collaborators THEN system SHALL permit managing guests and exporting guest lists
3. IF a collaborator attempts to modify core fields (title, date, location, pixKey) THEN system SHALL prevent saving and show an authorization message
4. IF a collaborator attempts to delete or cancel the event THEN system SHALL hide or disable deletion controls

**Independent Test**: Collaborator signs in, adds an item to the event, and verifies that the delete event button is not accessible.

---

## Edge Cases

- IF an owner removes a collaborator from the event THEN system SHALL immediately revoke their write access via Firestore rules
- IF a user is both owner and collaborator (accidental self-invite) THEN system SHALL treat the user as owner
- WHEN a collaborator views an event that is subsequently deleted by the owner THEN system SHALL handle the missing document gracefully with a notification

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| EVCO-01 | P1: Scoped Event Feed | Design | Pending |
| EVCO-02 | P1: Empty State CTA | Design | Pending |
| EVCO-03 | P2: Event Ownership Assignment | Design | Pending |
| EVCO-04 | P2: Invite Collaborators | Design | Pending |
| EVCO-05 | P2: Pending Email Invites | Design | Pending |
| EVCO-06 | P2: Collaborator Item Management | Design | Pending |
| EVCO-07 | P2: Core Field Protection | Design | Pending |

**Coverage:** 7 total, 7 mapped to tasks in future phases, 0 unmapped.

---

## Success Criteria

- [ ] Home dashboard renders only owned and collaborated events with zero data leakage between unrelated users
- [ ] Collaborators can manage items and guest lists in real time
- [ ] Core event fields and deletion actions are strictly restricted to the event owner
