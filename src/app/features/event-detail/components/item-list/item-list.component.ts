import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { PartyItem, GuestSession } from '../../../../core/models';

@Component({
  selector: 'app-item-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatCardModule, MatButtonModule, MatIconModule, MatChipsModule],
  templateUrl: './item-list.component.html',
  styleUrl: './item-list.component.scss',
})
export class ItemListComponent {
  readonly items = input.required<PartyItem[]>();
  readonly session = input<GuestSession | null>(null);
  readonly claimItem = output<PartyItem>();
  readonly unclaimItem = output<PartyItem>();

  protected readonly claimedCount = computed(
    () => this.items().filter((i) => i.claimedBy !== null).length
  );

  protected isClaimedByMe(item: PartyItem): boolean {
    const s = this.session();
    if (!s || !item.claimedBy) return false;
    return item.claimedBy.phone === s.phone;
  }

  protected trackByItemId(_index: number, item: PartyItem): string {
    return item.id;
  }
}
