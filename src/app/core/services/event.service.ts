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
  Timestamp,
} from 'firebase/firestore';
import { FirebaseService } from './firebase.service';
import { PartyEvent, PartyEventCreate, PartyEventUpdate } from '../models';

@Injectable({ providedIn: 'root' })
export class EventService {
  private readonly firestore = inject(FirebaseService).firestore;
  private readonly collectionName = 'events';

  listEvents(): Observable<PartyEvent[]> {
    return new Observable<PartyEvent[]>((subscriber) => {
      const q = query(collection(this.firestore, this.collectionName), orderBy('date', 'asc'));

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const events = snapshot.docs.map((d) => this.mapDoc(d));
          subscriber.next(events);
        },
        (error) => subscriber.error(error),
      );

      return () => unsubscribe();
    });
  }

  getEvent(eventId: string): Observable<PartyEvent | null> {
    return new Observable<PartyEvent | null>((subscriber) => {
      const docRef = doc(this.firestore, this.collectionName, eventId);

      const unsubscribe = onSnapshot(
        docRef,
        (snapshot) => {
          if (snapshot.exists()) {
            subscriber.next(this.mapDoc(snapshot));
          } else {
            subscriber.next(null);
          }
        },
        (error) => subscriber.error(error),
      );

      return () => unsubscribe();
    });
  }

  async createEvent(data: PartyEventCreate): Promise<string> {
    const now = new Date().toISOString();
    const docRef = await addDoc(collection(this.firestore, this.collectionName), {
      ...data,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    });
    return docRef.id;
  }

  async updateEvent(eventId: string, data: PartyEventUpdate): Promise<void> {
    const docRef = doc(this.firestore, this.collectionName, eventId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  }

  async cancelEvent(eventId: string): Promise<void> {
    const docRef = doc(this.firestore, this.collectionName, eventId);
    await updateDoc(docRef, {
      status: 'cancelled',
      updatedAt: new Date().toISOString(),
    });
  }

  private mapDoc(
    snapshot:
      | import('firebase/firestore').DocumentSnapshot
      | import('firebase/firestore').QueryDocumentSnapshot,
  ): PartyEvent {
    const data = snapshot.data();
    return {
      id: snapshot.id,
      title: (data?.['title'] as string) ?? '',
      category: (data?.['category'] as string) ?? '',
      description: (data?.['description'] as string) ?? '',
      date:
        data?.['date'] instanceof Timestamp
          ? (data['date'] as Timestamp).toDate().toISOString()
          : ((data?.['date'] as string) ?? ''),
      location: (data?.['location'] as string) ?? '',
      addressDetails: data?.['addressDetails'],
      pixKey: (data?.['pixKey'] as string | null) ?? null,
      status: (data?.['status'] as 'active' | 'cancelled') ?? 'active',
      createdAt: (data?.['createdAt'] as string) ?? '',
      updatedAt: (data?.['updatedAt'] as string) ?? '',
    };
  }
}
