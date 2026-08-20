import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';
import {
  EventDashboardFiltersComponent,
  EventStatusFilter,
  EventFilterCounts,
} from './event-filters.component';

@Component({
  standalone: true,
  imports: [EventDashboardFiltersComponent],
  template: `
    <app-event-filters
      [activeFilter]="activeFilter()"
      [filterCounts]="filterCounts()"
      (filterChange)="onFilterChange($event)"
    />
  `,
})
class TestHostComponent {
  readonly activeFilter = signal<EventStatusFilter>('all');
  readonly filterCounts = signal<EventFilterCounts>({
    all: 10,
    upcoming: 6,
    past: 3,
    cancelled: 1,
  });

  lastEmittedFilter: EventStatusFilter | null = null;

  onFilterChange(filter: EventStatusFilter): void {
    this.lastEmittedFilter = filter;
    this.activeFilter.set(filter);
  }
}

describe('EventDashboardFiltersComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let hostComponent: TestHostComponent;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent, EventDashboardFiltersComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    hostComponent = fixture.componentInstance;
    element = fixture.nativeElement;
    fixture.detectChanges();
  });

  it('should render all 4 filter tabs with labels and count badges', () => {
    const buttons = element.querySelectorAll<HTMLButtonElement>('button[role="tab"]');
    expect(buttons.length).toBe(4);

    const labels = Array.from(buttons).map(
      (b) => b.querySelector('.event-filters__label')?.textContent?.trim()
    );
    expect(labels).toEqual(['Todos', 'Em breve', 'Histórico', 'Cancelados']);

    const badges = Array.from(buttons).map(
      (b) => b.querySelector('.event-filters__badge')?.textContent?.trim()
    );
    expect(badges).toEqual(['10', '6', '3', '1']);
  });

  it('should highlight active filter tab with aria-selected="true" and active class', () => {
    const activeButton = element.querySelector<HTMLButtonElement>('#filter-tab-all');
    expect(activeButton?.getAttribute('aria-selected')).toBe('true');
    expect(activeButton?.classList.contains('event-filters__item--active')).toBe(true);

    const upcomingButton = element.querySelector<HTMLButtonElement>('#filter-tab-upcoming');
    expect(upcomingButton?.getAttribute('aria-selected')).toBe('false');
    expect(upcomingButton?.classList.contains('event-filters__item--active')).toBe(false);
  });

  it('should emit filterChange output when an inactive filter tab is clicked', () => {
    const upcomingButton = element.querySelector<HTMLButtonElement>('#filter-tab-upcoming');
    upcomingButton?.click();
    fixture.detectChanges();

    expect(hostComponent.lastEmittedFilter).toBe('upcoming');
    expect(upcomingButton?.getAttribute('aria-selected')).toBe('true');
    expect(upcomingButton?.classList.contains('event-filters__item--active')).toBe(true);
  });

  it('should not emit filterChange when clicking the already active filter tab', () => {
    hostComponent.lastEmittedFilter = null;
    const allButton = element.querySelector<HTMLButtonElement>('#filter-tab-all');
    allButton?.click();
    fixture.detectChanges();

    expect(hostComponent.lastEmittedFilter).toBeNull();
  });

  it('should support accessible attributes with role="tablist" on nav', () => {
    const nav = element.querySelector('nav');
    expect(nav?.getAttribute('role')).toBe('tablist');
    expect(nav?.getAttribute('aria-label')).toBe('Filtros de status dos eventos');
  });

  it('should have standardized data-testid attributes on filter chips', () => {
    const allButton = element.querySelector('#filter-tab-all');
    const upcomingButton = element.querySelector('#filter-tab-upcoming');
    const pastButton = element.querySelector('#filter-tab-past');
    const cancelledButton = element.querySelector('#filter-tab-cancelled');

    expect(allButton?.getAttribute('data-testid')).toBe('status-filter-all-chip');
    expect(upcomingButton?.getAttribute('data-testid')).toBe('status-filter-active-chip');
    expect(pastButton?.getAttribute('data-testid')).toBe('status-filter-past-chip');
    expect(cancelledButton?.getAttribute('data-testid')).toBe('status-filter-cancelled-chip');
  });
});
