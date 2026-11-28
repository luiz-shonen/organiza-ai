import { Injectable, inject } from '@angular/core';
import { Observable, catchError, combineLatest, map, of, switchMap } from 'rxjs';
import { FirestoreGateway } from './firestore.gateway';
import { EventNotificationService } from './event-notification.service';
import { PublicProfileService, type PublicProfile } from './public-profile.service';
import { ContactService } from './contact.service';
import { MapLocation } from '../value-objects';
import {
  PartyEvent,
  PartyEventCreate,
  PartyEventUpdate,
  EventInvitation,
  AddressDetails,
  PixType,
  SecretSantaSettings,
} from '../models';

@Injectable({ providedIn: 'root' })
export class EventService {
  private readonly gateway = inject(FirestoreGateway);
  private readonly notificationService = inject(EventNotificationService);
  private readonly profiles = inject(PublicProfileService);
  private readonly contacts = inject(ContactService);
  private readonly collectionName = 'events';

  listEvents(): Observable<PartyEvent[]> {
    return this.gateway
      .collectionSnapshot<
        Record<string, unknown>
      >(this.collectionName, this.gateway.orderBy('date', 'asc'))
      .pipe(map((docs) => docs.map((d) => this.mapEventData(d))));
  }

  /** Keeps "Organizado por" in step with the owner's profile name on every event they own. */
  getUserEvents(uid: string): Observable<PartyEvent[]> {
    if (!uid) {
      return of([]);
    }

    const owned$ = this.gateway
      .collectionSnapshot<
        Record<string, unknown>
      >(this.collectionName, this.gateway.where('createdBy', '==', uid))
      .pipe(map((docs) => docs.map((d) => this.mapEventData(d))));

    const collaborated$ = this.gateway
      .collectionSnapshot<
        Record<string, unknown>
      >(this.collectionName, this.gateway.where('collaborators', 'array-contains', uid))
      .pipe(map((docs) => docs.map((d) => this.mapEventData(d))));

    return combineLatest([owned$, collaborated$]).pipe(
      map(([owned, collaborated]) => {
        const eventMap = new Map<string, PartyEvent>();
        owned.forEach((e) => eventMap.set(e.id, e));
        collaborated.forEach((e) => eventMap.set(e.id, e));
        return Array.from(eventMap.values()).sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
        );
      }),
      switchMap((events) =>
        this.profiles
          .profilesOf$(events.map((event) => event.createdBy))
          .pipe(map((profiles) => events.map((event) => named(event, profiles)))),
      ),
    );
  }

  /**
   * One event, live, with its organizer's current name: read by `createdBy` from that account's
   * public profile (`publicProfiles/{uid}`), so a renamed organizer shows the new name everywhere.
   * The `creatorName` saved on older events is only a fallback.
   */
  getEvent(eventId: string): Observable<PartyEvent | null> {
    return this.gateway
      .docSnapshot<Record<string, unknown>>(`${this.collectionName}/${eventId}`)
      .pipe(
        map((doc) => (doc ? this.mapEventData(doc) : null)),
        switchMap((event) => {
          if (!event?.createdBy) return of(event);
          return this.profiles
            .profilesOf$([event.createdBy])
            .pipe(map((profiles) => named(event, profiles)));
        }),
      );
  }

  /**
   * Events named by their organizer's current profile (`publicProfiles/{createdBy}`), one read
   * per organizer: the `creatorName` saved when the event was made is only a fallback.
   */
  async withOrganizerNames(events: readonly PartyEvent[]): Promise<PartyEvent[]> {
    try {
      return await this.namedByOrganizers(events);
    } catch {
      return [...events];
    }
  }

  private async namedByOrganizers(events: readonly PartyEvent[]): Promise<PartyEvent[]> {
    const profiles = await this.profiles.lookup(events.map((event) => event.createdBy));
    return events.map((event) => named(event, profiles));
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
      const docData = await this.gateway.getDocWithId<Record<string, unknown>>(
        `${this.collectionName}/${eventId}`,
      );
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
      const docData = await this.gateway.getDocWithId<Record<string, unknown>>(
        `${this.collectionName}/${eventId}`,
      );
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

  /** "Reabrir evento": a cancelled event is open again, as it was. */
  async reopenEvent(eventId: string): Promise<void> {
    await this.gateway.updateDoc(`${this.collectionName}/${eventId}`, {
      status: 'active',
      updatedAt: new Date().toISOString(),
    });
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
      // The bell shows who invites by this uid, from their profile.
      invitedBy: invitedBy ?? '',
      createdAt: new Date().toISOString(),
    });
  }

  /** The events this account helps organise, with their title and organizer's name. */
  async collaboratingOn(
    uid: string,
  ): Promise<{ id: string; title: string; organizerName: string }[]> {
    if (!uid) return [];
    const events = await this.gateway.getDocs<{
      title?: string;
      createdBy?: string;
      creatorName?: string;
      collaborators?: string[];
    }>(this.collectionName, this.gateway.where('collaborators', 'array-contains', uid));
    const mine = events.filter((event) => (event.collaborators ?? []).includes(uid));
    const profiles = await this.profiles.lookup(mine.map((event) => event.createdBy));
    return mine.map((event) => ({
      id: event.id,
      title: event.title ?? '',
      organizerName:
        (event.createdBy && profiles[event.createdBy]?.name) || event.creatorName || '',
    }));
  }

  /** "Sair da colaboração": the collaborator takes their own account out of the event. */
  async leaveCollaboration(eventId: string, uid: string): Promise<void> {
    // First, while still an organizer: they stop reading the guests' phones.
    await this.contacts.revokeFromCollaborator(eventId, uid).catch(() => undefined);
    await this.gateway.updateDoc(`${this.collectionName}/${eventId}`, {
      collaborators: this.gateway.arrayRemove(uid),
      updatedAt: new Date().toISOString(),
    });
    await this.gateway.deleteDoc(this.collaboratorPath(eventId, uid)).catch(() => undefined);
  }

  async removeCollaborator(eventId: string, collaboratorUid: string): Promise<void> {
    await this.gateway.updateDoc(`${this.collectionName}/${eventId}`, {
      collaborators: this.gateway.arrayRemove(collaboratorUid),
      updatedAt: new Date().toISOString(),
    });
    // Then their saved e-mail, apart: removing must never fail on that record.
    await this.gateway
      .deleteDoc(this.collaboratorPath(eventId, collaboratorUid))
      .catch(() => undefined);
    // And the guests' phones: no longer an organizer here, so no longer on their lists.
    await this.contacts.revokeFromCollaborator(eventId, collaboratorUid).catch(() => undefined);
  }

  listPendingInvitations(eventId: string): Observable<EventInvitation[]> {
    return this.gateway
      .collectionSnapshot<Record<string, unknown>>(`${this.collectionName}/${eventId}/invitations`)
      .pipe(
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

  /** The invites to help organise sent to this e-mail and not answered yet. */
  async invitationsFor(email: string): Promise<EventInvitation[]> {
    const normalizedEmail = email.toLowerCase().trim();
    if (!normalizedEmail) return [];
    const docs = await this.gateway.getCollectionGroupDocs<Partial<EventInvitation>>(
      'invitations',
      this.gateway.where('invitedEmail', '==', normalizedEmail),
    );
    const invites = docs
      .filter((d) => d.eventId && (d.invitedEmail ?? d.id) === normalizedEmail)
      .map((d) => ({
        id: d.id,
        eventId: d.eventId ?? '',
        eventTitle: d.eventTitle ?? '',
        invitedEmail: d.invitedEmail ?? d.id,
        invitedBy: d.invitedBy ?? '',
        invitedByName: d.invitedByName ?? '',
        invitedByPhoto: d.invitedByPhoto ?? null,
        createdAt: d.createdAt ?? '',
      }));
    // Who invites, by account: their profile now. Invites saved without the inviter's uid name
    // the event's organizer; the name an older invite stored is the last fallback.
    const owners = await Promise.all(
      invites.map(async (invite) => {
        if (isUid(invite.invitedBy)) return null;
        return this.gateway
          .getDoc<{
            createdBy?: string;
            creatorName?: string;
          }>(`${this.collectionName}/${invite.eventId}`)
          .catch(() => null);
      }),
    );
    const inviters = invites.map(
      (invite, i) => (isUid(invite.invitedBy) ? invite.invitedBy : owners[i]?.createdBy) || '',
    );
    const profiles = await this.profiles.lookup(inviters);
    return invites.map((invite, i) => {
      const inviter = inviters[i];
      const profile = inviter ? profiles[inviter] : undefined;
      return {
        ...invite,
        invitedBy: inviter,
        invitedByName: profile?.name || invite.invitedByName || owners[i]?.creatorName || '',
        invitedByPhoto: profile ? profile.photoURL : invite.invitedByPhoto,
      };
    });
  }

  /** "Aceitar": the invited account joins the event as a collaborator; the invite goes. */
  async acceptInvitation(eventId: string, email: string, uid: string): Promise<void> {
    const normalizedEmail = email.toLowerCase().trim();
    await this.gateway.runBatch((batch) => {
      batch.update(`${this.collectionName}/${eventId}`, {
        collaborators: this.gateway.arrayUnion(uid),
        updatedAt: new Date().toISOString(),
      });
      batch.delete(`${this.collectionName}/${eventId}/invitations/${normalizedEmail}`);
    });
    // Then, apart, the e-mail the organizers see in their list.
    await this.gateway
      .setDoc(this.collaboratorPath(eventId, uid), {
        email: normalizedEmail,
        updatedAt: new Date().toISOString(),
      })
      .catch(() => undefined);
    // Now an organizer: they may read the phones of the guests who confirmed.
    await this.contacts.grantToCollaborator(eventId, uid).catch(() => undefined);
  }

  /** "Recusar": the invite is gone and nothing changes on the event. */
  async declineInvitation(eventId: string, email: string): Promise<void> {
    const normalizedEmail = email.toLowerCase().trim();
    await this.gateway.deleteDoc(
      `${this.collectionName}/${eventId}/invitations/${normalizedEmail}`,
    );
  }

  private collaboratorPath(eventId: string, uid: string): string {
    return `${this.collectionName}/${eventId}/collaborators/${uid}`;
  }

  /**
   * For collaborators who joined before e-mails were kept: on sign-in they record theirs on
   * each event they help with, so the organizers' list shows it.
   */
  async recordCollaboratorEmail(email: string, uid: string): Promise<void> {
    const normalizedEmail = email.toLowerCase().trim();
    if (!normalizedEmail || !uid) return;
    const events = await this.gateway.getDocs<{ id: string }>(
      this.collectionName,
      this.gateway.where('collaborators', 'array-contains', uid),
    );
    for (const event of events) {
      const saved = await this.gateway
        .getDoc<{ email?: string }>(this.collaboratorPath(event.id, uid))
        .catch(() => null);
      if (saved?.email === normalizedEmail) continue;
      await this.gateway
        .setDoc(this.collaboratorPath(event.id, uid), {
          email: normalizedEmail,
          updatedAt: new Date().toISOString(),
        })
        .catch(() => undefined);
    }
  }

  /** Each collaborator's e-mail by account id, live (organizers only). */
  collaboratorEmails$(eventId: string): Observable<Record<string, string>> {
    return this.gateway
      .collectionSnapshot<{ email?: string }>(`${this.collectionName}/${eventId}/collaborators`)
      .pipe(
        map((docs) =>
          Object.fromEntries(docs.filter((d) => d.email).map((d) => [d.id, d.email as string])),
        ),
        catchError(() => of({} as Record<string, string>)),
      );
  }

  /** The owner withdraws an e-mail invite that was not accepted yet. */
  async cancelInvitation(eventId: string, email: string): Promise<void> {
    const normalizedEmail = email.toLowerCase().trim();
    await this.gateway.deleteDoc(
      `${this.collectionName}/${eventId}/invitations/${normalizedEmail}`,
    );
  }

  async getEventById(eventId: string): Promise<PartyEvent | null> {
    try {
      const docData = await this.gateway.getDocWithId<Record<string, unknown>>(
        `${this.collectionName}/${eventId}`,
      );
      if (!docData) return null;
      return this.mapEventData(docData);
    } catch {
      return null;
    }
  }

  mapEventData(data: Record<string, unknown> & { id: string }): PartyEvent {
    const dateVal = this.gateway.timestampToDate(data['date']);
    return {
      id: data.id,
      title: (data['title'] as string) ?? '',
      category: (data['category'] as string) ?? '',
      description: (data['description'] as string) ?? '',
      date: dateVal ? dateVal.toISOString() : ((data['date'] as string) ?? ''),
      ...(typeof data['endDate'] === 'string' ? { endDate: data['endDate'] } : {}),
      location: (data['location'] as string) ?? '',
      addressDetails: (data['addressDetails'] as AddressDetails | undefined) ?? undefined,
      // Checked again on read: only a valid pin or a map site's link ever opens.
      mapLocation: MapLocation.fromData(data['mapLocation'])?.data ?? null,
      pixKey: (data['pixKey'] as string | null) ?? null,
      pixType: (data['pixType'] as PixType | undefined) ?? undefined,
      pixPurpose: typeof data['pixPurpose'] === 'string' ? data['pixPurpose'] : null,
      secretSantaRules:
        typeof data['secretSantaRules'] === 'string' ? data['secretSantaRules'] : null,
      ...(typeof data['secretSantaRosterVersion'] === 'number'
        ? { secretSantaRosterVersion: data['secretSantaRosterVersion'] }
        : {}),
      estimatedBudget:
        typeof data['estimatedBudget'] === 'number'
          ? (data['estimatedBudget'] as number)
          : data['estimatedBudget'] === null
            ? null
            : undefined,
      expectedGuests: typeof data['expectedGuests'] === 'number' ? data['expectedGuests'] : null,
      aiSuggestionsUsed:
        typeof data['aiSuggestionsUsed'] === 'number' ? data['aiSuggestionsUsed'] : 0,
      aiSuggestionKey: typeof data['aiSuggestionKey'] === 'string' ? data['aiSuggestionKey'] : null,
      status: (data['status'] as 'active' | 'cancelled') ?? 'active',
      createdBy: (data['createdBy'] as string) ?? '',
      creatorEmail: (data['creatorEmail'] as string) ?? '',
      creatorName: (data['creatorName'] as string) ?? '',
      collaborators: (data['collaborators'] as string[]) ?? [],
      ...(data['secretSanta'] ? { secretSanta: data['secretSanta'] as SecretSantaSettings } : {}),
      ...(data['requireApproval'] === true ? { requireApproval: true } : {}),
      createdAt: (data['createdAt'] as string) ?? '',
      updatedAt: (data['updatedAt'] as string) ?? '',
    };
  }
}

/** Older invites kept the inviter's e-mail in `invitedBy`; newer ones keep their uid. */
function isUid(value: string | undefined): value is string {
  return !!value && !value.includes('@');
}

/**
 * The event named by its organizer's profile now (`publicProfiles/{createdBy}`); the
 * `creatorName` an older event stored is only the fallback.
 */
function named(event: PartyEvent, profiles: Readonly<Record<string, PublicProfile>>): PartyEvent {
  const profile = event.createdBy ? profiles[event.createdBy] : undefined;
  return profile
    ? { ...event, creatorName: profile.name, creatorPhoto: profile.photoURL || event.creatorPhoto }
    : event;
}
