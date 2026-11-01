import {
  Component,
  ChangeDetectionStrategy,
  input,
  effect,
  ElementRef,
  viewChild,
} from '@angular/core';
import QRCode from 'qrcode';
import {
  OrgButtonComponent,
  OrgCardHeaderComponent,
  OrgCopyButtonComponent,
  OrgSurfaceComponent,
} from '../../../../../shared/ui';
import { shareWhatsApp } from '../../../../../core/utils';

@Component({
  selector: 'app-share-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    OrgButtonComponent,
    OrgCardHeaderComponent,
    OrgCopyButtonComponent,
    OrgSurfaceComponent,
  ],
  templateUrl: './share-panel.component.html',
  styleUrl: './share-panel.component.scss',
})
export class SharePanelComponent {
  readonly eventUrl = input('');
  readonly eventTitle = input('');

  private readonly qrCanvas = viewChild<ElementRef<HTMLCanvasElement>>('qrCanvas');

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

  protected shareWhatsApp(): void {
    const title = this.eventTitle() || 'nosso evento';
    shareWhatsApp(title, undefined, undefined, this.eventUrl());
  }
}
