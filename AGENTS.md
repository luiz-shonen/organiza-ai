# Organiza AI — Agent Guidelines

**Role:** Senior Angular Architect (v22+) specialising in Design Systems, Component Libraries, and Enterprise Frontend Architecture.

**Goal:** Generate production-ready, reusable, scalable Angular code. All output must strictly follow the guidelines below.

---

## 0. Read These First — Always

1. **`DESIGN.md`** — Colour palette, Glassmorphism rules, typography, spacing, `--org-*` tokens, and mobile-first responsive guidelines.
2. **`README.md`** — Architecture, routes, services, commands, and test structure.
3. **`.specs/STATE.md`** — Architectural Decision Log (AD-001..AD-031). If a decision is already logged, apply it without questioning it.

---

## 1. Architecture & Angular Core

- **Standalone Components Only** — NgModules are forbidden (AD-001).
- **OnPush Change Detection** — mandatory on EVERY component, no exceptions (AD-002).
- **Modern Control Flow** — use `@if`, `@for`, `@switch`. Never `*ngIf`, `*ngFor`.
- **Signals** — local state uses `signal()`, `computed()`, `effect()`, `input()`, `output()`, `model()`. RxJS only for Firestore streams converted via `toSignal()` (AD-003).
- **Signal-Driven Form Inputs** — for reactive modal forms and instant validation, prefer signal state binding (`[value]="sig()"`, `(input)="sig.set($any($event.target).value)"`) or Reactive Forms to avoid `[(ngModel)]` lifecycle synchronization delays.
- **Smart/Dumb Pattern** — Containers (`*.container.ts`) handle Firebase and state. Presentational (`*.component.ts`) receive `input()` and emit `output()`. Zero business logic inside presentational components (AD-011).
- **Template Separation** — always `templateUrl` + `styleUrl`. Never inline template or styles.

## 2. Routes & Domains

| Route | Domain | Access |
|---|---|---|
| `/` | `home/` | Public |
| `/login` | `auth/` | Public |
| `/evento/:id` | `event-detail/` | Public |
| `/perfil` | `profile/` | `authGuard` |
| `/meus-eventos/**` | `organizer/` (via `admin.routes.ts`) | `authGuard` |
| `/admin/**` | `admin/` | `superAdminGuard` |

> `/meus-eventos` = organizer dashboard (any authenticated user). `/admin` = Super Admins only (platform metrics). **Never confuse the two.**

Organizer sub-routes:
- `/meus-eventos` → `DashboardContainer`
- `/meus-eventos/evento/novo` → `EventEditorContainer`
- `/meus-eventos/evento/:id` → `EventEditorContainer`

## 3. Accessibility (WCAG 2.1 AA) — Mandatory

- Semantic HTML: `<nav>`, `<button>`, `<dialog>`, `<section>`, `<main>`, `<article>`.
- ARIA: `aria-label`, `aria-expanded`, `aria-hidden`, `role` where native semantics are insufficient.
- Full keyboard navigability: interactive elements must be focusable (`tabindex`) and respond to `Enter` and `Space`.
- Primary touch targets $\ge 48\text{ px}$ (WCAG 2.5.5 AA) for buttons, icon buttons, filter chips, and dialog actions (`assertMinTouchTarget(locator, 48)`).

## 4. Styling, Theming & Mobile-First Responsiveness (AD-031)

- **SCSS + BEM** — no Tailwind, no `!important` (AD-007).
- **`--org-*` CSS variables** defined in `src/styles.scss`. Use them for colours, spacing, and typography.
- **Angular Material 22 MDC tokens** — customise via `--mdc-*` and `--mat-sys-*`, never by overriding internal classes (AD-028).
- **Glassmorphism required on all cards and modals**: `backdrop-filter: blur(24px)`, `background: rgba(255,255,255,0.6)`, 1.5 px gradient border Purple→Orange at 40% opacity.
- **Plus Jakarta Sans** on all text.
- **Mobile-First Responsive Layouts**:
  - Write base styles for mobile ($< 600\text{ px}$ / $< 640\text{ px}$), expanding to multi-column grids via `@media (min-width: 600px)` or `@media (min-width: 640px)`.
  - Form grids: `1fr` on mobile, expanding to `2fr 1fr`, `1fr 1fr`, or 3 columns on desktop.
  - Fluid padding: `16px 12px` on mobile $\rightarrow$ `24px 16px` / `32px 16px` on desktop.
  - Horizontal scrolling containers (Stepper headers, filter chips): specify `max-width: 100%`, `overflow-x: auto`, `flex-wrap: nowrap`, and `-webkit-overflow-scrolling: touch`.
  - **Zero Horizontal Overflow Invariant**: Every page must maintain `document.documentElement.scrollWidth <= window.innerWidth + 1` (`assertNoHorizontalOverflow(page)`).

## 5. Type Safety & SOLID

- Strict TypeScript. Zero `any`. Explicit Interfaces/Types for inputs, outputs, and state.
- One file per responsibility. DTOs and Interfaces live in the `/models` directory.

## 6. Firebase & Auth

- **Firebase Modular SDK** directly — no `@angular/fire` (AD-004).
- **Verified RSVP** — Google / verified e-mail identity required; no anonymous guests (AD-024).
- **Super Admins**: `luiz.gmr.dev@gmail.com`, `jessica.calm.dev@gmail.com` — hardcoded in `AuthService.isSuperAdmin` and `firestore.rules` (AD-005).
- **Open registration** — any authenticated Google user can create events without a manual whitelist (AD-016).
- **Collaborator invites** — by e-mail at `events/{id}/invitations/{email}`; auto-claimed on login (AD-022).
- **Never save** anonymous user data to the `users` collection. Always check `!user.isAnonymous`.

## 7. Testing

### Unit Tests (Vitest)
- 42 test suites, 298 tests.
- Every new feature ships with a `.spec.ts` file.
- Focus on component API: `input()` changes update the template; interactions trigger `output()`.
- Include accessibility assertions (ARIA, roles).

### E2E Tests (Playwright)
- 13 test suites, 146 tests across Desktop Chromium and Mobile Chrome.
- **Atomic test rule (AD-030)**: each test sets up its own state (mock session + navigation), asserts exactly one thing (one step, one screen, one behaviour), captures a screenshot, and ends. No test depends on another.
- To reach Step 2 of the event editor, that test's own `beforeEach` fills and advances Step 1 independently.
- Mock auth via `addInitScript` (IndexedDB injection). Mock Firestore via `__MOCK_DOCUMENTS__` + `page.route()`.
- Assert design tokens and layout invariants on happy-path & visual tests: `assertNoHorizontalOverflow(page)`, `backdrop-filter` on surfaces, `--org-primary` on focused inputs, `font-family` on headings, touch targets $\ge 48\text{ px}$.
- Page Object Models in `e2e/pages/`, Component Harnesses in `e2e/components/`.
- 47 visual screenshot baselines saved to `e2e/screenshots/`.

## 8. Spec-Driven Development (AD-013)

Every new feature goes through:
1. **Specify** — `spec.md` with User Stories and EARS Acceptance Criteria.
2. **(Design)** — only when new architecture is needed.
3. **(Tasks)** — only when there are more than 3 tasks.
4. **Execute** — implementation + one atomic commit per task.
5. **Validation** — independent Verifier sub-agent + Discrimination Sensor.

Specs live in `.specs/features/[feature]/`. Decisions live in `.specs/STATE.md`.

