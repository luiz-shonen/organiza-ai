import { ChangeDetectionStrategy, Component, EventEmitter, input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { PartyItem } from '../../../../core/models/item.model';

@Component({
  selector: 'app-item-list-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatIconModule],
  templateUrl: './item-list-card.component.html',
  styleUrl: './item-list-card.component.scss',
})
export class ItemListCardComponent {
  public items = input.required<PartyItem[]>();
  public currentUserId = input<string | null>(null);

  @Output() onClaim = new EventEmitter<string>();
  @Output() onUnclaim = new EventEmitter<string>();
}
