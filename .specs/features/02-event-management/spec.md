# Event Management Specification

## Problem Statement

Organizers need to create, edit, and manage collaborative events intuitively. The flow covers everything from basic setup (title, date, location, estimated budget) to day-of-event support (item list, Pix key, guest export, WhatsApp sharing, QR Code, and automated change/cancellation notifications to confirmed guests).

## Goals

- [ ] Organizer creates a complete event (basic data, address, items, Pix, estimated budget) in a single editor view
- [ ] Organizer views all events on /meus-eventos with status filters (all, upcoming, history, cancelled)
- [ ] Organizer shares the event via WhatsApp and QR Code in one click
- [ ] Organizer exports the confirmed guest list to CSV / print
- [ ] Organizer cancels or edits an event with automatic notifications dispatched to confirmed attendees (AD-026)
- [ ] Organizer can define an estimated budget to calculate suggested contribution splits (AD-025)

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| Real-time collaborative conflict resolution | Conflict resolution complexity — P3 |
| Integrated banking gateway (Pix API) | MVP displays the Pix key for manual copy with split suggestion |
| Recurring events | Recurrence complexity is out of MVP scope |
| Import events from external calendars | Out of MVP scope |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| Event date is stored as ISO 8601 string | string field in PartyEvent model | Future compatibility with Firestore Timestamp | y |
| ViaCep CEP lookup is optional | Organizer can type address manually if CEP lookup fails | Must not block event creation due to a third-party API | y |
| Cancelled events remain visible on the public page | status: cancelled shows a cancellation banner | Guests who have the old link must be informed | y |
| Scoped event queries | Filtered by createdBy or collaborators array | Scoped user-owned event feed (AD-017, AD-020) | y |
| Budget estimation is optional | estimatedBudget defaults to null | Only displays split if organizer defines a budget (AD-025) | y |
| CSV export is generated client-side | No backend needed for file generation | Simple and zero infrastructure cost | y |

**Open questions:** none - all resolved or logged above (required before the spec is confirmed).

---

## User Stories

### P1: Create Event ⭐ MVP

**User Story**: As an Organizer, I want to create a new event with basic data, address, optional budget, and Pix key so that I can share it with guests.

**Why P1**: Core functionality — without events, nothing else works.

**Acceptance Criteria**:

1. WHEN organizer navigates to /meus-eventos/evento/novo THEN system SHALL display the event creation form with fields: title, description, date/time, category, address, Pix key (optional), and estimated budget (optional)
2. WHEN organizer enters a valid Brazilian CEP THEN system SHALL query the ViaCep API and auto-fill street, neighborhood, and city
3. IF CEP is not found by ViaCep THEN system SHALL display an error message and allow manual address entry
4. WHEN organizer submits the form with all required fields valid THEN system SHALL create the document events/{eventId} in Firestore and redirect to /meus-eventos/evento/{eventId}
5. IF required fields (title, date, location) are empty THEN system SHALL display field-level validation messages and prevent submission
6. The system SHALL automatically set createdAt and updatedAt fields at creation time

**Independent Test**: Organizer opens /meus-eventos/evento/novo, fills required fields, and verifies the event appears in /meus-eventos.

---

### P1: Edit Event & Notify Guests ⭐ MVP

**User Story**: As an Organizer, I want to edit an existing event and have confirmed guests automatically notified of critical changes.

**Why P1**: Event details change (venue, time, description). Attendees must stay updated automatically.

**Acceptance Criteria**:

1. WHEN organizer clicks edit on an event in /meus-eventos THEN system SHALL navigate to /meus-eventos/evento/{id} with current data pre-populated
2. WHEN organizer saves changes to date, time, or location THEN system SHALL update events/{id} and trigger change notifications to all confirmed guests
3. WHEN organizer updates the address via CEP THEN system SHALL re-run the ViaCep lookup with the new CEP
4. IF event does not exist in Firestore THEN system SHALL display an error message and redirect to /meus-eventos

**Independent Test**: Organizer edits event date; verified that updatedAt updates and notification trigger executes.

---

### P1: Manage Item List ⭐ MVP

**User Story**: As an Organizer, I want to define a list of items guests can bring so that the event is collaboratively organized.

**Why P1**: The item list is the central coordination mechanism — "who brings what."

**Acceptance Criteria**:

1. WHEN organizer adds an item with a name and quantity THEN system SHALL create the document events/{id}/items/{itemId} in Firestore
2. WHEN organizer removes an item THEN system SHALL delete the item document from Firestore
3. WHILE an item is marked as claimedBy a guest THEN system SHALL display that guest's name on the item in the organizer view
4. The system SHALL display available vs. total quantity for items with multiple units
5. IF item name is empty THEN system SHALL prevent creation and display a validation message

**Independent Test**: Organizer adds 3 items to an event and verifies they appear on the public event page.

---

### P1: Share Event (WhatsApp + QR Code) ⭐ MVP

**User Story**: As an Organizer, I want to share the event link via WhatsApp and QR Code so that guests can easily reach the event page.

**Why P1**: Without sharing, guests never reach the event page.

**Acceptance Criteria**:

1. WHEN organizer clicks share via WhatsApp THEN system SHALL open wa.me with a pre-formatted message containing title, date, location, and the event link
2. WHEN organizer accesses the QR Code section THEN system SHALL render a QR Code pointing to the public event URL (/evento/{id})
3. WHEN organizer clicks copy link THEN system SHALL copy the URL to the clipboard and display a confirmation snackbar
4. The system SHALL compose the public URL as {origin}/evento/{eventId}

**Independent Test**: Organizer copies the event link and opens it in a private tab — the event page loads correctly.

---

### P1: Cancel Event & Notify Guests ⭐ MVP

**User Story**: As an Organizer, I want to cancel an event and have confirmed attendees automatically notified.

**Why P1**: Events get cancelled; guests must be informed immediately.

**Acceptance Criteria**:

1. WHEN organizer clicks cancel event THEN system SHALL open a ConfirmDialogComponent with a confirmation message before executing the action
2. WHEN organizer confirms cancellation THEN system SHALL update status to "cancelled" on the events/{id} document and dispatch cancellation notifications
3. WHEN status is "cancelled" THEN system SHALL display a cancellation banner on the public event page (/evento/{id})
4. IF organizer dismisses the dialog THEN system SHALL leave the event status unchanged

**Independent Test**: Organizer cancels an event; public URL displays a cancellation banner and cancellation alert is triggered.

---

### P1: Event Dashboard with Filters ⭐ MVP

**User Story**: As an Organizer, I want to see all my events on /meus-eventos with status filters so that I can navigate my event history efficiently.

**Why P1**: With multiple events over time, an unfiltered list becomes unusable.

**Acceptance Criteria**:

1. WHEN organizer accesses /meus-eventos THEN system SHALL list owned and collaborated events ordered by date ASC
2. WHEN organizer selects the "Em breve" filter THEN system SHALL display only events with date >= today and status != cancelled
3. WHEN organizer selects the "Histórico" filter THEN system SHALL display only events with date < today and status != cancelled
4. WHEN organizer selects the "Cancelados" filter THEN system SHALL display only events with status = cancelled
5. WHEN no events match the selected filter THEN system SHALL display an empty state with a contextual message
6. WHEN an upcoming confirmed or organized event is 7 days away THEN system SHALL fire a 7-day reminder notification
7. WHEN an upcoming confirmed or organized event is 1 day (24 hours) away THEN system SHALL fire a 1-day countdown reminder notification

**Independent Test**: Organizer with 5 events (2 upcoming, 2 past, 1 cancelled) verifies each filter shows the correct count and 7-day/1-day notifications trigger as scheduled.

---

### P2: Export Guest List

**User Story**: As an Organizer, I want to export the guest list to CSV or printable format so that I can use it offline on event day.

**Why P2**: Useful on event day but does not block event creation or management.

**Acceptance Criteria**:

1. WHEN organizer clicks export CSV THEN system SHALL generate a .csv file with columns: Name, Email, Claimed Items, Companions
2. WHEN organizer clicks print THEN system SHALL call window.print() with a @media print layout that hides navigation and action buttons
3. The system SHALL include only confirmed guests in the export

**Independent Test**: Organizer with 3 confirmed guests exports CSV and verifies the file has 3 data rows.

---

### P2: Delete Event

**User Story**: As an Organizer, I want to permanently delete an event so that I can clean up test or outdated events.

**Why P2**: Deletion is destructive — cancellation is the preferred path. Delete is a cleanup action.

**Acceptance Criteria**:

1. WHEN organizer clicks delete event THEN system SHALL open a ConfirmDialogComponent with an irreversibility warning
2. WHEN organizer confirms deletion THEN system SHALL delete the events/{id} document and all sub-collections (guests, items) from Firestore
3. WHEN deletion completes THEN system SHALL remove the event from /meus-eventos listing without a full page reload
4. IF deletion fails THEN system SHALL display an error message via snackbar

**Independent Test**: Organizer deletes an event; /evento/{id} returns a "not found" state.

---

## Edge Cases

- IF ViaCep API is unavailable THEN system SHALL display "Busca de CEP indisponível" and allow manual address entry
- IF Firestore returns an error when saving the event THEN system SHALL display an error snackbar and keep the form populated
- WHEN organizer opens the same event in two tabs and edits both THEN system SHALL save the last submitted version (last-write-wins; no conflict detection in MVP)
- IF an event with confirmed guests is deleted THEN system SHALL delete the guests sub-collection together with the event

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| EVMG-01 | P1: Create Event — form | - | Verified (built) |
| EVMG-02 | P1: Create Event — ViaCep | - | Verified (built) |
| EVMG-03 | P1: Create Event — validation | - | Verified (built) |
| EVMG-04 | P1: Edit Event & Notify | Design | Pending |
| EVMG-05 | P1: Manage Items — add | - | Verified (built) |
| EVMG-06 | P1: Manage Items — remove | - | Verified (built) |
| EVMG-07 | P1: Share via WhatsApp | - | Verified (built) |
| EVMG-08 | P1: QR Code | - | Verified (built) |
| EVMG-09 | P1: Copy link | - | Verified (built) |
| EVMG-10 | P1: Cancel Event & Notify | Design | Pending |
| EVMG-11 | P1: Dashboard with filters | - | Verified (built) |
| EVMG-12 | P1: 7-day local notification | - | Verified (built) |
| EVMG-13 | P2: Export CSV | - | Verified (built) |
| EVMG-14 | P2: Print | - | Verified (built) |
| EVMG-15 | P2: Delete Event | - | Verified (built) |
| EVMG-16 | P1: 1-day countdown notification | Design | Pending |

**Coverage:** 16 total, 13 verified built, 3 pending design/task.

---

## Success Criteria

- [ ] Organizer creates a complete event (with CEP lookup) in under 3 minutes
- [ ] WhatsApp-shared link opens the correct event page in 100% of cases
- [ ] Dashboard filters return correct results for all 4 states (all / upcoming / history / cancelled)
- [ ] CSV export generates a file with accurate data for all confirmed guests

