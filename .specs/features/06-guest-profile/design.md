# Guest Profile & History Design

**Spec**: `.specs/features/06-guest-profile/spec.md`  
**Status**: Approved  

---

## Architecture Overview

The Profile architecture provides authenticated users with a personal account hub for viewing their event history, managing profile details, and accessing their family roster (AD-019, AD-024):
1. **Route & Layout**:
   - `/perfil` route protected by `authGuard`.
   - `ProfileContainer` (Smart) orchestrates user details, attended events history, and family roster.
2. **Attended Events Stream**:
   - Aggregates events where the user confirmed RSVP.
   - Provides 1-click navigation to the public event link.

```mermaid
graph TD
    A[/perfil Route] --> B[ProfileContainer]
    B --> C[ProfileInfoCard: Avatar, Name, Email, Phone]
    B --> D[FamilyRosterSection: Embedded Manager]
    B --> E[AttendedEventsList: History of RSVPs]
```

---

## Code Reuse Analysis

### Existing Components to Leverage

| Component | Location | How to Use |
| :--- | :--- | :--- |
| `UserService` | `src/app/core/services/user.service.ts` | Load and update `users/{uid}` document |
| `AuthService` | `src/app/core/services/auth.service.ts` | Read authenticated user Signals (`currentUser()`) |
| `EventCardComponent` | `src/app/features/organizer/dashboard/components/event-card/` | Reuse for displaying past attended events |

### Integration Points

| System | Integration Method |
| :--- | :--- |
| Firestore Collection `users` | Document read/update on `users/{uid}` |

---

## Components

### `ProfileInfoCardComponent` (Dumb Component)
- **Purpose**: Displays user identity and avatar with edit name option.
- **Location**: `src/app/features/profile/components/profile-info-card/`
- **Interfaces**:
  - `user = input.required<User>()`
  - `updateName = output<string>()`
- **Reuses**: BEM styles, CSS variables (`--org-text-primary`).

---

## Data Models

### `UserProfile`
```typescript
export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  phone?: string;
  createdAt: string;
  updatedAt: string;
}
```

---

## Error Handling Strategy

| Error Scenario | Handling | User Impact |
| :--- | :--- | :--- |
| Profile name update fails | Catch error in `UserService` and show snackbar | "Não foi possível atualizar o nome. Tente novamente." |
| Unauthenticated user opens `/perfil` | `authGuard` redirects to `/login` | User redirected seamlessly to sign-in page |

---

## Risks & Concerns

| Concern | Location (file:line) | Impact | Mitigation |
| :--- | :--- | :--- | :--- |
| High read volume for attended events history | `src/app/core/services/user.service.ts` | Extra Firestore read costs | Cache attended event IDs in `users/{uid}` or query with standard limits (e.g. `limit(20)`) |

---

## Tech Decisions

| Decision | Choice | Rationale |
| :--- | :--- | :--- |
| Consolidated `/perfil` route | Single tabbed or sectioned container | Gives users a clean single screen for identity, history, and family roster |
