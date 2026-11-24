import { Injectable, inject } from '@angular/core';
import { Location } from '@angular/common';
import { NavigationEnd, NavigationStart, Router } from '@angular/router';

/**
 * The screens visited in this tab, so the header back arrow returns to the one before
 * (Meus eventos → evento → editar → back to the evento), not to a fixed parent. A screen
 * opened straight from a link has nothing before it: then the arrow uses the fallback.
 */
@Injectable({ providedIn: 'root' })
export class NavigationHistoryService {
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly stack: string[] = [];
  private trigger: 'push' | 'replace' | 'popstate' = 'push';

  constructor() {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        const replace = this.router.getCurrentNavigation()?.extras.replaceUrl === true;
        // Browser back/forward (popstate, hashchange): a move in the history, not a new screen.
        this.trigger =
          event.navigationTrigger !== 'imperative' ? 'popstate' : replace ? 'replace' : 'push';
      } else if (event instanceof NavigationEnd) {
        this.record(event.urlAfterRedirects);
      }
    });
  }

  /** The screen before this one in the tab, or null when this is the first. */
  previous(): string | null {
    return this.stack.length > 1 ? this.stack[this.stack.length - 2] : null;
  }

  /** Back to the screen before; with none, to `fallback`. */
  back(fallback: string): void {
    if (this.previous()) {
      this.location.back();
      return;
    }
    this.router.navigateByUrl(fallback).catch(console.error);
  }

  private record(url: string): void {
    if (this.trigger === 'popstate') {
      // The browser went back (or forward): drop what came after, or add a screen not seen.
      const at = this.stack.lastIndexOf(url);
      if (at >= 0) this.stack.length = at + 1;
      else this.stack.push(url);
      return;
    }
    if (this.trigger === 'replace' && this.stack.length) {
      this.stack[this.stack.length - 1] = url;
      return;
    }
    if (this.stack[this.stack.length - 1] !== url) this.stack.push(url);
  }
}
