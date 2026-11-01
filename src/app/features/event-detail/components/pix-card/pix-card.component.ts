import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import {
  OrgCardHeaderComponent,
  OrgCopyButtonComponent,
  OrgSurfaceComponent,
} from '../../../../shared/ui';

@Component({
  selector: 'app-pix-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [OrgCardHeaderComponent, OrgCopyButtonComponent, OrgSurfaceComponent],
  templateUrl: './pix-card.component.html',
  styleUrl: './pix-card.component.scss',
})
export class PixCardComponent {
  readonly pixKey = input<string | null>(null);
  readonly pixType = input<string | undefined>(undefined);
  readonly estimatedBudget = input<number | null>(null);
  readonly guestCount = input<number>(0);

  readonly suggestedSplit = computed<number | null>(() => {
    const budget = this.estimatedBudget();
    const count = this.guestCount();
    return budget && count > 0 ? budget / count : null;
  });

  readonly formattedSuggestedSplit = computed<string | null>(() => {
    const split = this.suggestedSplit();
    if (split === null || split === undefined) {
      return null;
    }
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(split);
  });
}
