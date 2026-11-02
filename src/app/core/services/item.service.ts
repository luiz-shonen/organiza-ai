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

  async getItems(eventId: string): Promise<PartyItem[]> {
    return this.gateway.getDocs<Omit<PartyItem, 'id'>>(this.itemsPath(eventId));
  }

  async addItem(eventId: string, data: PartyItemCreate): Promise<string> {
    const item: Record<string, unknown> = {
      name: data.name,
      quantity: data.quantity,
      claimedBy: null,
    };
    if (data.unit) item['unit'] = data.unit;
    if (data.fixedQuantity) item['fixedQuantity'] = true;
    return this.gateway.addDoc(this.itemsPath(eventId), item);
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

  /** Changes what the item is; who already claimed it stays as it was. */
  async updateItem(eventId: string, itemId: string, data: PartyItemCreate): Promise<void> {
    await this.gateway.updateDoc(`${this.itemsPath(eventId)}/${itemId}`, {
      name: data.name,
      quantity: data.quantity,
      unit: data.unit ?? null,
      fixedQuantity: data.fixedQuantity ?? false,
    });
  }

  async deleteItem(eventId: string, itemId: string): Promise<void> {
    await this.gateway.deleteDoc(`${this.itemsPath(eventId)}/${itemId}`);
  }
}
