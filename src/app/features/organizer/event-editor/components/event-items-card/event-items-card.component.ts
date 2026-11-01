import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { NewPartyItem, PartyItem } from '../../../../../core/models';
import {
  OrgCardHeaderComponent,
  OrgIconButtonComponent,
  OrgIconComponent,
  OrgSurfaceComponent,
  OrgTextFieldComponent,
} from '../../../../../shared/ui';

@Component({
  selector: 'app-event-items-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    OrgCardHeaderComponent,
    OrgIconButtonComponent,
    OrgIconComponent,
    OrgSurfaceComponent,
    OrgTextFieldComponent,
  ],
  templateUrl: './event-items-card.component.html',
  styleUrl: './event-items-card.component.scss',
})
export class EventItemsCardComponent {
  readonly items = input.required<readonly PartyItem[]>();
  readonly add = output<NewPartyItem>();
  readonly remove = output<PartyItem>();

  protected readonly newItemName = signal('');
  protected readonly newItemQuantity = signal(1);

  protected setQuantity(value: string): void {
    const quantity = Number(value);
    this.newItemQuantity.set(Number.isInteger(quantity) && quantity > 0 ? quantity : 1);
  }

  protected submit(): void {
    const name = this.newItemName().trim();
    if (!name) {
      return;
    }

    this.add.emit({ name, quantity: this.newItemQuantity() });
    this.newItemName.set('');
    this.newItemQuantity.set(1);
  }
}
