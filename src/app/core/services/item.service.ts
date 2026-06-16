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
import { PartyItem, PartyItemCreate, ClaimedBy } from '../models';

@Injectable({ providedIn: 'root' })
export class ItemService {
  private readonly firestore = inject(FirebaseService).firestore;

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

  async claimItem(eventId: string, itemId: string, claimedBy: ClaimedBy): Promise<void> {
    const docRef = doc(this.firestore, 'events', eventId, 'items', itemId);
    await updateDoc(docRef, { claimedBy });
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
