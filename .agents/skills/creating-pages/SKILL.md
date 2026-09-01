---
name: creating-pages
description: Actionable step-by-step guide for authoring routed Smart Container pages, layout primitives, routing, and guards in Organiza AI.
---

# Organiza AI — Creating Pages (Smart Containers)

This skill provides step-by-step instructions for creating routed Smart Container pages in Organiza AI.

## Core Methodologies

All page authoring must adhere to:

- **`tlc-spec-driven`**: Specify user stories and acceptance criteria before implementation; build with atomic Conventional Commits.
- **`tdd`**: Write unit tests (`.container.spec.ts`) covering initialization, service delegation, state transitions, and error handling.
- **`bem-css`**: Style pages using strict BEM SCSS with `--org-*` design tokens, responsive layouts, and zero horizontal overflow.

---

## 1. Page File Architecture

Every routed page lives under its domain feature directory (`src/app/features/[domain]/`) and consists of 4 co-located files:

```
src/app/features/[domain]/[page-name]/
├── [page-name].container.ts        # Smart Container Component
├── [page-name].container.html      # Accessible semantic template
├── [page-name].container.scss      # BEM scoped styling
└── [page-name].container.spec.ts   # Vitest unit test suite
```

---

## 2. Step-by-Step Container Recipe

### Step 1: TypeScript Smart Container (`.container.ts`)

```typescript
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { EventService, AuthService } from '../../../core/services';
import { PartyEvent } from '../../../core/models';
import {
  FeedbackService,
  OrgButtonComponent,
  OrgEmptyStateComponent,
  OrgPageHeaderComponent,
  OrgPageLayoutComponent,
  OrgSectionComponent,
  OrgSurfaceComponent,
} from '../../../shared/ui';

@Component({
  selector: 'app-my-feature-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    OrgPageLayoutComponent,
    OrgPageHeaderComponent,
    OrgSectionComponent,
    OrgSurfaceComponent,
    OrgButtonComponent,
    OrgEmptyStateComponent,
  ],
  templateUrl: './my-feature-page.container.html',
  styleUrl: './my-feature-page.container.scss',
})
export class MyFeaturePageContainer implements OnInit {
  // 1. Route Parameter Inputs (withComponentInputBinding)
  readonly id = input<string>();

  // 2. Injected Services
  private readonly eventService = inject(EventService);
  private readonly authService = inject(AuthService);
  private readonly feedback = inject(FeedbackService);
  private readonly router = inject(Router);

  // 3. Reactive State Signals
  readonly loading = signal(true);
  private readonly events$ = this.eventService.listEvents();
  readonly events = toSignal(this.events$, { initialValue: [] as PartyEvent[] });

  // 4. Computed State
  readonly activeEvents = computed(() =>
    (this.events() ?? []).filter((e) => e.status !== 'cancelled'),
  );

  ngOnInit(): void {
    // Initial data fetch or setup if needed
    this.loading.set(false);
  }

  // 5. Actions / Event Handlers
  protected navigateToNew(): void {
    void this.router.navigate(['/meus-eventos/evento/novo']);
  }
}
```

### Step 2: Semantic HTML Template (`.container.html`)

Always wrap the container with `<org-page-layout>` and structure with `<org-page-header>` and `<org-section>`:

```html
<org-page-layout maxWidth="wide">
  <div class="my-feature-page" data-testid="my-feature-page">
    <!-- Header with Title, Subtitle, and Action Buttons -->
    <org-page-header
      title="Meus Eventos"
      subtitle="Gerencie suas celebrações, listas de convidados e itens."
      [gradient]="true"
    >
      <div orgPageHeaderActions class="my-feature-page__header-actions">
        <org-button
          variant="primary"
          label="Criar Evento"
          icon="add"
          testId="create-event-btn"
          (pressed)="navigateToNew()"
        />
      </div>
    </org-page-header>

    <!-- Sections for Logical Grouping -->
    <org-section title="Eventos Ativos" [count]="activeEvents().length">
      @if (loading()) {
      <org-surface class="my-feature-page__loading">
        <p>Carregando eventos...</p>
      </org-surface>
      } @else if (activeEvents().length === 0) {
      <org-empty-state
        icon="event"
        title="Nenhum evento ativo"
        description="Clique em 'Criar Evento' para organizar sua primeira festa."
      />
      } @else {
      <div class="my-feature-page__grid">
        @for (event of activeEvents(); track event.id) {
        <org-surface class="my-feature-page__card">
          <h3>{{ event.title }}</h3>
          <p>{{ event.location }}</p>
        </org-surface>
        }
      </div>
      }
    </org-section>
  </div>
</org-page-layout>
```

### Step 3: BEM Scoped Styles (`.container.scss`)

```scss
.my-feature-page {
  display: flex;
  flex-direction: column;
  gap: var(--org-spacing-6, 24px);

  &__header-actions {
    display: flex;
    align-items: center;
    gap: var(--org-spacing-3, 12px);
  }

  &__grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: var(--org-spacing-4, 16px);

    @media (min-width: 600px) {
      grid-template-columns: repeat(2, 1fr);
    }

    @media (min-width: 960px) {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  &__card {
    display: flex;
    flex-direction: column;
    gap: var(--org-spacing-2, 8px);
  }
}
```

### Step 4: Unit Test Suite (`.container.spec.ts`)

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { provideRouter } from '@angular/router';
import { MyFeaturePageContainer } from './my-feature-page.container';
import { EventService, AuthService } from '../../../core/services';
import { FeedbackService } from '../../../shared/ui';

describe('MyFeaturePageContainer', () => {
  let fixture: ComponentFixture<MyFeaturePageContainer>;
  let component: MyFeaturePageContainer;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyFeaturePageContainer],
      providers: [
        provideRouter([]),
        {
          provide: EventService,
          useValue: { listEvents: vi.fn().mockReturnValue(of([])) },
        },
        {
          provide: AuthService,
          useValue: { currentUser: signal({ uid: 'u-1' } as any) },
        },
        {
          provide: FeedbackService,
          useValue: { success: vi.fn(), error: vi.fn() },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MyFeaturePageContainer);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create container and render layout', () => {
    expect(component).toBeTruthy();
    const page = fixture.nativeElement.querySelector('[data-testid="my-feature-page"]');
    expect(page).toBeTruthy();
  });
});
```

---

## 3. Route Registration & Guard Wiring

### Organizer Route (`src/app/features/organizer/organizer.routes.ts`)

```typescript
export const ORGANIZER_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./dashboard/dashboard.container').then((m) => m.DashboardContainer),
  },
  {
    path: 'meu-recurso',
    loadComponent: () =>
      import('./my-feature-page/my-feature-page.container').then((m) => m.MyFeaturePageContainer),
  },
];
```

### Root Registration (`src/app/app.routes.ts`)

```typescript
export const routes: Routes = [
  {
    path: 'meus-eventos',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/organizer/organizer.routes').then((m) => m.ORGANIZER_ROUTES),
  },
  {
    path: 'admin',
    canActivate: [superAdminGuard],
    loadChildren: () => import('./features/admin/admin.routes').then((m) => m.ADMIN_ROUTES),
  },
];
```
