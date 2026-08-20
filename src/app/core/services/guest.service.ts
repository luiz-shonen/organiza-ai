import { Injectable, inject } from '@angular/core';
import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  orderBy,
  query,
  where,
  limit,
  getDocs,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore';
import { Observable } from 'rxjs';
import { FirebaseService } from './firebase.service';
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
  private readonly firestore = inject(FirebaseService).firestore;

  listGuests(eventId: string): Observable<Guest[]> {
    const guestsCol = this.guestsCollection(eventId);
    const q = query(guestsCol, orderBy('confirmedAt', 'desc'));

    return new Observable<Guest[]>((subscriber) => {
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const guests = snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            return {
              id: docSnap.id,
              name: data['name'],
              phone: data['phone'],
              photoUrl: data['photoUrl'],
              isConfirmed: data['isConfirmed'],
              confirmedAt: data['confirmedAt'],
              companionsCount: data['companionsCount'] ?? 0,
            } as Guest;
          });
          subscriber.next(guests);
        },
        (error) => subscriber.error(error),
      );

      return () => unsubscribe();
    });
  }

  async addGuest(eventId: string, guest: Partial<Guest>): Promise<string> {
    const guestsCol = this.guestsCollection(eventId);
    const docRef = await addDoc(guestsCol, {
      ...guest,
      isConfirmed: true,
      confirmedAt: new Date().toISOString(),
      createdAt: serverTimestamp(),
    });
    return docRef.id;
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
    const guestDocRef = this.guestDoc(eventId, guestData.uid);
    await setDoc(
      guestDocRef,
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
    const batch = writeBatch(this.firestore);
    const now = new Date().toISOString();

    const primaryDocRef = this.guestDoc(eventId, primaryGuest.uid);
    batch.set(
      primaryDocRef,
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
      const memberGuestDocRef = this.guestDoc(eventId, `${primaryGuest.uid}_${member.id}`);
      batch.set(
        memberGuestDocRef,
        {
          id: `${primaryGuest.uid}_${member.id}`,
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

    await batch.commit();
  }

  async updateGuest(eventId: string, guestId: string, data: Partial<Guest>): Promise<void> {
    const docRef = this.guestDoc(eventId, guestId);
    await updateDoc(docRef, data);
  }

  async deleteGuest(eventId: string, guestId: string): Promise<void> {
    const docRef = this.guestDoc(eventId, guestId);
    await deleteDoc(docRef);
  }

  async cancelRsvp(eventId: string, guestId: string, primaryUid?: string): Promise<void> {
    const batch = writeBatch(this.firestore);
    const primaryDocRef = this.guestDoc(eventId, guestId);
    batch.delete(primaryDocRef);

    const targetUid = primaryUid || guestId;

    try {
      const guestsCol = this.guestsCollection(eventId);
      const familyQuery = query(guestsCol, where('primaryGuestId', '==', targetUid));
      const familySnap = await getDocs(familyQuery);
      familySnap.forEach((docSnap) => {
        batch.delete(docSnap.ref);
      });
    } catch {
      // ignore
    }

    try {
      const itemsCol = collection(this.firestore, 'events', eventId, 'items');
      const itemsQuery = query(itemsCol, where('claimedBy.phone', '==', targetUid));
      const querySnap = await getDocs(itemsQuery);

      querySnap.forEach((itemDoc) => {
        batch.update(itemDoc.ref, { claimedBy: null });
      });
    } catch {
      // ignore
    }

    await batch.commit();
  }

  async getGuestByPhone(eventId: string, phone: string): Promise<Guest | null> {
    const guestsCol = this.guestsCollection(eventId);
    const q = query(guestsCol, where('phone', '==', phone), limit(1));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return null;
    }

    const docSnap = snapshot.docs[0];
    const data = docSnap.data();

    return {
      id: docSnap.id,
      name: data['name'],
      phone: data['phone'],
      photoUrl: data['photoUrl'],
      isConfirmed: data['isConfirmed'],
      confirmedAt: data['confirmedAt'],
      companionsCount: data['companionsCount'] ?? 0,
    };
  }

  async getGuest(eventId: string, guestId: string): Promise<Guest | null> {
    const docRef = this.guestDoc(eventId, guestId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    const data = docSnap.data();
    return {
      id: docSnap.id,
      name: data['name'],
      phone: data['phone'],
      photoUrl: data['photoUrl'],
      isConfirmed: data['isConfirmed'],
      confirmedAt: data['confirmedAt'],
      companionsCount: data['companionsCount'] ?? 0,
    };
  }

  private guestsCollection(eventId: string) {
    return collection(this.firestore, 'events', eventId, 'guests');
  }

  private guestDoc(eventId: string, guestId: string) {
    return doc(this.firestore, 'events', eventId, 'guests', guestId);
  }
}
