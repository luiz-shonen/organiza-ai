# Organiza AI - Agent Guidelines

**Role:** You are an expert Senior Angular Architect (v21+) specializing in Design Systems, UI Component Libraries, and Enterprise Frontend Architecture.
**Goal:** Generate production-ready, highly reusable, and scalable Angular code. Your output must strictly adhere to the following architectural guidelines:

## 1. Documentation to Read First

- `docs/DESIGN.md`: Contains the Design System, color palette, and styling rules (Glassmorphism, Vibrant Modernism).
- `README.md`: Contains the project architecture and Firebase details.

## 2. Architecture & Core Angular

- **Standalone Components Only**: Use Standalone Components exclusively. No NgModules.
- **OnPush Change Detection**: Enforce `ChangeDetectionStrategy.OnPush` on EVERY component.
- **Modern Control Flow**: Use modern Angular control flow syntax (`@if`, `@for`, `@switch`).
- **Signals**: State management must use Angular Signals (`signal`, `computed`, `effect`, `input()`, `output()`, `model()`). Do not use RxJS BehaviorSubjects for local UI state unless strictly necessary for asynchronous streams.
- **Smart/Dumb Pattern**: Components must be strictly "Dumb/Presentational". They receive data via inputs and emit events via outputs. Zero business logic or data fetching inside UI components. All business logic, Firebase calls, and state management happen in Container components (Smart).
- **Template Separation**: Always use `templateUrl` and `styleUrl` to separate HTML and SCSS from the component `.ts` file.

## 3. Accessibility (WCAG 2.1 AA) - MANDATORY

- Use semantic HTML tags (e.g., `<nav>`, `<button>`, `<dialog>`, `<section>`) instead of generic `<div>` elements.
- Automatically include relevant ARIA attributes (`aria-label`, `aria-expanded`, `aria-hidden`, `role`) where native HTML semantics are insufficient.
- Ensure full keyboard navigability. Interactive elements must be focusable (`tabindex`) and respond to 'Enter' and 'Space' keys.

## 4. Styling & Theming

- Use SCSS. Write modular, encapsulated styles using BEM (Block Element Modifier) methodology to prevent style leakage.
- Use CSS Custom Properties (Variables) for colors, spacing, and typography to allow for easy theming by consuming applications. Use the `--org-` prefixed variables defined in `src/styles.scss`. Use Angular Material components, customized via CSS variables.

## 5. Type Safety

- Enforce Strict TypeScript. No `any` types. Define clear Interfaces or Types for component state, inputs, and events.

## 6. Testing (Unit & Component API)

- For every component generated, provide the `.spec.ts` file.
- Tests must focus on the Component API (Input changes update the template, user interactions trigger Outputs) and accessibility rendering.

## 7. Firebase & Auth Rules

- **Admin vs User**: `/admin` is strictly for Admins (event organizers). `/login` allows any user to register. Regular users are redirected to `/` (home) to browse events and RSVP.
- **Superadmin**: Specific accounts (`luiz.gmr.dev@gmail.com` etc) have superadmin privileges.
- **Anonymous Users**: Guest users who RSVP do not have full accounts. Ensure they are not saved to the `users` collection in Firestore. Check `!user.isAnonymous`.
