import { TestBed } from '@angular/core/testing';
import type { Type } from '@angular/core';
import { describe, expect, it, vi } from 'vitest';
import { OrgDateBadgeComponent } from './data-display/org-date-badge.component';
import { OrgSplitProgressComponent } from './data-display/org-split-progress.component';
import { OrgFilterBarComponent } from './navigation/org-filter-bar.component';
import { OrgQuantityStepperComponent } from './forms/org-quantity-stepper.component';
import { OrgBottomSheetComponent } from './overlays/org-bottom-sheet.component';
import { OrgInsightCardComponent } from './feedback/org-insight-card.component';

async function create<T>(component: Type<T>) {
  await TestBed.configureTestingModule({ imports: [component] }).compileComponents();
  return TestBed.createComponent(component);
}

describe('OrgDateBadgeComponent', () => {
  it('shows month and day and announces the full date', async () => {
    const fixture = await create(OrgDateBadgeComponent);
    fixture.componentRef.setInput('date', '2026-08-23T20:00:00');
    fixture.detectChanges();

    const badge = fixture.nativeElement.querySelector('.org-date-badge') as HTMLElement;
    expect(badge.querySelector('.org-date-badge__month')?.textContent).toBe('AGO');
    expect(badge.querySelector('.org-date-badge__day')?.textContent).toBe('23');
    expect(badge.getAttribute('aria-label')).toBe('23 de agosto');
  });
});

describe('OrgFilterBarComponent', () => {
  async function bar() {
    const fixture = await create(OrgFilterBarComponent);
    fixture.componentRef.setInput('ariaLabel', 'Filtrar');
    fixture.componentRef.setInput('values', ['all']);
    fixture.componentRef.setInput('options', [
      { id: 'all', label: 'Todos' },
      { id: 'pending', label: 'Pendentes', count: 2, attention: true },
      { id: 'past', label: 'Realizados' },
    ]);
    fixture.detectChanges();
    const changes = vi.fn();
    fixture.componentInstance.valuesChange.subscribe((values) => {
      changes(values);
      fixture.componentRef.setInput('values', values);
      fixture.detectChanges();
    });
    const chip = (index: number) =>
      fixture.nativeElement.querySelectorAll('mat-chip-option')[index] as HTMLElement;
    const toggle = (index: number) => {
      (chip(index).querySelector('button') as HTMLButtonElement).click();
      fixture.detectChanges();
    };
    return { chip, toggle, changes };
  }

  it('starts on "Todos", with the counter on its chip', async () => {
    const { chip } = await bar();
    expect(chip(0).classList).toContain('mat-mdc-chip-selected');
    expect(chip(1).querySelector('.org-filter-bar__count--attention')?.textContent).toBe('2');
  });

  it('turns "Todos" off when another chip goes on, and lets several be on', async () => {
    const { toggle, changes } = await bar();
    toggle(1);
    expect(changes).toHaveBeenLastCalledWith(['pending']);
    toggle(2);
    expect(changes).toHaveBeenLastCalledWith(['pending', 'past']);
  });

  it('goes back to "Todos" when the last chip goes off or "Todos" is picked', async () => {
    const { toggle, changes } = await bar();
    toggle(1);
    toggle(1);
    expect(changes).toHaveBeenLastCalledWith(['all']);
    toggle(1);
    toggle(2);
    toggle(0);
    expect(changes).toHaveBeenLastCalledWith(['all']);
  });
});

describe('OrgSplitProgressComponent', () => {
  it('splits the bar by person and lists them in the legend', async () => {
    const fixture = await create(OrgSplitProgressComponent);
    fixture.componentRef.setInput('total', 10);
    fixture.componentRef.setInput('segments', [
      { label: 'Ana', value: 4 },
      { label: 'Marta', value: 2 },
    ]);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const segments = element.querySelectorAll<HTMLElement>('.org-split-progress__segment');
    expect(Array.from(segments).map((segment) => segment.style.inlineSize)).toEqual(['40%', '20%']);
    expect(element.querySelector('[role="progressbar"]')?.getAttribute('aria-valuenow')).toBe('6');
    expect(element.querySelectorAll('.org-split-progress__chip')).toHaveLength(2);
  });
});

describe('OrgQuantityStepperComponent', () => {
  it('stays between min and max', async () => {
    const fixture = await create(OrgQuantityStepperComponent);
    fixture.componentRef.setInput('max', 2);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const plus = element.querySelector('[data-testid="quantity-increase"]') as HTMLButtonElement;
    const minus = element.querySelector('[data-testid="quantity-decrease"]') as HTMLButtonElement;

    expect(minus.disabled).toBe(true);
    plus.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toBe(2);
    expect(plus.disabled).toBe(true);
  });
});

describe('OrgBottomSheetComponent', () => {
  it('renders only while open and closes on Escape', async () => {
    const fixture = await create(OrgBottomSheetComponent);
    fixture.componentRef.setInput('ariaLabel', 'Eu levo');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeNull();

    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeTruthy();

    const closed = vi.fn();
    fixture.componentInstance.closed.subscribe(closed);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(closed).toHaveBeenCalled();
  });
});

describe('OrgInsightCardComponent', () => {
  it('uses the warning tone when asked', async () => {
    const fixture = await create(OrgInsightCardComponent);
    fixture.componentRef.setInput('tone', 'warning');
    fixture.detectChanges();
    const card = fixture.nativeElement.querySelector('.org-insight-card') as HTMLElement;
    expect(card.classList).toContain('org-insight-card--warning');
    expect(card.textContent).toContain('Dica do Organiza AI');
  });
});
