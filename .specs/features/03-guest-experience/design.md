# Guest Experience & Verified RSVP Design

**Spec**: `.specs/features/03-guest-experience/spec.md`  
**Status**: Approved  

---

## Architecture Overview

The Guest Experience architecture guarantees zero-friction participation with 100% verified RSVP identity (AD-024) and dynamic financial split calculation (AD-025):
1. **Verified 1-Touch RSVP (AD-024)**:
   - On `/evento/:id`, clicking "Confirmar Presença" initiates 1-touch Google sign-in (or reuses active session).
   - Writes directly to `events/{eventId}/guests/{uid}` using the verified Google user profile.
   - Eliminates spam and fake entries by deprecating unverified phone number inputs.
2. **Dynamic Pix Split Card (AD-025)**:
   - Presentational component `PixCardComponent` dynamically divides `estimatedBudget` by `confirmedGuestCount`.
   - Displays suggested per-person amount with a 1-click Pix key copy button.
3. **Item Claiming & Atomic Release**:
   - Confirmed guests can claim items (`claimedBy = { uid, name }`).
   - Cancelling an RSVP deletes the guest document and automatically clears all items claimed by that user UID.

```mermaid
graph TD
    A[Visitor on /evento/:id] --> B{Already Signed In?}
    B -->|No| C[1-Touch Google OAuth Dialog]
    B -->|Yes| D[Confirm RSVP Dialog]
    C --> D
    D -->|Submit| E[Write to events/{id}/guests/{uid}]
    E --> F[Confetti Animation]
    E --> G[Prompt Push Permission for Event Updates]
    
    H[Pix Card] -->|Read estimatedBudget & guestCount| I[Computed Signal: suggestedSplit]
    I --> J[Render R$ XX,XX por pessoa + Copiar Pix]
```

---

## Code Reuse Analysis

### Existing Components to Leverage

| Component | Location | How to Use |
| :--- | :--- | :--- |
| `EventDetailContainer` | `src/app/features/event-detail/event-detail.container.ts` | Smart container coordinating event stream, guest stream, item stream, and RSVP |
| `PixCardComponent` | `src/app/features/event-detail/components/pix-card/` | Enhance with dynamic split calculation input and computed signal |
| `ConfettiService` | `src/app/core/services/confetti.service.ts` | Launch celebratory particle effects on RSVP confirmation and item claim |
| `SeasonalOverlayComponent` | `src/app/shared/components/seasonal-overlay/` | Render decorative seasonal animations based on event date |

### Integration Points

| System | Integration Method |
| :--- | :--- |
| Firestore Real-time Listeners | `collectionData` / `docData` for real-time guest and item updates |
| Clipboard API | `navigator.clipboard.writeText` for 1-click Pix key copy |

---

## Components

### `PixCardComponent` (Dumb Component)
- **Purpose**: Displays the organizer's Pix key and dynamic per-person split suggestion.
- **Location**: `src/app/features/event-detail/components/pix-card/pix-card.component.ts`
- **Interfaces**:
  - `pixKey = input<string | null>()`
  - `pixType = input<string | undefined>()`
  - `estimatedBudget = input<number | null>()`
  - `guestCount = input<number>(0)`
  - `copyPix = output<string>()`
- **Computed**:
  ```typescript
  readonly suggestedSplit = computed(() => {
    const budget = this.estimatedBudget();
    const count = this.guestCount();
    return budget && count > 0 ? budget / count : null;
  });
  ```

### `RsvpCardComponent` (Dumb Component)
- **Purpose**: Renders attendance status, 1-touch confirmation button, or confirmed state with cancel option.
- **Location**: `src/app/features/event-detail/components/rsvp-card/rsvp-card.component.ts`
- **Interfaces**:
  - `isConfirmed = input<boolean>(false)`
  - `guestCount = input<number>(0)`
  - `isLoading = input<boolean>(false)`
  - `confirmRsvp = output<void>()`
  - `cancelRsvp = output<void>()`

---

## Data Models

### `Guest`
```typescript
export interface Guest {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  photoUrl?: string;
  isConfirmed: boolean;
  confirmedAt: string;
  primaryGuestId?: string; // Links companion entries to the primary user UID
}
```

---

## Error Handling Strategy

| Error Scenario | Handling | User Impact |
| :--- | :--- | :--- |
| Google popup blocked during RSVP | NotificationService shows warning | "Permita popups no navegador para autenticar com o Google." |
| Item claimed by another guest concurrently | Optimistic update reverts with snackbar | "Este item acabou de ser assumido por outro convidado." |
| Pix key copy fails | Fallback to manual selection prompt | User can manually select and copy the Pix text |

---

## Risks & Concerns

| Concern | Location (file:line) | Impact | Mitigation |
| :--- | :--- | :--- | :--- |
| Orphaned claimed items on RSVP cancellation | `src/app/core/services/guest.service.ts` | Items remain marked as claimed by deleted guest | Use Firestore `writeBatch` in `cancelRsvp` to atomically remove guest and clear item claims |

---

## Tech Decisions

| Decision | Choice | Rationale |
| :--- | :--- | :--- |
| 1-Touch Google RSVP | Google OAuth popup + profile data | Guarantees authentic guest records and zero identity fraud (AD-024) |
| Client-side split calculation | Signal `computed()` | Real-time reactivity as guests confirm without extra network roundtrips (AD-025) |
