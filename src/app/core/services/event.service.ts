import { Injectable, inject } from '@angular/core';
import { Observable, combineLatest, map, of } from 'rxjs';
import {
  collection,
  collectionGroup,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  where,
  arrayUnion,
  arrayRemove,
  writeBatch,
  Timestamp,
} from 'firebase/firestore';
import { FirebaseService } from './firebase.service';
import { EventNotificationService } from './event-notification.service';
import { PartyEvent, PartyEventCreate, PartyEventUpdate, EventInvitation } from '../models';

@Injectable({ providedIn: 'root' })
export class EventService {
  private readonly firestore = inject(FirebaseService).firestore;
  private readonly notificationService = inject(EventNotificationService);
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

  getUserEvents(uid: string): Observable<PartyEvent[]> {
    if (!uid) {
      return of([]);
    }

    const owned$ = new Observable<PartyEvent[]>((subscriber) => {
      const q = query(
        collection(this.firestore, this.collectionName),
        where('createdBy', '==', uid),
      );
      return onSnapshot(
        q,
        (snapshot) => subscriber.next(snapshot.docs.map((d) => this.mapDoc(d))),
        (error) => subscriber.error(error),
      );
    });

    const collaborated$ = new Observable<PartyEvent[]>((subscriber) => {
      const q = query(
        collection(this.firestore, this.collectionName),
        where('collaborators', 'array-contains', uid),
      );
      return onSnapshot(
        q,
        (snapshot) => subscriber.next(snapshot.docs.map((d) => this.mapDoc(d))),
        (error) => subscriber.error(error),
      );
    });

    return combineLatest([owned$, collaborated$]).pipe(
      map(([owned, collaborated]) => {
        const eventMap = new Map<string, PartyEvent>();
        owned.forEach((e) => eventMap.set(e.id, e));
        collaborated.forEach((e) => eventMap.set(e.id, e));
        return Array.from(eventMap.values()).sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
        );
      }),
    );
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
      collaborators: data.collaborators ?? [],
      status: 'active',
      createdAt: now,
      updatedAt: now,
    });
    return docRef.id;
  }

  async updateEvent(eventId: string, data: PartyEventUpdate): Promise<void> {
    const docRef = doc(this.firestore, this.collectionName, eventId);
    let previousEvent: PartyEvent | null = null;

    try {
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        previousEvent = this.mapDoc(docSnap);
      }
    } catch {
      // Gracefully continue with update if snapshot fetch fails
    }

    await updateDoc(docRef, {
      ...data,
      updatedAt: new Date().toISOString(),
    });

    if (previousEvent) {
      const dateChanged = !!data.date && data.date !== previousEvent.date;
      const locationChanged = !!data.location && data.location !== previousEvent.location;
      const addressChanged =
        !!data.addressDetails &&
        JSON.stringify(data.addressDetails) !== JSON.stringify(previousEvent.addressDetails);

      if (dateChanged || locationChanged || addressChanged) {
        const changes: string[] = [];
        if (dateChanged) changes.push(`Data: ${data.date}`);
        if (locationChanged) changes.push(`Local: ${data.location}`);
        const changeSummary = changes.join(', ') || 'Informações atualizadas';

        try {
          await this.notificationService.notifyGuestsOfEventChange(
            {
              ...previousEvent,
              ...data,
            },
            changeSummary
          );
        } catch (error) {
          console.warn('Error sending event change notification', error);
        }
      }
    }
  }

  async saveEvent(eventId: string, data: PartyEventUpdate): Promise<void> {
    return this.updateEvent(eventId, data);
  }

  async cancelEvent(eventId: string): Promise<void> {
    const docRef = doc(this.firestore, this.collectionName, eventId);
    let eventToCancel: PartyEvent | null = null;

    try {
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        eventToCancel = this.mapDoc(docSnap);
      }
    } catch {
      // Gracefully continue
    }

    await updateDoc(docRef, {
      status: 'cancelled',
      updatedAt: new Date().toISOString(),
    });

    if (eventToCancel) {
      try {
        await this.notificationService.notifyGuestsOfCancellation({
          ...eventToCancel,
          status: 'cancelled',
        });
      } catch (error) {
        console.warn('Error sending cancellation notification', error);
      }
    }
  }

  async deleteEvent(eventId: string): Promise<void> {
    const docRef = doc(this.firestore, this.collectionName, eventId);
    await deleteDoc(docRef);
  }

  async inviteCollaborator(
    eventId: string,
    email: string,
    eventTitle?: string,
    invitedBy?: string,
  ): Promise<void> {
    const normalizedEmail = email.toLowerCase().trim();
    const docRef = doc(
      this.firestore,
      this.collectionName,
      eventId,
      'invitations',
      normalizedEmail,
    );
    await setDoc(docRef, {
      id: normalizedEmail,
      eventId,
      eventTitle: eventTitle ?? '',
      invitedEmail: normalizedEmail,
      invitedBy: invitedBy ?? '',
      createdAt: new Date().toISOString(),
    });
  }

  async removeCollaborator(eventId: string, collaboratorUid: string): Promise<void> {
    const docRef = doc(this.firestore, this.collectionName, eventId);
    await updateDoc(docRef, {
      collaborators: arrayRemove(collaboratorUid),
      updatedAt: new Date().toISOString(),
    });
  }

  listPendingInvitations(eventId: string): Observable<EventInvitation[]> {
    return new Observable<EventInvitation[]>((subscriber) => {
      const colRef = collection(this.firestore, this.collectionName, eventId, 'invitations');
      const unsubscribe = onSnapshot(
        colRef,
        (snapshot) => {
          const invites = snapshot.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              eventId: (data?.['eventId'] as string) ?? eventId,
              eventTitle: (data?.['eventTitle'] as string) ?? '',
              invitedEmail: (data?.['invitedEmail'] as string) ?? d.id,
              invitedBy: (data?.['invitedBy'] as string) ?? '',
              createdAt: (data?.['createdAt'] as string) ?? '',
            };
          });
          subscriber.next(invites);
        },
        (err) => subscriber.error(err),
      );
      return () => unsubscribe();
    });
  }

  async claimPendingInvitations(email: string, uid: string): Promise<void> {
    if (!email || !uid) return;
    const normalizedEmail = email.toLowerCase().trim();
    const q = query(
      collectionGroup(this.firestore, 'invitations'),
      where('invitedEmail', '==', normalizedEmail),
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return;

    const batch = writeBatch(this.firestore);
    for (const invDoc of snapshot.docs) {
      const invData = invDoc.data();
      const eventId = (invData?.['eventId'] as string) || invDoc.ref.parent.parent?.id;
      if (eventId) {
        const eventRef = doc(this.firestore, this.collectionName, eventId);
        batch.update(eventRef, {
          collaborators: arrayUnion(uid),
          updatedAt: new Date().toISOString(),
        });
      }
      batch.delete(invDoc.ref);
    }
    await batch.commit();
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
      pixType: data?.['pixType'],
      estimatedBudget: data?.['estimatedBudget'],
      status: (data?.['status'] as 'active' | 'cancelled') ?? 'active',
      createdBy: (data?.['createdBy'] as string) ?? '',
      creatorEmail: (data?.['creatorEmail'] as string) ?? '',
      collaborators: (data?.['collaborators'] as string[]) ?? [],
      createdAt: (data?.['createdAt'] as string) ?? '',
      updatedAt: (data?.['updatedAt'] as string) ?? '',
    };
  }
}
