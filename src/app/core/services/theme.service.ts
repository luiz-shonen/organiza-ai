import { Injectable, effect, signal } from '@angular/core';

export type ThemeMode = 'light' | 'dark' | 'system';

@Injectable({ providedIn: 'root' })
export class ThemeService {
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
  }

  setMode(newMode: ThemeMode): void {
    this.mode.set(newMode);
    localStorage.setItem('theme_mode', newMode);
    this.updateIsDark(newMode);
  }

  private loadFromStorage(): void {
    const stored = localStorage.getItem('theme_mode') as ThemeMode | null;
    if (stored && ['light', 'dark', 'system'].includes(stored)) {
      this.mode.set(stored);
    }
    this.updateIsDark(this.mode());
  }

  private setupListeners(): void {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (this.mode() === 'system') {
        this.updateIsDark('system');
      }
    });
  }

  private updateIsDark(currentMode: ThemeMode): void {
    if (currentMode === 'dark') {
      this.isDark.set(true);
    } else if (currentMode === 'light') {
      this.isDark.set(false);
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.isDark.set(prefersDark);
    }
  }
}
