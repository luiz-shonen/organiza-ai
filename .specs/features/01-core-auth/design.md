# Core Auth & RBAC Design

**Spec**: `.specs/features/01-core-auth/spec.md`  
**Status**: Approved  

---

## Architecture Overview

The authentication and access control architecture decouples general event organizers from super administration:
1. **Open Registration**: Any user authenticates via Google OAuth (1-touch) or Email/Password. Whitelist gating (`admins/{email}`) is retired for event creation (AD-016, AD-021).
2. **Route Restructuring**:
   - `/meus-eventos` is the route for authenticated organizers and collaborators (`authGuard`).
   - `/admin` is restricted strictly to Super Admins (`superAdminGuard`, checking hardcoded emails per AD-005, AD-020).
   - `/login` provides entry for both Google and Email/Password flows, redirecting directly to `/meus-eventos`.
3. **Non-Blocking Email Verification Banner**: Users creating accounts via Email/Password access `/meus-eventos` immediately with an informational banner and a 60s cooldown resend button (AD-023).

```mermaid
graph TD
    A[Visitor] -->|Opens /login| B[Login Container]
    B -->|Google OAuth 1-Click| C[Firebase Auth]
    B -->|Email + Password| C
    C -->|Auth State Changed| D[AuthService]
    D -->|isSuperAdmin: true| E[Allow /admin Analytics]
    D -->|isSuperAdmin: false| F[Redirect /admin to /meus-eventos]
    D -->|Authenticated User| G[/meus-eventos Dashboard]
    G -->|emailVerified: false| H[Email Verification Banner with 60s Cooldown]
    G -->|emailVerified: true| I[Clean Dashboard View]
```

---

## Code Reuse Analysis

### Existing Components to Leverage

| Component | Location | How to Use |
| :--- | :--- | :--- |
| `AuthService` | `src/app/core/services/auth.service.ts` | Refactor to remove whitelist requirements for organizers; maintain `isSuperAdmin` signal and add `sendVerificationEmail()` |
| `authGuard` | `src/app/core/guards/auth.guard.ts` | Guard for `/meus-eventos` checking `currentUser() !== null` |
| `NotificationService` | `src/app/core/services/notification.service.ts` | Display feedback snackbars on login error and verification email resend |

### Integration Points

| System | Integration Method |
| :--- | :--- |
| Firebase Auth | Direct modular SDK (`signInWithPopup`, `createUserWithEmailAndPassword`, `sendEmailVerification`, `signOut`) |
| Angular Router | `canActivate: [authGuard]` for `/meus-eventos` and `canActivate: [superAdminGuard]` for `/admin` |

---

## Components

### `EmailVerificationBannerComponent` (Dumb Component)
- **Purpose**: Displays non-blocking email confirmation reminder on organizer dashboard with resend cooldown timer.
- **Location**: `src/app/features/organizer/components/email-verification-banner/`
- **Interfaces**:
  - `email = input.required<string>()`
  - `resendCooldown = input<number>(0)`
  - `resend = output<void>()`
- **Dependencies**: Angular Material Button (`mat-button`), MatIcon (`mat-icon`).
- **Reuses**: Modern control flow `@if`, CSS custom properties (`--org-warning-color`).

### `superAdminGuard`
- **Purpose**: Restricts `/admin` routes strictly to authorized super administrative emails.
- **Location**: `src/app/core/guards/super-admin.guard.ts`
- **Interfaces**: `CanActivateFn: () => boolean | UrlTree`
- **Dependencies**: `AuthService`, `Router`.
- **Reuses**: Existing signal synchronization pattern from `authGuard`.

---

## Data Models

### `AuthUser`
```typescript
export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
}
```

---

## Error Handling Strategy

| Error Scenario | Handling | User Impact |
| :--- | :--- | :--- |
| Google OAuth popup closed/blocked | Catch exception in `AuthService.loginWithGoogle` | Display snackbar: "Autenticação cancelada ou bloqueada pelo navegador." |
| Email verification rate limit exceeded | Catch `auth/too-many-requests` | Banner displays: "Muitas tentativas. Aguarde alguns minutos." |
| Unauthenticated access to `/meus-eventos` | `authGuard` redirects to `/login` | User is seamlessly redirected to sign-in page |
| Non-superadmin accessing `/admin` | `superAdminGuard` redirects to `/meus-eventos` | User is safely redirected to their personal events dashboard |

---

## Risks & Concerns

| Concern | Location (file:line) | Impact | Mitigation |
| :--- | :--- | :--- | :--- |
| Old admin whitelist check in `AuthService.ts:38` blocks general users | `src/app/core/services/auth.service.ts:38` | General users cannot create events | Remove `verifyAdminStatus` gate; replace with open registration and `isSuperAdmin` check only |
| Route name mismatch (`/admin` used for both organizers and superadmins) | `src/app/app.routes.ts:20` | Confuses organizers with platform admins | Rename organizer route to `/meus-eventos` and isolate `/admin` for Super Admin analytics |

---

## Tech Decisions

| Decision | Choice | Rationale |
| :--- | :--- | :--- |
| Direct route renaming to `/meus-eventos` | Dedicated route + guard | Accurately models user ownership and avoids route ambiguity (AD-020) |
| Non-blocking verification | Banner with signal-based cooldown | Prevents signup drop-off while providing zero-cost verification (AD-023) |
| Retain hardcoded Super Admin | Hardcoded in `AuthService` + Firestore rules | Simple, free, zero-latency system privilege management (AD-005) |
