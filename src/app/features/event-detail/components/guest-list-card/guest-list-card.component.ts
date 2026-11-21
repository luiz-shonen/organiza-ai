import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import type { GuestDecline } from '../../../../core/models';
import type { GuestHousehold, PendingGuest } from '../../../../core/utils';
import { Phone } from '../../../../core/value-objects';
import {
  OrgAvatarComponent,
  OrgButtonComponent,
  OrgCardHeaderComponent,
  OrgExpansionPanelComponent,
  OrgIconButtonComponent,
  OrgSurfaceComponent,
  OrgIconComponent,
} from '../../../../shared/ui';

/**
 * "Quem vai" on the event page: one panel per confirmed household, like "Levar familiares?",
 * with each person (the guest, their family, their companions) and what they bring. Organizers
 * also see phones, the declines, and the Excel / print actions in the header.
 */
@Component({
  selector: 'app-guest-list-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    OrgAvatarComponent,
    OrgButtonComponent,
    OrgCardHeaderComponent,
    OrgExpansionPanelComponent,
    OrgIconButtonComponent,
    OrgIconComponent,
    OrgSurfaceComponent,
  ],
  templateUrl: './guest-list-card.component.html',
  styleUrl: './guest-list-card.component.scss',
})
export class GuestListCardComponent {
  readonly households = input.required<readonly GuestHousehold[]>();
  /** Organizers only: phones, "Não poderão ir", Excel and print. */
  readonly forOrganizer = input(false);
  readonly declines = input<readonly GuestDecline[]>([]);
  /** The event has a list of things to bring: without one, "Não leva nada da lista" is not said. */
  readonly hasItems = input(true);
  /** Organizers only: who of each household is in the amigo oculto, by household id. */
  readonly secretSanta = input<Readonly<Record<string, readonly string[]>>>({});

  /** "Jéssica Melo" → "Jéssica": whom the family and companions come with. */
  protected firstName(name: string): string {
    return name.trim().split(/\s+/)[0] ?? name;
  }

  /** "Jéssica e Romero", "Ana, Bia e Caio": the household's names in the draw, or empty. */
  protected santaNames(householdId: string): string {
    const names = this.secretSanta()[householdId] ?? [];
    if (names.length <= 1) return names[0] ?? '';
    return `${names.slice(0, -1).join(', ')} e ${names[names.length - 1]}`;
  }
  /** Organizers only: confirmations waiting for approval ("Aprovar presenças"). */
  readonly pending = input<readonly PendingGuest[]>([]);
  /** The waiting guest being approved or refused, while it saves. */
  readonly busyGuestId = input<string | null>(null);
  readonly approve = output<PendingGuest>();
  readonly refuse = output<PendingGuest>();

  readonly exportCsv = output<void>();
  readonly print = output<void>();

  protected readonly displayPhone = Phone.display;

  /** "5 confirmados": everyone going, the guests and the people coming with them. */
  protected readonly summary = computed(() => {
    const people = this.households().reduce(
      (total, household) => total + household.members.length,
      0,
    );
    return people === 1 ? '1 confirmado' : `${people} confirmados`;
  });

  /** Beside the guest's name: "+2 · 3 itens", short enough for a phone. */
  protected householdSummary(household: GuestHousehold): string {
    const extra = household.members.length - 1;
    const items = household.bring.length;
    const parts = [
      ...(extra ? [`+${extra}`] : []),
      ...(items ? [items === 1 ? '1 item' : `${items} itens`] : []),
    ];
    return parts.join(' · ') || '1 pessoa';
  }
}
