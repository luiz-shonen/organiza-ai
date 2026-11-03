# Organiza AI

Organiza AI is a modern festive event planner — it transforms event organizing from a chore into a celebration. Any account signed in with Google or e-mail can create and manage its own events and invite collaborators; guests confirm attendance with a verified identity and can bring family members from their profile and other companions.

## Stack

| Layer          | Technology                                  |
| -------------- | ------------------------------------------- |
| Framework      | Angular 22 (Standalone Components, Signals) |
| UI Components  | Angular Material 22 (MDC tokens)            |
| Backend        | Firebase (Firestore, Auth, PWA/NGSW)        |
| Quality / Lint | ESLint 9 Flat Config, Stylelint, Prettier   |
| Git Hooks      | Husky, lint-staged, commitlint              |
| Unit Tests     | Vitest 4                                    |
| E2E Tests      | Playwright 1.62                             |

## Architecture

### Feature Domains (`src/app/features/`)

| Domain                                   | Route              | Access            |
| ---------------------------------------- | ------------------ | ----------------- |
| `home/`                                  | `/`                | Public            |
| `auth/`                                  | `/login`           | Public            |
| `event-detail/`                          | `/evento/:id`      | Public            |
| `profile/`                               | `/perfil`          | `authGuard`       |
| `organizer/` (via `organizer.routes.ts`) | `/meus-eventos/**` | `authGuard`       |
| `admin/` (via `admin.routes.ts`)         | `/admin/**`        | `superAdminGuard` |
| `design-system/`                         | `/design-system`   | `superAdminGuard` |

> **Important:** `/meus-eventos` is the organizer dashboard (any authenticated user). `/admin` is exclusively for Super Admins (platform metrics and governance). Never confuse the two.

### Organizer Sub-Routes (`/meus-eventos`)

```
/meus-eventos              → DashboardContainer
/meus-eventos/evento/novo  → EventEditorContainer (new event)
/meus-eventos/evento/:id   → EventEditorContainer (edit event)
```

### Core Services (`src/app/core/services/`)

`AuthService` · `EventService` · `GuestService` · `ItemService` · `FamilyService` · `UserService` · `LocationService` (ViaCEP) · `NotificationService` · `EventNotificationService` · `ConfettiService` · `ThemeService` · `SeasonalThemeService` · `DrawerService` · `HeaderService` · `FirebaseService` · `FirestoreGateway` · `FeedbackService` · `OrgDialogService`

### Architectural Decisions

Decisions and known gotchas live in [`docs/knowledge/`](docs/knowledge/index.md), one concept per file in Open Knowledge Format. Each rule lists the script or test that enforces it (`enforced_by`). The retired Spec-Driven Development specs are preserved in git under the tag `archive/sdd`.

## Design System

**Branco Essencial + Usabilidade**: white, flat cards on a calm canvas, with colour reserved for what matters. Full rules and the `Org*` catalog in `DESIGN.md`.

- Lilac (`--org-primary`, #7950F2) only for actions, sky blue for dates and info, leaf green for success and progress; destructive actions (every trash can, "Cancelar evento") in `--org-error` red.
- Fredoka for titles, Plus Jakarta Sans for body text; pill-shaped buttons.
- Editing happens in side drawers; dialogs only for alerts and confirmations (a danger tone before deleting or cancelling).
- Light and dark themes, plus seasonal overlays.

Invariants verified in E2E tests:

- Plus Jakarta Sans on body text and Fredoka on titles
- Touch targets $\ge 48\text{ px}$ on primary CTAs, icon buttons, chips and dialog actions
- Zero horizontal overflow (`document.documentElement.scrollWidth <= window.innerWidth + 1`) on every page

## Commands

### Firebase runtime configuration

The Firebase web API key is loaded from the ignored `runtime-config.js` file
so a rotated key is never committed (the repository is public). For local
development, copy `public/runtime-config.example.js` to
`public/runtime-config.js` and set the current restricted Firebase web API key,
then restart `ng serve`. Without it the app falls back to the E2E placeholder
key and every sign-in returns 400. The deploy workflows write the file from the
`FIREBASE_API_KEY` secret.

`runtime-config.js` is excluded from the service worker manifest and served
with `Cache-Control: no-cache`, so a rotated key needs no new build. If the file
fails to load, `main.ts` loads it again before the app starts. Restrict the key
to this app's authorized web origins and the Firebase APIs it needs in Google
Cloud.

```bash
# Development server
ng serve                        # http://localhost:4200

# Production build & deploy
npm run build                   # Production Angular build
npm run deploy                  # Build + deploy hosting & Firestore rules to Firebase

# Code Quality & Linting
npm run quality                 # Full suite: ESLint + Stylelint + UI Contracts + Prettier
npm run lint                    # ESLint (TypeScript + Angular templates)
npm run lint:styles             # Stylelint (SCSS BEM & design tokens)
npm run format:check            # Prettier formatting check
npm run format:write            # Prettier in-place auto-format

# Unit tests (Vitest)
npm test -- --watch=false       # 604 tests, 101 suites
npm run test:rules              # 51 rules tests across 8 suites against the Firestore emulator (needs Java)

# E2E tests (Playwright)
npm run test:e2e                # 232 tests across Desktop Chromium + Mobile Chrome (15 suites)
npm run test:e2e:ci             # Headless mode for CI
npm run test:e2e:mobile         # Mobile Chrome only (Pixel 5)

# Pull Requests & CI Automation
npm run pr:create               # Push branch and open Pull Request with personal GitHub token
```

## E2E Tests — Structure

```
e2e/
├── fixtures/        # test.fixture.ts — POM dependency injection
├── helpers/         # auth-mock, firestore-mock, a11y, visual & overflow helpers
├── pages/           # Page Object Models (BasePage, HomePage, LoginPage, ...)
├── components/      # Component Harnesses (RsvpDialog, ItemList, SharePanel, ...)
├── rules/           # Firestore security rules unit tests (*.rules.test.ts)
├── specs/           # Test suites (01-home-theming ... 13-organizer-happy-path, design-system-showcase, visual-regression)
└── screenshots/     # 60 visual baselines ({milestone}-desktop/mobile.png)
```

### E2E Test Philosophy — Atomic Tests

Each test is **atomic**: it sets up its own state via mock session + navigation, asserts exactly one thing (one step, one screen, one behaviour), captures a screenshot, and ends. No test depends on the result of another.

To reach Step 2 of the event editor, that test's own `beforeEach` fills and advances Step 1 independently.

### Test Suites (232 tests · Chromium + Mobile Chrome)

| File                              | Coverage                                                                                                                                                                                                                                                                 |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `01-home-theming.spec.ts`         | Feed, light/dark theme persistence, seasonal overlay, WCAG AA                                                                                                                                                                                                            |
| `02-auth-guards.spec.ts`          | Route guards, form validation, Google sign-in, superadmin guard                                                                                                                                                                                                          |
| `03-event-lifecycle.spec.ts`      | Filter chips, ViaCEP auto-fill, stepper validation, cancel dialog                                                                                                                                                                                                        |
| `04-guest-rsvp.spec.ts`           | Event detail, RSVP drawer, Pix split, item claim/unclaim                                                                                                                                                                                                                 |
| `05-profile-family.spec.ts`       | Profile, family roster CRUD, batch RSVP with family                                                                                                                                                                                                                      |
| `06-collaborator-rbac.spec.ts`    | Share panel, collaborator invite, clipboard                                                                                                                                                                                                                              |
| `07-visual-layout.spec.ts`        | Zero horizontal overflow (`assertNoHorizontalOverflow`), touch targets $\ge 48\text{ px}$, Nielsen Heuristics, screenshot baselines                                                                                                                                      |
| `08-keyboard-a11y.spec.ts`        | Focus cycling, modal focus trap, Escape key                                                                                                                                                                                                                              |
| `09-multi-user-sync.spec.ts`      | Dual-context real-time sync, no session crosstalk                                                                                                                                                                                                                        |
| `10-share-qr.spec.ts`             | QR code canvas, WhatsApp URI, clipboard                                                                                                                                                                                                                                  |
| `11-pwa-offline.spec.ts`          | Offline cache, form interactivity, reconnection                                                                                                                                                                                                                          |
| `12-network-loading.spec.ts`      | Throttled network, skeleton shimmer, layout shift                                                                                                                                                                                                                        |
| `13-organizer-happy-path.spec.ts` | **Atomic happy paths**: dashboard, create event (Steps 1–3 + submit), edit event, guest RSVP (detail + dialog + submit), profile update, family roster, collaborator invite + visual token assertions (`backdrop-filter`, `--org-primary`, `font-family`, 48 px targets) |

### Mocking Strategy

- **Firebase Auth**: `addInitScript` injects a session into IndexedDB before navigation
- **Firestore**: `__MOCK_DOCUMENTS__` on `window` + REST route intercepts via `page.route()`
- **ViaCEP**: `page.route()` with a deterministic response
- **No real Firebase dependency** — tests run fully offline

## CI/CD & Deployment

The project employs a fully automated CI/CD pipeline on GitHub Actions with smart path filtering and automated deployments:

### 1. CI Pipeline (`.github/workflows/ci.yml`)

Runs on every push and pull request against `main`:

- **Smart Path Filtering (`dorny/paths-filter@v3`)**: `npm run format:check` runs unconditionally on all commits. Linters, contract checks, build, and E2E tests are skipped when changes only touch markdown (`**/*.md`), completing CI in ~15 seconds.
- **Quality Gate (`quality`)**: ESLint Flat Config, Stylelint SCSS/tokens, UI Contract validation, and Angular production build.
- **E2E Testing (`e2e`)**: Runs downstream of `quality` (`needs: quality`) across Chromium and Mobile Chrome with browser and npm caching.

### 2. Production CD Pipeline (`.github/workflows/cd.yml`)

Triggers automatically via `workflow_run` when the CI Pipeline completes successfully on `main`:

- Injects `public/runtime-config.js` with the `FIREBASE_API_KEY` secret.
- Builds the production Angular application (`npm run build`).
- Deploys Cloud Firestore security rules and composite indexes (`firebase deploy --only firestore`).
- Deploys hosting assets to the `live` channel (`FirebaseExtended/action-hosting-deploy@v0`).

### 3. PR Preview Deployments (`.github/workflows/cd-preview.yml`)

Triggers on pull requests against `main` (for non-fork branches with code changes):

- Injects `public/runtime-config.js` with the `FIREBASE_API_KEY` secret.
- Builds the application and deploys to an ephemeral Firebase Hosting preview channel.
- Automatically posts a comment on the PR with the live preview URL.

### Required GitHub Secrets

- `FIREBASE_API_KEY`: Restricted Firebase Web API Key for `runtime-config.js`.
- `FIREBASE_SERVICE_ACCOUNT_ORGANIZA_AI_3416F`: Google Cloud / Firebase Service Account JSON credentials for deployment.
