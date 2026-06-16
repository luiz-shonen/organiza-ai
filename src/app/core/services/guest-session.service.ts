import { Injectable, signal, computed, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { GuestSession } from '../models';

const STORAGE_KEY = 'organizaai_guest_session';

@Injectable({ providedIn: 'root' })
export class GuestSessionService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly _session = signal<GuestSession | null>(null);

  readonly session = this._session.asReadonly();
  readonly isIdentified = computed(() => this._session() !== null);
  readonly guestName = computed(() => this._session()?.name ?? '');
  readonly guestPhone = computed(() => this._session()?.phone ?? '');

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.loadFromStorage();
    }
  }

  saveSession(session: GuestSession): void {
    this._session.set(session);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    }
  }

  clearSession(): void {
    this._session.set(null);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  private loadFromStorage(): void {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed: unknown = JSON.parse(stored);
        if (this.isValidSession(parsed)) {
          this._session.set(parsed);
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }

  private isValidSession(value: unknown): value is GuestSession {
    return (
      typeof value === 'object' &&
      value !== null &&
      'name' in value &&
      'phone' in value &&
      typeof (value as GuestSession).name === 'string' &&
      typeof (value as GuestSession).phone === 'string'
    );
  }
}
