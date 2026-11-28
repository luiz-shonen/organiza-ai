import { DestroyRef, Injectable, inject } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { SwUpdate } from '@angular/service-worker';
import { filter } from 'rxjs';

/** How often an open app asks whether a new version was deployed. */
export const APP_UPDATE_CHECK_MS = 15 * 60 * 1000;

/**
 * A new deploy reaches everyone by itself. The service worker keeps a copy of the app and runs it
 * until a new one is downloaded, and then only after a reload, so people used to see new deploys
 * only after several refreshes. This asks for a new version when the app opens, when it comes
 * back to the screen and every 15 minutes, and switches to it at the first safe moment, with no
 * button: at once if the person has not touched the page yet (they just opened it), otherwise on
 * their next change of page or when they come back to the app, so nothing being typed is lost.
 */
@Injectable({ providedIn: 'root' })
export class AppUpdateService {
  private readonly sw = inject(SwUpdate, { optional: true });
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private started = false;
  /** The person tapped, clicked or typed since the page loaded. */
  private touched = false;
  /** A new version is ready and waits for a safe moment. */
  private pending = false;

  start(): void {
    const sw = this.sw;
    if (this.started || !sw?.isEnabled) return;
    this.started = true;

    const onTouch = () => (this.touched = true);
    document.addEventListener('pointerdown', onTouch, { capture: true, once: true });
    document.addEventListener('keydown', onTouch, { capture: true, once: true });

    const versions = sw.versionUpdates.subscribe((event) => {
      if (event.type === 'VERSION_READY') this.onReady();
    });
    // The copy kept is broken (a file of it is gone): only a reload recovers.
    const broken = sw.unrecoverable.subscribe(() => this.reload());
    const pages = this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        if (this.pending) void this.switchNow();
      });

    const check = () => void sw.checkForUpdate().catch(() => undefined);
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return;
      if (this.pending) void this.switchNow();
      else check();
    };
    document.addEventListener('visibilitychange', onVisible);
    const timer = setInterval(check, APP_UPDATE_CHECK_MS);
    check();

    this.destroyRef.onDestroy(() => {
      versions.unsubscribe();
      broken.unsubscribe();
      pages.unsubscribe();
      document.removeEventListener('pointerdown', onTouch, { capture: true });
      document.removeEventListener('keydown', onTouch, { capture: true });
      document.removeEventListener('visibilitychange', onVisible);
      clearInterval(timer);
    });
  }

  private onReady(): void {
    if (!this.touched) {
      void this.switchNow();
      return;
    }
    this.pending = true;
  }

  /** The new version takes over, and the page reloads on it (the same address). */
  private async switchNow(): Promise<void> {
    this.pending = false;
    await this.sw?.activateUpdate().catch(() => undefined);
    this.reload();
  }

  /** The browser's reload, apart so tests can watch it. */
  reload(): void {
    location.reload();
  }
}
