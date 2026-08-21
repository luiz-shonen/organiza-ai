# Feature 12 Tasks — Design System, RBAC, Visual Polish & Responsive Layout Architecture

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Design**: `.specs/features/12-design-system-rbac-visual-polish/design.md`  
**Status**: In Progress

---

## Test Coverage Matrix

> Generated from codebase, project guidelines (`AGENTS.md`), and spec.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| --- | --- | --- | --- | --- |
| Component (UI/Presentational) | unit | Input changes update template, outputs trigger, ARIA & roles verified | `src/app/**/*.spec.ts` | `npm test -- --watch=false` |
| Container (Smart) | unit | State signals, routing, service calls tested | `src/app/**/*.container.spec.ts` | `npm test -- --watch=false` |
| E2E / Layout / Visual | e2e | Happy path, touch targets >= 48px, zero horizontal overflow, screenshots | `e2e/specs/*.spec.ts` | `npm run test:e2e` |
| Styles / Tokens | none | Build gate + E2E visual assertions | `src/styles.scss` | `npm run build` |

---

## Gate Check Commands

| Gate Level | When to Use | Command |
| --- | --- | --- |
| Quick | After tasks with unit tests only | `npm test -- --watch=false` |
| Full | After tasks with e2e/visual tests | `npm run test:e2e` |
| Build | After styling, routing or phase completion | `npm run build && npm test -- --watch=false` |

---

## Execution Plan

Phases are ordered and run sequentially — each phase completes before the next begins, and tasks within a phase execute in order.

### Phase 1: RBAC Boundary & Organizer Navigation

Eliminate admin creation leaks from the organizer dashboard, retire unused drawer components, and clean up role-based toolbar navigation.

```
T1 → T2 → T3 → T4
```

### Phase 2: Visual Polish & Design System Tokens

Elevate the Home page hero and event cards, add a global dialog backdrop scrim, fix modal contrast in light/dark mode, and standardize form inputs.

```
T5 → T6 → T7 → T8
```

### Phase 3: Mobile Viewport & Stepper Layout Fixes

Fix the mobile left-edge padding offset, stepper headers, and title letter spacing in the Event Editor.

```
T9 → T10
```

### Phase 4: E2E Test Timing & Screenshot Baselines

Enhance screenshot capture helpers with scroll reset and step stabilization, update E2E assertions, and regenerate all 47 visual baselines.

```
T11 → T12 → T13
```

---

## Task Breakdown

### Phase 1: RBAC Boundary & Organizer Navigation

### T1: Retire AdminFormDrawerComponent and Remove Drawer References from App Shell

**What**: Remove `AdminFormDrawerComponent` imports, template markup, and drawer references from `App` shell component.  
**Where**: `src/app/app.ts`  
**Depends on**: None  
**Reuses**: `DrawerService`  
**Requirement**: RBAC-01, RBAC-02  

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] `AdminFormDrawerComponent` is removed from `App` imports and `app.html`
- [ ] Unused admin drawer code is cleanly removed without breaking `DrawerService`
- [ ] Unit tests pass: `npm test -- --watch=false`

**Tests**: unit  
**Gate**: quick  

---

### T2: Add "Meus Eventos" Link and Restrict "Painel Admin" to Super Admins in Toolbar & Menu

**What**: Update the toolbar template and user menu to show "Meus Eventos" for all authenticated users and gate "Painel Admin" strictly to `isSuperAdmin()`.  
**Where**: `src/app/app.html`  
**Depends on**: T1  
**Reuses**: `AuthService.isSuperAdmin`  
**Requirement**: RBAC-02, RBAC-03  

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] "Meus Eventos" button (`routerLink="/meus-eventos"`) rendered on desktop toolbar when user is authenticated
- [ ] "Painel Admin" link is hidden unless `isSuperAdmin()` is true
- [ ] User menu dropdown includes "Meus Eventos" and "Meu Perfil"
- [ ] Unit tests pass: `npm test -- --watch=false`

**Tests**: unit  
**Gate**: quick  

---

### T3: Remove "Novo Admin" Button from Organizer Dashboard

**What**: Remove the "Novo Admin" button, drawer trigger methods, and admin creation UI from the organizer dashboard container.  
**Where**: `src/app/features/admin/dashboard/dashboard.container.html`  
**Depends on**: T2  
**Reuses**: `DashboardContainer`  
**Requirement**: RBAC-01  

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] "Novo Admin" button is removed from `dashboard.container.html`
- [ ] `openAdminDialog` method is removed or cleaned up from `dashboard.container.ts`
- [ ] "Novo Evento" button remains fully accessible with >= 48px touch target
- [ ] Unit tests pass: `npm test -- --watch=false`

**Tests**: unit  
**Gate**: quick  

---

### T4: Update Organizer Routing and Link Paths

**What**: Ensure router links in `DashboardContainer` and `EventEditorContainer` point to `/meus-eventos` routes and clean up route declarations.  
**Where**: `src/app/app.routes.ts`  
**Depends on**: T3  
**Reuses**: `app.routes.ts`  
**Requirement**: RBAC-05  

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] Router links in dashboard point to `/meus-eventos/evento/novo`
- [ ] `app.routes.ts` enforces `authGuard` on `/meus-eventos` and `superAdminGuard` on `/admin`
- [ ] App routes unit tests pass: `npm test -- --watch=false`

**Tests**: unit  
**Gate**: quick  

---

### Phase 2: Visual Polish & Design System Tokens

### T5: Redesign Home Page Hero Section and Elevated Glassmorphic Event Cards

**What**: Transform the Home page header into a modern festive Hero section with an accent pill badge, gradient headline, and elevated glass cards with date badges.  
**Where**: `src/app/features/home/home.container.html`  
**Depends on**: T4  
**Reuses**: `DESIGN.md` tokens, `HomeContainer`  
**Requirement**: VISUAL-01, VISUAL-02  

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] Home header features an accent pill badge and bold headline ("Descubra, Participe e Celebre")
- [ ] Event cards display calendar date pills with month and day, location icon, and glassmorphic elevation
- [ ] Unit tests in `home.container.spec.ts` pass: `npm test -- --watch=false`

**Tests**: unit  
**Gate**: quick  

---

### T6: Add Global Dialog Backdrop Scrim and Fix Text Contrast in Modals

**What**: Style `.cdk-overlay-dark-backdrop` with a dark blurred scrim and replace `#ffffff` hardcoded colors in `CollaboratorInviteDialogComponent` with `--mat-sys-on-surface`.  
**Where**: `src/styles.scss`  
**Depends on**: T5  
**Reuses**: `DESIGN.md` Glassmorphism tokens  
**Requirement**: VISUAL-03  

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] `.cdk-overlay-dark-backdrop` has `background: rgba(15, 10, 20, 0.45)` and `backdrop-filter: blur(6px)`
- [ ] `collaborator-invite-dialog.component.scss` uses `--mat-sys-on-surface` and `--mat-sys-on-surface-variant` with 100% readable contrast in Light and Dark modes
- [ ] Dialog unit tests pass: `npm test -- --watch=false`

**Tests**: unit  
**Gate**: quick  

---

### T7: Fix Event Detail Mobile Hero Height and Organizer Host Label

**What**: Increase EventCard hero height on mobile to prevent overlapping cards from clipping the title, and change host label from "Você (Admin)" to "Você (Organizador)".  
**Where**: `src/app/features/event-detail/components/event-card/event-card.component.html`  
**Depends on**: T6  
**Reuses**: `EventCardComponent`  
**Requirement**: RBAC-04, VISUAL-04  

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] Host section displays "Você (Organizador)"
- [ ] Mobile hero height accommodates category badge and multiline title without clipping
- [ ] EventCard unit tests pass: `npm test -- --watch=false`

**Tests**: unit  
**Gate**: quick  

---

### T8: Standardize Form Inputs & Fix Family Roster Desktop Form Grid

**What**: Refine the Family Roster Manager form grid so inputs stack cleanly on mobile and have ample width on desktop with zero truncated placeholders.  
**Where**: `src/app/features/profile/components/family-roster-manager/family-roster-manager.component.scss`  
**Depends on**: T7  
**Reuses**: `FamilyRosterManagerComponent`  
**Requirement**: VISUAL-04  

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] Family roster form grid allocates adequate column widths on desktop
- [ ] CSS fallback colors replaced with official `--mat-sys-*` tokens
- [ ] Family roster unit tests pass: `npm test -- --watch=false`

**Tests**: unit  
**Gate**: quick  

---

### Phase 3: Mobile Viewport & Stepper Layout Fixes

### T9: Fix Event Editor Mobile Viewport Padding Offset and Title Letter Spacing

**What**: Remove negative letter-spacing from `&__title` and fix mobile padding/margins on `.editor` and `.editor__stepper` to eliminate left-edge clipping.  
**Where**: `src/app/features/admin/event-editor/event-editor.container.scss`  
**Depends on**: T8  
**Reuses**: `EventEditorContainer`  
**Requirement**: RESP-01, RESP-02  

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] "NOVO EVENTO" and "EDITAR EVENTO" render without letter collision
- [ ] Mobile viewports (< 600px) maintain uniform 12px-16px padding on left and right edges with zero clipping
- [ ] Unit tests pass: `npm test -- --watch=false`

**Tests**: unit  
**Gate**: quick  

---

### T10: Refine ViaCEP Readonly Address Fields in Event Editor

**What**: Apply clean, uniform, subtle glass readonly styling and locked icon to address fields auto-populated by ViaCEP.  
**Where**: `src/app/features/admin/event-editor/event-editor.container.html`  
**Depends on**: T9  
**Reuses**: `EventEditorContainer`  
**Requirement**: VISUAL-05  

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] Readonly address fields have clean locked styling matching the design system
- [ ] Address step validation works smoothly with ViaCEP auto-population
- [ ] Unit tests pass: `npm test -- --watch=false`

**Tests**: unit  
**Gate**: quick  

---

### Phase 4: E2E Test Timing & Screenshot Baselines

### T11: Enhance BasePage Screenshot Capture Helper with Scroll Reset

**What**: Update `BasePage.captureScreenshot` to reset scroll position to `(0, 0)` and wait for DOM and animation settling before capturing.  
**Where**: `e2e/pages/base.page.ts`  
**Depends on**: T10  
**Reuses**: `BasePage`  
**Requirement**: E2E-01  

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] `captureScreenshot` executes `window.scrollTo(0, 0)` before triggering `page.screenshot`
- [ ] Full-page screenshots include headers and top banners without scroll clipping

**Tests**: e2e  
**Gate**: full  

---

### T12: Fix Step 3 Pix and Wishlist Step Synchronization in E2E Specs

**What**: Update `e2e/specs/13-organizer-happy-path.spec.ts` so Step 3 tests wait for step container visibility and animation completion before taking screenshots.  
**Where**: `e2e/specs/13-organizer-happy-path.spec.ts`  
**Depends on**: T11  
**Reuses**: `13-organizer-happy-path.spec.ts`  
**Requirement**: E2E-02  

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] `13-06-step3-pix-empty` waits for Step 3 container to be visible and stable
- [ ] `13-07-step3-wishlist-items` captures the active wishlist card without scrolling away
- [ ] E2E tests pass: `npm run test:e2e`

**Tests**: e2e  
**Gate**: full  

---

### T13: Regenerate and Verify All 47 Visual Screenshot Baselines

**What**: Run full E2E test suite across Desktop Chromium and Mobile Chrome and verify all 47 screenshot baselines are crisp, complete, and free of visual defects.  
**Where**: `e2e/specs/07-visual-layout.spec.ts`  
**Depends on**: T12  
**Reuses**: `e2e/screenshots/`  
**Requirement**: E2E-03  

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] All 47 screenshot files regenerated in `e2e/screenshots/`
- [ ] Zero blank surfaces, zero white-text contrast bugs, zero left-side clipping on mobile
- [ ] All 13 E2E test suites pass on Chromium and Mobile Chrome

**Tests**: e2e  
**Gate**: full  

---

## Task Granularity Check

| Task | Scope | Status |
| --- | --- | --- |
| T1: Retire AdminFormDrawerComponent | 1 component / shell | ✅ Granular |
| T2: Update Toolbar Navigation & Menu | 1 template | ✅ Granular |
| T3: Remove Novo Admin from Dashboard | 1 container template | ✅ Granular |
| T4: Update Organizer Routing & Links | 1 routing config | ✅ Granular |
| T5: Redesign Home Page Hero & Cards | 1 container | ✅ Granular |
| T6: Add Dialog Backdrop & Fix Modal Contrast | 1 stylesheet | ✅ Granular |
| T7: Fix Event Detail Mobile Hero Height | 1 component | ✅ Granular |
| T8: Fix Family Roster Form Grid | 1 component style | ✅ Granular |
| T9: Fix Event Editor Mobile Offset & Title Tracking | 1 container style | ✅ Granular |
| T10: Refine ViaCEP Readonly Fields | 1 container template | ✅ Granular |
| T11: Enhance BasePage Screenshot Helper | 1 page helper | ✅ Granular |
| T12: Fix Step 3 Step Synchronization in E2E | 1 test suite | ✅ Granular |
| T13: Regenerate All 47 Screenshot Baselines | 1 test suite / baselines | ✅ Granular |

---

## Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
| --- | --- | --- | --- |
| T1 | None | None | ✅ Match |
| T2 | T1 | T1 → T2 | ✅ Match |
| T3 | T2 | T2 → T3 | ✅ Match |
| T4 | T3 | T3 → T4 | ✅ Match |
| T5 | T4 | None (Phase 2 start) | ✅ Match |
| T6 | T5 | T5 → T6 | ✅ Match |
| T7 | T6 | T6 → T7 | ✅ Match |
| T8 | T7 | T7 → T8 | ✅ Match |
| T9 | T8 | None (Phase 3 start) | ✅ Match |
| T10 | T9 | T9 → T10 | ✅ Match |
| T11 | T10 | None (Phase 4 start) | ✅ Match |
| T12 | T11 | T11 → T12 | ✅ Match |
| T13 | T12 | T12 → T13 | ✅ Match |

---

## Test Co-location Validation

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
| --- | --- | --- | --- | --- |
| T1: Retire AdminFormDrawerComponent | Component / Shell | unit | unit | ✅ OK |
| T2: Update Toolbar Navigation & Menu | Component / Shell | unit | unit | ✅ OK |
| T3: Remove Novo Admin from Dashboard | Container | unit | unit | ✅ OK |
| T4: Update Organizer Routing & Links | Route / Config | unit | unit | ✅ OK |
| T5: Redesign Home Page Hero & Cards | Container | unit | unit | ✅ OK |
| T6: Add Dialog Backdrop & Fix Modal Contrast | Styles / Component | unit | unit | ✅ OK |
| T7: Fix Event Detail Mobile Hero Height | Component | unit | unit | ✅ OK |
| T8: Fix Family Roster Form Grid | Component | unit | unit | ✅ OK |
| T9: Fix Event Editor Mobile Offset & Title Tracking | Container Style | unit | unit | ✅ OK |
| T10: Refine ViaCEP Readonly Fields | Container Template | unit | unit | ✅ OK |
| T11: Enhance BasePage Screenshot Helper | E2E Helper | e2e | e2e | ✅ OK |
| T12: Fix Step 3 Step Synchronization in E2E | E2E Spec | e2e | e2e | ✅ OK |
| T13: Regenerate All 47 Screenshot Baselines | E2E Spec | e2e | e2e | ✅ OK |
