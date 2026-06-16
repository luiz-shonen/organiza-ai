import {
  Component,
  ChangeDetectionStrategy,
  input,
  signal,
  effect,
  inject,
  ElementRef,
  viewChild,
} from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Clipboard } from '@angular/cdk/clipboard';
import { MatSnackBar } from '@angular/material/snack-bar';
import QRCode from 'qrcode';

@Component({
  selector: 'app-share-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatCardModule, MatButtonModule, MatIconModule],
  template: `
    @if (eventUrl()) {
      <mat-card class="share-panel" appearance="outlined">
        <mat-card-header>
          <mat-icon matCardAvatar class="share-panel__icon">qr_code_2</mat-icon>
          <mat-card-title>Compartilhar</mat-card-title>
          <mat-card-subtitle>Convide seus amigos!</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <div class="share-panel__qr-container">
            <canvas
              #qrCanvas
              class="share-panel__qr"
              aria-label="QR Code do evento"
            ></canvas>
          </div>

          <div class="share-panel__link">
            <code class="share-panel__url">{{ eventUrl() }}</code>
          </div>
        </mat-card-content>
        <mat-card-actions>
          <button
            mat-stroked-button
            (click)="copyLink()"
            aria-label="Copiar link do evento"
          >
            <mat-icon>content_copy</mat-icon>
            Copiar Link
          </button>
          <button
            mat-flat-button
            (click)="shareWhatsApp()"
            aria-label="Compartilhar no WhatsApp"
            class="share-panel__whatsapp-btn"
          >
            <mat-icon>share</mat-icon>
            WhatsApp
          </button>
        </mat-card-actions>
      </mat-card>
    }
  `,
  styleUrl: './share-panel.component.scss',
})
export class SharePanelComponent {
  readonly eventUrl = input('');
  readonly eventTitle = input('');

  private readonly qrCanvas = viewChild<ElementRef<HTMLCanvasElement>>('qrCanvas');
  private readonly clipboard = inject(Clipboard);
  private readonly snackBar = inject(MatSnackBar);

  constructor() {
    effect(() => {
      const url = this.eventUrl();
      const canvas = this.qrCanvas();
      if (url && canvas) {
        QRCode.toCanvas(canvas.nativeElement, url, {
          width: 200,
          margin: 2,
          color: { dark: '#1a1a1a', light: '#ffffff' },
        });
      }
    });
  }

  protected copyLink(): void {
    this.clipboard.copy(this.eventUrl());
    this.snackBar.open('Link copiado!', 'OK', { duration: 2000 });
  }

  protected shareWhatsApp(): void {
    const title = this.eventTitle() || 'nosso evento';
    const text = `🎉 Você está convidado(a) para *${title}*!\n\nConfirme sua presença e veja o que levar:\n${this.eventUrl()}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  }
}
