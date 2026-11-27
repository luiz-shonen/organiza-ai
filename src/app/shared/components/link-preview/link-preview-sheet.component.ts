import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { LinkPreviewService } from '../../../core/services';
import { isShortenedLink, linkHost } from '../../../core/utils';
import {
  OrgBannerComponent,
  OrgBottomSheetComponent,
  OrgButtonComponent,
  OrgSkeletonComponent,
} from '../../ui';

/**
 * "Abrir link externo?": one sheet for the whole app (in the shell). Shows what a gift idea's
 * link leads to, like WhatsApp's preview, and whether Google lists it as dangerous, before the
 * person decides to open it.
 */
@Component({
  selector: 'app-link-preview-sheet',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [OrgBannerComponent, OrgBottomSheetComponent, OrgButtonComponent, OrgSkeletonComponent],
  templateUrl: './link-preview-sheet.component.html',
  styleUrl: './link-preview-sheet.component.scss',
})
export class LinkPreviewSheetComponent {
  private readonly links = inject(LinkPreviewService);

  protected readonly state = this.links.state;
  protected readonly preview = computed(() => this.state()?.preview ?? null);
  /** Where it opens: the real address after redirects, once known. */
  protected readonly target = computed(() => this.preview()?.finalUrl || this.state()?.url || '');
  protected readonly host = computed(() => this.preview()?.host || linkHost(this.target()));
  protected readonly dangerous = computed(() => this.preview()?.dangerous === true);
  /** A short link whose real site is still unknown (no preview). */
  protected readonly hidden = computed(() => {
    const state = this.state();
    return !!state && !this.preview() && !state.loading && isShortenedLink(state.url);
  });
  /** A short link that turned out to lead elsewhere: say so. */
  protected readonly redirected = computed(() => {
    const preview = this.preview();
    return !!preview && linkHost(preview.url) !== preview.host;
  });
  /** Loaded, and Google could not say it is safe (no preview, or the check failed). */
  protected readonly unchecked = computed(() => {
    const state = this.state();
    return !!state && !state.loading && this.preview()?.dangerous == null;
  });

  protected close(): void {
    this.links.close();
  }

  protected openLink(): void {
    const url = this.target();
    this.links.close();
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  }

  /** A picture that does not load leaves no broken icon behind. */
  protected hideImage(event: Event): void {
    (event.target as HTMLElement).hidden = true;
  }
}
