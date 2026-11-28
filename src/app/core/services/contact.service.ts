import { Injectable, inject } from '@angular/core';
import type { PartyEvent } from '../models';
import { FirestoreGateway } from './firestore.gateway';

/** `contacts/{uid}`: the phone of an account and who may read it. */
interface ContactDoc {
  phone?: string;
  /** Uids of the people who organize an event this person confirmed. Permissions, never data. */
  phoneVisibleTo?: string[];
  /** The event whose organizers the last change by someone else was about (checked by the rules). */
  grantedVia?: string;
  updatedAt?: string;
}

/**
 * The phone of people with an account lives in one place, `contacts/{uid}`, never in the events.
 * Its owner reads and writes it; the organizers of the events the person confirmed read it too,
 * because their uids are in `phoneVisibleTo`.
 *
 * The list changes where its reason changes: the guest confirming adds the event's organizers;
 * a collaborator joining adds themself to the lists of the event's guests; a collaborator removed
 * (or leaving) is taken out. Best effort: if a change fails, the phone just does not show (the
 * organizer sees the guest without it); it never shows to someone it should not.
 */
@Injectable({ providedIn: 'root' })
export class ContactService {
  private readonly gateway = inject(FirestoreGateway);

  private path(uid: string): string {
    return `contacts/${uid}`;
  }

  /** The person's own phone; empty when they never saved one here. */
  async ownPhone(uid: string): Promise<string> {
    if (!uid) return '';
    const doc = await this.gateway.getDoc<ContactDoc>(this.path(uid)).catch(() => null);
    return doc?.phone ?? '';
  }

  /** The person saved their phone (profile, RSVP): one number, the same for every event. */
  async savePhone(uid: string, phone: string): Promise<void> {
    if (!uid) return;
    await this.gateway.setDoc(
      this.path(uid),
      { phone, updatedAt: new Date().toISOString() },
      { merge: true },
    );
  }

  /** The guest confirmed: who organizes the event may now read their phone. */
  async shareWithOrganizers(
    uid: string,
    event: Pick<PartyEvent, 'createdBy' | 'collaborators'>,
    phone: string,
  ): Promise<void> {
    const organizers = [event.createdBy, ...(event.collaborators ?? [])].filter(
      (id, i, all): id is string => !!id && id !== uid && all.indexOf(id) === i,
    );
    if (!uid) return;
    await this.gateway.setDoc(
      this.path(uid),
      {
        ...(phone ? { phone } : {}),
        ...(organizers.length ? { phoneVisibleTo: this.gateway.arrayUnion(...organizers) } : {}),
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    );
  }

  /** A collaborator joined the event: they may read the phones of its confirmed guests. */
  async grantToCollaborator(eventId: string, collaboratorUid: string): Promise<void> {
    await this.eachGuest(eventId, collaboratorUid, (guestUid) =>
      this.gateway.updateDoc(this.path(guestUid), {
        phoneVisibleTo: this.gateway.arrayUnion(collaboratorUid),
        grantedVia: eventId,
        updatedAt: new Date().toISOString(),
      }),
    );
  }

  /**
   * A collaborator was removed from the event (by its owner) or left it: they stop reading the
   * phones of its guests. Someone who also organizes another event the guest confirmed reads it
   * again when the guest answers that event.
   */
  async revokeFromCollaborator(eventId: string, collaboratorUid: string): Promise<void> {
    await this.eachGuest(eventId, collaboratorUid, (guestUid) =>
      this.gateway.updateDoc(this.path(guestUid), {
        phoneVisibleTo: this.gateway.arrayRemove(collaboratorUid),
        grantedVia: eventId,
        updatedAt: new Date().toISOString(),
      }),
    );
  }

  /** The phones of these accounts that the signed-in organizer may read, by uid. */
  async phonesOf(uids: readonly string[]): Promise<Record<string, string>> {
    const found = await Promise.all(
      [...new Set(uids.filter(Boolean))].map(async (uid) => {
        // Refused (not on the list) or missing: the event's own record stays the fallback.
        const doc = await this.gateway.getDoc<ContactDoc>(this.path(uid)).catch(() => null);
        return doc?.phone ? ([uid, doc.phone] as const) : null;
      }),
    );
    return Object.fromEntries(found.filter((entry) => entry !== null));
  }

  /** Each guest of the event who answered with their own account (not relatives or hand-added). */
  private async eachGuest(
    eventId: string,
    except: string,
    write: (guestUid: string) => Promise<void>,
  ): Promise<void> {
    if (!eventId || !except) return;
    const guests = await this.gateway
      .getDocs<{
        uid?: string;
        primaryGuestId?: string;
        addedBy?: string;
      }>(`events/${eventId}/guests`)
      .catch(() => []);
    const uids = guests
      .filter((g) => g.uid && g.id === g.uid && !g.primaryGuestId && !g.addedBy)
      .map((g) => g.uid as string)
      .filter((uid, i, all) => uid !== except && all.indexOf(uid) === i);
    // A guest who never saved a phone here has no document yet: nothing to share.
    await Promise.allSettled(uids.map((uid) => write(uid)));
  }
}
