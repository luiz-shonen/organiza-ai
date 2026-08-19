# Event Management & Automated Notifications Design

**Spec**: `.specs/features/02-event-management/spec.md`  
**Status**: Approved  

---

## Architecture Overview

The Event Management architecture provides complete event lifecycle handling, fast client-side filtering on `/meus-eventos`, and automated multi-stage attendee notifications (AD-026):
1. **Event Creation & Editing**: Full form handling with Signals, CEP auto-fill via `LocationService` (ViaCep), optional budget estimation (AD-025), Pix configuration, and item management.
2. **Automated Multi-Stage Notifications (AD-026)**:
   - **Critical Update Alert**: Triggered when event date, time, or location changes.
   - **Cancellation Alert**: Triggered when event status changes to `cancelled`.
   - **7-Day Countdown Reminder**: Fired 7 days before the event date for organizers and confirmed guests.
   - **1-Day (24-Hour) Countdown Reminder**: Fired exactly 1 day before the event date to minimize no-shows.
3. **Optimized Dashboard Filtering**: Reactive Signals filtering (`all`, `upcoming`, `history`, `cancelled`) over the local event state without recurring Firestore queries.

```mermaid
graph TD
    A[Event Owner] -->|Edits Date/Time/Location or Cancels| B[EventService.saveEvent / cancelEvent]
    B --> C[NotificationService.dispatchCriticalAlert]
    C -->|Fetch confirmed attendees| D[events/{id}/guests]
    D -->|Send Web Push via NGSW / in-app| E[Guest Devices]
    
    F[Background / App Init Service] -->|Check upcoming events| G[NotificationService.checkScheduledReminders]
    G -->|T - 7 days| H[7-Day Reminder Notification]
    G -->|T - 1 day / 24h| I[1-Day Countdown Notification]
```

---

## Code Reuse Analysis

### Existing Components to Leverage

| Component | Location | How to Use |
| :--- | :--- | :--- |
| `LocationService` | `src/app/core/services/location.service.ts` | Reuse ViaCep integration with CEP mask and timeout handling |
| `NotificationService` | `src/app/core/services/notification.service.ts` | Extend to support Web Push (`SwPush`), in-app alerts, and reminder timers |
| `ConfirmDialogComponent` | `src/app/shared/components/confirm-dialog/` | Reuse for cancel and delete confirmations |

### Integration Points

| System | Integration Method |
| :--- | :--- |
| Angular Service Worker | `@angular/service-worker` (`SwPush`) for Web Push notifications |
| ViaCep REST API | `HttpClient` lookup `https://viacep.com.br/ws/{cep}/json/` |
| Browser Clipboard / WhatsApp | `navigator.clipboard` and `https://wa.me/?text=...` URI schema |

---

## Components

### `EventDashboardFiltersComponent` (Dumb Component)
- **Purpose**: Presentational segmented button / chip filter group for upcoming, past, cancelled, and all events.
- **Location**: `src/app/features/organizer/dashboard/components/event-filters/`
- **Interfaces**:
  - `activeFilter = input.required<'all' | 'upcoming' | 'past' | 'cancelled'>()`
  - `filterCounts = input<{ all: number; upcoming: number; past: number; cancelled: number }>()`
  - `filterChange = output<'all' | 'upcoming' | 'past' | 'cancelled'>()`
- **Reuses**: BEM styles, CSS variables (`--org-primary-color`).

### `EventNotificationService`
- **Purpose**: Schedules and triggers 7-day and 1-day reminders and critical change/cancellation pushes.
- **Location**: `src/app/core/services/event-notification.service.ts`
- **Interfaces**:
  - `notifyGuestsOfEventChange(event: PartyEvent, changeSummary: string): Promise<void>`
  - `notifyGuestsOfCancellation(event: PartyEvent): Promise<void>`
  - `evaluateCountdownReminders(events: PartyEvent[]): void`
- **Dependencies**: `SwPush`, `FirebaseService`, `GuestService`.

---

## Data Models

### `EventNotificationRecord`
```typescript
export interface EventNotificationRecord {
  id: string;
  eventId: string;
  type: 'change' | 'cancellation' | 'reminder_7d' | 'reminder_1d';
  title: string;
  body: string;
  sentAt: string;
  recipientCount: number;
}
```

---

## Error Handling Strategy

| Error Scenario | Handling | User Impact |
| :--- | :--- | :--- |
| ViaCep API down / network timeout | Catch HTTP error and return null | Form displays "Busca de CEP indisponível. Preencha o endereço manualmente." |
| Push notification permission denied | Graceful fallback | Notification logged for in-app display on next page view |
| Event deletion Firestore network failure | Catch error and display snackbar | Event remains in list; user can retry |

---

## Risks & Concerns

| Concern | Location (file:line) | Impact | Mitigation |
| :--- | :--- | :--- | :--- |
| Duplicate reminders fired on multiple app launches | `src/app/core/services/event-notification.service.ts` | Annoying duplicate notifications | Store last-fired reminder timestamp in `localStorage` (`reminder_sent_{eventId}_{type}`) to guarantee single execution |

---

## Tech Decisions

| Decision | Choice | Rationale |
| :--- | :--- | :--- |
| Multi-stage notifications (7d & 1d) | Local Notification + Web Push | Minimizes event no-shows and ensures timely guest preparation (AD-026) |
| Client-side CSV generation | Blob + URL.createObjectURL | Zero backend cost, instant download, 100% offline-ready |
