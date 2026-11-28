import { Injectable, inject } from '@angular/core';
import {
  approvalNotificationId,
  collaborationNotificationId,
  eventStatusNotificationId,
  presenceNotificationId,
  type AppNotification,
  type PartyEvent,
} from '../models';
import { AuthService } from './auth.service';
import { EventService } from './event.service';
import { GuestService } from './guest.service';
import { firstValueFrom } from 'rxjs';
import { InboxService } from './inbox.service';
import { PushService } from './push.service';

/** A guest's answer, as told to who organizes. */
export type PresenceNews =
  | { readonly kind: 'confirmed'; readonly companions: number; readonly relatives: number }
  | { readonly kind: 'pending'; readonly companions: number; readonly relatives: number }
  | { readonly kind: 'edited'; readonly companions: number; readonly relatives: number }
  | { readonly kind: 'declined'; readonly message: string }
  | { readonly kind: 'cancelled'; readonly message: string };

function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`;
}

/** "com Pedro e 2 acompanhantes"-like detail, or empty when they come alone. */
function whoComes(companions: number, relatives: number): string {
  const parts = [
    relatives ? plural(relatives, 'familiar', 'familiares') : '',
    companions ? plural(companions, 'acompanhante', 'acompanhantes') : '',
  ].filter(Boolean);
  return parts.length ? `com ${parts.join(' e ')}` : '';
}

/** Text the rules accept: no markup characters, within the size. */
function clean(text: string, max: number): string {
  return text
    .replace(/[<>{}]/g, '')
    .trim()
    .slice(0, max);
}

/**
 * What the people of an event tell each other, in the bell and on the phone: a guest answering
 * tells each person who organizes; a collaborator joining or leaving tells the others; an
 * organizer letting a presence in tells the guest. Best effort: a notice that fails never undoes
 * what was done.
 */
@Injectable({ providedIn: 'root' })
export class PeopleNoticesService {
  private readonly auth = inject(AuthService);
  private readonly events = inject(EventService);
  private readonly guests = inject(GuestService);
  private readonly inbox = inject(InboxService);
  private readonly push = inject(PushService);

  /** Message for each person who organizes the event, about the guest's answer. */
  static presenceText(name: string, news: PresenceNews): { title: string; body: string } {
    switch (news.kind) {
      case 'confirmed':
        return {
          title: `${name} confirmou presença`,
          body: whoComes(news.companions, news.relatives) || 'Vai sozinho(a).',
        };
      case 'pending':
        return {
          title: `${name} quer confirmar presença`,
          body: ['Aguardando sua aprovação', whoComes(news.companions, news.relatives)]
            .filter(Boolean)
            .join(' · '),
        };
      case 'edited':
        return {
          title: `${name} editou a presença`,
          body: whoComes(news.companions, news.relatives) || 'Agora vai sozinho(a).',
        };
      case 'declined':
        return {
          title: `${name} não poderá ir`,
          body: news.message ? `“${news.message}”` : 'Recusou o convite.',
        };
      case 'cancelled':
        return {
          title: `${name} cancelou a presença`,
          body: news.message ? `“${news.message}”` : 'Não vai mais ao evento.',
        };
    }
  }

  /** A guest answered: each person who organizes hears it. */
  async presence(eventId: string, name: string, news: PresenceNews): Promise<void> {
    const actor = this.auth.currentUser()?.uid;
    if (!actor) return;
    const text = PeopleNoticesService.presenceText(clean(name, 80) || 'Um convidado', news);
    await this.toOrganizers(eventId, presenceNotificationId(eventId, actor), 'presence', {
      ...text,
      actionLabel: 'Ver convidados',
    });
  }

  /** A collaborator joined (accepted the invite) or left. */
  async collaboration(eventId: string, name: string, joined: boolean): Promise<void> {
    const actor = this.auth.currentUser()?.uid;
    if (!actor) return;
    const who = clean(name, 80) || 'Um colaborador';
    await this.toOrganizers(eventId, collaborationNotificationId(eventId, actor), 'collaboration', {
      title: joined ? `${who} aceitou colaborar` : `${who} saiu da colaboração`,
      body: joined ? 'Agora ajuda a organizar o evento.' : 'Não ajuda mais a organizar o evento.',
      actionLabel: 'Ver evento',
    });
  }

  /** An organizer let the guest's presence in. */
  async approved(event: Pick<PartyEvent, 'id' | 'title'>, guestUid: string): Promise<void> {
    const actor = this.auth.currentUser()?.uid;
    if (!actor || !guestUid || guestUid === actor) return;
    await this.send(guestUid, {
      id: approvalNotificationId(event.id),
      kind: 'approval',
      eventId: event.id,
      title: 'Sua presença foi aprovada',
      body: `Você está na lista de ${clean(event.title, 120) || 'convidados'}.`,
      actionLabel: 'Ver evento',
      actionUrl: `/evento/${event.id}`,
      createdAt: new Date().toISOString(),
      actorUid: actor,
    });
  }

  /**
   * The owner cancelled or reopened the event: each collaborator and each guest who answered
   * with an account hears it (relatives and people added by hand have no account of their own).
   */
  async eventStatus(
    event: Pick<PartyEvent, 'id' | 'title' | 'collaborators'>,
    cancelled: boolean,
  ): Promise<void> {
    const actor = this.auth.currentUser()?.uid;
    if (!actor) return;
    const guests = await firstValueFrom(this.guests.listGuests(event.id)).catch(() => []);
    const recipients = [
      ...(event.collaborators ?? []),
      ...guests.filter((g) => g.uid && !g.primaryGuestId && !g.addedBy).map((g) => g.uid!),
    ].filter((uid, i, all) => !!uid && uid !== actor && all.indexOf(uid) === i);
    const title = clean(event.title, 120) || 'O evento';
    const createdAt = new Date().toISOString();
    await Promise.allSettled(
      recipients.map((uid) =>
        this.send(uid, {
          id: eventStatusNotificationId(event.id),
          kind: 'event-status',
          eventId: event.id,
          title: cancelled ? 'Evento cancelado' : 'Evento reaberto',
          body: cancelled
            ? `${title} foi cancelado por quem organiza.`
            : `${title} está de pé de novo. Confira os detalhes.`,
          actionLabel: 'Ver evento',
          actionUrl: `/evento/${event.id}`,
          createdAt,
          actorUid: actor,
        }),
      ),
    );
  }

  /** An invite to help organise was sent: the invited person's phones hear it too. */
  collaboratorInvited(eventId: string, email: string): void {
    this.push.notify(`events/${eventId}/invitations/${email.toLowerCase().trim()}`);
  }

  /** The amigo oculto notice the owner wrote in a participant's bell. */
  pushNotice(uid: string, notificationId: string): void {
    this.push.notify(`users/${uid}/notifications/${notificationId}`);
  }

  private async toOrganizers(
    eventId: string,
    id: string,
    kind: 'presence' | 'collaboration',
    text: { title: string; body: string; actionLabel: string },
  ): Promise<void> {
    const actor = this.auth.currentUser()?.uid;
    const event = await this.events.getEventById(eventId).catch(() => null);
    if (!actor || !event) return;
    const organizers = [event.createdBy, ...(event.collaborators ?? [])].filter(
      (uid, i, all): uid is string => !!uid && uid !== actor && all.indexOf(uid) === i,
    );
    const createdAt = new Date().toISOString();
    await Promise.allSettled(
      organizers.map((uid) =>
        this.send(uid, {
          id,
          kind,
          eventId,
          title: clean(text.title, 200),
          body: clean(`${event.title ? `${event.title} · ` : ''}${text.body}`, 500),
          actionLabel: text.actionLabel,
          actionUrl: `/evento/${eventId}`,
          createdAt,
          actorUid: actor,
        }),
      ),
    );
  }

  private async send(uid: string, notice: Omit<AppNotification, 'readAt'>): Promise<void> {
    try {
      await this.inbox.send(uid, notice);
      this.pushNotice(uid, notice.id);
    } catch (err) {
      console.warn('Aviso não enviado', err);
    }
  }
}
