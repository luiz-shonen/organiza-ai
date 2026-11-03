import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { getCategoryClass, type PartyEvent } from '../../../core/models';
import { addressLines, formatWeekdayTime } from '../../../core/utils';
import {
  OrgBadgeComponent,
  OrgDateBadgeComponent,
  OrgIconComponent,
  OrgSurfaceComponent,
  OrgTooltipComponent,
  type OrgBadgeVariant,
} from '../../ui';

export interface EventSummaryStatus {
  readonly label: string;
  readonly variant: OrgBadgeVariant;
}

/**
 * The one event card of the app, used by Início and Meus eventos so both lists look
 * the same: category and status tags, title, date block, time, description and place.
 * Pages add their own extras (`[eventCardBody]`) and actions (`[eventCardFooter]`).
 */
@Component({
  selector: 'app-event-summary-card',
  standalone: true,
  imports: [
    RouterLink,
    OrgSurfaceComponent,
    OrgTooltipComponent,
    OrgBadgeComponent,
    OrgDateBadgeComponent,
    OrgIconComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './event-summary-card.component.html',
  styleUrl: './event-summary-card.component.scss',
})
export class EventSummaryCardComponent {
  public readonly event = input.required<PartyEvent>();

  /** Two lines instead of one cut-off line: street and neighbourhood, then city and CEP. */
  protected readonly address = computed(() =>
    addressLines(this.event().location, this.event().addressDetails),
  );
  public readonly status = input<EventSummaryStatus | null>(null);
  public readonly testId = input('event-card');
  /** Route of the event page; the title becomes the link to it. */
  public readonly link = input<readonly string[] | null>(null);
  /** Quiet link at the end of the footer; hidden when the page shows its own main action. */
  public readonly showDetails = input(true);

  protected readonly categoryLabel = computed(() => this.event().category || 'Evento');
  protected readonly categoryVariant = computed(
    () => getCategoryClass(this.event().category).replace('cat-', '') as OrgBadgeVariant,
  );
  protected readonly time = computed(() => formatWeekdayTime(this.event().date));
  protected readonly titleId = computed(() => `event-title-${this.event().id}`);
}
