import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { SwPush } from '@angular/service-worker';
import { firstValueFrom } from 'rxjs';
import { PUSH_VAPID_PUBLIC_KEY, pushRelayUrl } from '../../../environments/firebase-config';
import { AuthService } from './auth.service';

/**
 * What the phone can do about notices outside the app:
 * - `unsupported`: this browser has no push (or the relay is not set up);
 * - `install`: an iPhone or iPad, where push works only from the app on the Home Screen;
 * - `off` / `on`: this device does not / does receive them;
 * - `blocked`: the person said no in the browser; only its settings bring it back.
 */
export type PushState = 'unsupported' | 'install' | 'off' | 'on' | 'blocked';

function isAppleMobile(): boolean {
  const nav = globalThis.navigator;
  if (!nav) return false;
  return (
    /iPad|iPhone|iPod/.test(nav.userAgent) || (nav.maxTouchPoints > 1 && /Mac/.test(nav.platform))
  );
}

function isInstalled(): boolean {
  const nav = globalThis.navigator as Navigator & { standalone?: boolean };
  return !!nav?.standalone || !!globalThis.matchMedia?.('(display-mode: standalone)').matches;
}

/**
 * Notices on the phone (Web Push through the relay in `push-worker/`). Turned on only when the
 * person taps "Ativar notificações no celular", never by surprise. Each notice is written in the
 * person's bell first (`users/{uid}/notifications`), then the relay is asked to push it: the
 * relay reads it as whoever wrote it, so Firestore's rules decide who may tell whom.
 */
@Injectable({ providedIn: 'root' })
export class PushService {
  /** Missing in tests and when the service worker is off (development). */
  private readonly swPush = inject(SwPush, { optional: true });
  private readonly auth = inject(AuthService);

  private readonly subscribed = signal(false);
  private readonly permission = signal<NotificationPermission>(
    typeof Notification === 'undefined' ? 'denied' : Notification.permission,
  );

  readonly state = computed<PushState>(() => {
    const canPush =
      !!this.swPush?.isEnabled && !!pushRelayUrl() && typeof Notification !== 'undefined';
    if (!canPush) return isAppleMobile() && !isInstalled() ? 'install' : 'unsupported';
    if (this.permission() === 'denied') return 'blocked';
    return this.subscribed() && this.permission() === 'granted' ? 'on' : 'off';
  });

  constructor() {
    const swPush = this.swPush;
    if (!swPush?.isEnabled) return;
    swPush.subscription.subscribe((sub) => this.subscribed.set(!!sub));
    // On every sign-in, a device already on tells the relay again who it belongs to now.
    effect(() => {
      const uid = this.auth.currentUser()?.uid;
      if (uid) untracked(() => void this.refresh());
    });
  }

  /** "Ativar notificações no celular": asks the browser, then registers this device. */
  async enable(): Promise<boolean> {
    const swPush = this.swPush;
    if (this.state() !== 'off' || !swPush) return this.state() === 'on';
    try {
      const sub = await swPush.requestSubscription({ serverPublicKey: PUSH_VAPID_PUBLIC_KEY });
      this.permission.set(Notification.permission);
      if (await this.post('/devices', { subscription: sub.toJSON() })) return true;
      // The relay did not keep it: the device would look on and never receive anything.
      await swPush.unsubscribe().catch(() => undefined);
      return false;
    } catch {
      this.permission.set(typeof Notification === 'undefined' ? 'denied' : Notification.permission);
      return false;
    }
  }

  /** Stops notices on this device. */
  async disable(): Promise<void> {
    const swPush = this.swPush;
    if (!swPush) return;
    const sub = await firstValueFrom(swPush.subscription).catch(() => null);
    if (!sub) return;
    await this.post('/devices/remove', { endpoint: sub.endpoint });
    await swPush.unsubscribe().catch(() => undefined);
  }

  /**
   * Asks the relay to push a notice this person just wrote, e.g.
   * `users/{uid}/notifications/{id}` or `events/{id}/invitations/{email}`. Best effort: the bell
   * already has it.
   */
  notify(path: string): void {
    if (!pushRelayUrl()) return;
    void this.post('/notify', { path });
  }

  private async refresh(): Promise<void> {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
    if (!this.swPush) return;
    const sub = await firstValueFrom(this.swPush.subscription).catch(() => null);
    if (sub) await this.post('/devices', { subscription: sub.toJSON() });
  }

  private async post(route: string, body: unknown): Promise<boolean> {
    const user = this.auth.currentUser();
    const url = pushRelayUrl();
    if (!user || !url) return false;
    try {
      const token = await user.getIdToken();
      const response = await fetch(`${url}${route}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}
