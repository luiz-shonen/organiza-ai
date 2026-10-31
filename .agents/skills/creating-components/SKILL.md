---
name: creating-components
description: Actionable step-by-step guide for authoring pure Dumb Presentational UI components with signal inputs/outputs, OnPush change detection, and BEM SCSS.
---

# Organiza AI — Creating Components (Dumb / Presentational)

This skill provides step-by-step instructions for authoring pure presentational UI components in Organiza AI.

## Core Methodologies

All component authoring must adhere to:

- **Test-first** ([workflow](../../../docs/knowledge/decisions/workflow.md)): state the goal and an observable acceptance check, write the test that proves it, then implement; commit with Conventional Commits.
- **`tdd`**: Author component unit tests (`.component.spec.ts`) testing input rendering, output emissions, disabled behavior, and accessibility.
- **`bem-css`**: Style components using strict BEM SCSS, `--org-*` custom properties, and glassmorphism styling.

---

## 1. Principles of Dumb / Presentational Components

- **Zero Business Logic**: Presentational components never fetch data, never inject Firestore/backend services, and never perform navigation.
- **Signal-Driven API**: State flows in through `input()` or `input.required()`, and events flow out through `output()`.
- **Mandatory OnPush**: Every component must declare `changeDetection: ChangeDetectionStrategy.OnPush`.
- **Template Separation**: Always use `templateUrl` and `styleUrl`. Never inline templates or styles.
- **Strict BEM**: Block name matches the component selector without `app-` prefix (e.g. `app-item-card` $\rightarrow$ `.item-card`).
- **WCAG 2.1 AA**: Native semantic elements, ARIA attributes, keyboard support, and minimum 48px touch targets.

---

## 2. Step-by-Step Component Recipe

### Step 1: TypeScript Component (`.component.ts`)

```typescript
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { PartyItem } from '../../../core/models';
import { OrgBadgeComponent, OrgButtonComponent, OrgSurfaceComponent } from '../../../shared/ui';

@Component({
  selector: 'app-item-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule, OrgSurfaceComponent, OrgBadgeComponent, OrgButtonComponent],
  templateUrl: './item-card.component.html',
  styleUrl: './item-card.component.scss',
})
export class ItemCardComponent {
  // 1. Required and Optional Signal Inputs
  readonly item = input.required<PartyItem>();
  readonly isClaimedByMe = input(false);
  readonly disabled = input(false);

  // 2. Signal Outputs
  readonly claim = output<string>();
  readonly unclaim = output<string>();

  // 3. Computed Signals
  readonly isAssigned = computed(() => Boolean(this.item().assignedTo));

  // 4. Interaction Handlers
  protected onClaimToggle(): void {
    if (this.disabled()) return;

    if (this.isClaimedByMe()) {
      this.unclaim.emit(this.item().id);
    } else {
      this.claim.emit(this.item().id);
    }
  }
}
```

### Step 2: Semantic HTML Template (`.component.html`)

```html
<org-surface class="item-card" [class.item-card--claimed]="isAssigned()">
  <div class="item-card__header">
    <h3 class="item-card__title">{{ item().name }}</h3>
    @if (item().quantity > 1) {
    <org-badge variant="default" [label]="item().quantity + ' un'" />
    }
  </div>

  @if (item().description) {
  <p class="item-card__description">{{ item().description }}</p>
  }

  <div class="item-card__footer">
    <span class="item-card__status">
      @if (isAssigned()) { Trazido por: <strong>{{ item().assignedToName || 'Convidado' }}</strong>
      } @else { Disponível para levar }
    </span>

    <org-button
      [variant]="isClaimedByMe() ? 'secondary' : 'primary'"
      [label]="isClaimedByMe() ? 'Desistir' : 'Vou levar'"
      [disabled]="disabled() || (isAssigned() && !isClaimedByMe())"
      testId="claim-btn"
      (pressed)="onClaimToggle()"
    />
  </div>
</org-surface>
```

### Step 3: BEM Scoped Styles (`.component.scss`)

```scss
.item-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: var(--org-space-md);
  transition:
    transform 0.2s ease,
    border-color 0.2s ease;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--org-space-sm);
  }

  &__title {
    font-size: var(--org-font-size-md);
    font-weight: var(--org-font-weight-semibold);
    color: var(--org-on-surface);
    margin: 0;
  }

  &__description {
    font-size: var(--org-font-size-sm);
    color: var(--org-on-surface-variant);
    margin: 0;
  }

  &__footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    margin-top: auto;
    padding-top: var(--org-space-sm);
    border-top: 1px solid var(--org-outline-variant);
  }

  &__status {
    font-size: var(--org-font-size-xs);
    color: var(--org-on-surface-muted);
  }

  &--claimed {
    border-color: var(--org-primary, #ff4d94);
  }
}
```

### Step 4: Unit Test Suite (`.component.spec.ts`)

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ItemCardComponent } from './item-card.component';
import { PartyItem } from '../../../core/models';

describe('ItemCardComponent', () => {
  let fixture: ComponentFixture<ItemCardComponent>;
  let component: ItemCardComponent;

  const mockItem: PartyItem = {
    id: 'item-1',
    name: 'Refrigerante 2L',
    quantity: 3,
    eventId: 'evt-1',
    assignedTo: null,
    assignedToName: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ItemCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ItemCardComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('item', mockItem);
    fixture.detectChanges();
  });

  it('should render item title and quantity badge', () => {
    const title = fixture.nativeElement.querySelector('.item-card__title');
    expect(title.textContent).toContain('Refrigerante 2L');
  });

  it('should emit claim output when claim button is clicked', () => {
    const claimSpy = vi.fn();
    component.claim.subscribe(claimSpy);

    const btn = fixture.nativeElement.querySelector('[data-testid="claim-btn"]');
    btn.click();

    expect(claimSpy).toHaveBeenCalledWith('item-1');
  });

  it('should emit unclaim output when user is current assignee', () => {
    fixture.componentRef.setInput('isClaimedByMe', true);
    fixture.detectChanges();

    const unclaimSpy = vi.fn();
    component.unclaim.subscribe(unclaimSpy);

    const btn = fixture.nativeElement.querySelector('[data-testid="claim-btn"]');
    btn.click();

    expect(unclaimSpy).toHaveBeenCalledWith('item-1');
  });
});
```
