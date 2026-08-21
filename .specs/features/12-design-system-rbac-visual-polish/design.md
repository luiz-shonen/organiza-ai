# Feature 12 Design — Design System, RBAC, Visual Polish & Responsive Layout Architecture

**Spec**: `.specs/features/12-design-system-rbac-visual-polish/spec.md`  
**Status**: Approved

---

## Architecture Overview

This architecture streamlines the role-based boundaries, upgrades the visual design across Home, Event Editor, Profile, and Dialogs, enforces the zero-horizontal-overflow responsive invariant, and aligns automated E2E test timing.

```mermaid
graph TD
    subgraph Navigation & RBAC
        AppToolbar[AppToolbar / UserMenu] -->|authGuard| MeusEventos[Organizer Dashboard /meus-eventos]
        AppToolbar -->|superAdminGuard + isSuperAdmin()| AdminPanel[Super Admin Platform /admin]
        MeusEventos --> EventEditor[EventEditor /meus-eventos/evento/:id]
        EventEditor --> CollabDialog[CollaboratorInviteDialog]
    end

    subgraph Visual & Design System
        HomeHero[Home Hero Banner] --> HomeGrid[Glassmorphic Event Cards]
        MdcTokens[MDC 3 & --org-* Tokens] --> FormInputs[Standardized Text/Select Inputs]
        DialogScrim[Global CDK Backdrop Scrim] --> Modals[High-Contrast Readable Dialogs]
    end

    subgraph Test & Synchronization
        Playwright[E2E Regression Suites] --> WaitStabilize[Wait for Step & Scroll Reset (0,0)]
        WaitStabilize --> ScreenshotBaselines[47 Clean Visual Baselines]
    end
```

---

## Code Reuse Analysis

### Existing Components to Leverage

| Component | Location | How to Use |
| --- | --- | --- |
| `App` Toolbar & Menu | `src/app/app.html`, `src/app/app.ts` | Refactor toolbar links, add `Meus Eventos` link, guard `Painel Admin` to `isSuperAdmin()` only, remove drawer references. |
| `HomeContainer` | `src/app/features/home/` | Redesign with modern hero section, festive gradient badge, and elevated glass cards. |
| `DashboardContainer` | `src/app/features/admin/dashboard/` | Remove `Novo Admin` button, remove `admin-form-drawer` references, clean up event table and mobile cards. |
| `EventEditorContainer` | `src/app/features/admin/event-editor/` | Fix title letter spacing, resolve mobile stepper left-edge offset, refine form inputs, clean up ViaCEP readonly state. |
| `CollaboratorInviteDialogComponent` | `src/app/features/organizer/event-editor/components/collaborator-invite-dialog/` | Fix Light mode text contrast (replace `#ffffff` with `--mat-sys-on-surface`), clean up title & actions. |
| `GuestFormDialogComponent` | `src/app/features/event-detail/components/guest-form-dialog/` | Clean up label-notch collision, fix transparent action button contrast. |
| `FamilyRosterManagerComponent` | `src/app/features/profile/components/family-roster-manager/` | Expand form grid layout on desktop to prevent placeholder clipping, replace invalid CSS variables with `--mat-sys-*` tokens. |
| `EventCardComponent` | `src/app/features/event-detail/components/event-card/` | Fix mobile hero height to prevent overlapping cards from clipping the event title, replace hardcoded "Você (Admin)" with "Você (Organizador)". |
| Global Styles (`styles.scss`) | `src/styles.scss` | Add `.cdk-overlay-dark-backdrop` glassmorphic scrim styling, standardize `.mat-mdc-form-field` and `.glass-input`. |

---

## Components

### 1. `App` Toolbar & Header Navigation (`src/app/app.ts`, `app.html`, `app.scss`)
- **Purpose**: Top-level application header, seasonal theme overlay, theme switcher, and role-based navigation.
- **Interfaces**:
  - `isSuperAdmin()`: boolean signal gating Super Admin metrics link.
  - `isAuthenticated()`: boolean computed signal gating "Meus Eventos" and user menu.
- **Changes**:
  - Add "Meus Eventos" button (`routerLink="/meus-eventos"`, icon `calendar_month`) on desktop toolbar when authenticated.
  - Only render "Painel Admin" link (`routerLink="/admin"`, icon `admin_panel_settings`) when `isSuperAdmin()` is true.
  - Update user dropdown menu to include "Meus Eventos" and conditionally "Painel Admin".
  - Remove `<app-admin-form-drawer>` and its drawer trigger from the layout.

### 2. `HomeContainer` (`src/app/features/home/`)
- **Purpose**: Public discovery page showing available/upcoming events.
- **Changes**:
  - Hero Section: Add an accent pill badge ("✨ Momentos Inesquecíveis"), large bold headline ("Descubra, Participe e Celebre"), and an engaging subtitle.
  - Event Cards Grid: Glassmorphic cards (`.glass-card`), date badge with distinct calendar month pill and large day number, location icon, title, description clamp, and smooth hover elevation.
  - Empty State: Refined glassmorphic empty card with clear invitation to create or log in.

### 3. `DashboardContainer` (`src/app/features/admin/dashboard/` / `organizer`)
- **Purpose**: Organizer dashboard displaying user-owned and collaborated events.
- **Changes**:
  - Remove `+ Novo Admin` button and `openAdminDialog()` method.
  - Remove `AdminFormDrawerComponent` imports.
  - Fix router link to create event (`routerLink="/meus-eventos/evento/novo"`).
  - Ensure filter chips container supports smooth horizontal scroll on mobile with `-webkit-overflow-scrolling: touch`.

### 4. `EventEditorContainer` (`src/app/features/admin/event-editor/`)
- **Purpose**: 3-step event creation and editing wizard (Basic Info, Address / ViaCEP, Pix / Wishlist).
- **Changes**:
  - Title: Remove `letter-spacing: -0.05em` from `&__title` to eliminate letter squishing.
  - Mobile Left Offset: Fix padding/margins on `.editor`, `.editor__stepper`, and `.editor__form` so that on mobile (< 600px) the content has uniform 12px-16px edge padding with zero left-side clipping.
  - Readonly Address Fields: Uniform styling for ViaCEP fields with disabled appearance, locked icon, and clear readable text.
  - Save button: Prominent, high-contrast primary gradient button.

### 5. `CollaboratorInviteDialogComponent` & `GuestFormDialogComponent`
- **Purpose**: Modal dialogs for collaborator invitation and guest RSVP confirmation.
- **Changes**:
  - In `collaborator-invite-dialog.component.scss`: Replace all `var(--org-text-primary, #ffffff)` and `#ffffff` colors with `var(--mat-sys-on-surface)` and `var(--mat-sys-on-surface-variant)`.
  - In `guest-form-dialog.component.scss`: Ensure floating labels and buttons maintain proper contrast and spacing.
  - In `src/styles.scss`: Add global backdrop scrim styling:
    ```scss
    .cdk-overlay-backdrop.cdk-overlay-dark-backdrop {
      background: rgba(15, 10, 20, 0.45) !important;
      backdrop-filter: blur(6px) !important;
      -webkit-backdrop-filter: blur(6px) !important;
    }
    ```

### 6. `EventCardComponent` (`src/app/features/event-detail/components/event-card/`)
- **Purpose**: Hero banner and key details card on the public event page.
- **Changes**:
  - Mobile Hero Height: Increase mobile `&__hero` height to `280px` (or `min-height: 280px`) and ensure `&__details-wrapper` does not overlap title text.
  - Host Section: Replace hardcoded `<p class="event-card__host-name">Você (Admin)</p>` with `<p class="event-card__host-name">Você (Organizador)</p>`.

### 7. `FamilyRosterManagerComponent` (`src/app/features/profile/components/family-roster-manager/`)
- **Purpose**: Profile view for managing private family members.
- **Changes**:
  - Grid: Update `__form-grid` to provide ample space for inputs on desktop (`1fr 1fr 1fr` or `1.5fr 1fr 1.2fr`) so phone placeholders are never clipped.
  - Token Cleanup: Replace hardcoded colors with `--mat-sys-*` design tokens.

### 8. Playwright Helpers & E2E Specs (`e2e/pages/base.page.ts`, `e2e/specs/`)
- **Purpose**: Automated regression testing and visual screenshot capture.
- **Changes**:
  - In `BasePage.captureScreenshot`: Reset scroll to `window.scrollTo(0, 0)` before taking full-page screenshots.
  - In `13-organizer-happy-path.spec.ts`: In Step 3 tests (`E2E-07`, `E2E-09`), explicitly wait for the active step container and inputs to become visible and stable before capturing screenshots.

---

## Error Handling Strategy

| Error Scenario | Handling | User Impact |
| --- | --- | --- |
| Unauthenticated access to `/meus-eventos` | `authGuard` redirects to `/login` with return URL | User is prompted to sign in before accessing dashboard |
| Non-superadmin access to `/admin` | `superAdminGuard` denies access and redirects to `/meus-eventos` | Organizers cannot view Super Admin metrics |
| ViaCEP service latency | Form displays clean disabled state during lookup without UI jumping | Smooth user experience during address resolution |

---

## Risks & Concerns

| Concern | Location (file:line) | Impact | Mitigation |
| --- | --- | --- | --- |
| Lingering drawer component references | `src/app/app.ts:29`, `src/app/app.html:10` | Dead code and unused drawer imports | Remove `AdminFormDrawerComponent` imports and template usage entirely |
| Text contrast in dark mode vs light mode dialogs | `collaborator-invite-dialog.component.scss:7` | Unreadable white-on-white text | Use `--mat-sys-on-surface` and `--mat-sys-on-surface-variant` which adapt automatically to `.dark` |
| Stepper animation race conditions in Playwright | `e2e/specs/13-organizer-happy-path.spec.ts:275` | Blank or mid-transition screenshots | Wait for step container visibility (`expect(page.locator('#pix-form')).toBeVisible()`) and scroll reset |

---

## Tech Decisions

| Decision | Choice | Rationale |
| --- | --- | --- |
| Admin Drawer Retirement | Completely remove `AdminFormDrawerComponent` | Satisfies AD-021; open registration renders manual admin creation obsolete |
| Global Backdrop Scrim | CSS `.cdk-overlay-dark-backdrop` with blur & dark tint | Provides clean separation between glassmorphic dialogs and background view |
| Mobile Stepper Padding | Standard fluid padding (`16px 12px`) without negative margins | Ensures zero horizontal offset on mobile viewports |
