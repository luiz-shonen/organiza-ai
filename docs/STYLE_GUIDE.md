---
name: style-guide
description: Comprehensive engineering style guide with concrete code DOs and DON'Ts for TypeScript strictness, OnPush Signals, BEM SCSS, Firebase, and WCAG accessibility.
---

# Organiza AI — Engineering Style Guide

This style guide establishes mandatory engineering standards for Organiza AI. All contributors and AI agents must strictly follow these rules.

## Core Methodologies

All feature development and code modifications must follow three foundational methodology skills:
1. **`tlc-spec-driven`**: Feature planning and execution through 4 adaptive phases (Specify, Design, Tasks, Execute) with atomic Conventional Commits, testable EARS acceptance criteria, and independent validation.
2. **`tdd`**: Test-Driven Development with Vitest (unit/component API) and Playwright (E2E journeys). Every feature ships with automated tests verifying contracts before completion.
3. **`bem-css`**: Strict Block-Element-Modifier (BEM) naming conventions in SCSS, scoped components, and tokenized custom properties (`--org-*`).

---

## 1. TypeScript & Architecture Guidelines

### Strictness & Typing
- **DO**: Use strict TypeScript with zero `any` types.
- **DO**: Create granular, one-interface-per-file models in `src/app/core/models/` and re-export them cleanly via `src/app/core/models/index.ts`.
- **DO**: Use typed mock window declarations (`src/app/testing/types/mock-window.d.ts`) for browser globals.
- **DON'T**: Use `any`, `(window as any)`, or `$any()` in TypeScript or templates.
- **DON'T**: Declare duplicate interfaces across components or services.

#### Code Example
```typescript
// ✅ DO: Strict model interface in src/app/core/models/relationship-option.model.ts
import type { FamilyRelationship } from './family.model';

export interface RelationshipOption {
  readonly value: FamilyRelationship;
  readonly label: string;
}

// ❌ DON'T: Inline any casting or duplicate local interfaces
function process(data: any) {
  const windowAny = window as any;
}
```

---

## 2. Angular Core & Signals Architecture

### Change Detection & Modern Control Flow
- **DO**: Use `ChangeDetectionStrategy.OnPush` on EVERY component without exception (AD-002).
- **DO**: Use standalone components exclusively; NgModules are forbidden (AD-001).
- **DO**: Use modern control flow syntax: `@if`, `@for (item of items; track item.id)`, `@switch`.
- **DO**: Manage state reactively using Angular Signals (`signal()`, `computed()`, `input()`, `output()`, `model()`). Convert Firestore RxJS observables via `toSignal()` (AD-003).
- **DON'T**: Use legacy directives `*ngIf`, `*ngFor`, or `*ngSwitch`.
- **DON'T**: Use `BehaviorSubject` for local component state.

### Smart / Dumb Pattern
- **DO**: Keep Presentational Components pure and dumb (`*.component.ts`). They receive state via `input()` and emit events via `output()`.
- **DO**: Place business logic, Firebase calls, dialog dispatches, and navigation in Container components (`*.container.ts`) (AD-011).
- **DON'T**: Inject Firestore or API services directly into presentational dumb components.

#### Code Example
```typescript
// ✅ DO: Pure Dumb Presentational Component
@Component({
  selector: 'app-item-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [OrgSurfaceComponent, OrgButtonComponent],
  templateUrl: './item-card.component.html',
  styleUrl: './item-card.component.scss',
})
export class ItemCardComponent {
  readonly item = input.required<PartyItem>();
  readonly claim = output<string>();

  protected onClaim(): void {
    this.claim.emit(this.item().id);
  }
}
```

---

## 3. Styling, Theming & Glassmorphism

### BEM & Design Tokens
- **DO**: Write modular SCSS using BEM methodology (`.block__element--modifier`).
- **DO**: Use `--org-*` CSS variables defined in `src/styles.scss` (Brand palette: `#ff4d94`, `#ff8c42`, `#ffc837`).
- **DO**: Apply Glassmorphism to cards, surfaces, and modals: `backdrop-filter: blur(24px)`, `background: var(--org-surface-glass)`, subtle gradient borders.
- **DO**: Write mobile-first styles (`<600px` base) expanding to multi-column grids via `@media (min-width: 600px)` and `@media (min-width: 960px)`.
- **DON'T**: Use Tailwind CSS or `!important`.
- **DON'T**: Hardcode hex colors, arbitrary border radii, or box shadows when `--org-*` tokens exist.
- **DON'T**: Cause horizontal overflow (`scrollWidth > innerWidth`).

#### Code Example
```scss
// ✅ DO: BEM styling with --org-* tokens and glassmorphism
.admin-card {
  background: var(--org-surface-glass, rgba(255, 255, 255, 0.75));
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1.5px solid var(--org-border-subtle, rgba(255, 77, 148, 0.3));
  border-radius: var(--org-radius-xl, 16px);
  padding: var(--org-spacing-5, 20px);

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--org-spacing-4, 16px);
  }

  &__title {
    font-size: var(--org-font-size-xl, 1.25rem);
    font-weight: 700;
    color: var(--org-text-primary, #0f172a);
  }

  &--highlighted {
    border-color: var(--org-primary, #ff4d94);
  }
}
```

---

## 4. Accessibility (WCAG 2.1 AA)

- **DO**: Use semantic HTML: `<header>`, `<nav>`, `<main>`, `<section>`, `<dialog>`, `<button>`.
- **DO**: Provide `aria-label` or `aria-labelledby` on all icon buttons, search inputs, and dialogs.
- **DO**: Ensure primary touch targets are at least $48 \times 48\text{ px}$ (WCAG 2.5.5 AA).
- **DO**: Support keyboard navigation: interactive elements must receive focus with visible focus rings and activate via `Enter` or `Space`.
- **DON'T**: Use non-interactive elements (`<div>`, `<span>`) with click listeners without keyboard handlers and ARIA roles.

---

## 5. Firebase & Domain Routing

- **DO**: Use Firebase Modular SDK directly (AD-004).
- **DO**: Protect routes with `authGuard` (for authenticated organizers on `/meus-eventos` and `/perfil`) and `superAdminGuard` (for Super Admins on `/admin` and `/design-system`).
- **DO**: Await `AuthService.waitForAuthReady()` in guards and initialize auth state reactively.
- **DO**: Decouple organizer features (`src/app/features/organizer/`) from Super Admin governance (`src/app/features/admin/`).
- **DON'T**: Save anonymous guest credentials to the `users` collection. Always verify `!user.isAnonymous`.
- **DON'T**: Confuse `/meus-eventos` (organizer event management) with `/admin` (Super Admin platform metrics).

---

## 6. Testing Standards

- **Unit Tests (Vitest)**: Every component, service, and utility must ship with a `.spec.ts` testing inputs, outputs, branch conditions, and accessibility attributes.
- **E2E Tests (Playwright)**: Write atomic tests with independent state setups using `setupMockAuthSession()`. Assert design tokens, layout invariants (`assertNoHorizontalOverflow`), and touch target sizes ($\ge 48\text{ px}$).
