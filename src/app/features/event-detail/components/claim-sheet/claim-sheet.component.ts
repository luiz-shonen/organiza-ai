import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  linkedSignal,
  output,
} from '@angular/core';
import type { ItemClaimRequest, ItemProgress } from '../../../../core/models';
import { formatQuantity, unitFor } from '../../../../core/utils';
import {
  OrgBottomSheetComponent,
  OrgButtonComponent,
  OrgChipComponent,
  OrgIconComponent,
  OrgQuantityStepperComponent,
} from '../../../../shared/ui';

/** Someone who can bring an item: the account holder (`id: null`) or a family member. */
export interface ClaimPerson {
  readonly id: string | null;
  readonly name: string;
}

/**
 * "Eu levo": how many and who in the family brings it. The quantity is skipped for
 * fixed items, and the "who" question when the person has no family registered.
 */
@Component({
  selector: 'app-claim-sheet',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    OrgBottomSheetComponent,
    OrgButtonComponent,
    OrgChipComponent,
    OrgIconComponent,
    OrgQuantityStepperComponent,
  ],
  templateUrl: './claim-sheet.component.html',
  styleUrl: './claim-sheet.component.scss',
})
export class ClaimSheetComponent {
  /** The item being claimed; `null` keeps the sheet closed. */
  public readonly entry = input<ItemProgress | null>(null);
  public readonly people = input<readonly ClaimPerson[]>([]);
  public readonly saving = input(false);
  public readonly confirm = output<ItemClaimRequest>();
  public readonly closed = output<void>();

  // Every time the sheet opens it starts from one unit (or the whole fixed quantity)
  // for the account holder.
  protected readonly quantity = linkedSignal(() => {
    const entry = this.entry();
    if (!entry) return 1;
    return entry.item.fixedQuantity ? entry.remaining : Math.min(1, entry.remaining);
  });
  protected readonly who = linkedSignal<ItemProgress | null, string | null>({
    source: this.entry,
    computation: () => null,
  });

  protected readonly unitFor = unitFor;
  protected readonly fixed = computed(() => !!this.entry()?.item.fixedQuantity);
  protected readonly remainingLabel = computed(() => {
    const entry = this.entry();
    return entry ? formatQuantity(entry.remaining, entry.item.unit) : '';
  });

  protected total(entry: ItemProgress): string {
    return formatQuantity(entry.item.quantity, entry.item.unit);
  }

  protected submit(): void {
    const entry = this.entry();
    if (!entry) return;
    const person = this.people().find((p) => p.id === this.who()) ?? this.people()[0];
    this.confirm.emit({
      itemId: entry.item.id,
      quantity: this.quantity(),
      memberId: person?.id ?? null,
      who: person?.name ?? '',
    });
  }
}
