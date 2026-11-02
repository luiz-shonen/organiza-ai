import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import type { NewPartyItem } from '../../../../../core/models';
import { formatQuantity } from '../../../../../core/utils';
import { ItemName, Quantity } from '../../../../../core/value-objects';
import {
  OrgButtonComponent,
  OrgCardHeaderComponent,
  OrgIconButtonComponent,
  OrgIconComponent,
  OrgSelectFieldComponent,
  OrgSurfaceComponent,
  OrgTextFieldComponent,
  type OrgSelectOption,
} from '../../../../../shared/ui';

const UNITS: readonly OrgSelectOption[] = [
  'un.',
  'kg',
  'L',
  'pacotes',
  'garrafas',
  'caixas',
  'panelas',
  'bandejas',
].map((unit) => ({ value: unit, label: unit }));

/**
 * "Itens" step: what guests can bring. Optional; the list can also be changed later
 * by editing the event. The lock inside "Quantidade" makes the item fixed: whoever
 * picks it brings the whole quantity.
 */
@Component({
  selector: 'app-event-items-step',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    OrgButtonComponent,
    OrgCardHeaderComponent,
    OrgIconButtonComponent,
    OrgIconComponent,
    OrgSelectFieldComponent,
    OrgSurfaceComponent,
    OrgTextFieldComponent,
  ],
  templateUrl: './event-items-step.component.html',
  styleUrls: ['../event-step.scss', './event-items-step.component.scss'],
})
export class EventItemsStepComponent {
  public readonly items = input<readonly NewPartyItem[]>([]);
  /** Read-only list for collaborators without edit rights. */
  public readonly canEdit = input(true);
  public readonly add = output<NewPartyItem>();
  public readonly remove = output<number>();
  public readonly back = output<void>();
  public readonly next = output<void>();

  protected readonly units = UNITS;
  protected readonly name = signal('');
  protected readonly quantity = signal('1');
  protected readonly unit = signal<string | null>('un.');
  protected readonly fixed = signal(false);
  protected readonly openHint = signal<number | null>(null);

  /** Set on an add with invalid fields; the errors then follow what is typed. */
  protected readonly showErrors = signal(false);
  protected readonly nameMaxLength = ItemName.RULES.max;
  protected readonly nameError = computed(() =>
    this.showErrors() ? (ItemName.validate(this.name()) ?? '') : '',
  );
  protected readonly quantityError = computed(() =>
    String(this.quantity()).trim() === ''
      ? 'Informe a quantidade'
      : (Quantity.validate(this.quantity()) ?? ''),
  );
  protected readonly canAdd = computed(
    () => this.name().trim().length > 0 && !this.quantityError(),
  );

  protected label(item: NewPartyItem): string {
    return formatQuantity(item.quantity, item.unit);
  }

  protected toggleHint(index: number): void {
    this.openHint.update((current) => (current === index ? null : index));
  }

  protected submit(): void {
    if (!this.canAdd()) return;
    const name = ItemName.create(this.name());
    const quantity = Quantity.create(this.quantity());
    if (!name || !quantity) {
      this.showErrors.set(true);
      return;
    }
    this.add.emit({
      name: name.value,
      quantity: quantity.value,
      unit: this.unit() ?? undefined,
      fixedQuantity: this.fixed(),
    });
    this.name.set('');
    this.quantity.set('1');
    this.fixed.set(false);
    this.showErrors.set(false);
  }
}
