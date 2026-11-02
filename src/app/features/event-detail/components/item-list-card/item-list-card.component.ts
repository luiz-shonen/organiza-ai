import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import type { ItemProgress } from '../../../../core/models';
import { formatQuantity } from '../../../../core/utils';
import {
  OrgBadgeComponent,
  OrgButtonComponent,
  OrgCardHeaderComponent,
  OrgIconComponent,
  OrgProgressComponent,
  OrgSplitProgressComponent,
  OrgSurfaceComponent,
  type OrgSplitSegment,
} from '../../../../shared/ui';

/**
 * "Lista do evento": every item with how much is missing, who brings what (bar split by
 * person) and the "Eu levo" action. Completed items fade so the open ones stand out.
 */
@Component({
  selector: 'app-item-list-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    OrgBadgeComponent,
    OrgButtonComponent,
    OrgCardHeaderComponent,
    OrgIconComponent,
    OrgProgressComponent,
    OrgSplitProgressComponent,
    OrgSurfaceComponent,
  ],
  templateUrl: './item-list-card.component.html',
  styleUrl: './item-list-card.component.scss',
})
export class ItemListCardComponent {
  public readonly progress = input<readonly ItemProgress[]>([]);
  public readonly claim = output<string>();

  /** Item whose "Quantidade fixa" explanation is open. */
  protected readonly openHint = signal<string | null>(null);

  protected readonly complete = computed(() => this.progress().filter((p) => p.complete).length);
  protected readonly percent = computed(() =>
    this.progress().length ? (this.complete() / this.progress().length) * 100 : 0,
  );

  protected quantity(value: number, unit?: string): string {
    return formatQuantity(value, unit);
  }

  protected segments(entry: ItemProgress): OrgSplitSegment[] {
    return entry.shares.map((share) => ({ label: share.who, value: share.quantity }));
  }

  protected toggleHint(itemId: string): void {
    this.openHint.update((current) => (current === itemId ? null : itemId));
  }
}
