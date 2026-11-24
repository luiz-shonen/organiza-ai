import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { getCategoryClass, getCategoryHue, type PartyEvent } from '../../../core/models';
import { formatDaySpan, inviteInitial, inviteTheme } from '../../../core/utils';
import { OrgBadgeComponent, OrgSurfaceComponent, type OrgBadgeVariant } from '../../ui';
import type { EventSummaryStatus } from '../event-summary-card/event-summary-card.component';

/**
 * An invite on Início, as a closed envelope: the flap and a wax seal in the colours of the
 * event's category (`inviteTheme`), "Para Jéssica", the title, when it is and the tags. Tapping
 * it opens the invitation itself, on the event page. Pages add their own extras below the
 * envelope (`[inviteBody]`, e.g. what the family brings) and actions (`[inviteFooter]`).
 */
@Component({
  selector: 'app-invite-envelope',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, OrgBadgeComponent, OrgSurfaceComponent],
  templateUrl: './invite-envelope.component.html',
  styleUrl: './invite-envelope.component.scss',
})
export class InviteEnvelopeComponent {
  public readonly event = input.required<PartyEvent>();
  public readonly status = input<EventSummaryStatus | null>(null);
  /** Who the invite is for ("Para Jéssica"); left out when unknown. */
  public readonly recipient = input<string | null>(null);
  /** The event page: opening the envelope. */
  public readonly link = input.required<readonly string[]>();
  public readonly testId = input('invite-envelope');

  protected readonly theme = computed(() => inviteTheme(this.event().category));
  protected readonly titleId = computed(() => `invite-title-${this.event().id}`);
  /** The organizer's initial on the seal, as a signet. */
  protected readonly initial = computed(() =>
    inviteInitial(this.event().creatorName || this.event().title),
  );
  protected readonly firstName = computed(
    () => (this.recipient() ?? '').trim().split(/\s+/)[0] ?? '',
  );
  protected readonly categoryLabel = computed(() => this.event().category || 'Evento');
  protected readonly categoryVariant = computed(
    () => getCategoryClass(this.event().category).replace('cat-', '') as OrgBadgeVariant,
  );
  protected readonly categoryHue = computed(() => getCategoryHue(this.event().category));
  protected readonly showCategory = computed(() => this.theme().wordsKey === 'outros');

  /** "sáb., 20 de abr. · 19:30"; over several days "23 a 25 de dez. · 17:00". */
  protected readonly when = computed(() => {
    const { date: iso, endDate } = this.event();
    const date = new Date(iso);
    if (isNaN(date.getTime())) return '';
    const day =
      formatDaySpan(iso, endDate, 'short') ||
      date.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' });
    const time = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    return `${day} · ${time}`;
  });
}
