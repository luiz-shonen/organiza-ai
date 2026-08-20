import { Injectable, inject } from '@angular/core';
import {
  collection,
  doc,
  getDocs,
  addDoc,
  deleteDoc,
  orderBy,
  query,
  Timestamp,
} from 'firebase/firestore';
import { FirebaseService } from './firebase.service';
import { FamilyMember, FamilyMemberCreate } from '../models';

@Injectable({ providedIn: 'root' })
export class FamilyService {
  private readonly firestore = inject(FirebaseService).firestore;

  private familyCollection(uid: string) {
    return collection(this.firestore, 'users', uid, 'family');
  }

  async getFamilyMembers(uid: string): Promise<FamilyMember[]> {
    if (!uid) return [];
    try {
      const q = query(this.familyCollection(uid), orderBy('createdAt', 'asc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          name: (data?.['name'] as string) ?? '',
          relationship: data?.['relationship'] ?? 'other',
          phone: (data?.['phone'] as string | undefined) ?? undefined,
          createdAt:
            data?.['createdAt'] instanceof Timestamp
              ? data['createdAt'].toDate().toISOString()
              : ((data?.['createdAt'] as string) ?? ''),
        };
      });
    } catch (err) {
      console.error('Error fetching family members:', err);
      return [];
    }
  }

  async addFamilyMember(uid: string, member: FamilyMemberCreate): Promise<FamilyMember> {
    if (!uid) throw new Error('User ID is required');
    const now = new Date().toISOString();
    const docData = {
      name: member.name,
      relationship: member.relationship,
      phone: member.phone || '',
      createdAt: member.createdAt || now,
    };
    const docRef = await addDoc(this.familyCollection(uid), docData);
    return {
      id: docRef.id,
      ...docData,
    };
  }

  async deleteFamilyMember(uid: string, memberId: string): Promise<void> {
    if (!uid || !memberId) return;
    const docRef = doc(this.firestore, 'users', uid, 'family', memberId);
    await deleteDoc(docRef);
  }
}
