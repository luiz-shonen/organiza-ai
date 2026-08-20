import { TestBed } from '@angular/core/testing';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { of } from 'rxjs';
import { ItemService } from './item.service';
import { FirestoreGateway } from './firestore.gateway';
import { AuthService } from './auth.service';
import { createMockFirestoreGateway, MockFirestoreGateway } from '../../testing/mocks';

describe('ItemService', () => {
  let service: ItemService;
  let mockGateway: MockFirestoreGateway;
  let mockAuthService: { currentUser: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockGateway = createMockFirestoreGateway();
    mockAuthService = {
      currentUser: vi.fn().mockReturnValue({ uid: 'user-123' }),
    };

    TestBed.configureTestingModule({
      providers: [
        ItemService,
        { provide: FirestoreGateway, useValue: mockGateway },
        { provide: AuthService, useValue: mockAuthService },
      ],
    });

    service = TestBed.inject(ItemService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('listItems delegates to collectionSnapshot', () => {
    const mockItems = [{ id: 'item-1', name: 'Bolo', quantity: 1, claimedBy: null }];
    mockGateway.collectionSnapshot.mockReturnValue(of(mockItems));

    let emitted: any[] = [];
    service.listItems('evt-100').subscribe((items) => {
      emitted = items;
    });

    expect(mockGateway.collectionSnapshot).toHaveBeenCalledWith('events/evt-100/items', expect.anything());
    expect(emitted).toEqual(mockItems);
  });

  it('addItem adds item document with claimedBy null', async () => {
    mockGateway.addDoc.mockResolvedValue('new-item-id');

    const id = await service.addItem('evt-100', {
      name: 'Refrigerante',
      quantity: 5,
    });

    expect(mockGateway.addDoc).toHaveBeenCalledWith('events/evt-100/items', {
      name: 'Refrigerante',
      quantity: 5,
      claimedBy: null,
    });
    expect(id).toBe('new-item-id');
  });

  it('claimItem updates item document with claimedBy and current user uid', async () => {
    await service.claimItem('evt-100', 'item-1', {
      name: 'Mariana',
      phone: '11988887777',
    });

    expect(mockGateway.updateDoc).toHaveBeenCalledWith('events/evt-100/items/item-1', {
      claimedBy: {
        name: 'Mariana',
        phone: '11988887777',
        uid: 'user-123',
      },
    });
  });

  it('claimItem sets empty uid if no current user is logged in', async () => {
    mockAuthService.currentUser.mockReturnValue(null);

    await service.claimItem('evt-100', 'item-1', {
      name: 'Guest User',
      phone: '11900000000',
    });

    expect(mockGateway.updateDoc).toHaveBeenCalledWith('events/evt-100/items/item-1', {
      claimedBy: {
        name: 'Guest User',
        phone: '11900000000',
        uid: '',
      },
    });
  });

  it('unclaimItem sets claimedBy to null', async () => {
    await service.unclaimItem('evt-100', 'item-1');

    expect(mockGateway.updateDoc).toHaveBeenCalledWith('events/evt-100/items/item-1', {
      claimedBy: null,
    });
  });

  it('deleteItem deletes the item document', async () => {
    await service.deleteItem('evt-100', 'item-1');

    expect(mockGateway.deleteDoc).toHaveBeenCalledWith('events/evt-100/items/item-1');
  });
});
