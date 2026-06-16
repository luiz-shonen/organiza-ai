import { Component, ChangeDetectionStrategy, input, output, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Clipboard } from '@angular/cdk/clipboard';

@Component({
  selector: 'app-pix-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatCardModule, MatButtonModule, MatIconModule],
  template: `
    <mat-card class="pix-card" appearance="outlined">
      <mat-card-header>
        <mat-icon matCardAvatar class="pix-card__icon">pix</mat-icon>
        <mat-card-title>Rachadinha via Pix</mat-card-title>
        <mat-card-subtitle>Contribua com o evento!</mat-card-subtitle>
      </mat-card-header>
      <mat-card-content>
        <div class="pix-card__key-container">
          <code class="pix-card__key" aria-label="Chave Pix">{{ pixKey() }}</code>
        </div>
      </mat-card-content>
      <mat-card-actions>
        <button
          mat-flat-button
          class="pix-card__copy-btn"
          (click)="copyToClipboard()"
          aria-label="Copiar chave Pix"
        >
          <mat-icon>content_copy</mat-icon>
          Copiar Chave
        </button>
      </mat-card-actions>
    </mat-card>
  `,
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
