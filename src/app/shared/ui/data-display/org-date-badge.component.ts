import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { eventLastDay, formatDaySpan } from '../../../core/utils/date.utils';

/** Month and day block ("AGO / 23") shown at the top right of event cards. */
@Component({
  selector: 'org-date-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './org-date-badge.component.html',
  styleUrl: './org-date-badge.component.scss',
})
export class OrgDateBadgeComponent {
  /** ISO date string. */
  public readonly date = input.required<string>();
  /** Last day ("2026-12-25") of an event over several days: the badge reads "23–25". */
  public readonly endDate = input<string | null | undefined>(null);

  private readonly parsed = computed(() => {
    const date = new Date(this.date());
    return isNaN(date.getTime()) ? null : date;
  });

  private readonly last = computed(() => eventLastDay(this.date(), this.endDate()));

  protected readonly month = computed(() => {
    const date = this.parsed();
    if (!date) return '';
    const monthOf = (day: Date) =>
      day.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '').toUpperCase();
    const last = this.last();
    return last && monthOf(last) !== monthOf(date)
      ? `${monthOf(date)}–${monthOf(last)}`
      : monthOf(date);
  });
  protected readonly day = computed(() => {
    const date = this.parsed();
    if (!date) return '';
    const pad = (day: Date) => day.getDate().toString().padStart(2, '0');
    const last = this.last();
    return last ? `${pad(date)}–${pad(last)}` : pad(date);
  });
  /** The day reads as a span ("23–25"), set one step smaller to fit. */
  protected readonly isSpan = computed(() => !!this.last());
  protected readonly label = computed(
    () =>
      formatDaySpan(this.date(), this.endDate()) ||
      (this.parsed()?.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' }) ?? ''),
  );
}
