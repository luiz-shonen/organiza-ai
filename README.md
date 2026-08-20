# Organiza AI

Organiza AI is a Modern Festive Planner application designed to transform task management and event organizing from a chore into a celebration.

## Project Architecture

This project is built using **Angular v21** and **Firebase**.

### Key Architectural Decisions

1. **Smart / Dumb Components**: The UI is strictly separated into Presentational (Dumb) components and Container (Smart) components.
2. **Signals-based State**: Angular Signals (`signal`, `computed`, `effect`) are used everywhere instead of RxJS for local component state.
3. **OnPush Change Detection**: All components strictly use `ChangeDetectionStrategy.OnPush`.
4. **Firebase backend**:
   - Firestore for database (events, guests, items)
   - Firebase Auth for authentication (Email/Password, Google).
   - Supports Anonymous Login for guests confirming RSVP.

## Design System

The UI is styled using **Glassmorphism** and a "Vibrant Collaboration System".
We use **Angular Material** as the base component library, but customize it heavily using CSS variables prefixing with `--mat-sys-` and `--org-`.
For full design specifications, read **`DESIGN.md`**.

## For AI Agents

If you are an AI Assistant (Claude, Gemini, Cursor, etc), please refer to `CLAUDE.md` or `GEMINI.md` for specific instructions on how to write code for this repository.

## Commands

### Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`.

### Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

### Automated Testing

- **Unit & Component Tests (Vitest)**:
  ```bash
  npm test -- --watch=false
  ```
- **End-to-End Tests (Playwright - Desktop Chromium & Mobile Chrome)**:
  ```bash
  npm run test:e2e
  ```
- **E2E CI Headless Execution**:
  ```bash
  npm run test:e2e:ci
  ```
- **E2E Mobile Viewport Only**:
  ```bash
  npm run test:e2e:mobile
  ```

### Visual Layout Baselines

The E2E suite automatically captures high-resolution visual layout baselines for key milestones across both **Desktop** and **Mobile** viewports into `e2e/screenshots/`:
- `e2e/screenshots/{milestone}-desktop.png` (Desktop Chromium - 1280x720)
- `e2e/screenshots/{milestone}-mobile.png` (Mobile Chrome - Pixel 5 / 393x851)

