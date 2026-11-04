import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

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

  private readonly parsed = computed(() => {
    const date = new Date(this.date());
    return isNaN(date.getTime()) ? null : date;
  });

  protected readonly month = computed(
    () =>
      this.parsed()
        ?.toLocaleDateString('pt-BR', { month: 'short' })
        .replace('.', '')
        .toUpperCase() ?? '',
  );
  protected readonly day = computed(
    () => this.parsed()?.getDate().toString().padStart(2, '0') ?? '',
  );
  protected readonly label = computed(
    () => this.parsed()?.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' }) ?? '',
  );
}
