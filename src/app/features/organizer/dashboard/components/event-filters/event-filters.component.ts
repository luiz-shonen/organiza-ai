import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export type EventStatusFilter = 'all' | 'upcoming' | 'past' | 'cancelled';

export interface EventFilterCounts {
  all: number;
  upcoming: number;
  past: number;
  cancelled: number;
}

export interface FilterTabOption {
  id: EventStatusFilter;
  label: string;
}

@Component({
  selector: 'app-event-filters',
  standalone: true,
  templateUrl: './event-filters.component.html',
  styleUrl: './event-filters.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventDashboardFiltersComponent {
  readonly activeFilter = input.required<EventStatusFilter>();
  readonly filterCounts = input<EventFilterCounts>({
    all: 0,
    upcoming: 0,
    past: 0,
    cancelled: 0,
  });

  readonly filterChange = output<EventStatusFilter>();

  readonly filterTabs: readonly FilterTabOption[] = [
    { id: 'all', label: 'Todos' },
    { id: 'upcoming', label: 'Em breve' },
    { id: 'past', label: 'Histórico' },
    { id: 'cancelled', label: 'Cancelados' },
  ];

  selectFilter(filter: EventStatusFilter): void {
    if (this.activeFilter() !== filter) {
      this.filterChange.emit(filter);
    }
  }

  getCount(filter: EventStatusFilter): number {
    const counts = this.filterCounts();
    return counts?.[filter] ?? 0;
  }
}
