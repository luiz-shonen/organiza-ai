import { Injectable, inject } from '@angular/core';
import { FirestoreGateway } from './firestore.gateway';
import { EventService } from './event.service';
import type {
  UserProfile,
  PartyEvent,
  ThemeMode,
} from '../models';

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
          (data['displayName'] as string | null) ??
          (data['name'] as string | null) ??
          null,
        photoURL: (data['photoURL'] as string | null) ?? null,
        name: (data['name'] as string | undefined) ?? (data['displayName'] as string | undefined),
        phone: data['phone'] as string | undefined,
        themePref: data['themePref'] as ThemeMode | undefined,
        createdAt: createdAtDate ? createdAtDate.toISOString() : ((data['createdAt'] as string) ?? ''),
        updatedAt: updatedAtDate ? updatedAtDate.toISOString() : ((data['updatedAt'] as string) ?? ''),
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
          if (guestDoc.eventId) {
            eventIds.add(guestDoc.eventId);
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
