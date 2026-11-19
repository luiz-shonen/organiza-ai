import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import type { NewPartyItem } from '../../../../../core/models';
import { formatQuantity } from '../../../../../core/utils';
import {
  OrgBottomSheetComponent,
  OrgButtonComponent,
  OrgCardHeaderComponent,
  OrgIconButtonComponent,
  OrgSurfaceComponent,
  OrgToggleComponent,
} from '../../../../../shared/ui';
import { ItemFormComponent } from '../item-form/item-form.component';

export interface ItemUpdate {
  readonly index: number;
  readonly item: NewPartyItem;
}

/**
 * "Itens" step: what guests can bring. It opens with a question, like the amigo oculto step:
 * the form and the list show only once the organizer says guests will bring something.
 * Optional; the list can also be changed later
 * by editing the event. The lock inside "Quantidade" makes the item fixed: whoever
 * picks it brings the whole quantity. ✏️ edits an item in a sheet, so the add form
 * keeps what was being typed.
 */
@Component({
  selector: 'app-event-items-step',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ItemFormComponent,
    OrgBottomSheetComponent,
    OrgButtonComponent,
    OrgCardHeaderComponent,
    OrgIconButtonComponent,
    OrgSurfaceComponent,
    OrgToggleComponent,
  ],
  templateUrl: './event-items-step.component.html',
  styleUrls: ['../event-step.scss', './event-items-step.component.scss'],
})
export class EventItemsStepComponent {
  public readonly items = input<readonly NewPartyItem[]>([]);
  /** Read-only list for collaborators without edit rights. */
  public readonly canEdit = input(true);
  /** "Os convidados vão levar alguma coisa?"; the container decides, as turning it off removes items. */
  public readonly enabled = input(false);
  public readonly enabledChange = output<boolean>();
  public readonly add = output<NewPartyItem>();
  public readonly update = output<ItemUpdate>();
  public readonly remove = output<number>();
  public readonly back = output<void>();
  public readonly next = output<void>();

  protected readonly openHint = signal<number | null>(null);
  /** Index of the item open in the edit sheet; null while it is closed. */
  protected readonly editingIndex = signal<number | null>(null);
  protected readonly editingItem = computed(() => {
    const index = this.editingIndex();
    return index === null ? null : (this.items()[index] ?? null);
  });

  protected label(item: NewPartyItem): string {
    return formatQuantity(item.quantity, item.unit);
  }

  protected toggleHint(index: number): void {
    this.openHint.update((current) => (current === index ? null : index));
  }

  protected saveEdit(item: NewPartyItem): void {
    const index = this.editingIndex();
    if (index === null) return;
    this.update.emit({ index, item });
    this.editingIndex.set(null);
  }
}
