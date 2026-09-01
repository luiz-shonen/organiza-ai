import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { PartyItem } from '../../../../core/models';
import { OrgButtonComponent, OrgIconComponent, OrgSurfaceComponent } from '../../../../shared/ui';

@Component({
  selector: 'app-item-list-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [OrgButtonComponent, OrgIconComponent, OrgSurfaceComponent],
  templateUrl: './item-list-card.component.html',
  styleUrl: './item-list-card.component.scss',
})
export class ItemListCardComponent {
  public readonly items = input.required<PartyItem[]>();
  public readonly currentUserId = input<string | null>(null);

  public readonly claim = output<string>();
  public readonly unclaim = output<string>();
}
