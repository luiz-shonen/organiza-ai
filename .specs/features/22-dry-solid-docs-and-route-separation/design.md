# Feature 22: DRY/SOLID Architecture, Route Separation & Documentation Sync Design

**Spec**: `.specs/features/22-dry-solid-docs-and-route-separation/spec.md`  
**Status**: Draft  

---

## Architecture Overview

Feature 22 eliminates architectural debt, Single Responsibility Principle (SRP) violations, code duplication, and documentation drift across Organiza AI. The design organizes the codebase into crisp, modular layers:

1. **Shared Pure Utilities Layer (`src/app/core/utils/`)**: Pure helpers for date formatting with `Intl`, WhatsApp URI and clipboard sharing, crypto ID generation, CEP cleaning/masking, and relationship labels.
2. **Granular Domain Models Layer (`src/app/core/models/`)**: One-file-per-interface model architecture cleanly re-exported via `src/app/core/models/index.ts`.
3. **Core Services SRP & Type Safety**:
   - `AuthService` exposes `isAuthenticated` computed signal and `waitForAuthReady(): Promise<void>`.
   - `auth.guard.ts` and `super-admin.guard.ts` consume `waitForAuthReady()`, eliminating duplicate Angular effect waiter logic.
   - `UserService` drops `FamilyService` passthrough methods and delegates event data mapping to `EventService`.
   - Global typed `Window.__MOCK_DOCUMENTS__` in `src/app/testing/types/mock-window.d.ts` replaces 21 `(window as any)` casts in `firestore.gateway.ts`.
   - `OrgDateFieldComponent` replaces `$any()` casting in template with strict DOM event typing.
4. **Domain & Route Decoupling**:
   - `/meus-eventos` loads `ORGANIZER_ROUTES` in `src/app/features/organizer/` (`DashboardContainer`, `EventEditorContainer`) protected by `authGuard`.
   - `/admin` loads `ADMIN_ROUTES` in `src/app/features/admin/` (`AdminDashboardContainer`) protected by `superAdminGuard` for platform governance and admin list management.
   - `app.routes.ts` maps `/meus-eventos` and `/admin` to their respective route trees.
5. **Documentation & Agent Skills Synchronization**:
   - `DESIGN.md` remains the single source of truth for design tokens, visual guidelines, and component catalog.
   - `README.md`, `AGENTS.md`, `CONTEXT.md`, `.gemini/GEMINI.md`, `.claude/CLAUDE.md`, and `.specs/STATE.md` are updated to match current metrics and active ADRs (AD-001 through AD-041).
   - `.agents/skills/` provides four structured playbooks (`style-guide`, `creating-pages`, `creating-components`, `design-system-usage`) referencing `tdd`, `bem-css`, and `tlc-spec-driven`.
6. **Playwright E2E Mock Setup Deduplication**:
   - Test suites `07-visual-layout.spec.ts`, `08-keyboard-a11y.spec.ts`, and `09-multi-user-sync.spec.ts` consume `setupMockAuthSession()`.
   - Component harnesses `ConfirmDialogHarness` and `RsvpDialogHarness` target active `Org*` components directly.

```mermaid
graph TD
    subgraph Routing Layer [Angular Router]
        AR[app.routes.ts] -->|/meus-eventos + authGuard| OR[organizer.routes.ts]
        AR -->|/admin + superAdminGuard| ADMR[admin.routes.ts]
        AR -->|/design-system + superAdminGuard| DS[design-system-showcase.container]
    end

    subgraph Organizer Domain [features/organizer/]
        OR --> O_DASH[DashboardContainer]
        OR --> O_EDIT[EventEditorContainer]
        O_DASH --> FILTERS[EventFiltersComponent]
        O_EDIT --> SHARE[SharePanelComponent]
        O_EDIT --> INVITE[CollaboratorInviteDialogComponent]
    end

    subgraph Admin Domain [features/admin/]
        ADMR --> ADM_DASH[AdminDashboardContainer]
        ADM_DASH --> ADM_DRAWER[AdminFormDrawerComponent]
    end

    subgraph Core Services Layer [core/services/]
        AUTH_S[AuthService] -->|waitForAuthReady / isAuthenticated| GUARDS[authGuard / superAdminGuard]
        USER_S[UserService] -->|delegates events| EVT_S[EventService]
        PROFILE[ProfileContainer] -->|direct injection| FAM_S[FamilyService]
        EVT_S --> GATEWAY[FirestoreGateway]
    end

    subgraph Core Utilities & Models [core/utils/ & core/models/]
        UTILS[date, sharing, id, cep, relationship]
        MODELS[Granular Models & index.ts]
        UTILS --> O_DASH
        UTILS --> O_EDIT
        UTILS --> EVT_S
        MODELS --> Core Services Layer
    end
```

---

## Code Reuse Analysis

### Existing Components to Leverage

| Component | Location | How to Use |
|---|---|---|
| `FirestoreGateway` | `src/app/core/services/firestore.gateway.ts` | Central database abstraction; typed mock storage via `mock-window.d.ts` |
| `FamilyService` | `src/app/core/services/family.service.ts` | Injected directly by containers needing family roster CRUD |
| `EventService` | `src/app/core/services/event.service.ts` | Source of truth for event mappings, user event queries, and collaborator invites |
| `AuthService` | `src/app/core/services/auth.service.ts` | Auth state and promise-based readiness barrier |
| `setupMockAuthSession` | `e2e/helpers/auth-mock.helper.ts` | Centralized Playwright mock setup for IndexedDB and Google token endpoints |
| `Org*` Components | `src/app/shared/ui/` | Standard design system components (`OrgSurface`, `OrgButton`, `OrgTextField`, `OrgChip`, etc.) |

### Integration Points

| System | Integration Method |
|---|---|
| Router | `app.routes.ts` lazy-loads `ORGANIZER_ROUTES` for `/meus-eventos` and `ADMIN_ROUTES` for `/admin` |
| Navigation | `NavigationDrawer` links to `/meus-eventos` for organizers and `/admin` for Super Admins |
| Design System Showcase | `/design-system` renders live interactive component catalog and links to the Style Guide |

---

## Components

### 1. Core Utilities (`src/app/core/utils/`)

#### `date.utils.ts`
- **Purpose**: Pure date formatting functions with locale awareness and fallback handling.
- **Location**: `src/app/core/utils/date.utils.ts`
- **Interfaces**:
  - `formatDate(dateStr: string, locale?: string): string` - Formats ISO date string to `dd 'de' MMMM, yyyy` or `dd/MM/yyyy`.
  - `getDay(dateStr: string): string` - Returns 2-digit day of month (`01`-`31`).
  - `getMonth(dateStr: string, locale?: string): string` - Returns 3-letter uppercase month abbreviation (`JAN`, `FEV`, etc.).
  - `formatTime(dateStr: string): string` - Extracts time `HH:mm` from ISO string.
- **Dependencies**: None (native `Date` & `Intl.DateTimeFormat`).
- **Reuses**: Deduplicates date logic currently duplicated across `HomeContainer`, `DashboardContainer`, and `SeasonalThemeService`.

#### `sharing.utils.ts`
- **Purpose**: Pure helpers for WhatsApp sharing and clipboard copying with URI encoding.
- **Location**: `src/app/core/utils/sharing.utils.ts`
- **Interfaces**:
  - `buildWhatsAppShareUrl(title: string, date: string, location: string, url: string): string` - Constructs formatted `https://api.whatsapp.com/send?text=...` URI.
  - `shareWhatsApp(title: string, date: string, location: string, url: string): void` - Opens WhatsApp URL in a new browser window/tab.
  - `copyToClipboard(text: string): Promise<boolean>` - Copies text to navigator clipboard with fallback.
- **Dependencies**: Native browser `window.open` & `navigator.clipboard`.
- **Reuses**: Deduplicates sharing logic from `DashboardContainer` and `SharePanelComponent`.

#### `id.utils.ts`
- **Purpose**: Secure and deterministic identifier generation for client-side documents and notifications.
- **Location**: `src/app/core/utils/id.utils.ts`
- **Interfaces**:
  - `generateId(prefix?: string): string` - Generates random unique ID using `crypto.randomUUID()` or timestamp fallback.
  - `generateNotificationId(): string` - Generates `notif_<timestamp>_<random>` ID for notification records.
- **Dependencies**: Web Crypto API.
- **Reuses**: Replaces manual `Math.random().toString(36)` calls in `EventNotificationService` and `FirestoreGateway`.

#### `cep.utils.ts`
- **Purpose**: Pure formatting, validation, and sanitization functions for Brazilian Postal Codes (CEP).
- **Location**: `src/app/core/utils/cep.utils.ts`
- **Interfaces**:
  - `formatCep(raw: string): string` - Formats digits to `00000-000` mask.
  - `cleanCep(raw: string): string` - Strips non-digit characters (`\D`).
  - `isValidCep(cep: string): boolean` - Validates exact 8-digit requirement.
- **Dependencies**: None (pure regex).
- **Reuses**: Deduplicates CEP masking in `EventEditorContainer` and `LocationService`.

#### `relationship.utils.ts`
- **Purpose**: Canonical family relationship constants, select options, and localized label resolvers.
- **Location**: `src/app/core/utils/relationship.utils.ts`
- **Interfaces**:
  - `RELATIONSHIP_OPTIONS: readonly RelationshipOption[]` - Array of relationship values and labels (`spouse`, `child`, `parent`, `sibling`, `friend`, `other`).
  - `getRelationshipLabel(value: FamilyRelationship): string` - Returns localized Portuguese label for a relationship.
- **Dependencies**: `FamilyRelationship`, `RelationshipOption` models.
- **Reuses**: Deduplicates relationship options in `FamilySelectorComponent` and `FamilyRosterManagerComponent`.

---

### 2. Granular Models Layer (`src/app/core/models/`)

To strictly adhere to Single Responsibility and granular file architecture, monolithic model files are decomposed into 1-file-per-interface models:

| Model File | Exported Types / Interfaces | Purpose |
|---|---|---|
| `batch-primary-guest-input.model.ts` | `BatchPrimaryGuestInput` | Primary guest payload for batch RSVP operations |
| `guest-form-dialog-data.model.ts` | `GuestFormDialogData` | Data injected into guest RSVP dialog |
| `guest-form-dialog-result.model.ts` | `GuestFormDialogResult` | Result emitted upon guest form submission |
| `relationship-option.model.ts` | `RelationshipOption` | Value/label pair for relationship select menus |
| `family-member-create.model.ts` | `FamilyMemberCreate` | Creation payload for family members |
| `org-confirm-dialog-data.model.ts` | `OrgConfirmDialogData` | Data contract for `OrgConfirmDialogComponent` |
| `via-cep-response.model.ts` | `ViaCepResponse` | External ViaCEP REST response shape |
| `design-system-navigation-item.model.ts` | `DesignSystemNavigationItem` | Single item in showcase sidebar navigation |
| `design-system-navigation-group.model.ts` | `DesignSystemNavigationGroup` | Group of navigation items in showcase sidebar |
| `index.ts` | (all models) | Barrel export for `@core/models` |

---

### 3. Core Services & Guards Refactoring

#### `AuthService` (`src/app/core/services/auth.service.ts`)
- **Changes**:
  - Add `isAuthenticated = computed(() => { const u = this._currentUser(); return u !== null && !u.isAnonymous; });`
  - Add `async waitForAuthReady(): Promise<void>`:
    ```typescript
    async waitForAuthReady(): Promise<void> {
      await this.auth.authStateReady();
    }
    ```
- **Dependencies**: `firebase/auth`.

#### `auth.guard.ts` (`src/app/core/guards/auth.guard.ts`)
- **Changes**:
  - Replace Angular `effect()` waiter with `await authService.waitForAuthReady()`.
  - Check `authService.isAuthenticated()`.

#### `super-admin.guard.ts` (`src/app/core/guards/super-admin.guard.ts`)
- **Changes**:
  - Replace Angular `effect()` waiter with `await authService.waitForAuthReady()`.
  - Check `authService.isSuperAdmin()`.

#### `UserService` (`src/app/core/services/user.service.ts`)
- **Changes**:
  - Remove `getFamilyMembers`, `addFamilyMember`, `deleteFamilyMember` passthroughs (callers inject `FamilyService` directly).
  - Remove private `mapEventData()` method; delegate event mapping to `EventService`.

---

### 4. Domain & Route Decoupling

#### Organizer Domain (`src/app/features/organizer/`)
- **Relocated Files**:
  - `src/app/features/organizer/dashboard/dashboard.container.{ts,html,scss,spec.ts}`
  - `src/app/features/organizer/event-editor/event-editor.container.{ts,html,scss,spec.ts}`
  - `src/app/features/organizer/event-editor/components/share-panel/share-panel.component.{ts,html,scss,spec.ts}`
- **New File**: `src/app/features/organizer/organizer.routes.ts`:
  ```typescript
  import { Routes } from '@angular/router';

  export const ORGANIZER_ROUTES: Routes = [
    {
      path: '',
      loadComponent: () =>
        import('./dashboard/dashboard.container').then((m) => m.DashboardContainer),
    },
    {
      path: 'evento/novo',
      loadComponent: () =>
        import('./event-editor/event-editor.container').then((m) => m.EventEditorContainer),
    },
    {
      path: 'evento/:id',
      loadComponent: () =>
        import('./event-editor/event-editor.container').then((m) => m.EventEditorContainer),
    },
  ];
  ```

#### Admin Domain (`src/app/features/admin/`)
- **New File**: `src/app/features/admin/admin-dashboard.container.{ts,html,scss,spec.ts}`:
  - Container for Super Admin platform governance: system metrics, platform statistics, and admin whitelist management via `AuthService.listAdmins()` and `AuthService.removeAdmin()`.
- **Updated File**: `src/app/features/admin/admin.routes.ts`:
  ```typescript
  import { Routes } from '@angular/router';

  export const ADMIN_ROUTES: Routes = [
    {
      path: '',
      loadComponent: () =>
        import('./admin-dashboard.container').then((m) => m.AdminDashboardContainer),
    },
  ];
  ```

#### Root Routing (`src/app/app.routes.ts`)
```typescript
export const routes: Routes = [
  // ...
  {
    path: 'meus-eventos',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/organizer/organizer.routes').then((m) => m.ORGANIZER_ROUTES),
  },
  {
    path: 'admin',
    canActivate: [superAdminGuard],
    loadChildren: () =>
      import('./features/admin/admin.routes').then((m) => m.ADMIN_ROUTES),
  },
  // ...
];
```

---

### 5. Type Safety & Global Mock Window

#### `src/app/testing/types/mock-window.d.ts`
```typescript
export interface MockDocumentStore {
  [collectionPath: string]: Array<Record<string, unknown> & { id: string }>;
}

declare global {
  interface Window {
    __MOCK_DOCUMENTS__?: MockDocumentStore;
  }
}
```

#### `FirestoreGateway` (`src/app/core/services/firestore.gateway.ts`)
- Replace all 21 `(window as any)` type casts with typed access `window.__MOCK_DOCUMENTS__`.

---

### 6. Documentation & Agent Skills Library

1. **`docs/STYLE_GUIDE.md` & `.agents/skills/style-guide/SKILL.md`**: Comprehensive DOs/DON'Ts with code snippets for TypeScript strictness, Angular Signals OnPush architecture, BEM SCSS with `--org-*` tokens, Firebase SDK usage, WCAG 2.1 AA accessibility, and Vitest/Playwright testing.
2. **`.agents/skills/creating-pages/SKILL.md`**: Step-by-step recipes for creating routed Smart Containers, registering routes with guards, and consuming layout primitives (`OrgPageLayout`, `OrgPageHeader`, `OrgSection`).
3. **`.agents/skills/creating-components/SKILL.md`**: Step-by-step recipes for Dumb Presentational components with `input()`, `output()`, and `ChangeDetectionStrategy.OnPush`.
4. **`.agents/skills/design-system-usage/SKILL.md`**: Complete catalog of all 32 `Org*` components from `@shared/ui`.
5. **Methodology References**: All 4 skills explicitly cite `tdd`, `bem-css`, and `tlc-spec-driven`.
6. **Documentation Synchronization**: Sync `README.md`, `AGENTS.md`, `CONTEXT.md`, `DESIGN.md`, `.gemini/GEMINI.md`, `.claude/CLAUDE.md`, and `.specs/STATE.md` (AD-001..AD-041).

---

## Data Models

```typescript
// src/app/core/models/relationship-option.model.ts
import type { FamilyRelationship } from './family.model';

export interface RelationshipOption {
  readonly value: FamilyRelationship;
  readonly label: string;
}

// src/app/core/models/batch-primary-guest-input.model.ts
export interface BatchPrimaryGuestInput {
  readonly uid: string;
  readonly name: string;
  readonly email?: string;
  readonly phone?: string;
  readonly photoUrl?: string;
  readonly companionsCount?: number;
}

// src/app/core/models/org-confirm-dialog-data.model.ts
export interface OrgConfirmDialogData {
  readonly title: string;
  readonly message: string;
  readonly confirmLabel?: string;
  readonly cancelLabel?: string;
}
```

---

## Error Handling Strategy

| Error Scenario | Handling | User Impact |
|---|---|---|
| Auth initialization pending | `waitForAuthReady()` awaits `authStateReady()` | Page does not flicker or redirect unauthenticated users prematurely |
| Non-admin visits `/admin` | `superAdminGuard` intercepts after `waitForAuthReady()` and redirects to `/meus-eventos` | Protected admin routes remain completely inaccessible to regular organizers |
| Clipboard copy fails | `copyToClipboard()` falls back to textarea execCommand or returns false | UI displays warning feedback toast if copy fails |
| Invalid CEP string input | `cleanCep()` strips non-digits; `isValidCep()` returns false before external ViaCEP query | Prevents wasted HTTP calls on invalid input |
| Missing window in SSR/Node | All utility functions and `FirestoreGateway` guard with `typeof window !== 'undefined'` | Zero crashes during server-side build or headless testing |

---

## Risks & Concerns

| Concern | Location (file:line) | Impact | Mitigation |
|---|---|---|---|
| Broken imports due to container moves | `src/app/features/admin/` | Moving `dashboard` and `event-editor` to `organizer` could break unit/E2E test imports | Update all import paths atomically and verify with full test suite (`npm test`) |
| Duplicate interface declarations | Multiple components/services | Diverging interfaces cause subtle type mismatches | Centralize all interfaces in `core/models/` and export through `models/index.ts` |
| Guard race condition on cold load | `src/app/core/guards/auth.guard.ts:10` | Waiting for loading signal with effect could stall if auth never emits | Replace with native Firebase `authStateReady()` via `waitForAuthReady()` |

---

## Tech Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Model Granularity | One file per interface/model in `src/app/core/models/` | Strictly aligns with user requirement for granular file organization (DRY-03) |
| Shared Utilities Layer | `src/app/core/utils/` | Central standard location for pure TypeScript helper functions (DRY-01) |
| Route Separation | Dedicated `ORGANIZER_ROUTES` vs `ADMIN_ROUTES` | Clarifies domain boundaries between regular event organizers and Super Admins (AD-020, AD-027, DRY-10..12) |
| Typed Mock Documents | `src/app/testing/types/mock-window.d.ts` | Replaces all 21 `(window as any)` occurrences in `firestore.gateway.ts` with zero type safety loss (DRY-13, DRY-14) |
| Skills Documentation | `.agents/skills/` + `docs/STYLE_GUIDE.md` | Provides explicit, hallucination-resistant rules for AI assistants and contributors (DRY-19..23) |

---
