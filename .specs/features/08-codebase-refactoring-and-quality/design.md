# Codebase Refactoring & Quality Design

**Spec**: `.specs/features/08-codebase-refactoring-and-quality/spec.md`  
**Status**: Approved  

---

## Architecture Overview

This design outlines the technical blueprint to eliminate technical debt, establish clean domain boundaries between **Event Organizer** (`/meus-eventos`), **Super Admin** (`/admin`), and **Universal Auth** (`/login`), align the codebase strictly with Angular v21+ Signals architecture, enforce SOLID principles and strict TypeScript typing, ensure WCAG 2.1 AA accessibility compliance, align Angular Material 3 CSS with native MDC tokens, and achieve 100% unit/component test coverage across all active components and services.

```mermaid
graph TD
    subgraph "Core Models & Types (SOLID)"
        TM[theme.model.ts]
        DM[dialog.model.ts]
        EM[event.model.ts]
        GM[guest.model.ts]
    end

    subgraph "Core Services (Strict Type Safety)"
        FG[FirestoreGateway<br/>Eliminate 'as any' with WithFieldValue]
        ES[EventService<br/>Typed Data Mappings]
        US[UserService<br/>Import ThemeMode from models]
        NS[NotificationService<br/>Typed Notification Options]
    end

    subgraph "Event Organizer Domain (/meus-eventos)"
        OD[Organizer DashboardContainer]
        EF[EventFiltersComponent]
        OE[EventEditorContainer]
        CI[CollaboratorInviteDialogComponent]
        SP[SharePanelComponent]
        OD --> EF
        OE --> CI
        OE --> SP
    end

    subgraph "Super Admin Domain (/admin)"
        AD[AdminDashboardContainer / Metrics]
        AFD[AdminFormDrawerComponent<br/>Strict Error Narrowing]
        AD --> AFD
    end

    subgraph "Auth Domain (/login)"
        LC[LoginContainer<br/>Accessible to all users]
    end

    subgraph "Public Guest UI Layer"
        HC[HomeContainer<br/>toSignal() instead of AsyncPipe]
        ED[EventDetailContainer]
        IC[ItemListCardComponent<br/>output() instead of @Output]
        CD[ConfirmDialogComponent<br/>Separate HTML/SCSS + Model]
        TT[ThemeToggleComponent<br/>Separate SCSS + Model Import]
    end

    TM --> US
    TM --> TT
    DM --> CD
    DM --> GM
    FG --> ES
    FG --> US
    ES --> OD
    ES --> OE
    ES --> HC
    ES --> ED
```

---

## Domain Boundary Separation

| Domain | Route Scope | Access / Guard | Components & Responsibilities |
| :--- | :--- | :--- | :--- |
| **Organizer** (`features/organizer/`) | `/meus-eventos`<br/>`/meus-eventos/evento/novo`<br/>`/meus-eventos/evento/:id` | `authGuard` (any authenticated user, including Super Admins) | Event CRUD, collaborator management, guest list tracking, sharing (QR code, WhatsApp link). Contains `dashboard/`, `event-editor/`, `components/event-filters/`, `components/collaborator-invite-dialog/`, `components/share-panel/`. |
| **Super Admin** (`features/admin/`) | `/admin` | `superAdminGuard` (whitelisted system administrators) | System governance, platform insights, global health metrics, and admin whitelist management (`components/admin-form-drawer/`). |
| **Auth** (`features/auth/`) | `/login` | Public (all users) | Google OAuth & Email/Password login and registration (`LoginContainer`). |
| **Public / Guest** (`features/home/`, `features/event-detail/`) | `/`, `/evento/:id` | Public | Public event feed, event details, RSVP confirmation, split estimation, item claiming. |
| **Profile** (`features/profile/`) | `/perfil` | `authGuard` | User profile management, theme preference, private family roster (`FamilyRosterManagerComponent`). |

---

## Unused Files Audit & Replacement Mapping

Every file targeted for deletion has been verified to ensure it is not referenced and that an active component cleanly fulfills its responsibility:

| File / Component Targeted for Deletion | Path | Active Replacement Component | Verification Evidence |
| :--- | :--- | :--- | :--- |
| `ItemListComponent` | `src/app/features/event-detail/components/item-list/` | `ItemListCardComponent` (`src/app/features/event-detail/components/item-list-card/`) | Active `EventDetailContainer` imports `ItemListCardComponent` which uses verified user UIDs instead of legacy phone-based sessions. |
| `RsvpFormComponent` | `src/app/features/event-detail/components/rsvp-form/` | `RsvpCardComponent` & `GuestFormDialogComponent` | Active `EventDetailContainer` uses `RsvpCardComponent` for status and `GuestFormDialogComponent` for modal RSVP confirmation with family selection. |
| `EventHeaderComponent` | `src/app/features/event-detail/components/event-header/` | `EventCardComponent` (`src/app/features/event-detail/components/event-card/`) | Active `EventDetailContainer` renders header, countdowns, and details through unified `EventCardComponent`. |
| `EventInfoCardComponent` | `src/app/features/event-detail/components/event-info-card/` | `EventCardComponent` (`src/app/features/event-detail/components/event-card/`) | Merged into `EventCardComponent` with Glassmorphism styling. |
| `EmailVerificationBannerComponent` | `src/app/features/organizer/components/email-verification-banner/` | Integrated container banner in `DashboardContainer` | Verification status and resend logic are handled directly in the dashboard container with 60s cooldown. |
| `OrganizerEventCardComponent` | `src/app/features/organizer/dashboard/components/event-card/` | `DashboardContainer` table & card views | Active `DashboardContainer` implements its responsive table and card layout natively. |

---

## Component Refactoring & Angular Signals Alignment

### 1. `ItemListCardComponent` (Presentational / Dumb Component)
- **Location**: `src/app/features/event-detail/components/item-list-card/`
- **Refactor**: Replace legacy `@Output() onClaim = new EventEmitter<string>()` and `@Output() onUnclaim = new EventEmitter<string>()` with modern Angular Signals:
  - `readonly onClaim = output<string>();`
  - `readonly onUnclaim = output<string>();`
- **Change Detection**: `ChangeDetectionStrategy.OnPush`.

### 2. `HomeContainer` (Smart / Container Component)
- **Location**: `src/app/features/home/`
- **Refactor**:
  - Convert `events$` Observable to Signal via `readonly events = toSignal(this.eventService.listEvents(), { initialValue: null });`.
  - Remove `AsyncPipe` from imports and template.
  - Remove inline `style="cursor: pointer; transition: transform 0.2s"` from template; encapsulate into `.home__card` in `home.container.scss`.
  - Add WCAG 2.1 AA keyboard navigation to event cards (`role="link"`, `tabindex="0"`, `(keydown.enter)` / `(keydown.space)` routing).

### 3. `ConfirmDialogComponent` (Shared Component)
- **Location**: `src/app/shared/components/confirm-dialog/`
- **Refactor**:
  - Extract inline template from `confirm-dialog.component.ts` into dedicated `confirm-dialog.component.html` and `confirm-dialog.component.scss`.
  - Extract `ConfirmDialogData` interface into `src/app/core/models/dialog.model.ts`.
  - Keep `ChangeDetectionStrategy.OnPush`.

### 4. `ThemeToggleComponent` (Shared Component)
- **Location**: `src/app/shared/components/theme-toggle/`
- **Refactor**:
  - Create dedicated `theme-toggle.component.scss` and link via `styleUrl: './theme-toggle.component.scss'`.
  - Update `ThemeMode` import to reference `src/app/core/models/theme.model.ts`.

### 5. `LoginContainer` (Smart / Container Component)
- **Location**: `src/app/features/auth/login/` (moved from `features/admin/login/`)
- **Refactor**:
  - Remove inline `style="height: 76px"` from `.login__logo` in `login.container.html`; place in `login.container.scss`.
  - Ensure all error handling uses strict `catch (error: unknown)` with `error instanceof Error ? error.message : String(error)`.

### 6. `AdminFormDrawerComponent` (Presentational / Drawer Component)
- **Location**: `src/app/features/admin/dashboard/components/admin-form-drawer/`
- **Refactor**:
  - Replace `catch (err: any)` and `catch (error: any)` with `catch (error: unknown)` and safe message resolution.

---

## Angular Material 3 CSS & MDC Design Tokens Optimization

To adhere strictly to modern Angular Material 3 best practices, global form field and UI component customizations in `src/styles.scss` will be refactored to eliminate manual CSS overrides using `!important` in favor of native MDC design tokens:

### 1. Form Field Design Token Mapping
```scss
:root {
  /* Native Material 3 MDC Outlined Text Field Tokens */
  --mdc-outlined-text-field-container-shape: 16px;
  --mdc-outlined-text-field-outline-color: var(--org-outline-variant-light);
  --mdc-outlined-text-field-focus-outline-color: var(--org-primary);
  --mdc-outlined-text-field-hover-outline-color: var(--org-secondary);
  --mdc-outlined-text-field-label-text-color: var(--mat-sys-on-surface-variant);
  --mdc-outlined-text-field-focus-label-text-color: var(--org-primary);
  --mdc-outlined-text-field-input-text-color: var(--mat-sys-on-surface);

  /* Native Material 3 MDC Dialog & Surface Tokens */
  --mdc-dialog-container-shape: 28px;
  --mat-menu-container-shape: 16px;
}
```

### 2. Glassmorphism Styling Encapsulation
- Keep `.glass-card` and `.org-glass` utility classes scoped with standard backdrop filter and linear gradient borders.
- Form fields inherit global tokens cleanly without overriding internal MDC shadow-DOM selectors with excessive `!important`.

---

## Data Models & DTO Extraction (SOLID Compliance)

All DTOs and shared contract interfaces currently inlined within component or service files are extracted into dedicated files in `src/app/core/models/` and re-exported via `index.ts`:

### 1. `theme.model.ts`
```typescript
export type ThemeMode = 'light' | 'dark' | 'system';
```
*Decouples `profile.model.ts` and `theme.service.ts` from circular / inverted dependencies.*

### 2. `dialog.model.ts`
```typescript
import { GuestSession, FamilyMember } from './index';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

export interface GuestFormDialogData {
  session: GuestSession | null;
  familyMembers?: FamilyMember[];
  userId?: string;
}

export interface GuestFormDialogResult {
  name: string;
  phone: string;
  companionsCount: number;
  selectedFamilyMembers?: FamilyMember[];
}

export interface BatchPrimaryGuestInput {
  uid: string;
  name: string;
  email?: string;
  phone?: string;
  photoUrl?: string;
  companionsCount?: number;
}
```

---

## Strict TypeScript & `as any` Elimination

### 1. `FirestoreGateway` (`src/app/core/services/firestore.gateway.ts`)
- Replace `data as any` in `setDoc`, `updateDoc`, `addDoc`, and `runBatch` with proper Firestore types: `WithFieldValue<DocumentData>` and `UpdateData<DocumentData>`.

### 2. `EventService` (`src/app/core/services/event.service.ts`)
- Replace `data['addressDetails'] as any`, `data['pixType'] as any`, `data['estimatedBudget'] as any` with typed assignments using `AddressDetails`, `PixType`, and `number`.

### 3. `UserService` (`src/app/core/services/user.service.ts`)
- Replace `data['addressDetails'] as any` with `data['addressDetails'] as AddressDetails | undefined`.
- Update `ThemeMode` import source to `../models`.

### 4. `FirebaseService` (`src/app/core/services/firebase.service.ts`)
- Replace `initializeFirestore(this.app, { experimentalForceLongPolling: true } as any)` with typed `FirestoreSettings`.

### 5. `NotificationService` (`src/app/core/services/notification.service.ts`)
- Replace `as any` in `new Notification(..., options)` with a typed `ExtendedNotificationOptions` interface extending `NotificationOptions`.

---

## Accessibility (WCAG 2.1 AA) & Design System SCSS

| Element / Component | A11y Requirement | Implementation |
| :--- | :--- | :--- |
| `HomeContainer` Event Cards | Keyboard Accessible & Screen Reader Ready | `tabindex="0"`, `role="link"`, `[attr.aria-label]="'Ver detalhes do evento ' + event.title"`, `(keydown.enter)="openEvent(event.id)"`, `(keydown.space)="openEvent(event.id)"` |
| `DashboardContainer` Alert Banners | Keyboard Accessible Close & Focus | `aria-live="polite"`, `role="alert"`, focusable buttons with clear `aria-label` |
| SCSS Custom Properties | Consistent Vibrant Modernism | Use `--org-primary`, `--org-secondary`, `--org-radius-lg`, `--org-glass-bg`, `--org-glass-blur`, and `--org-glass-shadow` exclusively |
| Inline Styles Removal | Zero inline `style=""` | Transferred to encapsulated SCSS rules adhering to BEM syntax |

---

## Unit Test Suite Expansion (100% Spec Coverage)

The following 13 new unit & component API test suites (`.spec.ts`) will be implemented using Vitest and Angular TestBed to achieve 100% test coverage:

| Target File | Spec File Location | Key Test Scenarios |
| :--- | :--- | :--- |
| `HomeContainer` | `src/app/features/home/home.container.spec.ts` | Signal reactivity, empty state display, loading spinner, card formatting, keyboard navigation |
| `LoginContainer` | `src/app/features/auth/login/login.container.spec.ts` | Form validation, password visibility toggle, email/pass login, auto-registration fallback, Google login, navigation |
| `ConfirmDialogComponent` | `src/app/shared/components/confirm-dialog/confirm-dialog.component.spec.ts` | Injected dialog data rendering, custom labels, confirm/cancel dialog closing |
| `ThemeToggleComponent` | `src/app/shared/components/theme-toggle/theme-toggle.component.spec.ts` | Menu opening, mode selection triggering `ThemeService.setMode()` |
| `ItemListCardComponent` | `src/app/features/event-detail/components/item-list-card/item-list-card.component.spec.ts` | Item list rendering, signal output emission for `onClaim` and `onUnclaim` |
| `SharePanelComponent` | `src/app/features/organizer/event-editor/components/share-panel/share-panel.component.spec.ts` | QR canvas rendering effect, clipboard copy snackbar, WhatsApp share URL generation |
| `AdminFormDrawerComponent` | `src/app/features/admin/dashboard/components/admin-form-drawer/admin-form-drawer.component.spec.ts` | Loading admin list, adding new admin, confirmation dialog on remove, error handling |
| `GuestSessionService` | `src/app/core/services/guest-session.service.spec.ts` | Saving session, clearing session, loading from `localStorage`, SSR safe fallback |
| `ConfettiService` | `src/app/core/services/confetti.service.spec.ts` | Triggering `fireSuccessConfetti` without throwing errors |
| `DrawerService` | `src/app/core/services/drawer.service.spec.ts` | Opening admin drawer, opening event drawer with data, closing drawer, signals reactivity |
| `HeaderService` | `src/app/core/services/header.service.spec.ts` | Updating title, back button visibility, and back URL signals |
| `NotificationService` | `src/app/core/services/notification.service.spec.ts` | Local notification triggering, permission checking, safe fallbacks when unsupported |
| `FirebaseService` | `src/app/core/services/firebase.service.spec.ts` | Proper initialization of Firebase App, Auth, and Firestore instances |

---

## Error Handling Strategy

| Error Scenario | Handling | User / App Impact |
| :--- | :--- | :--- |
| Unexpected error in async catch block | Catch as `error: unknown`, narrow with `error instanceof Error ? error.message : String(error)` | Clean user-facing snackbar / alert without crashing or leaking undefined variables |
| `window.matchMedia` or `localStorage` undefined (SSR / JSDOM) | Wrap in browser platform check `isPlatformBrowser(platformId)` or `typeof window !== 'undefined'` | Safe fallback without throwing unhandled runtime exceptions |
| Browser Desktop Notification API unavailable | Guard with `'Notification' in window` and warn gracefully in console | App continues seamlessly without notifications on unsupported browsers |

---

## Risks & Concerns

| Concern | Location (file:line) | Impact | Mitigation |
| :--- | :--- | :--- | :--- |
| Broken imports when separating `organizer/`, `admin/`, and `auth/` | `src/app/app.routes.ts:24-34` | Compile error if routes or containers are misplaced | Update routes in `app.routes.ts`, `organizer.routes.ts`, and `admin.routes.ts` in sync with folder moves |
| Circular model references when extracting DTOs | `src/app/core/models/dialog.model.ts` | Potential bundling issues | Re-export all models cleanly through `src/app/core/models/index.ts` with explicit type exports |
| Type discrepancy in `FirestoreGateway` when dropping `as any` | `src/app/core/services/firestore.gateway.ts:108` | Type errors with Firestore `setDoc` / `updateDoc` | Import and utilize official `WithFieldValue<DocumentData>` and `UpdateData<DocumentData>` types from `firebase/firestore` |

---

## Tech Decisions

| Decision | Choice | Rationale |
| :--- | :--- | :--- |
| Clean 3-domain structure (`organizer`, `admin`, `auth`) | Separate `features/organizer` (`/meus-eventos`), `features/admin` (`/admin`), and `features/auth` (`/login`) | Matches AD-020; ensures clear role boundaries between regular event organizing and superadmin system operations |
| Angular Material 3 MDC design tokens | Replace `!important` CSS overrides with native `--mdc-outlined-text-field-*` tokens | Aligns global styling with official Angular Material 3 / MDC architecture standards |
| DTO consolidation in `src/app/core/models/` | Centralized `dialog.model.ts` and `theme.model.ts` | Strict adherence to SOLID "One File Per Responsibility" and model-service decoupling rules |
| Vitest component API testing strategy | TestBed with `provideNoopAnimations()` and mock service fixtures | Fast, robust unit and interaction testing asserting spec-defined outcomes |
