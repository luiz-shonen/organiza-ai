import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import type { GuestDecline } from '../../../../core/models';
import type { GuestHousehold } from '../../../../core/utils';
import { Phone } from '../../../../core/value-objects';
import {
  OrgAvatarComponent,
  OrgCardHeaderComponent,
  OrgExpansionPanelComponent,
  OrgIconButtonComponent,
  OrgSurfaceComponent,
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
  /** Organizers only: phones, "Não poderão ir", Excel and print. */
  readonly forOrganizer = input(false);
  readonly declines = input<readonly GuestDecline[]>([]);

  readonly exportCsv = output<void>();
  readonly print = output<void>();

  protected readonly displayPhone = Phone.display;

  /** "3 confirmados · 5 pessoas": the households, and everyone coming with them. */
  protected readonly summary = computed(() => {
    const households = this.households();
    const people = households.reduce((total, household) => total + household.members.length, 0);
    const answered = households.length === 1 ? '1 confirmado' : `${households.length} confirmados`;
    return people > households.length ? `${answered} · ${people} pessoas` : answered;
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
