import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
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
      const q = query(this.guestsCollection(eventId), orderBy('createdAt', 'desc'));

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const guests = snapshot.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<Guest, 'id'>),
          }));
          subscriber.next(guests);
        },
        (error) => subscriber.error(error)
      );

      return () => unsubscribe();
    });
  }

  async addGuest(eventId: string, data: GuestCreate): Promise<string> {
    const user = this.authService.currentUser();
    const docRef = await addDoc(this.guestsCollection(eventId), {
      ...data,
      uid: user ? user.uid : '',
      createdAt: new Date().toISOString(),
    });
    return docRef.id;
  }

  async updateGuest(
    eventId: string,
    guestId: string,
    data: Partial<GuestCreate>
  ): Promise<void> {
    const docRef = doc(this.firestore, 'events', eventId, 'guests', guestId);
    await updateDoc(docRef, { ...data });
  }

  async getGuestByPhone(eventId: string, phone: string): Promise<Guest | null> {
    const q = query(
      this.guestsCollection(eventId),
      where('phone', '==', phone),
      limit(1)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      return null;
    }
    const d = snapshot.docs[0];
    return { id: d.id, ...(d.data() as Omit<Guest, 'id'>) };
  }
}
