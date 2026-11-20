import { Injectable } from '@angular/core';

/** A draft as kept in the browser: what was typed and when. */
export interface StoredDraft<T> {
  readonly value: T;
  readonly savedAt: number;
}

/**
 * Keeps what someone is typing in this browser (localStorage), so a reload, a closed tab or a
 * dropped connection does not lose it. A draft lasts three days; older ones are dropped.
 * Storage may be missing or full (private mode): then nothing is kept and the form still works.
 */
@Injectable({ providedIn: 'root' })
export class FormDraftService {
  static readonly PREFIX = 'organiza:draft:';
  static readonly TTL_MS = 3 * 24 * 60 * 60 * 1000;

  constructor() {
    this.prune();
  }

  save<T>(key: string, value: T, now = Date.now()): void {
    const draft: StoredDraft<T> = { value, savedAt: now };
    try {
      localStorage.setItem(FormDraftService.PREFIX + key, JSON.stringify(draft));
    } catch {
      // No storage (private mode, full): the form works, it just is not kept.
    }
  }

  /** The draft, or null when there is none, it cannot be read or it is older than three days. */
  load<T>(key: string, now = Date.now()): StoredDraft<T> | null {
    try {
      const raw = localStorage.getItem(FormDraftService.PREFIX + key);
      if (!raw) return null;
      const draft = JSON.parse(raw) as StoredDraft<T>;
      if (typeof draft?.savedAt !== 'number' || now - draft.savedAt > FormDraftService.TTL_MS) {
        this.clear(key);
        return null;
      }
      return draft;
    } catch {
      this.clear(key);
      return null;
    }
  }

  clear(key: string): void {
    try {
      localStorage.removeItem(FormDraftService.PREFIX + key);
    } catch {
      // Nothing to clear without storage.
    }
  }

  /** Drops every draft older than three days, so forgotten ones do not pile up. */
  prune(now = Date.now()): void {
    try {
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(FormDraftService.PREFIX)) keys.push(key);
      }
      for (const key of keys) this.load(key.slice(FormDraftService.PREFIX.length), now);
    } catch {
      // No storage: nothing kept, nothing to drop.
    }
  }
}
