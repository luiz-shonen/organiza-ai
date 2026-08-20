# Guest Experience Specification

## Problem Statement

Guests need zero-friction access to confirm their attendance (RSVP) and coordinate who brings what to the event. To guarantee 100% genuine guest lists without fake identities or spam, RSVPs are authenticated via 1-touch Google verification or verified user accounts (AD-024). The system calculates contribution splits dynamically when an estimated budget is configured (AD-025) and keeps attendees updated via real-time notifications (AD-026).

## Goals

- [ ] Guest views complete event details on the public page without initial login barriers
- [ ] Guest RSVPs with 1-touch Google verification (or authenticated account) in under 10 seconds (AD-024)
- [ ] System reuses verified phone numbers from Google accounts when available
- [ ] Guest claims and unclaims items from the collaboration list
- [ ] Guest can cancel their own RSVP, releasing claimed items automatically
- [ ] Guest views dynamic per-person contribution split and copies the Pix key in 1 click (AD-025)
- [ ] System delivers celebratory feedback on successful actions

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| Arbitrary unverified phone number text input | Eliminated to prevent impersonation and fake RSVPs (AD-024) |
| Payment gateway processing | MVP displays Pix key with dynamic split suggestion (AD-025) |
| Guest-to-guest messaging | Social feature — out of MVP scope |
| Viewing full private guest lists on public page | Privacy concern — only aggregate count and item claims are public |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| RSVP identity is verified | 1-touch Google Sign-in or authenticated session | Eliminates impersonation and spam without SMS costs (AD-024) | y |
| Google phone number reuse | Extract phone from Google profile if available | Convenient contact sharing without manual typing | y |
| Split calculation | estimatedBudget / totalConfirmedGuests | Transparent suggested contribution per attendee (AD-025) | y |
| Only confirmed guests claim items | isConfirmed required to claim | Prevents anonymous item claiming without commitment | y |
| Unclaiming an item requires no confirmation | Instant single-click unclaim | Low-risk action; reversal is instant | y |
| Cancel RSVP auto-unclaims items | Releases items claimed by that guest UID | Prevents orphaned claimed items | y |

**Open questions:** none - all resolved or logged above (required before the spec is confirmed).

---

## User Stories

### P1: View Event Details ⭐ MVP

**User Story**: As a guest, I want to view all event details on the public page so that I know when, where, and what to bring.

**Why P1**: The event page is the guest's entry point.

**Acceptance Criteria**:

1. WHEN guest navigates to /evento/:id THEN system SHALL display: event title, description, date, location, and status
2. WHEN event status is "cancelled" THEN system SHALL display a prominent cancellation banner above all other content
3. IF event does not exist in Firestore THEN system SHALL display a "Evento não encontrado" message
4. WHILE event data is loading THEN system SHALL display skeleton loaders that match the layout of the loaded state
5. The system SHALL hide skeleton loaders from screen readers via aria-hidden="true"

**Independent Test**: Open /evento/:id and verify all fields render correctly with skeleton loaders during load.

---

### P1: Verified 1-Touch RSVP ⭐ MVP

**User Story**: As a guest, I want to confirm my attendance with 1-touch Google verification so that my presence is recorded authentically without entering passwords.

**Why P1**: RSVP is the core guest action and must be 100% verified against fake entries.

**Acceptance Criteria**:

1. WHEN guest clicks "Confirmar Presença" THEN system SHALL initiate 1-touch Google verification (or reuse current authenticated session)
2. WHEN verification succeeds THEN system SHALL create or update the guest record in events/{id}/guests/{uid} with name, email, photo, and optional phone
3. WHEN RSVP is saved successfully THEN system SHALL fire a confetti animation and display "Presença confirmada!"
4. WHEN RSVP is confirmed THEN system SHALL update the public view to the confirmed state and prompt for push notification permission
5. The system SHALL NOT allow unverified text-only submissions to create guest records

**Independent Test**: Click "Confirmar Presença", authenticate with Google; verify guest record in Firestore matches authenticated UID.

---

### P1: Claim Item ⭐ MVP

**User Story**: As a confirmed guest, I want to claim an item from the list so that I can commit to bringing it.

**Why P1**: Item claiming is the collaborative coordination feature.

**Acceptance Criteria**:

1. WHEN a confirmed guest clicks "Assumir" on an available item THEN system SHALL update the item's claimedBy field with the guest's UID and name
2. WHEN an item is claimed THEN system SHALL display the claiming guest's name on that item for all viewers
3. WHEN claim succeeds THEN system SHALL fire a confetti animation and display a success snackbar
4. IF guest has not confirmed RSVP and clicks "Assumir" THEN system SHALL prompt to confirm presence first
5. WHILE an item is already claimed by another guest THEN system SHALL display the claimer's name and hide the claim button

**Independent Test**: Guest confirms RSVP, then claims item; item shows guest's name in real time.

---

### P1: Unclaim Item ⭐ MVP

**User Story**: As a guest, I want to unclaim an item I previously claimed so that another guest can take responsibility for it.

**Why P1**: Plans change; guests must be able to release commitments easily.

**Acceptance Criteria**:

1. WHEN guest clicks to unclaim an item they claimed THEN system SHALL clear the claimedBy field on that item in Firestore
2. WHEN unclaim succeeds THEN system SHALL display the item as available again immediately
3. IF unclaim fails THEN system SHALL display an error snackbar

**Independent Test**: Guest claims item, then unclaims it — item returns to available state for all viewers.

---

### P1: Cancel RSVP ⭐ MVP

**User Story**: As a guest, I want to cancel my RSVP so that the organizer's guest count stays accurate.

**Why P1**: Accurate attendee counts are essential for event logistics.

**Acceptance Criteria**:

1. WHEN guest clicks "Não poderei ir" THEN system SHALL open a ConfirmDialogComponent before executing the action
2. WHEN guest confirms cancellation THEN system SHALL delete their guest record from events/{id}/guests/{uid}
3. WHEN RSVP is cancelled THEN system SHALL automatically unclaim all items claimed by that guest UID
4. WHEN cancellation completes THEN system SHALL update the UI to the unconfirmed state
5. IF cancellation fails THEN system SHALL display an error snackbar and leave the RSVP intact

**Independent Test**: Guest cancels RSVP; guest record is removed from Firestore and all claimed items are released.

---

### P1: Pix Card with Dynamic Split Calculation ⭐ MVP

**User Story**: As a guest, I want to see the suggested contribution split and copy the Pix key in 1 click so that I can contribute financially.

**Why P1**: Group cost-sharing ("rachadinha") is a core product value.

**Acceptance Criteria**:

1. WHEN event has a pixKey THEN system SHALL display the Pix card with the key and a copy button
2. WHEN event has an estimatedBudget and guestCount > 0 THEN system SHALL calculate and display the suggested contribution per person (estimatedBudget / guestCount)
3. WHEN guest clicks the copy button THEN system SHALL copy the pixKey to the clipboard and display a confirmation snackbar
4. WHEN event has no pixKey THEN system SHALL hide the Pix card entirely

**Independent Test**: Event with R$ 600 budget and 12 confirmed guests displays "Sugestão: R$ 50,00 por pessoa".

---

### P2: Seasonal Theme

**User Story**: As a guest, I want the event page to reflect the seasonal theme of the event so that the experience feels festive.

**Why P2**: Enhances the product personality.

**Acceptance Criteria**:

1. WHEN event date falls within a defined seasonal window THEN system SHALL apply the matching seasonal theme (Festa Junina, Natal, Páscoa)
2. WHEN seasonal theme is active THEN system SHALL display themed decorative assets
3. WHEN guest leaves the event page THEN system SHALL reset to the auto theme via seasonalThemeService.resetToAuto()

**Independent Test**: Open an event dated in June — Festa Junina theme assets appear.

---

### P2: Real-time Guest Count Display

**User Story**: As a guest, I want to see how many people have confirmed attendance.

**Why P2**: Social proof.

**Acceptance Criteria**:

1. The system SHALL display total confirmed attendees in real time
2. WHEN a new RSVP is confirmed THEN system SHALL update the guest count display without full page reload

**Independent Test**: 3 guests confirm — count displays 3.

---

## Edge Cases

- IF a non-logged-in guest attempts to claim an item THEN system SHALL prompt for 1-touch Google confirmation before claiming
- WHEN an event is cancelled THEN system SHALL disable RSVP and item claiming, displaying the cancellation banner
- IF Firestore write for guest record fails THEN system SHALL display an error snackbar and retain the current form state

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| GEXP-01 | P1: View event details | - | Verified |
| GEXP-02 | P1: Cancelled event banner | - | Verified |
| GEXP-03 | P1: Skeleton loaders | - | Verified |
| GEXP-04 | P1: Verified 1-Touch RSVP | Phase 2/3 | Verified |
| GEXP-05 | P1: Claim item | - | Verified |
| GEXP-06 | P1: Unclaim item | - | Verified |
| GEXP-07 | P1: Cancel RSVP + auto-unclaim | Phase 1/3 | Verified |
| GEXP-08 | P1: Pix Card + Split Calculation | Phase 2/3 | Verified |
| GEXP-09 | P2: Seasonal theme | - | Verified |
| GEXP-10 | P2: Real-time Guest count | - | Verified |

**Coverage:** 10 total, 10 verified.

---

## Success Criteria

- [ ] Guest completes verified RSVP in under 10 seconds on mobile
- [ ] Item claim is reflected for all viewers in under 2 seconds (Firestore real-time listener)
- [ ] Dynamic split calculation accurately divides estimated budget by confirmed guest count
- [ ] RSVP cancellation removes guest record and releases all items atomically

