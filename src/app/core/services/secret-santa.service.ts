import { Injectable, inject } from '@angular/core';
import { Observable, firstValueFrom, map } from 'rxjs';
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
  SecretSantaRosterEntry,
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

  /**
   * The amigo oculto as the guests see it: one entry per participant, same id, with only the
   * name and the gift options (the participants hold phones, so only organizers read those).
   * Every write to a participant writes its roster entry in the same batch.
   */
  private rosterPath(eventId: string): string {
    return `events/${eventId}/secretSantaRoster`;
  }

  private rosterDoc(input: { name: string; giftOptions: readonly string[] }) {
    return { name: input.name, giftOptions: [...input.giftOptions] };
  }

  /** Who is in the draw, names and gift options only: what a signed-in guest may read. */
  listRoster(eventId: string): Observable<SecretSantaRosterEntry[]> {
    return this.gateway
      .collectionSnapshot<
        Omit<SecretSantaRosterEntry, 'id'> & { createdAt?: string }
      >(this.rosterPath(eventId))
      .pipe(
        map((docs) =>
          docs
            .map((d) => ({
              id: d.id,
              name: d.name ?? '',
              giftOptions: d.giftOptions ?? [],
              createdAt: d.createdAt ?? '',
            }))
            .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
            .map(({ createdAt: _createdAt, ...entry }) => entry),
        ),
      );
  }

  /**
   * Organizers only: brings the roster in line with the participants (entries written before it
   * existed, or by an older version), so the guests see the same people.
   */
  async syncRoster(
    eventId: string,
    participants: readonly SecretSantaParticipant[],
  ): Promise<void> {
    const roster = await firstValueFrom(this.listRoster(eventId));
    const byId = new Map(roster.map((entry) => [entry.id, entry]));
    const stale = participants.filter((p) => {
      const entry = byId.get(p.id);
      return (
        !entry ||
        entry.name !== p.name ||
        JSON.stringify(entry.giftOptions) !== JSON.stringify(p.giftOptions)
      );
    });
    const ids = new Set(participants.map((p) => p.id));
    const gone = roster.filter((entry) => !ids.has(entry.id));
    if (!stale.length && !gone.length) return;
    await this.gateway.runBatch((batch) => {
      for (const p of stale) {
        batch.set(
          `${this.rosterPath(eventId)}/${p.id}`,
          { ...this.rosterDoc(p), createdAt: p.createdAt || new Date().toISOString() },
          { merge: true },
        );
      }
      for (const entry of gone) batch.delete(`${this.rosterPath(eventId)}/${entry.id}`);
    });
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
    const id = this.gateway.newId(this.participantsPath(eventId));
    const createdAt = new Date().toISOString();
    await this.gateway.runBatch((batch) => {
      batch.set(`${this.participantsPath(eventId)}/${id}`, { ...this.toDoc(input), createdAt });
      batch.set(`${this.rosterPath(eventId)}/${id}`, { ...this.rosterDoc(input), createdAt });
    });
    return id;
  }

  async updateParticipant(
    eventId: string,
    participantId: string,
    input: SecretSantaParticipantInput,
  ): Promise<void> {
    await this.gateway.runBatch((batch) => {
      batch.update(`${this.participantsPath(eventId)}/${participantId}`, this.toDoc(input));
      batch.set(`${this.rosterPath(eventId)}/${participantId}`, this.rosterDoc(input), {
        merge: true,
      });
    });
  }

  /** Only the gift ideas of an entry (the organizer changing one right in the list). */
  async updateGiftOptions(
    eventId: string,
    participantId: string,
    giftOptions: readonly string[],
  ): Promise<void> {
    await this.gateway.runBatch((batch) => {
      batch.update(`${this.participantsPath(eventId)}/${participantId}`, {
        giftOptions: [...giftOptions],
      });
      batch.set(
        `${this.rosterPath(eventId)}/${participantId}`,
        { giftOptions: [...giftOptions] },
        { merge: true },
      );
    });
  }

  async removeParticipant(eventId: string, participantId: string): Promise<void> {
    await this.gateway.runBatch((batch) => {
      batch.delete(`${this.participantsPath(eventId)}/${participantId}`);
      batch.delete(`${this.rosterPath(eventId)}/${participantId}`);
    });
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
        batch.set(
          `${this.rosterPath(eventId)}/${id}`,
          { ...this.rosterDoc(input), ...(existing.includes(id) ? {} : { createdAt: now }) },
          { merge: true },
        );
      }
      for (const id of remove) {
        batch.delete(`${this.participantsPath(eventId)}/${id}`);
        batch.delete(`${this.rosterPath(eventId)}/${id}`);
      }
    });
  }

  /**
   * Makes the two entries of one person a single one: the entry that came from the invite stays
   * as the guest made it (their name and gift ideas are theirs), tied to the confirmed guest the
   * typed one pointed to; the typed entry leaves the list. With two phones, the organizer chose
   * which stays: the typed one may replace the guest's only here.
   */
  async mergeDuplicate(
    eventId: string,
    duplicate: SecretSantaDuplicate,
    /** "Juntar" with two phones: the one the organizer chose to keep. */
    phone: string = duplicate.keep.phone,
  ): Promise<void> {
    const { keep, drop } = duplicate;
    // Only the typed entry's phone can replace the guest's, and only as it leaves the list.
    const takesTypedPhone = phone !== keep.phone && phone === drop.phone;
    const changes = {
      ...(!keep.guestId && drop.guestId ? { guestId: drop.guestId } : {}),
      ...(takesTypedPhone ? { phone, mergedFrom: drop.id } : {}),
    };
    await this.gateway.runBatch((batch) => {
      if (Object.keys(changes).length) {
        batch.update(`${this.participantsPath(eventId)}/${keep.id}`, changes);
      }
      batch.delete(`${this.participantsPath(eventId)}/${drop.id}`);
      batch.set(`${this.rosterPath(eventId)}/${keep.id}`, this.rosterDoc(keep), { merge: true });
      batch.delete(`${this.rosterPath(eventId)}/${drop.id}`);
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
    event: Pick<PartyEvent, 'id' | 'title' | 'date' | 'secretSanta'>,
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
      // Guests read it on the event: from now on they no longer join or leave on their own.
      if (event.secretSanta) {
        batch.update(`events/${event.id}`, {
          secretSanta: { ...event.secretSanta, drawnAt: now },
          updatedAt: now,
        });
      }
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
