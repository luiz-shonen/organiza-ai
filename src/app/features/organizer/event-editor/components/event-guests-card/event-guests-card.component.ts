import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Guest } from '../../../../../core/models';
import { Phone } from '../../../../../core/value-objects';
import {
  OrgButtonComponent,
  OrgCardHeaderComponent,
  OrgDataColumn,
  OrgDataTableComponent,
  OrgSurfaceComponent,
} from '../../../../../shared/ui';

/** Companions named in the RSVP, or the older bare count. */
function companionsOf(guest: Guest): number {
  return guest.companions?.length ?? guest.companionsCount ?? 0;
}

@Component({
  selector: 'app-event-guests-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [OrgButtonComponent, OrgCardHeaderComponent, OrgDataTableComponent, OrgSurfaceComponent],
  templateUrl: './event-guests-card.component.html',
  styleUrl: './event-guests-card.component.scss',
})
export class EventGuestsCardComponent {
  readonly guests = input.required<readonly Guest[]>();
  readonly exportCsv = output<void>();
  readonly print = output<void>();

  /** "4 confirmados · 7 pessoas": who answered, and everyone coming with them. */
  protected readonly summary = computed(() => {
    const guests = this.guests();
    const people = guests.reduce((total, guest) => total + 1 + companionsOf(guest), 0);
    const answered = guests.length === 1 ? '1 confirmado' : `${guests.length} confirmados`;
    return people > guests.length ? `${answered} · ${people} pessoas` : answered;
  });

  protected readonly columns: readonly OrgDataColumn<Guest>[] = [
    { id: 'name', label: 'Nome', value: (guest) => guest.name },
    { id: 'phone', label: 'Telefone', value: (guest) => Phone.display(guest.phone) || '—' },
    {
      id: 'companions',
      label: 'Acompanhantes',
      value: (guest) => (companionsOf(guest) ? `+${companionsOf(guest)}` : '—'),
    },
  ];
}
