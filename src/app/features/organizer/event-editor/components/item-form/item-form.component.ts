import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  output,
  signal,
} from '@angular/core';
import type { NewPartyItem } from '../../../../../core/models';
import { ItemName, Quantity } from '../../../../../core/value-objects';
import {
  OrgAutocompleteFieldComponent,
  OrgButtonComponent,
  OrgTextFieldComponent,
  type OrgSelectOption,
} from '../../../../../shared/ui';

// The most common first; typing in the field filters the list.
export const ITEM_UNITS: readonly OrgSelectOption[] = [
  'un.',
  'kg',
  'g',
  'L',
  'ml',
  'dúzias',
  'pacotes',
  'garrafas',
  'latas',
  'caixas',
  'fardos',
  'sacos',
  'potes',
  'panelas',
  'travessas',
  'bandejas',
  'porções',
  'fatias',
].map((unit) => ({ value: unit, label: unit }));

/**
 * Name, quantity (with the Fixa / Dividir lock) and unit of an item. The items step uses
 * it to add, and the edit sheet to change one, so each keeps its own draft.
 */
@Component({
  selector: 'app-item-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [OrgAutocompleteFieldComponent, OrgButtonComponent, OrgTextFieldComponent],
  templateUrl: './item-form.component.html',
  styleUrls: ['../event-step.scss', './item-form.component.scss'],
})
export class ItemFormComponent {
  /** The item being edited; null to add a new one. */
  public readonly item = input<NewPartyItem | null>(null);
  public readonly submitLabel = input('Adicionar item');
  /** Shows a cancel button next to submit (the edit sheet). */
  public readonly cancelLabel = input<string | null>(null);
  /** Prefix of the field test ids, so two forms on one page stay distinct. */
  public readonly testIdPrefix = input('item');
  public readonly submitted = output<NewPartyItem>();
  public readonly cancelled = output<void>();

  protected readonly units = ITEM_UNITS;
  protected readonly name = signal('');
  protected readonly quantity = signal('1');
  protected readonly unit = signal<string | null>('un.');
  protected readonly fixed = signal(false);

  /** Set on a submit with invalid fields; the errors then follow what is typed. */
  protected readonly showErrors = signal(false);
  protected readonly nameMaxLength = ItemName.RULES.max;
  protected readonly maskQuantity = Quantity.mask;
  protected readonly nameError = computed(() => {
    if (!this.showErrors()) return '';
    if (!this.name().trim()) return 'Informe o nome do item';
    return ItemName.validate(this.name()) ?? '';
  });
  protected readonly quantityError = computed(() =>
    String(this.quantity()).trim() === ''
      ? 'Informe a quantidade'
      : (Quantity.validate(this.quantity()) ?? ''),
  );
  protected readonly unitError = computed(() =>
    this.showErrors() && !this.unit() ? 'Escolha uma unidade da lista' : '',
  );

  constructor() {
    effect(() => this.load(this.item()));
  }

  protected submit(): void {
    const name = ItemName.create(this.name());
    const quantity = Quantity.create(this.quantity());
    const unit = this.unit();
    if (!name || !quantity || !unit) {
      this.showErrors.set(true);
      return;
    }
    this.submitted.emit({
      name: name.value,
      quantity: quantity.value,
      unit,
      fixedQuantity: this.fixed(),
    });
    if (!this.item()) this.load(null);
  }

  private load(item: NewPartyItem | null): void {
    this.name.set(item?.name ?? '');
    this.quantity.set(String(item?.quantity ?? 1));
    this.unit.set(item ? (item.unit ?? null) : 'un.');
    this.fixed.set(item?.fixedQuantity ?? false);
    this.showErrors.set(false);
  }
}
