import { Injectable } from '@angular/core';

/** What was typed in an amigo oculto form, not saved yet. */
export interface ParticipantDraft {
  readonly name: string;
  readonly phone: string;
  readonly gifts: readonly string[];
  /** An idea typed in "Nova opção" and not added yet. */
  readonly pendingGift: string;
}

/**
 * Keeps what was typed in an amigo oculto form while its drawer is closed (by a tap outside,
 * Esc, or going to another screen), so reopening it brings everything back. In memory only:
 * reloading the page clears it, as does saving or "Cancelar". Kept per page and per form.
 */
@Injectable({ providedIn: 'root' })
export class ParticipantDraftsService {
  private readonly drafts = new Map<string, ParticipantDraft>();

  get(key: string): ParticipantDraft | undefined {
    return this.drafts.get(this.scoped(key));
  }

  set(key: string, draft: ParticipantDraft): void {
    this.drafts.set(this.scoped(key), draft);
  }

  clear(key: string): void {
    this.drafts.delete(this.scoped(key));
  }

  private scoped(key: string): string {
    const page = typeof location === 'undefined' ? '' : location.pathname;
    return `${page}|${key}`;
  }
}
