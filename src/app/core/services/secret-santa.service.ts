import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { FirestoreGateway } from './firestore.gateway';
import { InboxService } from './inbox.service';
import { secretSantaNotificationId } from '../models';
import type {
  PartyEvent,
  SecretSantaDraw,
  SecretSantaLink,
  SecretSantaParticipant,
  SecretSantaParticipantInput,
  SecretSantaDuplicate,
  SecretSantaReveal,
  SecretSantaSettings,
} from '../models';
import { drawSecretSanta, generateId } from '../utils';

/**
 * Amigo oculto. Participants live in `events/{id}/secretSantaParticipants` (owner and
 * collaborators), the latest draw with every link in `events/{id}/secretSanta/draw` (owner
 * only), and each pair only in `secretSantaReveals/{token}`, which anyone holding the token
 * reads without signing in, and nobody can list.
 */
@Injectable({ providedIn: 'root' })
export class SecretSantaService {
  private readonly gateway = inject(FirestoreGateway);
  private readonly inbox = inject(InboxService);

  private participantsPath(eventId: string): string {
    return `events/${eventId}/secretSantaParticipants`;
  }

  private drawPath(eventId: string): string {
    return `events/${eventId}/secretSanta/draw`;
  }

  private revealPath(token: string): string {
    return `secretSantaReveals/${token}`;
  }

  listParticipants(eventId: string): Observable<SecretSantaParticipant[]> {
    return this.gateway
      .collectionSnapshot<Omit<SecretSantaParticipant, 'id'>>(this.participantsPath(eventId))
      .pipe(
        map((docs) =>
          docs
            .map((d) => ({
              id: d.id,
              name: d.name ?? '',
              phone: d.phone ?? '',
              giftOptions: d.giftOptions ?? [],
              ...(d.guestId ? { guestId: d.guestId } : {}),
              ...(d.joinedBy ? { joinedBy: d.joinedBy } : {}),
              ...(d.distinctFrom?.length ? { distinctFrom: d.distinctFrom } : {}),
              createdAt: d.createdAt ?? '',
            }))
            .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
        ),
      );
  }

  async addParticipant(eventId: string, input: SecretSantaParticipantInput): Promise<string> {
    return this.gateway.addDoc(this.participantsPath(eventId), {
      ...this.toDoc(input),
      createdAt: new Date().toISOString(),
    });
  }

  async updateParticipant(
    eventId: string,
    participantId: string,
    input: SecretSantaParticipantInput,
  ): Promise<void> {
    await this.gateway.updateDoc(
      `${this.participantsPath(eventId)}/${participantId}`,
      this.toDoc(input),
    );
  }

  async removeParticipant(eventId: string, participantId: string): Promise<void> {
    await this.gateway.deleteDoc(`${this.participantsPath(eventId)}/${participantId}`);
  }

  /**
   * The entries this guest put in the draw from the invite, among `ids` (`rsvp_{uid}…`). A guest
   * cannot read the list, only their own entries, one by one.
   */
  async getOwnEntries(eventId: string, ids: readonly string[]): Promise<SecretSantaParticipant[]> {
    const found = await Promise.all(
      ids.map((id) =>
        this.gateway
          .getDocWithId<
            Omit<SecretSantaParticipant, 'id'>
          >(`${this.participantsPath(eventId)}/${id}`)
          .catch(() => null),
      ),
    );
    return found.flatMap((doc) =>
      doc
        ? [
            {
              id: doc.id,
              name: doc.name ?? '',
              phone: doc.phone ?? '',
              giftOptions: doc.giftOptions ?? [],
              ...(doc.guestId ? { guestId: doc.guestId } : {}),
              ...(doc.joinedBy ? { joinedBy: doc.joinedBy } : {}),
            },
          ]
        : [],
    );
  }

  /**
   * Saves who the guest put in the draw from the invite, in one batch: each entry keeps its id
   * (`rsvp_{uid}…`), so answering again updates it instead of adding a second one, and the
   * entries left out (`remove`) leave the draw.
   */
  async saveOwnEntries(
    eventId: string,
    uid: string,
    entries: readonly { id: string; input: SecretSantaParticipantInput }[],
    remove: readonly string[],
    /** Entries that already exist: they keep their creation date. */
    existing: readonly string[] = [],
  ): Promise<void> {
    if (!entries.length && !remove.length) return;
    const now = new Date().toISOString();
    await this.gateway.runBatch((batch) => {
      for (const { id, input } of entries) {
        batch.set(
          `${this.participantsPath(eventId)}/${id}`,
          {
            ...this.toDoc(input),
            joinedBy: uid,
            ...(existing.includes(id) ? {} : { createdAt: now }),
          },
          { merge: true },
        );
      }
      for (const id of remove) {
        batch.delete(`${this.participantsPath(eventId)}/${id}`);
      }
    });
  }

  /**
   * Makes the two entries of one person a single one: the entry that came from the invite stays
   * (it is tied to the guest's account) and takes the phone and gift options typed by the
   * organizer when it has none; the typed entry leaves the list.
   */
  async mergeDuplicate(eventId: string, duplicate: SecretSantaDuplicate): Promise<void> {
    const { keep, drop } = duplicate;
    await this.gateway.runBatch((batch) => {
      batch.update(`${this.participantsPath(eventId)}/${keep.id}`, {
        phone: keep.phone || drop.phone,
        giftOptions: [...(keep.giftOptions.length ? keep.giftOptions : drop.giftOptions)],
        ...(!keep.guestId && drop.guestId ? { guestId: drop.guestId } : {}),
      });
      batch.delete(`${this.participantsPath(eventId)}/${drop.id}`);
    });
  }

  /** "São pessoas diferentes": the pair is no longer pointed out. */
  async markDistinct(eventId: string, duplicate: SecretSantaDuplicate): Promise<void> {
    await this.gateway.updateDoc(`${this.participantsPath(eventId)}/${duplicate.keep.id}`, {
      distinctFrom: [...(duplicate.keep.distinctFrom ?? []), duplicate.drop.id],
    });
  }

  /** Opens or closes the sign-ups from the invite (owner only). */
  async setSelfJoin(eventId: string, settings: SecretSantaSettings, open: boolean): Promise<void> {
    await this.gateway.updateDoc(`events/${eventId}`, {
      secretSanta: { ...settings, selfJoin: open },
      updatedAt: new Date().toISOString(),
    });
  }

  /** The latest draw; only the event owner may read it. */
  watchDraw(eventId: string): Observable<SecretSantaDraw | null> {
    return this.gateway.docSnapshot<SecretSantaDraw>(this.drawPath(eventId)).pipe(
      map((doc) =>
        doc
          ? {
              drawnAt: doc.drawnAt ?? '',
              participantIds: doc.participantIds ?? [],
              links: doc.links ?? [],
            }
          : null,
      ),
    );
  }

  /**
   * Draws (or draws again) in one batch: the links of the previous draw stop working, every
   * participant gets a new secret link, and the draw keeps those links for the owner to send.
   */
  async draw(
    event: Pick<PartyEvent, 'id' | 'title' | 'date'>,
    participants: readonly SecretSantaParticipant[],
    previous: SecretSantaDraw | null,
    /** Participants with an account (confirmed guests), by participant id: told in the app. */
    uids: Readonly<Record<string, string>> = {},
  ): Promise<SecretSantaDraw> {
    const pairs = drawSecretSanta(participants);
    const now = new Date().toISOString();
    const links: SecretSantaLink[] = pairs.map(({ giver, receiver }) => ({
      participantId: giver.id,
      name: giver.name,
      phone: giver.phone,
      token: generateId(),
      receiverId: receiver.id,
      ...(uids[giver.id] ? { uid: uids[giver.id] } : {}),
    }));
    const draw: SecretSantaDraw = {
      drawnAt: now,
      participantIds: participants.map((p) => p.id),
      links,
    };

    await this.gateway.runBatch((batch) => {
      for (const link of previous?.links ?? []) {
        batch.delete(this.revealPath(link.token));
      }
      pairs.forEach(({ giver, receiver }, i) => {
        batch.set(
          this.revealPath(links[i].token),
          this.toReveal(event, giver, receiver, now, links[i].uid),
        );
      });
      batch.set(this.drawPath(event.id), draw);
    });
    await this.notify(event, links, false);
    return draw;
  }

  /**
   * A new link for one participant, with the same person drawn: for someone who opened the
   * link and did not write the name down, or lost the message. The old link stops working.
   */
  async resendLink(
    event: Pick<PartyEvent, 'id' | 'title' | 'date'>,
    draw: SecretSantaDraw,
    participantId: string,
    participants: readonly SecretSantaParticipant[],
    uids: Readonly<Record<string, string>> = {},
  ): Promise<SecretSantaDraw> {
    const link = draw.links.find((l) => l.participantId === participantId);
    const giver = participants.find((p) => p.id === participantId);
    const receiver = participants.find((p) => p.id === link?.receiverId);
    if (!link || !giver || !receiver) {
      throw new Error('Esta pessoa ou quem ela tirou saiu do amigo oculto: sorteie de novo.');
    }
    const fresh: SecretSantaLink = {
      ...link,
      name: giver.name,
      phone: giver.phone,
      token: generateId(),
      ...(uids[participantId] || link.uid ? { uid: uids[participantId] || link.uid } : {}),
    };
    const next: SecretSantaDraw = {
      ...draw,
      links: draw.links.map((l) => (l.participantId === participantId ? fresh : l)),
    };
    await this.gateway.runBatch((batch) => {
      batch.delete(this.revealPath(link.token));
      batch.set(
        this.revealPath(fresh.token),
        this.toReveal(event, giver, receiver, new Date().toISOString(), fresh.uid),
      );
      batch.set(this.drawPath(event.id), next);
    });
    await this.notify(event, [fresh], true);
    return next;
  }

  /**
   * Tells the participants who have an account, in the app: "Confira quem você tirou", with
   * their secret link. Best effort: WhatsApp stays the main way, so a failed notice never fails
   * the draw. Returns how many were told.
   */
  private async notify(
    event: Pick<PartyEvent, 'id' | 'title'>,
    links: readonly SecretSantaLink[],
    isNewLink: boolean,
  ): Promise<number> {
    const now = new Date().toISOString();
    const results = await Promise.allSettled(
      links
        .filter((link) => link.uid)
        .map((link) =>
          this.inbox.send(link.uid!, {
            id: secretSantaNotificationId(event.id),
            kind: 'secret-santa',
            eventId: event.id,
            eventTitle: event.title,
            title: isNewLink ? 'Seu novo link do amigo oculto' : 'Sorteio do amigo oculto feito!',
            body: isNewLink
              ? `Quem organiza ${event.title} enviou um novo link para você ver quem tirou no amigo oculto. Ele abre uma vez só: anote o nome.`
              : `O sorteio do amigo oculto de ${event.title} foi feito. Confira quem você tirou: o resultado abre uma vez só, anote o nome.`,
            actionLabel: 'Ver quem eu tirei',
            actionUrl: `/amigo-oculto/${link.token}`,
            createdAt: now,
          }),
        ),
    );
    return results.filter((r) => r.status === 'fulfilled').length;
  }

  /** What a secret link reveals; null when the link is unknown or was replaced. */
  async getReveal(token: string): Promise<SecretSantaReveal | null> {
    return this.gateway.getDoc<SecretSantaReveal>(this.revealPath(token));
  }

  /**
   * Spends the link: stamps when it was opened and erases whom the person drew, so opening it
   * again only says it expired. The rules allow this once, to anyone holding the link.
   */
  async openReveal(token: string): Promise<void> {
    await this.gateway.updateDoc(this.revealPath(token), {
      openedAt: new Date().toISOString(),
      receiverName: '',
      receiverGiftOptions: [],
    });
  }

  /** When a link was opened (null: not yet, or it no longer exists), for the owner's list. */
  watchOpenedAt(token: string): Observable<string | null> {
    return this.gateway
      .docSnapshot<SecretSantaReveal>(this.revealPath(token))
      .pipe(map((doc) => doc?.openedAt ?? null));
  }

  private toReveal(
    event: Pick<PartyEvent, 'id' | 'title' | 'date'>,
    giver: SecretSantaParticipant,
    receiver: SecretSantaParticipant,
    now: string,
    giverUid?: string,
  ): SecretSantaReveal {
    return {
      eventId: event.id,
      eventTitle: event.title,
      eventDate: event.date,
      giverName: giver.name,
      ...(giverUid ? { giverUid } : {}),
      receiverName: receiver.name,
      receiverGiftOptions: [...receiver.giftOptions],
      createdAt: now,
    };
  }

  private toDoc(input: SecretSantaParticipantInput): Record<string, unknown> {
    return {
      name: input.name,
      phone: input.phone,
      giftOptions: [...input.giftOptions],
      ...(input.guestId ? { guestId: input.guestId } : {}),
    };
  }
}
