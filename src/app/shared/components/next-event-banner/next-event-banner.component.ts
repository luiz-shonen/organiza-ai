import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { PartyEvent } from '../../../core/models';
import { daysUntil } from '../../../core/utils';
import { OrgIconComponent } from '../../ui';

/**
 * "Evento próximo: Festa Junina 2026, em 7 dias": one row that links to the event, at the top
 * of Início (the next event the member confirmed) and Meus eventos (the next one they organize).
 */
@Component({
  selector: 'app-next-event-banner',
  standalone: true,
  imports: [RouterLink, OrgIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './next-event-banner.component.html',
  styleUrl: './next-event-banner.component.scss',
})
export class NextEventBannerComponent {
  public readonly event = input.required<PartyEvent>();

  protected readonly when = computed(() => {
    const days = daysUntil(this.event().date);
    if (days <= 0) return 'é hoje!';
    if (days === 1) return 'amanhã';
    return `em ${days} dias`;
  });
}
