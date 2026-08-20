import { Injectable, inject } from '@angular/core';
import { Observable, combineLatest, map, of } from 'rxjs';
import { FirestoreGateway } from './firestore.gateway';
import { EventNotificationService } from './event-notification.service';
import { PartyEvent, PartyEventCreate, PartyEventUpdate, EventInvitation } from '../models';

@Injectable({ providedIn: 'root' })
export class EventService {
  private readonly gateway = inject(FirestoreGateway);
  private readonly notificationService = inject(EventNotificationService);
  private readonly collectionName = 'events';

  listEvents(): Observable<PartyEvent[]> {
    return this.gateway.collectionSnapshot<Record<string, unknown>>(
      this.collectionName,
      this.gateway.orderBy('date', 'asc'),
    ).pipe(map((docs) => docs.map((d) => this.mapEventData(d))));
  }

  getUserEvents(uid: string): Observable<PartyEvent[]> {
    if (!uid) {
      return of([]);
    }

    const owned$ = this.gateway.collectionSnapshot<Record<string, unknown>>(
      this.collectionName,
      this.gateway.where('createdBy', '==', uid),
    ).pipe(map((docs) => docs.map((d) => this.mapEventData(d))));

    const collaborated$ = this.gateway.collectionSnapshot<Record<string, unknown>>(
      this.collectionName,
      this.gateway.where('collaborators', 'array-contains', uid),
    ).pipe(map((docs) => docs.map((d) => this.mapEventData(d))));

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
    return this.gateway.docSnapshot<Record<string, unknown>>(
      `${this.collectionName}/${eventId}`,
    ).pipe(map((doc) => (doc ? this.mapEventData(doc) : null)));
  }

  async createEvent(data: PartyEventCreate): Promise<string> {
    const now = new Date().toISOString();
    return this.gateway.addDoc(this.collectionName, {
      ...data,
      collaborators: data.collaborators ?? [],
      status: 'active',
      createdAt: now,
      updatedAt: now,
    });
  }

  async updateEvent(eventId: string, data: PartyEventUpdate): Promise<void> {
    let previousEvent: PartyEvent | null = null;

    try {
      const docData = await this.gateway.getDocWithId<Record<string, unknown>>(`${this.collectionName}/${eventId}`);
      if (docData) {
        previousEvent = this.mapEventData(docData);
      }
    } catch {
      // Gracefully continue with update if snapshot fetch fails
    }

    await this.gateway.updateDoc(`${this.collectionName}/${eventId}`, {
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
            changeSummary,
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
    let eventToCancel: PartyEvent | null = null;

    try {
      const docData = await this.gateway.getDocWithId<Record<string, unknown>>(`${this.collectionName}/${eventId}`);
      if (docData) {
        eventToCancel = this.mapEventData(docData);
      }
    } catch {
      // Gracefully continue
    }

    await this.gateway.updateDoc(`${this.collectionName}/${eventId}`, {
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
    await this.gateway.deleteDoc(`${this.collectionName}/${eventId}`);
  }

  async inviteCollaborator(
    eventId: string,
    email: string,
    eventTitle?: string,
    invitedBy?: string,
  ): Promise<void> {
    const normalizedEmail = email.toLowerCase().trim();
    await this.gateway.setDoc(`${this.collectionName}/${eventId}/invitations/${normalizedEmail}`, {
      id: normalizedEmail,
      eventId,
      eventTitle: eventTitle ?? '',
      invitedEmail: normalizedEmail,
      invitedBy: invitedBy ?? '',
      createdAt: new Date().toISOString(),
    });
  }

  async removeCollaborator(eventId: string, collaboratorUid: string): Promise<void> {
    await this.gateway.updateDoc(`${this.collectionName}/${eventId}`, {
      collaborators: this.gateway.arrayRemove(collaboratorUid),
      updatedAt: new Date().toISOString(),
    });
  }

  listPendingInvitations(eventId: string): Observable<EventInvitation[]> {
    return this.gateway.collectionSnapshot<Record<string, unknown>>(
      `${this.collectionName}/${eventId}/invitations`,
    ).pipe(
      map((docs) =>
        docs.map((d) => ({
          id: d.id,
          eventId: (d['eventId'] as string) ?? eventId,
          eventTitle: (d['eventTitle'] as string) ?? '',
          invitedEmail: (d['invitedEmail'] as string) ?? d.id,
          invitedBy: (d['invitedBy'] as string) ?? '',
          createdAt: (d['createdAt'] as string) ?? '',
        })),
      ),
    );
  }

  async claimPendingInvitations(email: string, uid: string): Promise<void> {
    if (!email || !uid) return;
    const normalizedEmail = email.toLowerCase().trim();

    const snapshotDocs = await this.gateway.getCollectionGroupDocs<{ eventId?: string }>(
      'invitations',
      this.gateway.where('invitedEmail', '==', normalizedEmail),
    );
    if (snapshotDocs.length === 0) return;

    await this.gateway.runBatch((batch) => {
      for (const invDoc of snapshotDocs) {
        if (invDoc.eventId) {
          batch.update(`${this.collectionName}/${invDoc.eventId}`, {
            collaborators: this.gateway.arrayUnion(uid),
            updatedAt: new Date().toISOString(),
          });
          batch.delete(`${this.collectionName}/${invDoc.eventId}/invitations/${invDoc.id}`);
        }
      }
    });
  }

  private mapEventData(data: Record<string, unknown> & { id: string }): PartyEvent {
    const dateVal = this.gateway.timestampToDate(data['date']);
    return {
      id: data.id,
      title: (data['title'] as string) ?? '',
      category: (data['category'] as string) ?? '',
      description: (data['description'] as string) ?? '',
      date: dateVal ? dateVal.toISOString() : ((data['date'] as string) ?? ''),
      location: (data['location'] as string) ?? '',
      addressDetails: data['addressDetails'] as any,
      pixKey: (data['pixKey'] as string | null) ?? null,
      pixType: data['pixType'] as any,
      estimatedBudget: data['estimatedBudget'] as any,
      status: (data['status'] as 'active' | 'cancelled') ?? 'active',
      createdBy: (data['createdBy'] as string) ?? '',
      creatorEmail: (data['creatorEmail'] as string) ?? '',
      collaborators: (data['collaborators'] as string[]) ?? [],
      createdAt: (data['createdAt'] as string) ?? '',
      updatedAt: (data['updatedAt'] as string) ?? '',
    };
  }
}
