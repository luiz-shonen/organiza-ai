import { Injectable, inject } from '@angular/core';
import { FirestoreGateway } from './firestore.gateway';
import { FamilyMember, FamilyMemberCreate } from '../models';

@Injectable({ providedIn: 'root' })
export class FamilyService {
  private readonly gateway = inject(FirestoreGateway);

  private familyPath(uid: string) {
    return `users/${uid}/family`;
  }

  async getFamilyMembers(uid: string): Promise<FamilyMember[]> {
    if (!uid) return [];
    try {
      const docs = await this.gateway.getDocs<Omit<FamilyMember, 'id'>>(
        this.familyPath(uid),
        this.gateway.orderBy('createdAt', 'asc'),
      );
      return docs.map((data) => {
        const createdAtDate = this.gateway.timestampToDate(data.createdAt);
        return {
          id: data.id,
          name: data.name ?? '',
          relationship: data.relationship ?? 'other',
          phone: data.phone ?? undefined,
          createdAt: createdAtDate
            ? createdAtDate.toISOString()
            : ((data.createdAt as unknown as string) ?? ''),
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
    const id = await this.gateway.addDoc(this.familyPath(uid), docData);
    return {
      id,
      ...docData,
    };
  }

  async deleteFamilyMember(uid: string, memberId: string): Promise<void> {
    if (!uid || !memberId) return;
    await this.gateway.deleteDoc(`${this.familyPath(uid)}/${memberId}`);
  }
}
