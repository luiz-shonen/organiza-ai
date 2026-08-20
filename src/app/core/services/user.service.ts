import { Injectable, inject } from '@angular/core';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collectionGroup,
  query,
  where,
  getDocs,
  Timestamp,
  type DocumentSnapshot,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { FirebaseService } from './firebase.service';
import type { UserProfile, PartyEvent } from '../models';
import type { ThemeMode } from './theme.service';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly firestore = inject(FirebaseService).firestore;

  async getProfile(uid: string): Promise<UserProfile | null> {
    if (!uid) return null;
    try {
      const docRef = doc(this.firestore, 'users', uid);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        return {
          uid,
          email: (data?.['email'] as string | null) ?? null,
          displayName:
            (data?.['displayName'] as string | null) ??
            (data?.['name'] as string | null) ??
            null,
          photoURL: (data?.['photoURL'] as string | null) ?? null,
          name: (data?.['name'] as string | undefined) ?? (data?.['displayName'] as string | undefined),
          phone: data?.['phone'] as string | undefined,
          themePref: data?.['themePref'] as ThemeMode | undefined,
          createdAt:
            data?.['createdAt'] instanceof Timestamp
              ? data['createdAt'].toDate().toISOString()
              : ((data?.['createdAt'] as string) ?? ''),
          updatedAt:
            data?.['updatedAt'] instanceof Timestamp
              ? data['updatedAt'].toDate().toISOString()
              : ((data?.['updatedAt'] as string) ?? ''),
        };
      }
      return null;
    } catch {
      return null;
    }
  }

  async updateProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
    if (!uid) return;
    try {
      const docRef = doc(this.firestore, 'users', uid);
      const snap = await getDoc(docRef);
      const now = new Date().toISOString();
      const updateData: Record<string, unknown> = {
        ...data,
        updatedAt: now,
      };
      if (data.displayName !== undefined) {
        updateData['name'] = data.displayName;
      }
      if (snap.exists()) {
        await updateDoc(docRef, updateData);
      } else {
        await setDoc(docRef, {
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
      const userDocRef = doc(this.firestore, 'users', uid);
      const userSnap = await getDoc(userDocRef);
      if (userSnap.exists()) {
        const data = userSnap.data();
        const rsvpEvents = (data?.['rsvpEvents'] as string[]) ?? [];
        rsvpEvents.forEach((id) => eventIds.add(id));
      }

      // 2. Query guests collectionGroup where uid == uid
      try {
        const guestQuery = query(
          collectionGroup(this.firestore, 'guests'),
          where('uid', '==', uid),
        );
        const guestSnaps = await getDocs(guestQuery);
        guestSnaps.forEach((guestDoc) => {
          const eventRef = guestDoc.ref?.parent?.parent;
          if (eventRef) {
            eventIds.add(eventRef.id);
          }
        });
      } catch {
        // Fallback gracefully
      }

      // Fetch details for each event
      const fetchPromises = Array.from(eventIds).map(async (eventId) => {
        try {
          const eventDocRef = doc(this.firestore, 'events', eventId);
          const eventSnap = await getDoc(eventDocRef);
          if (eventSnap.exists()) {
            return this.mapEventDoc(eventSnap);
          }
        } catch {
          return null;
        }
        return null;
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

  private mapEventDoc(snapshot: DocumentSnapshot | QueryDocumentSnapshot): PartyEvent {
    const data = snapshot.data();
    return {
      id: snapshot.id,
      title: (data?.['title'] as string) ?? '',
      category: (data?.['category'] as string) ?? '',
      description: (data?.['description'] as string) ?? '',
      date:
        data?.['date'] instanceof Timestamp
          ? data['date'].toDate().toISOString()
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
