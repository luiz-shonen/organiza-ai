import { Injectable, inject } from '@angular/core';
import { Observable, catchError, combineLatest, map, of } from 'rxjs';
import { FirestoreGateway } from './firestore.gateway';
import { InboxService } from './inbox.service';
import { PushService } from './push.service';
import { AuthService } from './auth.service';
import { PublicProfileService } from './public-profile.service';
import { secretSantaNotificationId, type FirestoreBatchOperations } from '../models';
import type {
  PartyEvent,
  SecretSantaDraw,
  SecretSantaLink,
  SecretSantaParticipant,
  SecretSantaParticipantInput,
  SecretSantaDuplicate,
  SecretSantaReveal,
  SecretSantaRevealCopy,
  SecretSantaRosterEntry,
  SecretSantaSettings,
} from '../models';
import { drawSecretSanta, generateId, secretSantaNoticeBody } from '../utils';

/**
 * Amigo oculto. Participants live in `events/{id}/secretSantaParticipants` (owner and
 * collaborators), the latest draw with every link in `events/{id}/secretSanta/draw` (owner
 * only), and each pair only in `secretSantaReveals/{token}`, which anyone holding the token
 * reads without signing in, and nobody can list.
 */
/**
 * Raised when the guests' list needs checking again on every event (a new field in the copies,
 * or a past bug that left copies missing). Each event is then checked once more, by its owner.
 */
export const SECRET_SANTA_ROSTER_VERSION = 1;

@Injectable({ providedIn: 'root' })
export class SecretSantaService {
  private readonly gateway = inject(FirestoreGateway);
  private readonly inbox = inject(InboxService);
  private readonly push = inject(PushService);
  private readonly auth = inject(AuthService);
  private readonly profiles = inject(PublicProfileService);

  private participantsPath(eventId: string): string {
    return `events/${eventId}/secretSantaParticipants`;
  }

  /**
   * The phone of a participant without an account of their own, apart from the list everyone
   * reads (same id): only organizers, and the guest for their own entries, read it.
   */
  private phonesPath(eventId: string): string {
    return `events/${eventId}/secretSantaPhones`;
  }

  /** Writes (or clears) the phone kept apart for one entry, in the same batch. */
  private writePhone(
    batch: FirestoreBatchOperations,
    eventId: string,
    id: string,
    phone: string | undefined,
  ): void {
    if (phone === undefined) return;
    const path = `${this.phonesPath(eventId)}/${id}`;
    if (phone.trim()) batch.set(path, { phone });
    else batch.delete(path);
  }

  /**
   * The amigo oculto as the guests see it: one entry per participant, same id, with only the
   * name and the gift options (the participants hold phones, so only organizers read those).
   * Every write to a participant writes its roster entry in the same batch.
   */
  private rosterPath(eventId: string): string {
    return `events/${eventId}/secretSantaRoster`;
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
              ...(d.note ? { note: d.note } : {}),
              createdAt: d.createdAt ?? '',
            }))
            .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
            .map(({ createdAt: _createdAt, ...entry }) => entry),
        ),
      );
  }

  /**
   * The list as everyone reads it (the one list: names and gift ideas, no phones), for guests.
   * An event whose phones were not moved apart yet (`secretSantaFormat` 1) refuses it: then the
   * older guests' copy (`secretSantaRoster`) is read instead, until the migration script runs.
   */
  listForGuests(eventId: string): Observable<SecretSantaRosterEntry[]> {
    return this.gateway
      .collectionSnapshot<Omit<SecretSantaParticipant, 'id'>>(this.participantsPath(eventId))
      .pipe(
        map((docs) =>
          docs
            .map((d) => ({
              id: d.id,
              name: d.name ?? '',
              giftOptions: d.giftOptions ?? [],
              ...(d.note ? { note: d.note } : {}),
              ...(d.joinedBy ? { joinedBy: d.joinedBy } : {}),
              ...(d.guestId ? { guestId: d.guestId } : {}),
              createdAt: d.createdAt ?? '',
            }))
            .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
            .map(({ createdAt: _createdAt, ...entry }) => entry),
        ),
        catchError(() => this.listRoster(eventId)),
      );
  }

  private drawPath(eventId: string): string {
    return `events/${eventId}/secretSanta/draw`;
  }

  private revealPath(token: string): string {
    return `secretSantaReveals/${token}`;
  }

  /** The list with each phone (organizers): the phones kept apart, or an older entry's own. */
  listParticipants(eventId: string): Observable<SecretSantaParticipant[]> {
    return combineLatest([
      this.gateway.collectionSnapshot<Omit<SecretSantaParticipant, 'id'>>(
        this.participantsPath(eventId),
      ),
      this.gateway
        .collectionSnapshot<{ phone?: string }>(this.phonesPath(eventId))
        .pipe(catchError(() => of([] as { id: string; phone?: string }[]))),
    ]).pipe(
      map(([docs, phones]) => {
        const phoneOf = new Map(phones.map((p) => [p.id, p.phone ?? '']));
        return docs
          .map((d) => ({
            id: d.id,
            name: d.name ?? '',
            phone: phoneOf.get(d.id) ?? d.phone ?? '',
            giftOptions: d.giftOptions ?? [],
            ...(d.note ? { note: d.note } : {}),
            ...(d.guestId ? { guestId: d.guestId } : {}),
            ...(d.joinedBy ? { joinedBy: d.joinedBy } : {}),
            ...(d.distinctFrom?.length ? { distinctFrom: d.distinctFrom } : {}),
            createdAt: d.createdAt ?? '',
          }))
          .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      }),
    );
  }

  async addParticipant(eventId: string, input: SecretSantaParticipantInput): Promise<string> {
    const id = this.gateway.newId(this.participantsPath(eventId));
    const createdAt = new Date().toISOString();
    await this.gateway.runBatch((batch) => {
      batch.set(`${this.participantsPath(eventId)}/${id}`, { ...this.toDoc(input), createdAt });
      this.writePhone(batch, eventId, id, input.phone);
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
      this.writePhone(batch, eventId, participantId, input.phone);
    });
  }

  /** Only the gift ideas of an entry (the organizer changing one right in the list). */
  async updateGiftOptions(
    eventId: string,
    participant: Pick<SecretSantaParticipant, 'id' | 'name'>,
    giftOptions: readonly string[],
  ): Promise<void> {
    await this.gateway.updateDoc(`${this.participantsPath(eventId)}/${participant.id}`, {
      giftOptions: [...giftOptions],
    });
  }

  async removeParticipant(eventId: string, participantId: string): Promise<void> {
    await this.gateway.runBatch((batch) => {
      batch.delete(`${this.participantsPath(eventId)}/${participantId}`);
      batch.delete(`${this.phonesPath(eventId)}/${participantId}`);
      // The older guests' copy, when the event still has one.
      batch.delete(`${this.rosterPath(eventId)}/${participantId}`);
    });
  }

  /**
   * The entries this guest put in the draw from the invite, among `ids` (`rsvp_{uid}…`). A guest
   * cannot read the list, only their own entries, one by one.
   */
  async getOwnEntries(eventId: string, ids: readonly string[]): Promise<SecretSantaParticipant[]> {
    const found = await Promise.all(
      ids.map(async (id) => {
        const [doc, kept] = await Promise.all([
          this.gateway
            .getDocWithId<
              Omit<SecretSantaParticipant, 'id'>
            >(`${this.participantsPath(eventId)}/${id}`)
            .catch(() => null),
          this.gateway
            .getDoc<{ phone?: string }>(`${this.phonesPath(eventId)}/${id}`)
            .catch(() => null),
        ]);
        return doc ? { ...doc, phone: kept?.phone ?? doc.phone ?? '' } : null;
      }),
    );
    return found.flatMap((doc) =>
      doc
        ? [
            {
              id: doc.id,
              name: doc.name ?? '',
              phone: doc.phone,
              giftOptions: doc.giftOptions ?? [],
              ...(doc.note ? { note: doc.note } : {}),
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
            ...this.toDoc(input, id === `rsvp_${uid}`),
            joinedBy: uid,
            ...(existing.includes(id) ? {} : { createdAt: now }),
          },
          { merge: true },
        );
        // The guest's own phone is their account's (contacts); a relative's is kept apart.
        if (id !== `rsvp_${uid}`) this.writePhone(batch, eventId, id, input.phone);
      }
      for (const id of remove) {
        batch.delete(`${this.participantsPath(eventId)}/${id}`);
        batch.delete(`${this.phonesPath(eventId)}/${id}`);
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
    const changes = !keep.guestId && drop.guestId ? { guestId: drop.guestId } : null;
    await this.gateway.runBatch((batch) => {
      if (changes) batch.update(`${this.participantsPath(eventId)}/${keep.id}`, changes);
      // The phone the links go to, kept apart like every other one.
      if (takesTypedPhone) batch.set(`${this.phonesPath(eventId)}/${keep.id}`, { phone });
      batch.delete(`${this.participantsPath(eventId)}/${drop.id}`);
      batch.delete(`${this.phonesPath(eventId)}/${drop.id}`);
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
    // By id only: the card names each person and finds their phone when it shows them.
    const links: SecretSantaLink[] = pairs.map(({ giver, receiver }) => ({
      participantId: giver.id,
      token: generateId(),
      receiverId: receiver.id,
      ...(uids[giver.id] ? { uid: uids[giver.id] } : {}),
    }));
    const draw: SecretSantaDraw = {
      drawnAt: now,
      participantIds: participants.map((p) => p.id),
      links,
    };

    // New links made from spent ones ("Gerar novo link") go with the old draw too.
    const renewed = (
      await Promise.all(
        (previous?.links ?? []).filter((l) => !l.uid).map((l) => this.renewedTokens(l.token)),
      )
    ).flat();
    await this.gateway.runBatch((batch) => {
      for (const link of previous?.links ?? []) {
        batch.delete(this.revealPath(link.token));
        batch.delete(this.copyPath(link.token));
      }
      for (const token of renewed) {
        batch.delete(this.revealPath(token));
        batch.delete(this.copyPath(token));
      }
      pairs.forEach(({ giver, receiver }, i) => {
        batch.set(
          this.revealPath(links[i].token),
          this.toReveal(event, giver, receiver, now, links[i].uid),
        );
        // Kept for "Gerar novo link" on links without an account (an account's keeps its result).
        if (!links[i].uid) batch.set(this.copyPath(links[i].token), this.toCopy(event, receiver));
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
    const { name: _name, phone: _phone, ...byId } = link;
    const fresh: SecretSantaLink = {
      ...byId,
      token: generateId(),
      ...(uids[participantId] || link.uid ? { uid: uids[participantId] || link.uid } : {}),
    };
    const next: SecretSantaDraw = {
      ...draw,
      links: draw.links.map((l) => (l.participantId === participantId ? fresh : l)),
    };
    const renewed = link.uid ? [] : await this.renewedTokens(link.token);
    await this.gateway.runBatch((batch) => {
      batch.delete(this.revealPath(link.token));
      batch.delete(this.copyPath(link.token));
      for (const token of renewed) {
        batch.delete(this.revealPath(token));
        batch.delete(this.copyPath(token));
      }
      batch.set(
        this.revealPath(fresh.token),
        this.toReveal(event, giver, receiver, new Date().toISOString(), fresh.uid),
      );
      if (!fresh.uid) batch.set(this.copyPath(fresh.token), this.toCopy(event, receiver));
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
    const actorUid = this.auth.currentUser()?.uid;
    const results = await Promise.allSettled(
      links
        .filter((link) => link.uid)
        .map(async (link) => {
          await this.inbox.send(link.uid!, {
            id: secretSantaNotificationId(event.id),
            kind: 'secret-santa',
            eventId: event.id,
            title: isNewLink ? 'Seu novo link do amigo oculto' : 'Sorteio do amigo oculto feito!',
            body: secretSantaNoticeBody(event.title, isNewLink),
            actionLabel: 'Ver quem eu tirei',
            actionUrl: `/amigo-oculto/${link.token}`,
            createdAt: now,
            ...(actorUid ? { actorUid } : {}),
          });
          // On the phone too: the relay reads the notice as the owner who wrote it.
          this.push.notify(
            `users/${link.uid}/notifications/${secretSantaNotificationId(event.id)}`,
          );
        }),
    );
    return results.filter((r) => r.status === 'fulfilled').length;
  }

  /** What a secret link reveals; null when the link is unknown or was replaced. */
  async getReveal(token: string): Promise<SecretSantaReveal | null> {
    return this.gateway.getDoc<SecretSantaReveal>(this.revealPath(token));
  }

  /**
   * Opens the link. Without an account it is spent: the stamp, and whom the person drew is erased,
   * so opening it again only says it expired. A link of an account (`keepResult`) opens only in
   * it, so it keeps the result and is only stamped, the first time. The rules allow each once.
   */
  async openReveal(token: string, keepResult = false, byId = true): Promise<void> {
    const openedAt = new Date().toISOString();
    const spent = byId ? { receiverId: '' } : { receiverName: '', receiverGiftOptions: [] };
    await this.gateway.updateDoc(
      this.revealPath(token),
      keepResult ? { openedAt } : { openedAt, ...spent },
    );
  }

  /**
   * The link as the page shows it: a link by id (newer draws) gets the event's title and date,
   * the giver's name and whom they drew, with the ideas, read now from the event and its list
   * (an account named by its profile). A link of an older draw already carries them.
   */
  async describeReveal(reveal: SecretSantaReveal): Promise<SecretSantaReveal> {
    if (!reveal.giverId && !reveal.receiverId) return reveal;
    const entry = (id: string | undefined) =>
      id
        ? this.gateway
            .getDocWithId<
              Partial<SecretSantaParticipant>
            >(`${this.participantsPath(reveal.eventId)}/${id}`)
            .catch(() => null)
        : Promise.resolve(null);
    const [event, giver, receiver] = await Promise.all([
      this.gateway
        .getDoc<{ title?: string; date?: string }>(`events/${reveal.eventId}`)
        .catch(() => null),
      entry(reveal.giverId),
      entry(reveal.receiverId),
    ]);
    const accountOf = (doc: (Partial<SecretSantaParticipant> & { id: string }) | null) =>
      doc?.joinedBy && doc.id === `rsvp_${doc.joinedBy}` ? doc.joinedBy : doc?.guestId;
    const giverUid = reveal.giverUid || accountOf(giver);
    const receiverUid = accountOf(receiver);
    const named = await this.profiles.lookup([giverUid, receiverUid]);
    return {
      ...reveal,
      eventTitle: event?.title ?? reveal.eventTitle ?? '',
      eventDate: event?.date ?? reveal.eventDate ?? '',
      giverName: (giverUid && named[giverUid]?.name) || giver?.name || reveal.giverName || '',
      receiverName: receiver
        ? (receiverUid && named[receiverUid]?.name) || receiver.name || ''
        : '',
      receiverGiftOptions: receiver?.giftOptions ?? [],
    };
  }

  /**
   * The result kept for a link without an account, for "Gerar novo link": the rules let it be read
   * only once the link was spent and until it is renewed. Null when there is none (drawn before
   * this existed).
   */
  async getRevealCopy(token: string): Promise<SecretSantaRevealCopy | null> {
    return this.gateway.getDoc<SecretSantaRevealCopy>(this.copyPath(token));
  }

  /**
   * "Gerar novo link" on a spent link of someone without an account (added by hand): the newest
   * link of the chain that starts at `token` (the one sent by WhatsApp). Not opened yet → that
   * one, nothing new; opened → a new link with the same person (the rules check it is the same
   * result and that each opened link is renewed once). Returns the link to open.
   */
  async renewLink(token: string): Promise<string> {
    let current = token;
    let reveal = await this.getReveal(current);
    for (let hop = 0; reveal?.replacedBy && hop < 50; hop++) {
      current = reveal.replacedBy;
      reveal = await this.getReveal(current);
    }
    if (!reveal) throw new Error('Este link não existe mais: peça um novo para quem organiza.');
    if (!reveal.openedAt) return current;
    const kept = await this.getRevealCopy(current);
    if (!kept) throw new Error('Não foi possível gerar um novo link: peça um para quem organiza.');
    const fresh = generateId();
    const createdAt = new Date().toISOString();
    // Same giver and person drawn: by id for newer draws, written in for older ones.
    const next: SecretSantaReveal = kept.receiverId
      ? {
          eventId: reveal.eventId,
          giverId: reveal.giverId ?? '',
          receiverId: kept.receiverId,
          createdAt,
          replaces: current,
        }
      : {
          eventId: reveal.eventId,
          eventTitle: reveal.eventTitle,
          eventDate: reveal.eventDate,
          giverName: reveal.giverName,
          receiverName: kept.receiverName,
          receiverGiftOptions: [...(kept.receiverGiftOptions ?? [])],
          createdAt,
          replaces: current,
        };
    await this.gateway.runBatch((batch) => {
      batch.set(this.revealPath(fresh), next);
      batch.set(
        this.copyPath(fresh),
        (kept.receiverId
          ? { eventId: reveal.eventId, receiverId: kept.receiverId }
          : {
              eventId: reveal.eventId,
              receiverName: kept.receiverName ?? '',
              receiverGiftOptions: [...(kept.receiverGiftOptions ?? [])],
            }) as Record<string, unknown>,
      );
      batch.update(this.revealPath(current), { replacedBy: fresh });
    });
    return fresh;
  }

  /** The links made from `token` by "Gerar novo link", newest last (the owner reads them all). */
  private async renewedTokens(token: string): Promise<string[]> {
    const tokens: string[] = [];
    let reveal = await this.getReveal(token).catch(() => null);
    while (reveal?.replacedBy && tokens.length < 50) {
      tokens.push(reveal.replacedBy);
      reveal = await this.getReveal(reveal.replacedBy).catch(() => null);
    }
    return tokens;
  }

  /** When a link was opened (null: not yet, or it no longer exists), for the owner's list. */
  watchOpenedAt(token: string): Observable<string | null> {
    return this.gateway
      .docSnapshot<SecretSantaReveal>(this.revealPath(token))
      .pipe(map((doc) => doc?.openedAt ?? null));
  }

  private copyPath(token: string): string {
    return `${this.revealPath(token)}/private/result`;
  }

  /** Whom the person drew, by id: the name and ideas are read when the new link is shown. */
  private toCopy(
    event: Pick<PartyEvent, 'id'>,
    receiver: SecretSantaParticipant,
  ): SecretSantaRevealCopy {
    return { eventId: event.id, receiverId: receiver.id };
  }

  private toReveal(
    event: Pick<PartyEvent, 'id' | 'title' | 'date'>,
    giver: SecretSantaParticipant,
    receiver: SecretSantaParticipant,
    now: string,
    giverUid?: string,
  ): SecretSantaReveal {
    // By id: the page reads the names, the ideas and the event when it shows the link.
    return {
      eventId: event.id,
      giverId: giver.id,
      ...(giverUid ? { giverUid } : {}),
      receiverId: receiver.id,
      createdAt: now,
    };
  }

  /**
   * The entry as everyone reads it: never a phone (kept apart), and no name for an account's own
   * entry (named by its profile). An organizer's "Participar também" has their uid in `guestId`.
   */
  private toDoc(input: SecretSantaParticipantInput, ownAccount = false): Record<string, unknown> {
    const account =
      ownAccount || (!!input.guestId && input.guestId === this.auth.currentUser()?.uid);
    return {
      ...(account ? {} : { name: input.name }),
      giftOptions: [...input.giftOptions],
      ...(input.note !== undefined ? { note: input.note } : {}),
      ...(input.guestId ? { guestId: input.guestId } : {}),
    };
  }
}
