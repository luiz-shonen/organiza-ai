import { Injectable, effect, signal, inject } from '@angular/core';
import { AuthService } from './auth.service';
import { UserService } from './user.service';

export type ThemeMode = 'light' | 'dark' | 'system';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly auth = inject(AuthService);
  private readonly userService = inject(UserService);

  readonly mode = signal<ThemeMode>('system');
  readonly isDark = signal<boolean>(false);

  constructor() {
    this.loadFromStorage();
    this.setupListeners();

    effect(() => {
      const dark = this.isDark();
      if (dark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    });

    effect(() => {
      const user = this.auth.currentUser();
      if (user?.uid && !user.isAnonymous) {
        this.userService.getProfile(user.uid).then((profile) => {
          if (profile?.themePref) {
            this.mode.set(profile.themePref);
            this.updateIsDark(profile.themePref);
            localStorage.setItem('theme_mode', profile.themePref);
          }
        });
      }
    });
  }

  setMode(newMode: ThemeMode): void {
    this.mode.set(newMode);
    localStorage.setItem('theme_mode', newMode);
    this.updateIsDark(newMode);

    const user = this.auth.currentUser();
    if (user?.uid && !user.isAnonymous) {
      this.userService.updateThemePreference(user.uid, newMode).catch(console.error);
    }
  }

  private loadFromStorage(): void {
    const stored = localStorage.getItem('theme_mode') as ThemeMode | null;
    if (stored && ['light', 'dark', 'system'].includes(stored)) {
      this.mode.set(stored);
    }
    this.updateIsDark(this.mode());
  }

  private setupListeners(): void {
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      try {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery?.addEventListener?.('change', () => {
          if (this.mode() === 'system') {
            this.updateIsDark('system');
          }
        });
      } catch {
        // Fallback for jsdom / SSR
      }
    }
  }

  private updateIsDark(currentMode: ThemeMode): void {
    if (currentMode === 'dark') {
      this.isDark.set(true);
    } else if (currentMode === 'light') {
      this.isDark.set(false);
    } else {
      let prefersDark = false;
      if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
        try {
          prefersDark = window.matchMedia('(prefers-color-scheme: dark)')?.matches ?? false;
        } catch {
          prefersDark = false;
        }
      }
      this.isDark.set(prefersDark);
    }
  }
}
