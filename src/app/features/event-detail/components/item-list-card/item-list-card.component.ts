import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { PartyItem } from '../../../../core/models';

@Component({
  selector: 'app-item-list-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatIconModule],
  templateUrl: './item-list-card.component.html',
  styleUrl: './item-list-card.component.scss',
})
export class ItemListCardComponent {
  public readonly items = input.required<PartyItem[]>();
  public readonly currentUserId = input<string | null>(null);

  public readonly onClaim = output<string>();
  public readonly onUnclaim = output<string>();
}
