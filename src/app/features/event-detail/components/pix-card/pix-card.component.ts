import { Component, ChangeDetectionStrategy, input, output, inject } from '@angular/core';
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
  readonly copied = output<void>();

  private readonly clipboard = inject(Clipboard);

  protected copyToClipboard(): void {
    this.clipboard.copy(this.pixKey());
    this.copied.emit();
  }
}
