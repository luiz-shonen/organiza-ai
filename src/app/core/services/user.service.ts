import { Injectable, inject } from '@angular/core';
import { Observable, combineLatest, from, map } from 'rxjs';
import { FirestoreGateway } from './firestore.gateway';
import { EventService } from './event.service';
import type { UserProfile, PartyEvent, ThemeMode } from '../models';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly gateway = inject(FirestoreGateway);
  private readonly eventService = inject(EventService);

  private userPath(uid: string) {
    return `users/${uid}`;
  }

  async getProfile(uid: string): Promise<UserProfile | null> {
    if (!uid) return null;
    try {
      const data = await this.gateway.getDoc<Record<string, unknown>>(this.userPath(uid));
      if (!data) return null;

      const createdAtDate = this.gateway.timestampToDate(data['createdAt']);
      const updatedAtDate = this.gateway.timestampToDate(data['updatedAt']);

      return {
        uid,
        email: (data['email'] as string | null) ?? null,
        displayName:
          (data['displayName'] as string | null) ?? (data['name'] as string | null) ?? null,
        photoURL: (data['photoURL'] as string | null) ?? null,
        name: (data['name'] as string | undefined) ?? (data['displayName'] as string | undefined),
        phone: data['phone'] as string | undefined,
        themePref: data['themePref'] as ThemeMode | undefined,
        createdAt: createdAtDate
          ? createdAtDate.toISOString()
          : ((data['createdAt'] as string) ?? ''),
        updatedAt: updatedAtDate
          ? updatedAtDate.toISOString()
          : ((data['updatedAt'] as string) ?? ''),
      };
    } catch {
      return null;
    }
  }

  async updateProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
    if (!uid) return;
    try {
      const existing = await this.gateway.getDoc<Record<string, unknown>>(this.userPath(uid));
      const now = new Date().toISOString();
      const updateData: Record<string, unknown> = {
        ...data,
        updatedAt: now,
      };
      if (data.displayName !== undefined) {
        updateData['name'] = data.displayName;
      }
      const newName = (data.name ?? data.displayName)?.trim();
      if (newName) {
        // Guests read the organizer's name from each event, not from this private profile.
        this.eventService.renameCreator(uid, newName).catch(console.error);
      }
      if (existing) {
        await this.gateway.updateDoc(this.userPath(uid), updateData);
      } else {
        await this.gateway.setDoc(this.userPath(uid), {
          uid,
          ...updateData,
          createdAt: now,
        });
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      throw err;
    }
  }

  async upsertProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
    return this.updateProfile(uid, data);
  }

  async updateThemePreference(uid: string, themePref: ThemeMode): Promise<void> {
    await this.upsertProfile(uid, { themePref });
  }

  /** Events the member said they cannot attend; Início shows them as "Recusado". */
  async getDeclinedEvents(uid: string): Promise<string[]> {
    if (!uid) return [];
    try {
      const user = await this.gateway.getDoc<Record<string, unknown>>(this.userPath(uid));
      return (user?.['declinedEvents'] as string[] | undefined) ?? [];
    } catch {
      return [];
    }
  }

  /** Marks the invite as declined, or clears it when the member confirms after all. */
  async setDeclined(uid: string, eventId: string, declined: boolean): Promise<void> {
    if (!uid || !eventId) return;
    await this.gateway.setDoc(
      this.userPath(uid),
      {
        declinedEvents: declined
          ? this.gateway.arrayUnion(eventId)
          : this.gateway.arrayRemove(eventId),
      },
      { merge: true },
    );
  }

  /** Remembers an event the member opened from its invite link, so it shows on Início. */
  async rememberInvitedEvent(uid: string, eventId: string): Promise<void> {
    if (!uid || !eventId) return;
    await this.gateway.setDoc(
      this.userPath(uid),
      { invitedEvents: this.gateway.arrayUnion(eventId) },
      { merge: true },
    );
  }

  /**
   * Events are private: a member sees the ones they organize, the ones they opened from an
   * invite link and the ones they answered. Never every event of the people who invited them.
   */
  getVisibleEvents(uid: string): Observable<PartyEvent[]> {
    return combineLatest([
      this.eventService.getUserEvents(uid),
      from(this.getInvitedEvents(uid)),
    ]).pipe(
      map(([own, invited]) => {
        const byId = new Map<string, PartyEvent>();
        [...invited, ...own].forEach((event) => byId.set(event.id, event));
        return Array.from(byId.values()).sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
        );
      }),
    );
  }

  private async getInvitedEvents(uid: string): Promise<PartyEvent[]> {
    try {
      const [user, attended] = await Promise.all([
        this.gateway.getDoc<Record<string, unknown>>(this.userPath(uid)),
        this.getAttendedEvents(uid),
      ]);
      const attendedIds = new Set(attended.map((event) => event.id));
      const invitedIds = ((user?.['invitedEvents'] as string[] | undefined) ?? []).filter(
        (id) => !attendedIds.has(id),
      );
      const invited = await Promise.all(
        invitedIds.map((eventId) => this.eventService.getEventById(eventId)),
      );
      return [...attended, ...invited.filter((event): event is PartyEvent => !!event)];
    } catch (err) {
      console.error('Error fetching invited events:', err);
      return [];
    }
  }

  async getAttendedEvents(uid: string): Promise<PartyEvent[]> {
    if (!uid) return [];
    try {
      const events: PartyEvent[] = [];
      const eventIds = new Set<string>();

      // 1. Check if user document has rsvpEvents array
      const user = await this.gateway.getDoc<Record<string, unknown>>(this.userPath(uid));
      if (user) {
        const rsvpEvents = (user['rsvpEvents'] as string[]) ?? [];
        rsvpEvents.forEach((id) => eventIds.add(id));
      }

      // 2. Query guests collectionGroup where uid == uid
      try {
        const guestDocs = await this.gateway.getCollectionGroupDocs<{ eventId?: string }>(
          'guests',
          this.gateway.where('uid', '==', uid),
        );
        guestDocs.forEach((guestDoc) => {
          const eventId = guestDoc.eventId ?? guestDoc.parentId;
          if (eventId) {
            eventIds.add(eventId);
          }
        });
      } catch {
        // Fallback gracefully
      }

      // Fetch details for each event via EventService
      const fetchPromises = Array.from(eventIds).map(async (eventId) => {
        return this.eventService.getEventById(eventId);
      });

      const results = await Promise.all(fetchPromises);
      for (const evt of results) {
        if (evt) {
          events.push(evt);
        }
      }

      return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } catch (err) {
      console.error('Error fetching attended events:', err);
      return [];
    }
  }
}
