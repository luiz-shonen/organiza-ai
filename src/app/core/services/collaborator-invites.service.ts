import { Injectable, inject, signal } from '@angular/core';
import type { EventInvitation } from '../models';
import { AuthService } from './auth.service';
import { EventService } from './event.service';

/**
 * The invites to help organise an event that the signed-in person received (by e-mail) and
 * has not answered. They show in the notifications bell; on the event's page the person accepts
 * (and becomes a collaborator) or declines.
 */
@Injectable({ providedIn: 'root' })
export class CollaboratorInvitesService {
  private readonly auth = inject(AuthService);
  private readonly events = inject(EventService);

  private readonly list = signal<EventInvitation[]>([]);
  readonly invites = this.list.asReadonly();
  /** Invites opened already (by event id): still listed until answered, no longer counted. */
  private readonly seenIds = signal<ReadonlySet<string>>(new Set());
  readonly seen = this.seenIds.asReadonly();

  private seenKey(): string | null {
    const uid = this.auth.currentUser()?.uid;
    return uid ? `organiza:seen-invites:${uid}` : null;
  }

  private loadSeen(): void {
    const key = this.seenKey();
    let ids: string[] = [];
    try {
      ids = key ? (JSON.parse(localStorage.getItem(key) ?? '[]') as string[]) : [];
    } catch {
      ids = [];
    }
    this.seenIds.set(new Set(ids));
  }

  /** Opening an invite (from the bell or on the event page) stops it counting as new. */
  markSeen(eventId: string): void {
    if (!eventId || this.seenIds().has(eventId)) return;
    const next = new Set(this.seenIds()).add(eventId);
    this.seenIds.set(next);
    const key = this.seenKey();
    try {
      if (key) localStorage.setItem(key, JSON.stringify([...next]));
    } catch {
      // Storage may be unavailable: it then stays seen for this visit only.
    }
  }

  async refresh(): Promise<void> {
    this.loadSeen();
    const email = this.auth.currentUser()?.email;
    if (!email) {
      this.list.set([]);
      return;
    }
    try {
      this.list.set(await this.events.invitationsFor(email));
    } catch {
      this.list.set([]);
    }
  }

  forEvent(eventId: string): EventInvitation | null {
    return this.list().find((invite) => invite.eventId === eventId) ?? null;
  }

  async accept(invite: EventInvitation): Promise<void> {
    const uid = this.auth.currentUser()?.uid;
    if (!uid) return;
    await this.events.acceptInvitation(invite.eventId, invite.invitedEmail, uid);
    this.drop(invite);
  }

  async decline(invite: EventInvitation): Promise<void> {
    await this.events.declineInvitation(invite.eventId, invite.invitedEmail);
    this.drop(invite);
  }

  private drop(invite: EventInvitation): void {
    this.list.update((list) => list.filter((i) => i.eventId !== invite.eventId));
  }
}
