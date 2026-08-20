import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  getDocs,
} from 'firebase/firestore';
import { FirebaseService } from './firebase.service';
import { AuthService } from './auth.service';
import { Guest, GuestCreate, FamilyMember } from '../models';

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
  private readonly authService = inject(AuthService);

  private guestsCollection(eventId: string) {
    return collection(this.firestore, 'events', eventId, 'guests');
  }

  listGuests(eventId: string): Observable<Guest[]> {
    return new Observable<Guest[]>((subscriber) => {
      const q = query(this.guestsCollection(eventId), orderBy('confirmedAt', 'desc'));

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const guests = snapshot.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<Guest, 'id'>),
          }));
          subscriber.next(guests);
        },
        (error) => subscriber.error(error),
      );

      return () => unsubscribe();
    });
  }

  async addGuest(eventId: string, data: GuestCreate): Promise<string> {
    const user = this.authService.currentUser();
    const docRef = await addDoc(this.guestsCollection(eventId), {
      ...data,
      uid: user ? user.uid : '',
      isConfirmed: data.isConfirmed ?? true,
      confirmedAt: data.confirmedAt ?? new Date().toISOString(),
      createdAt: new Date().toISOString(),
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
    const guestDocRef = doc(this.firestore, `events/${eventId}/guests/${guestData.uid}`);
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

    // 1. Primary guest record
    const primaryDocRef = doc(this.firestore, `events/${eventId}/guests/${primaryGuest.uid}`);
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

    // 2. Linked family member guest records
    for (const member of familyMembers) {
      const memberGuestDocRef = doc(
        this.firestore,
        `events/${eventId}/guests/${primaryGuest.uid}_${member.id}`,
      );
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

    // 3. Commit atomically
    await batch.commit();
  }

  async updateGuest(eventId: string, guestId: string, data: Partial<Guest>): Promise<void> {
    const docRef = doc(this.firestore, `events/${eventId}/guests/${guestId}`);
    await updateDoc(docRef, data);
  }

  async deleteGuest(eventId: string, guestId: string): Promise<void> {
    const docRef = doc(this.firestore, `events/${eventId}/guests/${guestId}`);
    await deleteDoc(docRef);
  }

  async cancelRsvp(eventId: string, guestId: string, uid?: string): Promise<void> {
    const batch = writeBatch(this.firestore);

    // 1. Delete primary guest document
    const guestDocRef = doc(this.firestore, `events/${eventId}/guests/${guestId}`);
    batch.delete(guestDocRef);

    const targetUid = uid || guestId;
    if (targetUid) {
      // 2. Cascade delete linked family member guest records
      try {
        const familyGuestsQuery = query(
          this.guestsCollection(eventId),
          where('primaryGuestId', '==', targetUid),
        );
        const familyGuestsSnap = await getDocs(familyGuestsQuery);
        familyGuestsSnap.forEach((docSnap) => {
          batch.delete(docSnap.ref);
        });
      } catch (err) {
        console.error('Error finding linked family guests to cancel:', err);
      }

      // 3. Query and reset items claimed by this guest UID
      try {
        const itemsCol = collection(this.firestore, 'events', eventId, 'items');
        const itemsQuery = query(itemsCol, where('claimedBy.uid', '==', targetUid));
        const itemsSnap = await getDocs(itemsQuery);
        itemsSnap.forEach((itemDoc) => {
          batch.update(itemDoc.ref, { claimedBy: null });
        });
      } catch (err) {
        console.error('Error finding claimed items to reset:', err);
      }
    }

    // 4. Atomically commit the batch
    await batch.commit();
  }

  async getGuestById(eventId: string, guestId: string): Promise<Guest | null> {
    const docRef = doc(this.firestore, `events/${eventId}/guests/${guestId}`);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { id: snap.id, ...(snap.data() as Omit<Guest, 'id'>) };
    }
    return null;
  }

  async getGuestByPhone(eventId: string, phone: string): Promise<Guest | null> {
    const q = query(this.guestsCollection(eventId), where('phone', '==', phone), limit(1));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      return null;
    }
    const d = snapshot.docs[0];
    return { id: d.id, ...(d.data() as Omit<Guest, 'id'>) };
  }
}
