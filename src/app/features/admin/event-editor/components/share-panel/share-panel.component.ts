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
import { MatIconModule } from '@angular/material/icon';
import { Clipboard } from '@angular/cdk/clipboard';
import QRCode from 'qrcode';
import { FeedbackService, OrgButtonComponent, OrgSurfaceComponent } from '../../../../../shared/ui';
import { shareWhatsApp } from '../../../../../core/utils';

@Component({
  selector: 'app-share-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule, OrgButtonComponent, OrgSurfaceComponent],
  templateUrl: './share-panel.component.html',
  styleUrl: './share-panel.component.scss',
})
export class SharePanelComponent {
  readonly eventUrl = input('');
  readonly eventTitle = input('');

  private readonly qrCanvas = viewChild<ElementRef<HTMLCanvasElement>>('qrCanvas');
  private readonly clipboard = inject(Clipboard);
  private readonly feedback = inject(FeedbackService);

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
    this.feedback.success('Link copiado!', { duration: 2000 });
  }

  protected shareWhatsApp(): void {
    const title = this.eventTitle() || 'nosso evento';
    shareWhatsApp(title, undefined, undefined, this.eventUrl());
  }
}
