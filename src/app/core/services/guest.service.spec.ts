import { TestBed } from '@angular/core/testing';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { GuestService } from './guest.service';
import { FirebaseService } from './firebase.service';
import { FamilyMember } from '../models';
const mocks = vi.hoisted(() => {
  const mockBatch = {
    set: vi.fn(),
    delete: vi.fn(),
    update: vi.fn(),
    commit: vi.fn().mockResolvedValue(undefined),
  };

  return {
    mockBatch,
    mockCollection: vi.fn(),
    mockCollectionGroup: vi.fn(),
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
    mockWriteBatch: vi.fn(() => mockBatch),
    mockArrayUnion: vi.fn((...args: unknown[]) => ({ _type: 'arrayUnion', args })),
    mockArrayRemove: vi.fn((...args: unknown[]) => ({ _type: 'arrayRemove', args })),
    serverTimestamp: vi.fn(),
    Timestamp: class Timestamp {
      constructor(public seconds: number, public nanoseconds: number) {}
      toDate() {
        return new Date(this.seconds * 1000);
      }
    },
  };
});

vi.mock('firebase/firestore', () => ({
  initializeFirestore: vi.fn(),
  collection: mocks.mockCollection,
  collectionGroup: mocks.mockCollectionGroup,
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
  arrayUnion: mocks.mockArrayUnion,
  arrayRemove: mocks.mockArrayRemove,
  serverTimestamp: vi.fn(),
  Timestamp: mocks.Timestamp,
}));

describe('GuestService', () => {
  let service: GuestService;
  const mockFirestore = {} as any;

  beforeEach(() => {
    vi.clearAllMocks();

    mocks.mockBatch.set.mockReset();
    mocks.mockBatch.delete.mockReset();
    mocks.mockBatch.update.mockReset();
    mocks.mockBatch.commit.mockReset().mockResolvedValue(undefined);

    mocks.mockDoc.mockReturnValue('guest-doc-ref' as any);
    mocks.mockCollection.mockReturnValue('guests-col-ref' as any);
    mocks.mockWriteBatch.mockReturnValue(mocks.mockBatch);
    mocks.mockGetDocs.mockResolvedValue({ docs: [], forEach: vi.fn() } as any);

    TestBed.configureTestingModule({
      providers: [
        GuestService,
        {
          provide: FirebaseService,
          useValue: {
            firestore: mockFirestore,
          },
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
      mocks.mockSetDoc.mockResolvedValue(undefined as any);

      await service.saveVerifiedRsvp('evt-100', {
        uid: 'user-123',
        name: 'Maria Silva',
        email: 'maria@example.com',
        phone: '11999998888',
        photoUrl: 'https://example.com/photo.jpg',
      });

      expect(mocks.mockDoc).toHaveBeenCalledWith(mockFirestore, 'events', 'evt-100', 'guests', 'user-123');
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

      expect(mocks.mockWriteBatch).toHaveBeenCalledWith(mockFirestore);
      expect(mocks.mockBatch.set).toHaveBeenCalledTimes(3);

      expect(mocks.mockBatch.set).toHaveBeenCalledWith(
        'guest-doc-ref',
        expect.objectContaining({
          uid: 'user-123',
          name: 'Carlos Silva',
          email: 'carlos@example.com',
          isConfirmed: true,
        }),
        { merge: true },
      );

      expect(mocks.mockBatch.set).toHaveBeenCalledWith(
        'guest-doc-ref',
        expect.objectContaining({
          id: 'user-123_fam-1',
          name: 'Lucas Silva',
          primaryGuestId: 'user-123',
          isConfirmed: true,
        }),
        { merge: true },
      );

      expect(mocks.mockBatch.set).toHaveBeenCalledWith(
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

      expect(mocks.mockBatch.commit).toHaveBeenCalled();
    });

    it('works when family members list is empty', async () => {
      mocks.mockDoc.mockReturnValue('primary-doc-ref' as any);

      await service.batchConfirmRsvp('evt-100', {
        uid: 'user-123',
        name: 'Carlos Silva',
      });

      expect(mocks.mockBatch.set).toHaveBeenCalledTimes(1);
      expect(mocks.mockBatch.commit).toHaveBeenCalled();
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
      } as any).mockResolvedValueOnce({
        forEach: vi.fn(),
      } as any);

      await service.cancelRsvp('evt-100', 'guest-123', 'user-123');

      expect(mocks.mockWriteBatch).toHaveBeenCalledWith(mockFirestore);
      expect(mocks.mockBatch.delete).toHaveBeenCalledWith('guest-doc-ref');
      expect(mocks.mockBatch.delete).toHaveBeenCalledWith('fam-doc-1');
      expect(mocks.mockBatch.delete).toHaveBeenCalledWith('fam-doc-2');
      expect(mocks.mockBatch.commit).toHaveBeenCalled();
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
      } as any).mockResolvedValueOnce({
        forEach: (callback: any) => itemDocs.forEach(callback),
      } as any);

      await service.cancelRsvp('evt-100', 'user-123');

      expect(mocks.mockBatch.delete).toHaveBeenCalledWith('guest-doc-ref');
      expect(mocks.mockBatch.update).toHaveBeenCalledTimes(2);
      expect(mocks.mockBatch.update).toHaveBeenCalledWith(mockItem1Ref, { claimedBy: null });
      expect(mocks.mockBatch.update).toHaveBeenCalledWith(mockItem2Ref, { claimedBy: null });
      expect(mocks.mockBatch.commit).toHaveBeenCalled();
    });

    it('rejects and rolls back if batch commit fails', async () => {
      mocks.mockDoc.mockReturnValue('guest-doc-ref' as any);
      mocks.mockCollection.mockReturnValue('items-collection-ref' as any);
      mocks.mockGetDocs.mockResolvedValue({
        forEach: vi.fn(),
      } as any);
      mocks.mockBatch.commit.mockRejectedValue(new Error('Firestore batch error'));

      await expect(service.cancelRsvp('evt-100', 'guest-123')).rejects.toThrow(
        'Firestore batch error',
      );
    });
  });

  describe('addGuest and listGuests', () => {
    it('creates guest document and returns id', async () => {
      mocks.mockAddDoc.mockResolvedValue({ id: 'guest-new-id' } as any);

      const id = await service.addGuest('evt-100', {
        name: 'João',
      });

      expect(id).toBe('guest-new-id');
      expect(mocks.mockAddDoc).toHaveBeenCalled();
    });

    it('lists guests subscribing to onSnapshot', () => {
      mocks.mockOnSnapshot.mockImplementation((_query: any, next: any) => {
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
