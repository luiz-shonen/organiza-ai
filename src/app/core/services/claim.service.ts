import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { FirestoreGateway } from './firestore.gateway';
import type { EventClaims, ItemClaimEntry } from '../models';

/**
 * What each household brings to an event. One document per account holder at
 * `events/{eventId}/claims/{uid}`, so only that person can change it (see firestore.rules).
 */
@Injectable({ providedIn: 'root' })
export class ClaimService {
  private readonly gateway = inject(FirestoreGateway);

  private claimsPath(eventId: string): string {
    return `events/${eventId}/claims`;
  }

  listClaims(eventId: string): Observable<EventClaims[]> {
    return this.gateway.collectionSnapshot<Omit<EventClaims, 'id'>>(this.claimsPath(eventId));
  }

  async getClaims(eventId: string, uid: string): Promise<EventClaims | null> {
    return this.gateway.getDocWithId<Omit<EventClaims, 'id'>>(`${this.claimsPath(eventId)}/${uid}`);
  }

  /** Replaces the household's entries; an empty list removes the document. */
  async saveClaims(
    eventId: string,
    uid: string,
    name: string,
    entries: readonly ItemClaimEntry[],
  ): Promise<void> {
    const path = `${this.claimsPath(eventId)}/${uid}`;
    if (entries.length === 0) {
      await this.gateway.deleteDoc(path);
      return;
    }
    await this.gateway.setDoc(path, {
      name,
      entries: entries.map((entry) => ({ ...entry })),
      updatedAt: new Date().toISOString(),
    });
  }
}
