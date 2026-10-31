import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Guest } from '../../../../../core/models';
import {
  OrgButtonComponent,
  OrgCardHeaderComponent,
  OrgDataColumn,
  OrgDataTableComponent,
  OrgSurfaceComponent,
} from '../../../../../shared/ui';

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

  protected readonly columns: readonly OrgDataColumn<Guest>[] = [
    { id: 'name', label: 'Nome', value: (guest) => guest.name },
    { id: 'phone', label: 'Telefone', value: (guest) => guest.phone ?? '' },
  ];
}
