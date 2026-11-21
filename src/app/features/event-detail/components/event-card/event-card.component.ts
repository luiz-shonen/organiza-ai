import { eventLastDay, formatDaySpan, inviteTheme } from '../../../../core/utils';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { PartyEvent } from '../../../../core/models';
import {
  OrgAvatarComponent,
  OrgBadgeComponent,
  OrgButtonComponent,
  OrgIconComponent,
  OrgSurfaceComponent,
} from '../../../../shared/ui';

/** Top of the event page: title card, date and place, and who organises it. */
@Component({
  selector: 'app-event-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgTemplateOutlet,
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
  /** Name of the person viewing; the organizer's avatar uses it when it is them. */
  public readonly viewerName = input<string | null>(null);
  public readonly edit = output<void>();

  /** The colours and words of the invitation, from the category. */
  protected readonly theme = computed(() => inviteTheme(this.event().category));
  /**
   * "Churrasco", in small capitals above the greeting: only when the greeting does not already
   * say what the party is ("Feliz Natal!" needs no "Natal" tag), and never a bare "Outros".
   */
  protected readonly categoryLine = computed(() => {
    const category = (this.event().category ?? '').trim();
    if (this.theme().key !== 'padrao' || !category || /^outros?$/i.test(category)) return null;
    return category;
  });
  /** The four corners of the frame, each with the same flourish turned to face its corner. */
  protected readonly corners = ['top-start', 'top-end', 'bottom-start', 'bottom-end'] as const;

  /**
   * "Quinta", "24", "Dez · 20:00": the date block of the invitation. Over several days:
   * "Quarta a sexta", "23–25", "Dez · 17:00" ("Dez–Jan" across months).
   */
  protected readonly dateParts = computed(() => {
    const { date: iso, endDate } = this.event();
    const date = new Date(iso);
    if (isNaN(date.getTime())) return null;
    const last = eventLastDay(iso, endDate);
    const weekdayOf = (day: Date) =>
      day.toLocaleDateString('pt-BR', { weekday: 'long' }).split('-')[0];
    const monthOf = (day: Date) =>
      capital(day.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''));
    const time = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    if (!last) {
      return {
        weekday: capital(weekdayOf(date)),
        day: String(date.getDate()),
        monthTime: `${monthOf(date)} · ${time}`,
        isSpan: false,
      };
    }
    const months =
      monthOf(date) === monthOf(last) ? monthOf(date) : `${monthOf(date)}–${monthOf(last)}`;
    return {
      weekday: `${capital(weekdayOf(date))} a ${weekdayOf(last)}`,
      day: `${date.getDate()}–${last.getDate()}`,
      monthTime: `${months} · ${time}`,
      isSpan: true,
    };
  });

  /** "Domingo, 23 de agosto · 20:00"; over several days "De 23 a 25 de dezembro · 17:00". */
  protected readonly when = computed(() => {
    const { date: iso, endDate } = this.event();
    const date = new Date(iso);
    if (isNaN(date.getTime())) return '';
    const span = formatDaySpan(iso, endDate);
    const day = span
      ? `De ${span}`
      : capital(
          date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }),
        );
    const time = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    return `${day} · ${time}`;
  });

  /** Street, number and complement on the first line; neighbourhood, city and CEP below. */
  protected readonly address = computed(() => {
    const ev = this.event();
    const details = ev.addressDetails;
    // A rural CEP may give no street, only the city: the saved fields still win over the line.
    if (details?.address || details?.city) {
      const street = [details.address, details.number, details.complement]
        .filter(Boolean)
        .join(', ');
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

  /** The organizer's own name (or the e-mail's first part for older events). */
  private readonly creatorName = computed(() => {
    const { creatorName, creatorEmail } = this.event();
    return creatorName?.trim() || (creatorEmail ? creatorEmail.split('@')[0] : '');
  });
  /** "Com carinho, Luiz": who signs the invitation (always the name, never "Você"). */
  protected readonly signer = computed(() => this.creatorName());

  /** "Você" for the organizer; otherwise the organizer's name. */
  protected readonly organizerName = computed(() =>
    this.isOwner() ? 'Você' : this.creatorName() || 'Organizador(a)',
  );
  /** The avatar shows the person's initial, also when the label says "Você". */
  protected readonly organizerAvatarName = computed(
    () => (this.isOwner() ? this.viewerName() : null) || this.creatorName() || this.organizerName(),
  );

  protected readonly googleCalendarUrl = computed(() => {
    const ev = this.event();
    const dateStr = new Date(ev.date).toISOString().replace(/-|:|\.\d\d\d/g, '');
    // One day: four hours. Several days: until the end of the last one.
    const last = eventLastDay(ev.date, ev.endDate);
    const end = last
      ? new Date(last.getFullYear(), last.getMonth(), last.getDate(), 23, 59)
      : new Date(new Date(ev.date).getTime() + 4 * 60 * 60 * 1000);
    const endDateStr = end.toISOString().replace(/-|:|\.\d\d\d/g, '');
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(ev.title)}&dates=${dateStr}/${endDateStr}&details=${encodeURIComponent(ev.description)}&location=${encodeURIComponent(ev.location)}`;
  });
}

function capital(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
