import { Component, ChangeDetectionStrategy, input, output, computed, inject } from '@angular/core';
import { Clipboard } from '@angular/cdk/clipboard';
import { OrgButtonComponent, OrgIconComponent, OrgSurfaceComponent } from '../../../../shared/ui';

@Component({
  selector: 'app-pix-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [OrgButtonComponent, OrgIconComponent, OrgSurfaceComponent],
  templateUrl: './pix-card.component.html',
  styleUrl: './pix-card.component.scss',
})
export class PixCardComponent {
  readonly pixKey = input<string | null>(null);
  readonly pixType = input<string | undefined>(undefined);
  readonly estimatedBudget = input<number | null>(null);
  readonly guestCount = input<number>(0);

  readonly copyPix = output<string>();
  readonly copied = output<void>();

  private readonly clipboard = inject(Clipboard);

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

  protected copyToClipboard(): void {
    const key = this.pixKey();
    if (key) {
      this.clipboard.copy(key);
      this.copyPix.emit(key);
      this.copied.emit();
    }
  }
}
