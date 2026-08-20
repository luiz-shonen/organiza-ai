import { Component, ChangeDetectionStrategy, input, output, computed, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Clipboard } from '@angular/cdk/clipboard';

@Component({
  selector: 'app-pix-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './pix-card.component.html',
  styleUrl: './pix-card.component.scss',
})
export class PixCardComponent {
  readonly pixKey = input.required<string>();
  readonly estimatedBudget = input<number | undefined>(undefined);
  readonly guestCount = input<number | undefined>(undefined);

  readonly copyPix = output<void>();
  readonly copied = output<void>();

  readonly splitAmount = computed(() => {
    const budget = this.estimatedBudget();
    const guests = this.guestCount();
    if (budget === undefined || guests === undefined || guests <= 0) {
      return null;
    }
    return budget / guests;
  });

  private readonly clipboard = inject(Clipboard);

  protected copyToClipboard(): void {
    this.clipboard.copy(this.pixKey());
    this.copyPix.emit();
    this.copied.emit();
  }
}
