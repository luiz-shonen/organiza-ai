# Personal Family Roster & Batch RSVP Design

**Spec**: `.specs/features/07-family-roster/spec.md`  
**Status**: Approved  

---

## Architecture Overview

The Family Roster architecture enables users to maintain a private roster of family members in their personal account profile (AD-019) and confirm batch attendance in a single action:
1. **Isolated Storage**: Saved in the user's private subcollection `users/{uid}/family/{memberId}`.
2. **Collapsible RSVP Selector**: In the event RSVP flow, if the user has family members saved, a collapsible panel allows checking individual members or "Selecionar Todos".
3. **Inline Quick Addition**: Allows typing a family member's name directly in the RSVP modal, saving them to `users/{uid}/family` and auto-selecting them for the current event.
4. **Normalized Batch Event Writes**: Submitting the RSVP creates a primary guest entry for the user and linked guest entries (`events/{id}/guests/{uid_memberId}`) for each selected family member with `primaryGuestId: uid`.

```mermaid
graph TD
    A[User Profile: /perfil] --> B[users/{uid}/family CRUD]
    
    C[Event RSVP Flow on /evento/:id] --> D{User has family roster?}
    D -->|Yes| E[Show Collapsible 'Adicionar Família?' Panel]
    D -->|No / Quick Add| F[Inline '+ Novo Membro' Field]
    F -->|Save| B
    E --> G[Checkbox Selection: Select All / Itemized]
    G --> H[Confirm RSVP Action]
    H --> I[Batch Write to events/{id}/guests]
    I --> J[1 Primary Guest Record + N Linked Family Guest Records]
```

---

## Code Reuse Analysis

### Existing Components to Leverage

| Component | Location | How to Use |
| :--- | :--- | :--- |
| `GuestService` | `src/app/core/services/guest.service.ts` | Add `batchConfirmRsvp(eventId, primaryGuest, familyMembers)` |
| `UserService` | `src/app/core/services/user.service.ts` | Add `getFamilyMembers(uid)`, `addFamilyMember(uid, member)`, `deleteFamilyMember(uid, id)` |
| `GuestFormDialogComponent` | `src/app/features/event-detail/components/guest-form-dialog/` | Embed `FamilySelectorComponent` inside the dialog |

### Integration Points

| System | Integration Method |
| :--- | :--- |
| Firestore Subcollections | `users/{uid}/family` and `events/{eventId}/guests` |
| Angular Material | `MatExpansionModule`, `MatCheckboxModule`, `MatFormFieldModule` |

---

## Components

### `FamilySelectorComponent` (Dumb Component)
- **Purpose**: Presentational collapsible checklist to choose attending family members.
- **Location**: `src/app/features/event-detail/components/family-selector/`
- **Interfaces**:
  - `members = input.required<FamilyMember[]>()`
  - `selectedIds = input<string[]>()`
  - `toggleMember = output<string>()`
  - `selectAll = output<boolean>()`
  - `addInlineMember = output<{ name: string; relationship: string }>()`
- **Reuses**: Modern control flow (`@for`, `@if`), BEM styling.

### `FamilyRosterManagerComponent` (Dumb Component)
- **Purpose**: Presentational list with add/edit/delete actions for profile page.
- **Location**: `src/app/features/profile/components/family-roster-manager/`
- **Interfaces**:
  - `members = input.required<FamilyMember[]>()`
  - `addMember = output<{ name: string; relationship: string }>()`
  - `removeMember = output<string>()`

---

## Data Models

### `FamilyMember`
```typescript
export interface FamilyMember {
  id: string;
  name: string;
  relationship: 'spouse' | 'child' | 'parent' | 'sibling' | 'relative' | 'other';
  createdAt: string;
}
```

---

## Error Handling Strategy

| Error Scenario | Handling | User Impact |
| :--- | :--- | :--- |
| Inline family member save failure | Non-blocking alert; retains primary RSVP | "Erro ao salvar membro na lista de família. Tente novamente." |
| Batch guest write partial failure | Firestore `writeBatch` ensures atomicity | Either all family guests are confirmed or none, preventing inconsistent guest counts |

---

## Risks & Concerns

| Concern | Location (file:line) | Impact | Mitigation |
| :--- | :--- | :--- | :--- |
| Cancelling primary RSVP leaves orphaned family guest records | `src/app/core/services/guest.service.ts` | Disconnected attendees on event list | In `cancelRsvp`, query and delete all guest documents where `primaryGuestId === uid` in the same batch |

---

## Tech Decisions

| Decision | Choice | Rationale |
| :--- | :--- | :--- |
| Subcollection `users/{uid}/family` | Isolated Firestore subcollection | Completely private, scalable, and independent of event documents (AD-019) |
| Separate guest records per member | Normalized `events/{id}/guests/{uid_memberId}` | Keeps attendance statistics, headcounts, and name exports 100% accurate |
