import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { FirestoreGateway } from './firestore.gateway';
import {
  Guest,
  GuestCompanion,
  GuestDecline,
  FamilyMember,
  type ManualGuestInput,
  type ManualGuestRelative,
} from '../models';
import { Phone } from '../value-objects';

/**
 * The guest's own answer. They are named and pictured by their account (`publicProfiles/{uid}`),
 * so the answer keeps no e-mail or photo.
 */
export interface BatchPrimaryGuestInput {
  uid: string;
  /**
   * Still written until the cleanup (plan item 6): older app versions sort and compare guests by
   * it before the profile arrives, and break on an answer without it. The screens read the profile.
   */
  name: string;
  phone?: string;
  companions?: GuestCompanion[];
  companionsCount?: number;
  /** The event asks for approval and this is the guest's first answer. */
  pendingApproval?: boolean;
}

@Injectable({ providedIn: 'root' })
export class GuestService {
  private readonly gateway = inject(FirestoreGateway);

  private guestsPath(eventId: string) {
    return `events/${eventId}/guests`;
  }

  private guestDocPath(eventId: string, guestId: string) {
    return `events/${eventId}/guests/${guestId}`;
  }

  listGuests(eventId: string): Observable<Guest[]> {
    return this.gateway
      .collectionSnapshot<
        Omit<Guest, 'id'>
      >(this.guestsPath(eventId), this.gateway.orderBy('confirmedAt', 'desc'))
      .pipe(map((guests) => guests.map((guest) => this.toGuest(guest))));
  }

  /** Who said they cannot go, for the organizer's guest list. */
  listDeclines(eventId: string): Observable<GuestDecline[]> {
    return this.gateway
      .collectionSnapshot<Omit<GuestDecline, 'id'>>(`events/${eventId}/declines`)
      .pipe(
        map((docs) =>
          docs.map((d) => ({
            id: d.id,
            // Older answers stored the name; screens show the profile's, by the id (the uid).
            name: d.name ?? '',
            message: d.message ?? '',
            declinedAt: d.declinedAt ?? '',
          })),
        ),
      );
  }

  /** "Não poderei ir": the document id is the account; the name comes from its profile. */
  async saveDecline(eventId: string, uid: string, message: string): Promise<void> {
    await this.gateway.setDoc(`events/${eventId}/declines/${uid}`, {
      message,
      declinedAt: new Date().toISOString(),
    });
  }

  async removeDecline(eventId: string, uid: string): Promise<void> {
    await this.gateway.deleteDoc(`events/${eventId}/declines/${uid}`);
  }

  async addGuest(eventId: string, guest: Partial<Guest>): Promise<string> {
    return this.gateway.addDoc(this.guestsPath(eventId), {
      ...guest,
      isConfirmed: true,
      confirmedAt: new Date().toISOString(),
      createdAt: this.gateway.serverTimestamp(),
    });
  }

  /**
   * "Adicionar alguém à mão": an organizer puts someone on the list without them answering the
   * invite. No account, so no `uid`; `addedBy` marks the entry as the organizers' to edit. Their
   * relatives are guest entries tied to them (`primaryGuestId`), written in the same batch: they
   * have no family profile to live in.
   */
  async addManualGuest(eventId: string, guest: ManualGuestInput, addedBy: string): Promise<string> {
    const id = this.gateway.newId(this.guestsPath(eventId));
    const confirmedAt = new Date().toISOString();
    await this.gateway.runBatch((batch) => {
      batch.set(this.guestDocPath(eventId, id), {
        ...this.manualFields(guest),
        isConfirmed: true,
        confirmedAt,
        addedBy,
        createdAt: this.gateway.serverTimestamp(),
      });
      for (const relative of guest.relatives) {
        batch.set(
          this.guestDocPath(eventId, this.manualRelativeId(eventId, id)),
          this.manualRelativeDoc(id, relative, confirmedAt, addedBy),
        );
      }
    });
    return id;
  }

  /**
   * Changes the name, WhatsApp, companions or relatives of someone the organizers added by hand.
   * `previousRelativeIds` are the relatives saved before: those not in `guest.relatives` leave.
   */
  async updateManualGuest(
    eventId: string,
    guestId: string,
    guest: ManualGuestInput,
    previousRelativeIds: readonly string[],
    addedBy: string,
  ): Promise<void> {
    const kept = new Set(guest.relatives.map((relative) => relative.id).filter(Boolean));
    const confirmedAt = new Date().toISOString();
    await this.gateway.runBatch((batch) => {
      batch.update(this.guestDocPath(eventId, guestId), this.manualFields(guest));
      for (const relative of guest.relatives) {
        const fields = { name: relative.name, relationship: relative.relationship };
        if (relative.id) {
          batch.update(this.guestDocPath(eventId, relative.id), {
            ...fields,
            phone: relative.phone,
          });
        } else {
          batch.set(
            this.guestDocPath(eventId, this.manualRelativeId(eventId, guestId)),
            this.manualRelativeDoc(guestId, relative, confirmedAt, addedBy),
          );
        }
      }
      for (const id of previousRelativeIds) {
        if (!kept.has(id)) batch.delete(this.guestDocPath(eventId, id));
      }
    });
  }

  /** Takes someone the organizers added by hand off the list, with their relatives. */
  async removeManualGuest(
    eventId: string,
    guestId: string,
    relativeIds: readonly string[] = [],
  ): Promise<void> {
    await this.gateway.runBatch((batch) => {
      for (const id of relativeIds) batch.delete(this.guestDocPath(eventId, id));
      batch.delete(this.guestDocPath(eventId, guestId));
    });
  }

  private manualFields(guest: ManualGuestInput) {
    const companions = guest.companions.map((name) => ({ name }));
    return {
      name: guest.name,
      phone: guest.phone,
      companions,
      companionsCount: companions.length,
    };
  }

  /** `{guestId}_{random}`: the rules tie a relative to the hand-added person by this prefix. */
  private manualRelativeId(eventId: string, guestId: string): string {
    return `${guestId}_${this.gateway.newId(this.guestsPath(eventId))}`;
  }

  private manualRelativeDoc(
    guestId: string,
    relative: ManualGuestRelative,
    confirmedAt: string,
    addedBy: string,
  ) {
    return {
      name: relative.name,
      relationship: relative.relationship,
      phone: relative.phone,
      primaryGuestId: guestId,
      isConfirmed: true,
      confirmedAt,
      addedBy,
      createdAt: this.gateway.serverTimestamp(),
    };
  }

  async batchConfirmRsvp(
    eventId: string,
    primaryGuest: BatchPrimaryGuestInput,
    familyMembers: FamilyMember[] = [],
    /** Family members confirmed before and left out when the presence is edited. */
    removedFamilyMemberIds: readonly string[] = [],
  ): Promise<void> {
    const now = new Date().toISOString();
    const companionsCount = primaryGuest.companions?.length ?? primaryGuest.companionsCount ?? 0;

    await this.gateway.runBatch((batch) => {
      batch.set(
        this.guestDocPath(eventId, primaryGuest.uid),
        {
          uid: primaryGuest.uid,
          // Name and phone still kept here until the cleanup (plan item 6), for older app
          // versions. The screens read the profile, and the phone from `contacts/{uid}`.
          name: primaryGuest.name,
          phone: primaryGuest.phone ?? '',
          isConfirmed: true,
          confirmedAt: now,
          companionsCount,
          ...(primaryGuest.companions ? { companions: primaryGuest.companions } : {}),
          // A first answer to an event that asks for approval waits for the owner.
          ...(primaryGuest.pendingApproval ? { approved: false } : {}),
          createdAt: now,
        },
        { merge: true },
      );

      for (const member of familyMembers) {
        const memberId = `${primaryGuest.uid}_${member.id}`;
        batch.set(
          this.guestDocPath(eventId, memberId),
          {
            id: memberId,
            name: member.name,
            primaryGuestId: primaryGuest.uid,
            // Shown beside the name in "Confirmados"; a pet is counted apart from people.
            relationship: member.relationship ?? 'other',
            // An older family phone may break the rules' format; it is not needed for the RSVP.
            // A pet has none.
            phone:
              member.relationship === 'pet' ? '' : (Phone.create(member.phone)?.formatted ?? ''),
            isConfirmed: true,
            confirmedAt: now,
            createdAt: now,
          },
          { merge: true },
        );
      }

      for (const memberId of removedFamilyMemberIds) {
        batch.delete(this.guestDocPath(eventId, `${primaryGuest.uid}_${memberId}`));
      }
    });
  }

  async updateGuest(eventId: string, guestId: string, data: Partial<Guest>): Promise<void> {
    await this.gateway.updateDoc(this.guestDocPath(eventId, guestId), data);
  }

  async deleteGuest(eventId: string, guestId: string): Promise<void> {
    await this.gateway.deleteDoc(this.guestDocPath(eventId, guestId));
  }

  /**
   * Removes the guest, their linked family and their claims. `householdUid` is the signed-in
   * account cancelling its own RSVP: only then are its household claims deleted, because the
   * rules let only that uid touch `claims/{uid}` (a phone-only guest has no claims document).
   */
  async cancelRsvp(
    eventId: string,
    guestId: string,
    primaryUid?: string,
    householdUid?: string,
  ): Promise<void> {
    const targetUid = primaryUid || guestId;

    let familyDocs: { id: string }[] = [];
    try {
      familyDocs = await this.gateway.getDocs<{ id: string }>(
        this.guestsPath(eventId),
        this.gateway.where('primaryGuestId', '==', targetUid),
      );
    } catch {
      // ignore
    }

    let itemDocs: { id: string }[] = [];
    try {
      itemDocs = await this.gateway.getDocs<{ id: string }>(
        `events/${eventId}/items`,
        this.gateway.where('claimedBy.phone', '==', targetUid),
      );
    } catch {
      // ignore
    }

    await this.gateway.runBatch((batch) => {
      batch.delete(this.guestDocPath(eventId, guestId));

      for (const memberDoc of familyDocs) {
        batch.delete(this.guestDocPath(eventId, memberDoc.id));
      }

      for (const itemDoc of itemDocs) {
        batch.update(`events/${eventId}/items/${itemDoc.id}`, { claimedBy: null });
      }

      // The household's share of the list goes back to the event with the RSVP.
      if (householdUid) {
        batch.delete(`events/${eventId}/claims/${householdUid}`);
      }
    });
  }

  /** "Aprovar": the guest (and who comes with them) enters the list. Organizers only. */
  async approveGuest(eventId: string, guestId: string): Promise<void> {
    await this.gateway.updateDoc(this.guestDocPath(eventId, guestId), { approved: true });
  }

  /**
   * "Recusar": the waiting confirmation leaves, with the relatives' documents and the amigo
   * oculto entries the guest wrote from the invite. Organizers only.
   */
  async refuseGuest(
    eventId: string,
    guestId: string,
    familyGuestIds: readonly string[],
    secretSantaEntryIds: readonly string[] = [],
  ): Promise<void> {
    await this.gateway.runBatch((batch) => {
      batch.delete(this.guestDocPath(eventId, guestId));
      for (const id of familyGuestIds) batch.delete(this.guestDocPath(eventId, id));
      for (const id of secretSantaEntryIds) {
        batch.delete(`events/${eventId}/secretSantaParticipants/${id}`);
        // Its copy without phones too, or guests would still see the name and gift ideas.
        batch.delete(`events/${eventId}/secretSantaRoster/${id}`);
      }
    });
  }

  async getGuestByPhone(eventId: string, phone: string): Promise<Guest | null> {
    const docs = await this.gateway.getDocs<Omit<Guest, 'id'>>(
      this.guestsPath(eventId),
      this.gateway.where('phone', '==', phone),
      this.gateway.limit(1),
    );

    if (docs.length === 0) return null;
    return this.toGuest(docs[0]);
  }

  async getGuest(eventId: string, guestId: string): Promise<Guest | null> {
    const docData = await this.gateway.getDocWithId<Omit<Guest, 'id'>>(
      this.guestDocPath(eventId, guestId),
    );
    if (!docData) return null;

    return this.toGuest(docData);
  }

  private toGuest(guest: Guest): Guest {
    return {
      ...guest,
      // An answer by account keeps no name: the screens read it from the profile (by `uid`).
      name: guest.name ?? '',
      companionsCount: guest.companions?.length ?? guest.companionsCount ?? 0,
    };
  }
}
