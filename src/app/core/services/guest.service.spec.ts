import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { of } from 'rxjs';
import { GuestService } from './guest.service';
import { FirestoreGateway } from './firestore.gateway';
import { FamilyMember } from '../models';
import { createMockFirestoreGateway, MockFirestoreGateway } from '../../testing/mocks';

describe('GuestService', () => {
  let service: GuestService;
  let mockGateway: MockFirestoreGateway;

  beforeEach(() => {
    mockGateway = createMockFirestoreGateway();

    TestBed.configureTestingModule({
      providers: [
        GuestService,
        {
          provide: FirestoreGateway,
          useValue: mockGateway,
        },
      ],
    });

    service = TestBed.inject(GuestService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('saveVerifiedRsvp', () => {
    it('sets guest document in Firestore with verified fields and merge true', async () => {
      await service.saveVerifiedRsvp('evt-100', {
        uid: 'user-123',
        name: 'Carlos Silva',
        email: 'carlos@example.com',
        phone: '11999999999',
        photoUrl: 'https://photo.jpg',
      });

      expect(mockGateway.setDoc).toHaveBeenCalledWith(
        'events/evt-100/guests/user-123',
        expect.objectContaining({
          uid: 'user-123',
          name: 'Carlos Silva',
          email: 'carlos@example.com',
          phone: '11999999999',
          photoUrl: 'https://photo.jpg',
          companions: [],
          companionsCount: 0,
          isConfirmed: true,
        }),
        { merge: true },
      );
    });
  });

  describe('batchConfirmRsvp', () => {
    it('atomically creates primary guest and linked family member guest records', async () => {
      const familyMembers: FamilyMember[] = [
        {
          id: 'fam-1',
          name: 'Mariana',
          relationship: 'spouse',
          phone: '11988887777',
          createdAt: '2026-01-01T00:00:00.000Z',
        },
        {
          id: 'fam-2',
          name: 'Lucas',
          relationship: 'child',
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      ];

      await service.batchConfirmRsvp(
        'evt-100',
        {
          uid: 'user-123',
          name: 'Carlos Silva',
          email: 'carlos@example.com',
          companions: [{ name: 'Ana' }, { name: 'Bia' }],
        },
        familyMembers,
      );

      expect(mockGateway.runBatch).toHaveBeenCalled();
      expect(mockGateway.batchOps.set).toHaveBeenCalledTimes(3);
      expect(mockGateway.batchOps.set).toHaveBeenCalledWith(
        'events/evt-100/guests/user-123',
        expect.objectContaining({
          companions: [{ name: 'Ana' }, { name: 'Bia' }],
          companionsCount: 2,
        }),
        { merge: true },
      );
    });

    it('works when family members list is empty', async () => {
      await service.batchConfirmRsvp('evt-100', {
        uid: 'user-123',
        name: 'Carlos Solo',
      });

      expect(mockGateway.batchOps.set).toHaveBeenCalledTimes(1);
    });

    it('preserves a legacy count without fabricating companion names during the UI transition', async () => {
      await service.batchConfirmRsvp('evt-100', {
        uid: 'user-123',
        name: 'Carlos Solo',
        companionsCount: 2,
      });

      expect(mockGateway.batchOps.set).toHaveBeenCalledWith(
        'events/evt-100/guests/user-123',
        expect.objectContaining({
          companionsCount: 2,
        }),
        { merge: true },
      );
      expect(mockGateway.batchOps.set).not.toHaveBeenCalledWith(
        'events/evt-100/guests/user-123',
        expect.objectContaining({ companions: [{ name: expect.any(String) }] }),
        { merge: true },
      );
    });
  });

  describe('cancelRsvp', () => {
    it('atomically deletes guest document and cascades delete to linked family members', async () => {
      mockGateway.getDocs.mockResolvedValueOnce([{ id: 'user-123_fam-1' }]);
      mockGateway.getDocs.mockResolvedValueOnce([]);

      await service.cancelRsvp('evt-100', 'guest-123', 'user-123');

      expect(mockGateway.runBatch).toHaveBeenCalled();
      expect(mockGateway.batchOps.delete).toHaveBeenCalledWith('events/evt-100/guests/guest-123');
      expect(mockGateway.batchOps.delete).toHaveBeenCalledWith(
        'events/evt-100/guests/user-123_fam-1',
      );
    });

    it('atomically deletes guest document and resets all claimed items for UID', async () => {
      mockGateway.getDocs.mockResolvedValueOnce([]);
      mockGateway.getDocs.mockResolvedValueOnce([{ id: 'item-1' }, { id: 'item-2' }]);

      await service.cancelRsvp('evt-100', 'user-123');

      expect(mockGateway.batchOps.delete).toHaveBeenCalledWith('events/evt-100/guests/user-123');
      expect(mockGateway.batchOps.update).toHaveBeenCalledTimes(2);
      expect(mockGateway.batchOps.update).toHaveBeenCalledWith('events/evt-100/items/item-1', {
        claimedBy: null,
      });
      expect(mockGateway.batchOps.update).toHaveBeenCalledWith('events/evt-100/items/item-2', {
        claimedBy: null,
      });
    });

    it('rejects and rolls back if batch commit fails', async () => {
      mockGateway.runBatch.mockRejectedValue(new Error('Firestore batch error'));

      await expect(service.cancelRsvp('evt-100', 'guest-123')).rejects.toThrow(
        'Firestore batch error',
      );
    });
  });

  describe('addGuest and listGuests', () => {
    it('creates guest document and returns id', async () => {
      mockGateway.addDoc.mockResolvedValue('guest-new-id');

      const id = await service.addGuest('evt-100', {
        name: 'João',
      });

      expect(mockGateway.addDoc).toHaveBeenCalledWith(
        'events/evt-100/guests',
        expect.objectContaining({
          name: 'João',
          isConfirmed: true,
        }),
      );
      expect(id).toBe('guest-new-id');
    });

    it('lists guests subscribing to onSnapshot', () => {
      const mockGuests = [
        {
          id: 'guest-1',
          name: 'Ana',
          phone: '11988887777',
          photoUrl: 'https://photo.jpg',
          isConfirmed: true,
          confirmedAt: '2026-01-01',
          companionsCount: 1,
        },
      ];

      mockGateway.collectionSnapshot.mockReturnValue(of(mockGuests));

      let result: any = null;
      service.listGuests('evt-100').subscribe((guests) => {
        result = guests;
      });

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Ana');
    });

    it('keeps a legacy count when a stored guest has no companion names', async () => {
      mockGateway.getDocWithId.mockResolvedValue({
        id: 'legacy-guest',
        name: 'Maria',
        phone: '11999998888',
        isConfirmed: true,
        confirmedAt: '2026-01-01',
        companionsCount: 2,
      });

      const guest = await service.getGuest('evt-100', 'legacy-guest');

      expect(guest?.companions).toBeUndefined();
      expect(guest?.companionsCount).toBe(2);
    });
  });

  describe('getGuest and getGuestByPhone', () => {
    it('getGuest returns mapped guest when document exists', async () => {
      mockGateway.getDocWithId.mockResolvedValue({
        id: 'guest-1',
        name: 'Maria',
        phone: '11999998888',
        photoUrl: '',
        isConfirmed: true,
        confirmedAt: '2026-01-01',
        companionsCount: 0,
      });

      const guest = await service.getGuest('evt-100', 'guest-1');
      expect(guest).toEqual({
        id: 'guest-1',
        name: 'Maria',
        phone: '11999998888',
        photoUrl: '',
        isConfirmed: true,
        confirmedAt: '2026-01-01',
        companionsCount: 0,
      });
    });

    it('getGuest returns null when document does not exist', async () => {
      mockGateway.getDocWithId.mockResolvedValue(null);

      const guest = await service.getGuest('evt-100', 'guest-none');
      expect(guest).toBeNull();
    });

    it('getGuestByPhone returns mapped guest when match exists', async () => {
      mockGateway.getDocs.mockResolvedValue([
        {
          id: 'guest-phone-1',
          name: 'Roberto',
          phone: '11988880000',
          photoUrl: '',
          isConfirmed: true,
          confirmedAt: '2026-01-01',
          companionsCount: 1,
        },
      ]);

      const guest = await service.getGuestByPhone('evt-100', '11988880000');
      expect(guest?.name).toBe('Roberto');
    });

    it('getGuestByPhone returns null when no matching phone', async () => {
      mockGateway.getDocs.mockResolvedValue([]);

      const guest = await service.getGuestByPhone('evt-100', '0000000000');
      expect(guest).toBeNull();
    });
  });
});
