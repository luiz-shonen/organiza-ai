import { TestBed } from '@angular/core/testing';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { GuestService } from './guest.service';
import { FirebaseService } from './firebase.service';
import { FamilyMember } from '../models';
const { firestoreMocks } = vi.hoisted(() => {
  const batch = {
    set: vi.fn(),
    delete: vi.fn(),
    update: vi.fn(),
    commit: vi.fn().mockResolvedValue(undefined),
  };

  class MockTimestamp {
    constructor(public seconds: number, public nanoseconds: number) {}
    toDate() {
      return new Date(this.seconds * 1000);
    }
  }

  const mocks = {
    batch,
    collection: vi.fn(),
    collectionGroup: vi.fn(),
    doc: vi.fn(),
    addDoc: vi.fn(),
    setDoc: vi.fn(),
    updateDoc: vi.fn(),
    deleteDoc: vi.fn(),
    getDoc: vi.fn(),
    getDocs: vi.fn(),
    onSnapshot: vi.fn(),
    orderBy: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    limit: vi.fn(),
    writeBatch: vi.fn(() => batch),
    arrayUnion: vi.fn((...args: unknown[]) => ({ _type: 'arrayUnion', args })),
    arrayRemove: vi.fn((...args: unknown[]) => ({ _type: 'arrayRemove', args })),
    serverTimestamp: vi.fn(),
    Timestamp: MockTimestamp,
  };

  return { firestoreMocks: mocks };
});

vi.mock('firebase/firestore', () => ({
  initializeFirestore: vi.fn(),
  getFirestore: vi.fn(),
  collection: (...args: any[]) => (firestoreMocks.collection as any)(...args),
  collectionGroup: (...args: any[]) => (firestoreMocks.collectionGroup as any)(...args),
  doc: (...args: any[]) => (firestoreMocks.doc as any)(...args),
  addDoc: (...args: any[]) => (firestoreMocks.addDoc as any)(...args),
  setDoc: (...args: any[]) => (firestoreMocks.setDoc as any)(...args),
  getDoc: (...args: any[]) => (firestoreMocks.getDoc as any)(...args),
  updateDoc: (...args: any[]) => (firestoreMocks.updateDoc as any)(...args),
  deleteDoc: (...args: any[]) => (firestoreMocks.deleteDoc as any)(...args),
  onSnapshot: (...args: any[]) => (firestoreMocks.onSnapshot as any)(...args),
  orderBy: (...args: any[]) => (firestoreMocks.orderBy as any)(...args),
  query: (...args: any[]) => (firestoreMocks.query as any)(...args),
  where: (...args: any[]) => (firestoreMocks.where as any)(...args),
  limit: (...args: any[]) => (firestoreMocks.limit as any)(...args),
  getDocs: (...args: any[]) => (firestoreMocks.getDocs as any)(...args),
  writeBatch: (...args: any[]) => (firestoreMocks.writeBatch as any)(...args),
  arrayUnion: (...args: any[]) => (firestoreMocks.arrayUnion as any)(...args),
  arrayRemove: (...args: any[]) => (firestoreMocks.arrayRemove as any)(...args),
  serverTimestamp: (...args: any[]) => (firestoreMocks.serverTimestamp as any)(...args),
  Timestamp: firestoreMocks.Timestamp,
}));

vi.mock('@firebase/firestore', () => ({
  initializeFirestore: vi.fn(),
  getFirestore: vi.fn(),
  collection: (...args: any[]) => (firestoreMocks.collection as any)(...args),
  collectionGroup: (...args: any[]) => (firestoreMocks.collectionGroup as any)(...args),
  doc: (...args: any[]) => (firestoreMocks.doc as any)(...args),
  addDoc: (...args: any[]) => (firestoreMocks.addDoc as any)(...args),
  setDoc: (...args: any[]) => (firestoreMocks.setDoc as any)(...args),
  getDoc: (...args: any[]) => (firestoreMocks.getDoc as any)(...args),
  updateDoc: (...args: any[]) => (firestoreMocks.updateDoc as any)(...args),
  deleteDoc: (...args: any[]) => (firestoreMocks.deleteDoc as any)(...args),
  onSnapshot: (...args: any[]) => (firestoreMocks.onSnapshot as any)(...args),
  orderBy: (...args: any[]) => (firestoreMocks.orderBy as any)(...args),
  query: (...args: any[]) => (firestoreMocks.query as any)(...args),
  where: (...args: any[]) => (firestoreMocks.where as any)(...args),
  limit: (...args: any[]) => (firestoreMocks.limit as any)(...args),
  getDocs: (...args: any[]) => (firestoreMocks.getDocs as any)(...args),
  writeBatch: (...args: any[]) => (firestoreMocks.writeBatch as any)(...args),
  arrayUnion: (...args: any[]) => (firestoreMocks.arrayUnion as any)(...args),
  arrayRemove: (...args: any[]) => (firestoreMocks.arrayRemove as any)(...args),
  serverTimestamp: (...args: any[]) => (firestoreMocks.serverTimestamp as any)(...args),
  Timestamp: firestoreMocks.Timestamp,
}));

describe('GuestService', () => {
  let service: GuestService;
  const mockFirestore = {} as any;

  beforeEach(() => {
    vi.clearAllMocks();

    firestoreMocks.batch.set.mockReset();
    firestoreMocks.batch.delete.mockReset();
    firestoreMocks.batch.update.mockReset();
    firestoreMocks.batch.commit.mockReset().mockResolvedValue(undefined);

    firestoreMocks.doc.mockReturnValue('guest-doc-ref' as any);
    firestoreMocks.collection.mockReturnValue('guests-col-ref' as any);
    firestoreMocks.writeBatch.mockReturnValue(firestoreMocks.batch as any);
    firestoreMocks.getDocs.mockResolvedValue({ docs: [], forEach: vi.fn() } as any);

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
      firestoreMocks.doc.mockReturnValue('guest-doc-ref' as any);
      firestoreMocks.setDoc.mockResolvedValue(undefined as any);

      await service.saveVerifiedRsvp('evt-100', {
        uid: 'user-123',
        name: 'Maria Silva',
        email: 'maria@example.com',
        phone: '11999998888',
        photoUrl: 'https://example.com/photo.jpg',
      });

      expect(firestoreMocks.doc).toHaveBeenCalledWith(mockFirestore, 'events', 'evt-100', 'guests', 'user-123');
      expect(firestoreMocks.setDoc).toHaveBeenCalledWith(
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
      firestoreMocks.doc.mockReturnValue('guest-doc-ref' as any);

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

      expect(firestoreMocks.writeBatch).toHaveBeenCalledWith(mockFirestore);
      expect(firestoreMocks.batch.set).toHaveBeenCalledTimes(3);

      expect(firestoreMocks.batch.set).toHaveBeenCalledWith(
        'guest-doc-ref',
        expect.objectContaining({
          uid: 'user-123',
          name: 'Carlos Silva',
          email: 'carlos@example.com',
          isConfirmed: true,
        }),
        { merge: true },
      );

      expect(firestoreMocks.batch.set).toHaveBeenCalledWith(
        'guest-doc-ref',
        expect.objectContaining({
          id: 'user-123_fam-1',
          name: 'Lucas Silva',
          primaryGuestId: 'user-123',
          isConfirmed: true,
        }),
        { merge: true },
      );

      expect(firestoreMocks.batch.set).toHaveBeenCalledWith(
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

      expect(firestoreMocks.batch.commit).toHaveBeenCalled();
    });

    it('works when family members list is empty', async () => {
      firestoreMocks.doc.mockReturnValue('primary-doc-ref' as any);

      await service.batchConfirmRsvp('evt-100', {
        uid: 'user-123',
        name: 'Carlos Silva',
      });

      expect(firestoreMocks.batch.set).toHaveBeenCalledTimes(1);
      expect(firestoreMocks.batch.commit).toHaveBeenCalled();
    });
  });

  describe('cancelRsvp', () => {
    it('atomically deletes guest document and cascades delete to linked family members', async () => {
      firestoreMocks.doc.mockReturnValue('guest-doc-ref' as any);
      firestoreMocks.collection.mockReturnValue('collection-ref' as any);

      const mockFamDoc1 = { ref: 'fam-doc-1' };
      const mockFamDoc2 = { ref: 'fam-doc-2' };

      firestoreMocks.getDocs.mockResolvedValueOnce({
        forEach: (cb: any) => [mockFamDoc1, mockFamDoc2].forEach(cb),
      } as any).mockResolvedValueOnce({
        forEach: vi.fn(),
      } as any);

      await service.cancelRsvp('evt-100', 'guest-123', 'user-123');

      expect(firestoreMocks.writeBatch).toHaveBeenCalledWith(mockFirestore);
      expect(firestoreMocks.batch.delete).toHaveBeenCalledWith('guest-doc-ref');
      expect(firestoreMocks.batch.delete).toHaveBeenCalledWith('fam-doc-1');
      expect(firestoreMocks.batch.delete).toHaveBeenCalledWith('fam-doc-2');
      expect(firestoreMocks.batch.commit).toHaveBeenCalled();
    });

    it('atomically deletes guest document and resets all claimed items for UID', async () => {
      firestoreMocks.doc.mockReturnValue('guest-doc-ref' as any);
      firestoreMocks.collection.mockReturnValue('items-collection-ref' as any);

      const mockItem1Ref = { id: 'item-1' };
      const mockItem2Ref = { id: 'item-2' };
      const itemDocs = [
        { ref: mockItem1Ref, data: () => ({ name: 'Carvão' }) },
        { ref: mockItem2Ref, data: () => ({ name: 'Gelo' }) },
      ];

      firestoreMocks.getDocs.mockResolvedValueOnce({
        forEach: vi.fn(),
      } as any).mockResolvedValueOnce({
        forEach: (callback: any) => itemDocs.forEach(callback),
      } as any);

      await service.cancelRsvp('evt-100', 'user-123');

      expect(firestoreMocks.batch.delete).toHaveBeenCalledWith('guest-doc-ref');
      expect(firestoreMocks.batch.update).toHaveBeenCalledTimes(2);
      expect(firestoreMocks.batch.update).toHaveBeenCalledWith(mockItem1Ref, { claimedBy: null });
      expect(firestoreMocks.batch.update).toHaveBeenCalledWith(mockItem2Ref, { claimedBy: null });
      expect(firestoreMocks.batch.commit).toHaveBeenCalled();
    });

    it('rejects and rolls back if batch commit fails', async () => {
      firestoreMocks.doc.mockReturnValue('guest-doc-ref' as any);
      firestoreMocks.collection.mockReturnValue('items-collection-ref' as any);
      firestoreMocks.getDocs.mockResolvedValue({
        forEach: vi.fn(),
      } as any);
      firestoreMocks.batch.commit.mockRejectedValue(new Error('Firestore batch error'));

      await expect(service.cancelRsvp('evt-100', 'guest-123')).rejects.toThrow(
        'Firestore batch error',
      );
    });
  });

  describe('addGuest and listGuests', () => {
    it('creates guest document and returns id', async () => {
      firestoreMocks.addDoc.mockResolvedValue({ id: 'guest-new-id' } as any);

      const id = await service.addGuest('evt-100', {
        name: 'João',
      });

      expect(id).toBe('guest-new-id');
      expect(firestoreMocks.addDoc).toHaveBeenCalled();
    });

    it('lists guests subscribing to onSnapshot', () => {
      firestoreMocks.onSnapshot.mockImplementation((_query: any, next: any) => {
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
