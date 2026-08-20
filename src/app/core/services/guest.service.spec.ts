import { TestBed } from '@angular/core/testing';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { GuestService } from './guest.service';
import { FirebaseService } from './firebase.service';
import { AuthService } from './auth.service';
import { FamilyMember } from '../models';

const mocks = vi.hoisted(() => ({
  mockCollection: vi.fn(),
  mockDoc: vi.fn(),
  mockAddDoc: vi.fn(),
  mockSetDoc: vi.fn(),
  mockGetDoc: vi.fn(),
  mockUpdateDoc: vi.fn(),
  mockDeleteDoc: vi.fn(),
  mockOnSnapshot: vi.fn(),
  mockOrderBy: vi.fn(),
  mockQuery: vi.fn(),
  mockWhere: vi.fn(),
  mockLimit: vi.fn(),
  mockGetDocs: vi.fn(),
  mockWriteBatch: vi.fn(),
  mockBatchSet: vi.fn(),
  mockBatchDelete: vi.fn(),
  mockBatchUpdate: vi.fn(),
  mockBatchCommit: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  collection: mocks.mockCollection,
  doc: mocks.mockDoc,
  addDoc: mocks.mockAddDoc,
  setDoc: mocks.mockSetDoc,
  getDoc: mocks.mockGetDoc,
  updateDoc: mocks.mockUpdateDoc,
  deleteDoc: mocks.mockDeleteDoc,
  onSnapshot: mocks.mockOnSnapshot,
  orderBy: mocks.mockOrderBy,
  query: mocks.mockQuery,
  where: mocks.mockWhere,
  limit: mocks.mockLimit,
  getDocs: mocks.mockGetDocs,
  writeBatch: mocks.mockWriteBatch,
  serverTimestamp: vi.fn(),
}));

describe('GuestService', () => {
  let service: GuestService;
  let mockAuthService: {
    currentUser: ReturnType<typeof vi.fn>;
  };

  const mockBatch = {
    set: mocks.mockBatchSet,
    delete: mocks.mockBatchDelete,
    update: mocks.mockBatchUpdate,
    commit: mocks.mockBatchCommit,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mocks.mockWriteBatch.mockReturnValue(mockBatch);
    mockBatch.commit.mockResolvedValue(undefined);

    mockAuthService = {
      currentUser: vi.fn().mockReturnValue({ uid: 'user-123', email: 'guest@example.com' }),
    };

    TestBed.configureTestingModule({
      providers: [
        GuestService,
        {
          provide: FirebaseService,
          useValue: {
            firestore: {} as any,
          },
        },
        {
          provide: AuthService,
          useValue: mockAuthService,
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
      mocks.mockDoc.mockReturnValue('guest-doc-ref' as any);
      mocks.mockSetDoc.mockResolvedValue(undefined);

      await service.saveVerifiedRsvp('evt-100', {
        uid: 'user-123',
        name: 'Maria Silva',
        email: 'maria@example.com',
        phone: '11999998888',
        photoUrl: 'https://example.com/photo.jpg',
      });

      expect(mocks.mockDoc).toHaveBeenCalled();
      expect(mocks.mockSetDoc).toHaveBeenCalledWith(
        'guest-doc-ref',
        expect.objectContaining({
          uid: 'user-123',
          name: 'Maria Silva',
          email: 'maria@example.com',
          phone: '11999998888',
          photoUrl: 'https://example.com/photo.jpg',
          isConfirmed: true,
        }),
        { merge: true },
      );
    });
  });

  describe('batchConfirmRsvp', () => {
    it('atomically creates primary guest and linked family member guest records', async () => {
      mocks.mockDoc.mockReturnValue('guest-doc-ref' as any);

      const familyMembers: FamilyMember[] = [
        {
          id: 'fam-1',
          name: 'Lucas Silva',
          relationship: 'child',
          createdAt: '2026-08-10T10:00:00.000Z',
        },
        {
          id: 'fam-2',
          name: 'Mariana Silva',
          relationship: 'spouse',
          phone: '11977776666',
          createdAt: '2026-08-11T10:00:00.000Z',
        },
      ];

      await service.batchConfirmRsvp(
        'evt-100',
        {
          uid: 'user-123',
          name: 'Carlos Silva',
          email: 'carlos@example.com',
          phone: '11999998888',
          photoUrl: 'https://example.com/carlos.jpg',
        },
        familyMembers,
      );

      expect(mocks.mockWriteBatch).toHaveBeenCalled();
      expect(mocks.mockBatchSet).toHaveBeenCalledTimes(3);

      expect(mocks.mockBatchSet).toHaveBeenCalledWith(
        'guest-doc-ref',
        expect.objectContaining({
          uid: 'user-123',
          name: 'Carlos Silva',
          email: 'carlos@example.com',
          isConfirmed: true,
        }),
        { merge: true },
      );

      expect(mocks.mockBatchSet).toHaveBeenCalledWith(
        'guest-doc-ref',
        expect.objectContaining({
          id: 'user-123_fam-1',
          name: 'Lucas Silva',
          primaryGuestId: 'user-123',
          isConfirmed: true,
        }),
        { merge: true },
      );

      expect(mocks.mockBatchSet).toHaveBeenCalledWith(
        'guest-doc-ref',
        expect.objectContaining({
          id: 'user-123_fam-2',
          name: 'Mariana Silva',
          primaryGuestId: 'user-123',
          phone: '11977776666',
          isConfirmed: true,
        }),
        { merge: true },
      );

      expect(mockBatch.commit).toHaveBeenCalled();
    });

    it('works when family members list is empty', async () => {
      mocks.mockDoc.mockReturnValue('primary-doc-ref' as any);

      await service.batchConfirmRsvp('evt-100', {
        uid: 'user-123',
        name: 'Carlos Silva',
      });

      expect(mocks.mockBatchSet).toHaveBeenCalledTimes(1);
      expect(mockBatch.commit).toHaveBeenCalled();
    });
  });

  describe('cancelRsvp', () => {
    it('atomically deletes guest document and cascades delete to linked family members', async () => {
      mocks.mockDoc.mockReturnValue('guest-doc-ref' as any);
      mocks.mockCollection.mockReturnValue('collection-ref' as any);

      const mockFamDoc1 = { ref: 'fam-doc-1' };
      const mockFamDoc2 = { ref: 'fam-doc-2' };

      mocks.mockGetDocs.mockResolvedValueOnce({
        forEach: (cb: any) => [mockFamDoc1, mockFamDoc2].forEach(cb),
      }).mockResolvedValueOnce({
        forEach: vi.fn(),
      });

      await service.cancelRsvp('evt-100', 'guest-123', 'user-123');

      expect(mocks.mockWriteBatch).toHaveBeenCalled();
      expect(mocks.mockBatchDelete).toHaveBeenCalledWith('guest-doc-ref');
      expect(mocks.mockBatchDelete).toHaveBeenCalledWith('fam-doc-1');
      expect(mocks.mockBatchDelete).toHaveBeenCalledWith('fam-doc-2');
      expect(mockBatch.commit).toHaveBeenCalled();
    });

    it('atomically deletes guest document and resets all claimed items for UID', async () => {
      mocks.mockDoc.mockReturnValue('guest-doc-ref' as any);
      mocks.mockCollection.mockReturnValue('items-collection-ref' as any);

      const mockItem1Ref = { id: 'item-1' };
      const mockItem2Ref = { id: 'item-2' };
      const itemDocs = [
        { ref: mockItem1Ref, data: () => ({ name: 'Carvão' }) },
        { ref: mockItem2Ref, data: () => ({ name: 'Gelo' }) },
      ];

      mocks.mockGetDocs.mockResolvedValueOnce({
        forEach: vi.fn(),
      }).mockResolvedValueOnce({
        forEach: (callback: any) => itemDocs.forEach(callback),
      });

      await service.cancelRsvp('evt-100', 'user-123');

      expect(mocks.mockBatchDelete).toHaveBeenCalledWith('guest-doc-ref');
      expect(mocks.mockBatchUpdate).toHaveBeenCalledTimes(2);
      expect(mocks.mockBatchUpdate).toHaveBeenCalledWith(mockItem1Ref, { claimedBy: null });
      expect(mocks.mockBatchUpdate).toHaveBeenCalledWith(mockItem2Ref, { claimedBy: null });
      expect(mockBatch.commit).toHaveBeenCalled();
    });

    it('rejects and rolls back if batch commit fails', async () => {
      mocks.mockDoc.mockReturnValue('guest-doc-ref' as any);
      mocks.mockCollection.mockReturnValue('items-collection-ref' as any);
      mocks.mockGetDocs.mockResolvedValue({
        forEach: vi.fn(),
      });
      mockBatch.commit.mockRejectedValue(new Error('Firestore batch error'));

      await expect(service.cancelRsvp('evt-100', 'guest-123')).rejects.toThrow(
        'Firestore batch error',
      );
    });
  });

  describe('addGuest and listGuests', () => {
    it('creates guest document and returns id', async () => {
      mocks.mockAddDoc.mockResolvedValue({ id: 'guest-new-id' });

      const id = await service.addGuest('evt-100', {
        name: 'João',
      });

      expect(id).toBe('guest-new-id');
      expect(mocks.mockAddDoc).toHaveBeenCalled();
    });

    it('lists guests subscribing to onSnapshot', () => {
      mocks.mockOnSnapshot.mockImplementation((_query, next) => {
        next({
          docs: [
            {
              id: 'g-1',
              data: () => ({
                name: 'Ana',
                isConfirmed: true,
                confirmedAt: '2026-08-19T00:00:00.000Z',
              }),
            },
          ],
        });
        return () => {};
      });

      let result: any;
      service.listGuests('evt-100').subscribe((guests) => {
        result = guests;
      });

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Ana');
    });
  });
});
