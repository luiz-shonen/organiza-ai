import { Injectable, inject, signal } from '@angular/core';
import type { EventInvitation } from '../models';
import { AuthService } from './auth.service';
import { EventService } from './event.service';
import { InboxService } from './inbox.service';
import { collaboratorNotificationId } from '../models';

/**
 * The invites to help organise an event that the signed-in person received (by e-mail) and
 * has not answered. They show in the notifications bell; on the event's page the person accepts
 * (and becomes a collaborator) or declines.
 */
@Injectable({ providedIn: 'root' })
export class CollaboratorInvitesService {
  private readonly auth = inject(AuthService);
  private readonly events = inject(EventService);
  private readonly inbox = inject(InboxService);

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

  /** One invite, not its event: a new invite to the same event is new again. */
  seenKeyOf(invite: Pick<EventInvitation, 'eventId' | 'createdAt'>): string {
    return `${invite.eventId}@${invite.createdAt}`;
  }

  isSeen(invite: Pick<EventInvitation, 'eventId' | 'createdAt'>): boolean {
    return this.seenIds().has(this.seenKeyOf(invite));
  }

  /** Opening an invite (from the bell or on the event page) stops it counting as new. */
  markSeen(invite: Pick<EventInvitation, 'eventId' | 'createdAt'>): void {
    const id = this.seenKeyOf(invite);
    if (!invite.eventId || this.seenIds().has(id)) return;
    const next = new Set(this.seenIds()).add(id);
    this.seenIds.set(next);
    const key = this.seenKey();
    try {
      if (key) localStorage.setItem(key, JSON.stringify([...next]));
    } catch {
      // Storage may be unavailable: it then stays seen for this visit only.
    }
  }

  /** While the app is open: on coming back to it, and every minute, new invites show up. */
  private watching = false;
  watch(): void {
    if (this.watching || typeof window === 'undefined') return;
    this.watching = true;
    const again = () => {
      if (document.visibilityState === 'visible') void this.refresh();
    };
    window.addEventListener('focus', again);
    document.addEventListener('visibilitychange', again);
    window.setInterval(again, 60_000);
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
    await this.remember(invite, true);
  }

  async decline(invite: EventInvitation): Promise<void> {
    await this.events.declineInvitation(invite.eventId, invite.invitedEmail);
    this.drop(invite);
    await this.remember(invite, false);
  }

  /** The answered invite stays in the bell's history; best effort, never undoing the answer. */
  private async remember(invite: EventInvitation, accepted: boolean): Promise<void> {
    const uid = this.auth.currentUser()?.uid;
    if (!uid) return;
    const by = invite.invitedByName ? ` · por ${invite.invitedByName}` : '';
    await this.inbox
      .record(uid, {
        id: collaboratorNotificationId(invite.eventId),
        kind: 'collaborator',
        eventId: invite.eventId,
        eventTitle: invite.eventTitle,
        title: accepted ? 'Você aceitou colaborar' : 'Você recusou o convite para colaborar',
        body: `${invite.eventTitle || 'Um evento'}${by}`,
        actionLabel: 'Ver evento',
        actionUrl: `/evento/${invite.eventId}`,
        createdAt: new Date().toISOString(),
      })
      .catch(() => undefined);
  }

  private drop(invite: EventInvitation): void {
    this.list.update((list) => list.filter((i) => i.eventId !== invite.eventId));
  }
}
