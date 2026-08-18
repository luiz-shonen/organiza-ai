# Guest Experience Specification

## Problem Statement

Guests need zero-friction access to confirm their attendance (RSVP) and coordinate who brings what to the event. No account creation, no app download — just a link and a name. The system must handle the full guest lifecycle: arriving, RSVPing, claiming items, and cancelling attendance.

## Goals

- [ ] Guest views complete event details on the public page without authentication
- [ ] Guest RSVPs by providing name and phone number in under 60 seconds
- [ ] Guest claims and unclaims items from the collaboration list
- [ ] Guest can cancel their own RSVP, releasing claimed items automatically
- [ ] Guest can copy the event Pix key for financial contribution
- [ ] System provides celebratory feedback on successful actions

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| Guest account creation from the event page | Deferred to 06-guest-profile (P2) |
| Payment processing | MVP only displays the Pix key for manual transfer |
| Guest-to-guest messaging | Social feature — out of MVP scope |
| Viewing the full guest list | Privacy concern — only the total count is shown |
| Editing RSVP companions count via UI | Field exists in the data model but no input implemented (P2) |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| RSVP deduplication is by phone number | getGuestByPhone checks before insert; updates if exists | Phone is the most natural unique identifier guests know | y |
| Guest session is localStorage-only | GuestSessionService stores {name, phone} in localStorage | No Firestore record for anonymous guests (AD-006) | y |
| If guest clears localStorage, session is lost | Guest must re-enter name/phone | Acceptable trade-off for privacy; no server-side session | y |
| companionsCount defaults to 0 | No UI to set companions — field defaults | Simplicity for MVP; companion input is P2 | n |
| Only guests who have RSVPd can claim items | System checks isIdentified before allowing claim | Prevents anonymous item claiming without commitment | y |
| Unclaiming an item requires no confirmation | No confirm dialog for unclaim | Low-risk action; reversal is instant | y |
| Cancel RSVP auto-unclaims all items by that guest | Items with claimedBy.phone matching session.phone are unclaimed | Prevents orphaned claimed items after RSVP cancellation | y |

**Open questions:** none - all resolved or logged above (required before the spec is confirmed).

---

## User Stories

### P1: View Event Details ⭐ MVP

**User Story**: As a guest, I want to view all event details on the public page so that I know when, where, and what to bring.

**Why P1**: The event page is the guest's entry point — it must load and display correctly before anything else.

**Acceptance Criteria**:

1. WHEN guest navigates to /evento/:id THEN system SHALL display: event title, description, date, location, and status
2. WHEN event status is "cancelled" THEN system SHALL display a prominent cancellation banner above all other content
3. IF event does not exist in Firestore THEN system SHALL display a "Evento não encontrado" message
4. WHILE event data is loading THEN system SHALL display skeleton loaders that match the layout of the loaded state
5. The system SHALL hide skeleton loaders from screen readers via aria-hidden="true"

**Independent Test**: Open /evento/:id and verify all fields render correctly; verify skeleton loaders appear before data loads.

---

### P1: RSVP (Confirm Attendance) ⭐ MVP

**User Story**: As a guest, I want to confirm my attendance by entering only my name and phone so that the organizer knows I'm coming.

**Why P1**: RSVP is the core guest action — it is the reason for the public event page.

**Acceptance Criteria**:

1. WHEN guest clicks the RSVP button THEN system SHALL display a dialog with name and phone input fields
2. WHEN guest submits the RSVP form with a valid name and phone THEN system SHALL create or update a guest record in events/{id}/guests using phone as the deduplication key
3. WHEN RSVP is saved successfully THEN system SHALL save the session to localStorage via GuestSessionService and fire a confetti animation
4. WHEN RSVP is saved successfully THEN system SHALL display the "Presença confirmada!" snackbar
5. IF name or phone fields are empty THEN system SHALL prevent submission and display field validation messages
6. WHEN a non-anonymous authenticated user RSVPs THEN system SHALL also call userService.upsertProfile with name and phone
7. The system SHALL NOT write any record to the Firestore users collection for anonymous guests

**Independent Test**: Guest RSVPs with name and phone; Firestore shows a guest record; page state updates to "confirmed."

---

### P1: Claim Item ⭐ MVP

**User Story**: As a guest who has RSVPd, I want to claim an item from the list so that I can commit to bringing it.

**Why P1**: Item claiming is the collaborative coordination feature — the product's second most important guest action.

**Acceptance Criteria**:

1. WHEN a guest who has RSVPd clicks "Assumir" on an available item THEN system SHALL update the item's claimedBy field in Firestore with the guest's name and phone
2. WHEN an item is claimed THEN system SHALL display the claiming guest's name on that item for all viewers
3. WHEN claim succeeds THEN system SHALL fire a confetti animation and display a success snackbar
4. IF guest has not RSVPd and clicks "Assumir" THEN system SHALL display "Por favor, confirme sua presença primeiro" and NOT claim the item
5. WHILE an item is already claimed by another guest THEN system SHALL display the claimer's name and hide the claim button

**Independent Test**: Guest RSVPs then claims an item; item shows guest's name to all viewers.

---

### P1: Unclaim Item ⭐ MVP

**User Story**: As a guest, I want to unclaim an item I previously claimed so that another guest can take responsibility for it.

**Why P1**: Plans change; guests must be able to release commitments without contacting the organizer.

**Acceptance Criteria**:

1. WHEN guest clicks to unclaim an item they claimed THEN system SHALL clear the claimedBy field on that item in Firestore
2. WHEN unclaim succeeds THEN system SHALL display the item as available again immediately
3. IF unclaim fails THEN system SHALL display an error snackbar

**Independent Test**: Guest claims item, then unclaims it — item returns to available state for all viewers.

---

### P1: Cancel RSVP ⭐ MVP

**User Story**: As a guest, I want to cancel my RSVP so that the organizer's guest count stays accurate.

**Why P1**: Event counts matter for planning. Guests who can't attend should be able to withdraw easily.

**Acceptance Criteria**:

1. WHEN guest clicks "Cancelar Presença" THEN system SHALL open a ConfirmDialogComponent before executing the action
2. WHEN guest confirms cancellation THEN system SHALL delete their guest record from events/{id}/guests
3. WHEN RSVP is cancelled THEN system SHALL unclaim all items where claimedBy.phone matches the guest's session phone
4. WHEN cancellation completes THEN system SHALL call guestSession.clearSession() resetting the local state
5. IF cancellation fails THEN system SHALL display an error snackbar and leave the RSVP intact

**Independent Test**: Guest cancels RSVP; guest record is removed from Firestore; all claimed items are released.

---

### P1: Copy Pix Key ⭐ MVP

**User Story**: As a guest, I want to copy the organizer's Pix key so that I can contribute financially to the event.

**Why P1**: Pix contribution ("rachadinha") is a core feature of the product vision.

**Acceptance Criteria**:

1. WHEN event has a pixKey THEN system SHALL display the Pix card with the key and a copy button
2. WHEN guest clicks the copy button THEN system SHALL copy the pixKey to the clipboard and display a confirmation snackbar
3. WHEN event has no pixKey THEN system SHALL hide the Pix card entirely

**Independent Test**: Event with Pix key — copy button copies correct value. Event without Pix key — Pix card is not rendered.

---

### P2: Seasonal Theme

**User Story**: As a guest, I want the event page to reflect the seasonal theme of the event so that the experience feels festive and contextual.

**Why P2**: Enhances the product's "celebration" personality but does not affect core functionality.

**Acceptance Criteria**:

1. WHEN event date falls within a defined seasonal window THEN system SHALL apply the matching seasonal theme (Festa Junina, Natal, Páscoa)
2. WHEN seasonal theme is active THEN system SHALL display the corresponding themed decorative assets
3. WHEN guest leaves the event page THEN system SHALL reset to the auto theme via seasonalThemeService.resetToAuto()

**Independent Test**: Open an event dated in June — Festa Junina theme assets appear.

---

### P2: Guest Count Display

**User Story**: As a guest, I want to see how many people have confirmed attendance so that I can gauge the event size.

**Why P2**: Social proof feature — useful but not blocking.

**Acceptance Criteria**:

1. The system SHALL display total confirmed attendees as the sum of (1 + companionsCount) for each guest record
2. WHEN a new RSVP is confirmed THEN system SHALL update the guest count display in real time

**Independent Test**: 3 guests confirm with 0 companions each — count displays 3.

---

## Edge Cases

- IF guest's localStorage is cleared between sessions THEN system SHALL show the RSVP form again without error (session is treated as new)
- IF two guests submit RSVP with the same phone simultaneously THEN system SHALL handle the race via Firestore's last-write-wins (getGuestByPhone + update pattern)
- WHEN event is cancelled THEN system SHALL disable the RSVP button and display the cancellation banner instead
- IF Firestore write for guest record fails THEN system SHALL display an error snackbar and NOT update localStorage session

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| GEXP-01 | P1: View event details | - | Verified (built) |
| GEXP-02 | P1: Cancelled event banner | - | Verified (built) |
| GEXP-03 | P1: Skeleton loaders | - | Verified (built) |
| GEXP-04 | P1: RSVP — dialog + form | - | Verified (built) |
| GEXP-05 | P1: RSVP — deduplication by phone | - | Verified (built) |
| GEXP-06 | P1: RSVP — localStorage session | - | Verified (built) |
| GEXP-07 | P1: RSVP — no Firestore for anonymous | - | Verified (built) |
| GEXP-08 | P1: Claim item | - | Verified (built) |
| GEXP-09 | P1: Unclaim item | - | Verified (built) |
| GEXP-10 | P1: Cancel RSVP + auto-unclaim | - | Verified (built) |
| GEXP-11 | P1: Copy Pix key | - | Verified (built) |
| GEXP-12 | P2: Seasonal theme | - | Verified (built) |
| GEXP-13 | P2: Guest count | - | Verified (built) |

**Coverage:** 13 total, 0 mapped to tasks (retroactive — all built), 0 unmapped.

---

## Success Criteria

- [ ] Guest completes RSVP flow (open page → submit form → confirmed) in under 60 seconds on mobile
- [ ] Item claim is reflected for all viewers within 2 seconds (Firestore real-time listener)
- [ ] RSVP cancellation removes guest record and releases all items in a single atomic flow
- [ ] Pix key copy works correctly on both iOS Safari and Android Chrome
