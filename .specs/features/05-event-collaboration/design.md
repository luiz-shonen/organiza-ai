# Event Collaboration & Scoped Feeds Design

**Spec**: `.specs/features/05-event-collaboration/spec.md`  
**Status**: Approved  

---

## Architecture Overview

The collaboration model establishes clean, event-centric access control (AD-017) with zero-cost email invitations and auto-claim on sign-in (AD-022):
1. **Scoped Event Feeds**: Replaces unauthenticated global feeds with a personalized dashboard showing only events created by the user or where the user is an invited collaborator.
2. **Email Invitation & Auto-Claim**:
   - Owner invites collaborator by email → writes to `events/{eventId}/invitations/{email}`.
   - When the user authenticates (Google or Email/Password), `AuthService` checks for matching pending invitations and executes a Firestore `writeBatch` adding the user UID to `collaborators` on the event document and removing the pending invite.
3. **Scoped Role-Based UI & Field Protection**:
   - **Owner (`createdBy === uid`)**: Full edit privileges (title, date, time, location, Pix key, estimated budget, item management, guest management, cancellation, deletion).
   - **Collaborator (`collaborators.includes(uid)`)**: Item management (add, edit, remove items) and guest list review/export. Core event fields, budget, Pix key, cancellation, and deletion are strictly read-only/hidden.

```mermaid
graph TD
    A[Event Owner] -->|Enters collaborator email| B[Write events/{id}/invitations/{email}]
    C[Invited User] -->|Signs In via /login| D[AuthService OnAuthStateChanged]
    D -->|Query pending invitations| E[Process Auto-Claim Batch]
    E -->|Add UID to collaborators array| F[Update events/{id}]
    E -->|Delete invitation doc| G[Clean up invitations/{email}]
    F --> H[/meus-eventos Personal Feed]
    H -->|Badge: Organizador / Colaborador| I[Event Card]
```

---

## Code Reuse Analysis

### Existing Components to Leverage

| Component | Location | How to Use |
| :--- | :--- | :--- |
| `EventService` | `src/app/core/services/event.service.ts` | Add `getUserEvents(uid)`, `inviteCollaborator(eventId, email)`, `claimPendingInvitations(email, uid)` |
| `EventEditorContainer` | `src/app/features/organizer/event-editor/event-editor.container.ts` | Add `isOwner = computed(() => this.event()?.createdBy === this.authService.currentUser()?.uid)` to conditionally lock core form fields |
| `EventCardComponent` | `src/app/features/organizer/dashboard/components/event-card/` | Add role badge (`Organizador` / `Colaborador`) via presentational input |

### Integration Points

| System | Integration Method |
| :--- | :--- |
| Firestore Queries | `where('createdBy', '==', uid)` and `where('collaborators', 'array-contains', uid)` |
| Firestore Batch | Atomic write to update `events/{id}.collaborators` and delete `events/{id}/invitations/{email}` |

---

## Components

### `CollaboratorInviteDialogComponent` (Dumb Component)
- **Purpose**: Modal to input collaborator email and display active/pending collaborators for an event.
- **Location**: `src/app/features/organizer/event-editor/components/collaborator-invite-dialog/`
- **Interfaces**:
  - `collaborators = input<string[]>()`
  - `pendingInvites = input<string[]>()`
  - `invite = output<string>()`
  - `removeCollaborator = output<string>()`
- **Dependencies**: `MatDialogModule`, `MatFormFieldModule`, `MatInputModule`, `MatChipsModule`.
- **Reuses**: BEM styling, `--org-primary-color`.

---

## Data Models

### `PartyEvent` (Extended)
```typescript
export interface PartyEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  cep?: string;
  pixKey?: string;
  pixType?: 'cpf' | 'cnpj' | 'email' | 'phone' | 'random';
  estimatedBudget?: number;
  status: 'active' | 'cancelled';
  createdBy: string;
  creatorEmail?: string;
  collaborators: string[];
  createdAt: string;
  updatedAt: string;
}

export interface EventInvitation {
  id: string;
  eventId: string;
  eventTitle: string;
  invitedEmail: string;
  invitedBy: string;
  createdAt: string;
}
```

---

## Error Handling Strategy

| Error Scenario | Handling | User Impact |
| :--- | :--- | :--- |
| Non-owner tries to invite collaborator | Security rule rejection & client-side guard | Displays: "Apenas o organizador principal pode convidar colaboradores." |
| Collaborator attempts to delete event | Button is hidden + Firestore rule denies write | Action impossible in UI; safe fallback |
| Auto-claim fails due to network glitch | Non-blocking try/catch in `AuthService` | User can still access events; auto-claim retries on next app focus/reload |

---

## Risks & Concerns

| Concern | Location (file:line) | Impact | Mitigation |
| :--- | :--- | :--- | :--- |
| Multiple parallel queries in Firestore | `src/app/core/services/event.service.ts` | Disjoint query lists for created and collaborated events | Use `combineLatest` in `EventService` to merge and deduplicate events into a single reactive Signals stream |

---

## Tech Decisions

| Decision | Choice | Rationale |
| :--- | :--- | :--- |
| Email invitation with auto-claim | `events/{id}/invitations/{email}` subcollection + auto-claim on auth | 100% free, requires zero paid email servers (AD-022) |
| Direct event-level permissions | Single owner + array of collaborator UIDs | Avoids complex team/organization entities while meeting all user requirements (AD-017, AD-018) |
