import { Injectable, inject, signal } from '@angular/core';
import { pushRelayUrl } from '../../../environments/firebase-config';
import type { LinkPreview } from '../models';
import { AuthService } from './auth.service';

/** The link being looked at before opening it, and what is known about it so far. */
export interface LinkPreviewState {
  readonly url: string;
  /** null while it loads, or when no preview could be had (signed out, relay off, failure). */
  readonly preview: LinkPreview | null;
  readonly loading: boolean;
}

/**
 * "Prévia do link": a link in a gift idea never opens at once. The sheet in the app shell shows
 * what it leads to (picture, title, price, the real site after a short link) and whether Google
 * lists it as dangerous, read by the relay Worker; the person then decides.
 */
@Injectable({ providedIn: 'root' })
export class LinkPreviewService {
  private readonly auth = inject(AuthService);
  private readonly cache = new Map<string, LinkPreview>();

  readonly state = signal<LinkPreviewState | null>(null);

  async open(url: string): Promise<void> {
    const known = this.cache.get(url) ?? null;
    this.state.set({ url, preview: known, loading: !known });
    if (known) return;
    const preview = await this.fetch(url);
    if (preview) this.cache.set(url, preview);
    // Only if the person is still looking at this link.
    if (this.state()?.url === url) this.state.set({ url, preview, loading: false });
  }

  close(): void {
    this.state.set(null);
  }

  private async fetch(url: string): Promise<LinkPreview | null> {
    const relay = pushRelayUrl();
    const user = this.auth.currentUser();
    if (!relay || !user || user.isAnonymous) return null;
    try {
      const token = await user.getIdToken();
      const response = await fetch(`${relay}/preview`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({ url }),
      });
      return response.ok ? ((await response.json()) as LinkPreview) : null;
    } catch {
      return null;
    }
  }
}
