import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import type { GuestDecline } from '../../../../core/models';
import {
  householdPeople,
  petsLabel,
  type GuestHousehold,
  type PendingGuest,
} from '../../../../core/utils';
import { Phone } from '../../../../core/value-objects';
import {
  OrgAvatarComponent,
  OrgButtonComponent,
  OrgCardHeaderComponent,
  OrgExpansionPanelComponent,
  OrgIconButtonComponent,
  OrgSurfaceComponent,
} from '../../../../shared/ui';

/**
 * "Quem vai" on the event page: one panel per confirmed household, like "Levar familiares?",
 * with each person (the guest, their family, their companions) and what they bring. Organizers
 * also see phones, the declines, and the PDF / print actions in the header.
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
    OrgSurfaceComponent,
  ],
  templateUrl: './guest-list-card.component.html',
  styleUrl: './guest-list-card.component.scss',
})
export class GuestListCardComponent {
  readonly households = input.required<readonly GuestHousehold[]>();
  /** Organizers only: phones, "Não poderão ir", PDF and print. */
  readonly forOrganizer = input(false);
  readonly declines = input<readonly GuestDecline[]>([]);
  /** The event has a list of things to bring: without one, "Não leva nada da lista" is not said. */
  readonly hasItems = input(true);
  /** "Jéssica Melo" → "Jéssica": whom the family and companions come with. */
  protected firstName(name: string): string {
    return name.trim().split(/\s+/)[0] ?? name;
  }
  /** Organizers only: confirmations waiting for approval ("Aprovar presenças"). */
  readonly pending = input<readonly PendingGuest[]>([]);
  /** The waiting guest being approved or refused, while it saves. */
  readonly busyGuestId = input<string | null>(null);
  readonly approve = output<PendingGuest>();
  readonly refuse = output<PendingGuest>();

  /** "Baixar": the list as a PDF. */
  readonly download = output<void>();
  readonly print = output<void>();

  protected readonly displayPhone = Phone.display;

  /** "5 confirmados": everyone going, the guests and the people coming with them. */
  /** Everyone going: the guests and the people coming with them. */
  protected readonly people = computed(() =>
    this.households().reduce((total, household) => total + householdPeople(household), 0),
  );
  /** Pets go too, but are counted apart from people. */
  protected readonly pets = computed(() =>
    this.households().reduce((total, household) => total + (household.pets ?? 0), 0),
  );
  /** Under the heading: how many answered (and the pets), the count of people in the pill. */
  protected readonly summary = computed(() => {
    const families = this.households().length;
    const answered = families === 1 ? '1 família respondeu' : `${families} famílias responderam`;
    return this.pets() ? `${answered} · ${petsLabel(this.pets())}` : answered;
  });

  /** Beside the guest's name: "+2 · 3 itens", short enough for a phone. */
  /** Something to open: who comes with them, or what they bring (or not) from the list. */
  protected hasDetails(household: GuestHousehold): boolean {
    return household.members.length > 1 || household.bring.length > 0 || this.hasItems();
  }

  protected householdSummary(household: GuestHousehold): string {
    // Only what the line does not already say: one person alone needs no "1 pessoa".
    const people = householdPeople(household);
    const items = household.bring.length;
    return [
      ...(people > 1 ? [`${people} pessoas`] : []),
      ...(household.pets ? [petsLabel(household.pets)] : []),
      ...(items ? [items === 1 ? '1 item' : `${items} itens`] : []),
    ].join(' · ');
  }
}
