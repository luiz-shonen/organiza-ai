import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { PartyEvent, getCategoryClass } from '../../../../core/models';
import {
  OrgAvatarComponent,
  OrgBadgeComponent,
  OrgBadgeVariant,
  OrgButtonComponent,
  OrgIconComponent,
  OrgSurfaceComponent,
} from '../../../../shared/ui';

/** Top of the event page: title card, date and place, and who organises it. */
@Component({
  selector: 'app-event-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    OrgAvatarComponent,
    OrgBadgeComponent,
    OrgButtonComponent,
    OrgIconComponent,
    OrgSurfaceComponent,
  ],
  templateUrl: './event-card.component.html',
  styleUrl: './event-card.component.scss',
})
export class EventCardComponent {
  public readonly event = input.required<PartyEvent>();
  public readonly guestCount = input<number>(0);
  /** The viewer created or helps organise the event: shows "Editar evento". */
  public readonly canEdit = input(false);
  public readonly isOwner = input(false);
  public readonly edit = output<void>();

  protected readonly categoryName = computed(() => this.event().category || 'Evento');

  protected readonly categoryBadgeVariant = computed<OrgBadgeVariant>(
    () => getCategoryClass(this.event().category).replace('cat-', '') as OrgBadgeVariant,
  );

  /** "Domingo, 23 de agosto · 20:00". */
  protected readonly when = computed(() => {
    const date = new Date(this.event().date);
    if (isNaN(date.getTime())) return '';
    const day = date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
    const time = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    return `${day.charAt(0).toUpperCase()}${day.slice(1)} · ${time}`;
  });

  /** Street on the first line, neighbourhood, city and CEP below it. */
  protected readonly address = computed(() => {
    const ev = this.event();
    const details = ev.addressDetails;
    if (details?.address) {
      const street = [details.address, details.number].filter(Boolean).join(', ');
      const rest = [details.neighborhood, details.city, details.cep].filter(Boolean).join(' · ');
      return { street, rest };
    }
    const [street, ...rest] = (ev.location ?? '').split(' - ');
    return { street, rest: rest.map((part) => part.replace('CEP: ', '')).join(' · ') };
  });

  protected readonly mapsUrl = computed(
    () =>
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(this.event().location)}`,
  );

  protected readonly organizerName = computed(() => {
    if (this.isOwner()) return 'Você';
    const email = this.event().creatorEmail;
    return email ? email.split('@')[0] : 'Organizador';
  });

  protected readonly googleCalendarUrl = computed(() => {
    const ev = this.event();
    const dateStr = new Date(ev.date).toISOString().replace(/-|:|\.\d\d\d/g, '');
    const endDateStr = new Date(new Date(ev.date).getTime() + 4 * 60 * 60 * 1000)
      .toISOString()
      .replace(/-|:|\.\d\d\d/g, '');
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(ev.title)}&dates=${dateStr}/${endDateStr}&details=${encodeURIComponent(ev.description)}&location=${encodeURIComponent(ev.location)}`;
  });
}
