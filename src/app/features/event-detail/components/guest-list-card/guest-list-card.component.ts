import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import type { GuestDecline } from '../../../../core/models';
import type { GuestHousehold } from '../../../../core/utils';
import { Phone } from '../../../../core/value-objects';
import {
  OrgAvatarComponent,
  OrgButtonComponent,
  OrgCardHeaderComponent,
  OrgSurfaceComponent,
} from '../../../../shared/ui';

/**
 * "Quem vai" on the event page: each confirmed household, who comes with them and what they
 * bring, for everyone with the link. Organizers also see phones, the declines and the export.
 */
@Component({
  selector: 'app-guest-list-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [OrgAvatarComponent, OrgButtonComponent, OrgCardHeaderComponent, OrgSurfaceComponent],
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
    const people = households.reduce((total, household) => total + 1 + household.people.length, 0);
    const answered = households.length === 1 ? '1 confirmado' : `${households.length} confirmados`;
    return people > households.length ? `${answered} · ${people} pessoas` : answered;
  });
}
