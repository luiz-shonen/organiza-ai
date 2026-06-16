import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  orderBy,
  query,
} from 'firebase/firestore';
import { FirebaseService } from './firebase.service';
import { AuthService } from './auth.service';
import { PartyItem, PartyItemCreate, ClaimedBy } from '../models';

@Injectable({ providedIn: 'root' })
export class ItemService {
  private readonly firestore = inject(FirebaseService).firestore;
  private readonly authService = inject(AuthService);

  private itemsCollection(eventId: string) {
    return collection(this.firestore, 'events', eventId, 'items');
  }

  listItems(eventId: string): Observable<PartyItem[]> {
    return new Observable<PartyItem[]>((subscriber) => {
      const q = query(this.itemsCollection(eventId), orderBy('name', 'asc'));

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const items = snapshot.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<PartyItem, 'id'>),
          }));
          subscriber.next(items);
        },
        (error) => subscriber.error(error)
      );

      return () => unsubscribe();
    });
  }

  async addItem(eventId: string, data: PartyItemCreate): Promise<string> {
    const docRef = await addDoc(this.itemsCollection(eventId), {
      ...data,
      claimedBy: null,
    });
    return docRef.id;
  }

  async claimItem(eventId: string, itemId: string, claimedBy: Omit<ClaimedBy, 'uid'>): Promise<void> {
    const user = this.authService.currentUser();
    const docRef = doc(this.firestore, 'events', eventId, 'items', itemId);
    await updateDoc(docRef, { claimedBy: { ...claimedBy, uid: user ? user.uid : '' } });
  }

  async unclaimItem(eventId: string, itemId: string): Promise<void> {
    const docRef = doc(this.firestore, 'events', eventId, 'items', itemId);
    await updateDoc(docRef, { claimedBy: null });
  }

  async deleteItem(eventId: string, itemId: string): Promise<void> {
    const docRef = doc(this.firestore, 'events', eventId, 'items', itemId);
    await deleteDoc(docRef);
  }
}
