import { Injectable, inject } from '@angular/core';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { FirebaseService } from './firebase.service';
import { UserProfile } from '../models';
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
        return snap.data() as UserProfile;
      }
      return null;
    } catch {
      return null;
    }
  }

  async upsertProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
    if (!uid) return;
    try {
      const docRef = doc(this.firestore, 'users', uid);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        await updateDoc(docRef, data);
      } else {
        await setDoc(docRef, { ...data, createdAt: serverTimestamp() });
      }
    } catch (err) {
      console.error('Error upserting profile:', err);
    }
  }

  async updateThemePreference(uid: string, themePref: ThemeMode): Promise<void> {
    await this.upsertProfile(uid, { themePref });
  }
}
