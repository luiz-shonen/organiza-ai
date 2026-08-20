import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { FirestoreGateway } from './firestore.gateway';
import { Guest, FamilyMember } from '../models';

export interface BatchPrimaryGuestInput {
  uid: string;
  name: string;
  email?: string;
  phone?: string;
  photoUrl?: string;
  companionsCount?: number;
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
    return this.gateway.collectionSnapshot<Omit<Guest, 'id'>>(
      this.guestsPath(eventId),
      this.gateway.orderBy('confirmedAt', 'desc'),
    ) as Observable<Guest[]>;
  }

  async addGuest(eventId: string, guest: Partial<Guest>): Promise<string> {
    return this.gateway.addDoc(this.guestsPath(eventId), {
      ...guest,
      isConfirmed: true,
      confirmedAt: new Date().toISOString(),
      createdAt: this.gateway.serverTimestamp(),
    });
  }

  async saveVerifiedRsvp(
    eventId: string,
    guestData: {
      uid: string;
      name: string;
      email?: string;
      phone?: string;
      photoUrl?: string;
    },
  ): Promise<void> {
    await this.gateway.setDoc(
      this.guestDocPath(eventId, guestData.uid),
      {
        uid: guestData.uid,
        name: guestData.name,
        email: guestData.email ?? '',
        phone: guestData.phone ?? '',
        photoUrl: guestData.photoUrl ?? '',
        isConfirmed: true,
        confirmedAt: new Date().toISOString(),
      },
      { merge: true },
    );
  }

  async batchConfirmRsvp(
    eventId: string,
    primaryGuest: BatchPrimaryGuestInput,
    familyMembers: FamilyMember[] = [],
  ): Promise<void> {
    const now = new Date().toISOString();

    await this.gateway.runBatch((batch) => {
      batch.set(
        this.guestDocPath(eventId, primaryGuest.uid),
        {
          uid: primaryGuest.uid,
          name: primaryGuest.name,
          email: primaryGuest.email ?? '',
          phone: primaryGuest.phone ?? '',
          photoUrl: primaryGuest.photoUrl ?? '',
          isConfirmed: true,
          confirmedAt: now,
          companionsCount: primaryGuest.companionsCount ?? 0,
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
            phone: member.phone ?? '',
            isConfirmed: true,
            confirmedAt: now,
            createdAt: now,
          },
          { merge: true },
        );
      }
    });
  }

  async updateGuest(eventId: string, guestId: string, data: Partial<Guest>): Promise<void> {
    await this.gateway.updateDoc(this.guestDocPath(eventId, guestId), data);
  }

  async deleteGuest(eventId: string, guestId: string): Promise<void> {
    await this.gateway.deleteDoc(this.guestDocPath(eventId, guestId));
  }

  async cancelRsvp(eventId: string, guestId: string, primaryUid?: string): Promise<void> {
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
    });
  }

  async getGuestByPhone(eventId: string, phone: string): Promise<Guest | null> {
    const docs = await this.gateway.getDocs<Omit<Guest, 'id'>>(
      this.guestsPath(eventId),
      this.gateway.where('phone', '==', phone),
      this.gateway.limit(1),
    );

    if (docs.length === 0) return null;
    const docData = docs[0];
    return {
      id: docData.id,
      name: docData.name,
      phone: docData.phone,
      photoUrl: docData.photoUrl,
      isConfirmed: docData.isConfirmed,
      confirmedAt: docData.confirmedAt,
      companionsCount: docData.companionsCount ?? 0,
    };
  }

  async getGuest(eventId: string, guestId: string): Promise<Guest | null> {
    const docData = await this.gateway.getDocWithId<Omit<Guest, 'id'>>(this.guestDocPath(eventId, guestId));
    if (!docData) return null;

    return {
      id: docData.id,
      name: docData.name,
      phone: docData.phone,
      photoUrl: docData.photoUrl,
      isConfirmed: docData.isConfirmed,
      confirmedAt: docData.confirmedAt,
      companionsCount: docData.companionsCount ?? 0,
    };
  }
}
