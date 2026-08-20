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
import { Guest, GuestCreate } from '../models';

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

    // 1. Delete guest document
    const guestDocRef = doc(this.firestore, `events/${eventId}/guests/${guestId}`);
    batch.delete(guestDocRef);

    // 2. Query and reset items claimed by this guest UID
    const targetUid = uid || guestId;
    if (targetUid) {
      const itemsCol = collection(this.firestore, 'events', eventId, 'items');
      const itemsQuery = query(itemsCol, where('claimedBy.uid', '==', targetUid));
      const itemsSnap = await getDocs(itemsQuery);
      itemsSnap.forEach((itemDoc) => {
        batch.update(itemDoc.ref, { claimedBy: null });
      });
    }

    // 3. Atomically commit the batch
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
