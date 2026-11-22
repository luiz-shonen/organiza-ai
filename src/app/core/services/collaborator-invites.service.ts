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

  async refresh(): Promise<void> {
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
