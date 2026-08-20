import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { FirestoreGateway } from './firestore.gateway';
import { AuthService } from './auth.service';
import { PartyItem, PartyItemCreate, ClaimedBy } from '../models';

@Injectable({ providedIn: 'root' })
export class ItemService {
  private readonly gateway = inject(FirestoreGateway);
  private readonly authService = inject(AuthService);

  private itemsPath(eventId: string) {
    return `events/${eventId}/items`;
  }

  listItems(eventId: string): Observable<PartyItem[]> {
    return this.gateway.collectionSnapshot<Omit<PartyItem, 'id'>>(
      this.itemsPath(eventId),
      this.gateway.orderBy('name', 'asc'),
    );
  }

  async addItem(eventId: string, data: PartyItemCreate): Promise<string> {
    return this.gateway.addDoc(this.itemsPath(eventId), {
      ...data,
      claimedBy: null,
    });
  }

  async claimItem(
    eventId: string,
    itemId: string,
    claimedBy: Omit<ClaimedBy, 'uid'>,
  ): Promise<void> {
    const user = this.authService.currentUser();
    await this.gateway.updateDoc(`${this.itemsPath(eventId)}/${itemId}`, {
      claimedBy: { ...claimedBy, uid: user ? user.uid : '' },
    });
  }

  async unclaimItem(eventId: string, itemId: string): Promise<void> {
    await this.gateway.updateDoc(`${this.itemsPath(eventId)}/${itemId}`, {
      claimedBy: null,
    });
  }

  async deleteItem(eventId: string, itemId: string): Promise<void> {
    await this.gateway.deleteDoc(`${this.itemsPath(eventId)}/${itemId}`);
  }
}
