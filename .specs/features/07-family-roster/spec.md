# Personal Family Roster Specification

## Problem Statement

Users often attend events with their family members (spouse, children, relatives). Today, confirming attendance for a family of 5 requires manually typing each person's name or repeatedly adding companions. Organiza AI will allow registered users to maintain a personal family roster in their account profile. During event RSVP, an "Adicionar Família" toggle reveals a collapsible selector allowing one-click or itemized batch confirmation for family members.

## Goals

- [ ] Allow authenticated users to manage a private list of family members in their account profile (name, relationship, optional phone)
- [ ] Provide an "Adicionar Família" toggle in the RSVP dialog that expands a collapsible checklist
- [ ] Enable users to select all or specific family members who will attend the event
- [ ] Submit batch guest records to the event in a single action, creating individual guest entries for each attending member
- [ ] Allow quick unchecking or editing of attendees prior to submission

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| Shared global families across accounts | The roster is private to the authenticated user (AD-019) |
| Family member login credentials | Family members in the roster are managed entries, not standalone user accounts |
| Automatic item claiming for all family members | Item claiming remains individual or explicitly assigned |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| Family roster stored in user doc | users/{uid}/family/{memberId} subcollection | Clean isolation per user, scalable for large families | y |
| RSVP creates separate Guest records | 1 guest record per confirmed family member | Keeps event attendee lists and counts normalized | y |
| Toggle is collapsible | mat-expansion-panel or animated accordion | Keeps mobile dialog clean when attending solo | y |
| Feature available to authenticated users | Requires Google sign-in to persist roster | Roster cannot exist reliably without a persistent account | y |

**Open questions:** none - all resolved or logged above (required before the spec is confirmed).

---

## User Stories

### P2: Manage Personal Family Members

**User Story**: As an Authenticated User, I want to add my family members to my profile so that I don't have to re-type their information for every event.

**Why P2**: Greatly accelerates repetitive attendance confirmations for family organizers.

**Acceptance Criteria**:

1. WHEN user accesses /perfil/familia THEN system SHALL display the list of saved family members with an "Adicionar Membro" button
2. WHEN user submits a new member with name and relationship THEN system SHALL save the record to users/{uid}/family/{memberId}
3. WHEN user edits or deletes a family member THEN system SHALL update or remove the corresponding document in Firestore
4. IF member name is empty THEN system SHALL prevent submission and display a validation error

**Independent Test**: Add 3 family members in profile view; reload page and verify they persist.

---

### P2: Collapsible Family RSVP Selection

**User Story**: As a Guest with a registered account, I want to toggle my family roster during RSVP so that I can easily select who is coming with me.

**Why P2**: The core UX benefit of having a family roster.

**Acceptance Criteria**:

1. WHEN an authenticated user opens the RSVP dialog THEN system SHALL display an "Adicionar Família?" toggle if the user has saved family members
2. WHEN user activates the "Adicionar Família?" toggle THEN system SHALL expand a collapsible panel displaying checkboxes for each family member
3. WHEN user checks "Selecionar Todos" THEN system SHALL mark all family member checkboxes as selected
4. WHEN user confirms the RSVP THEN system SHALL create a guest entry in events/{id}/guests for the primary user plus one guest entry for each selected family member
5. IF user deactivates the toggle THEN system SHALL collapse the panel and confirm attendance for the primary user only

**Independent Test**: Open RSVP on an event, toggle family, select 2 out of 3 members, confirm, and verify 3 total guest records appear on the event.

---

### P3: Quick Family Member Creation inside RSVP Dialog

**User Story**: As a User during RSVP, I want to quickly add a new family member inline so that I don't have to leave the event page to update my profile.

**Why P3**: Frictionless flow when a new family member needs to be included on the spot.

**Acceptance Criteria**:

1. WHEN user clicks "+ Novo Membro" inside the expanded family panel THEN system SHALL display inline name and relationship inputs
2. WHEN inline member is saved THEN system SHALL add the member to users/{uid}/family/{memberId} and automatically check them for the current RSVP
3. IF inline input is cancelled THEN system SHALL revert to the existing roster list without changes

**Independent Test**: Add a family member directly within the RSVP modal and confirm they are immediately added to both profile and event.

---

## Edge Cases

- IF an event has reached maximum capacity (if capacity limit is set) THEN system SHALL prevent selecting more family members than available spots
- IF user cancels their RSVP on an event THEN system SHALL prompt whether to cancel only their spot or all associated family members
- WHEN a family member is removed from the profile THEN system SHALL NOT alter historical RSVPs on past events

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| FAMS-01 | P2: Profile Family List | Execute | ✅ Verified |
| FAMS-02 | P2: Add/Edit/Delete Member | Execute | ✅ Verified |
| FAMS-03 | P2: Collapsible RSVP Toggle | Execute | ✅ Verified |
| FAMS-04 | P2: Batch Guest Creation | Execute | ✅ Verified |
| FAMS-05 | P2: Select All / Itemized Checkbox | Execute | ✅ Verified |
| FAMS-06 | P3: Inline Add Member in RSVP | Execute | ✅ Verified |

**Coverage:** 6 total, 6 mapped to future design/tasks, 0 unmapped.

---

## Success Criteria

- [ ] Confirming RSVP for a family of 4 takes < 5 seconds using the pre-saved roster
- [ ] Individual guest records are created accurately with proper deduplication
- [ ] Roster data remains completely private to the authenticated account
