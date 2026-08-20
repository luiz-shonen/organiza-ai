import { TestBed } from '@angular/core/testing';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { UserService } from './user.service';
import { FirebaseService } from './firebase.service';
import { FamilyService } from './family.service';

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

describe('UserService', () => {
  let service: UserService;
  let mockFamilyService: {
    getFamilyMembers: ReturnType<typeof vi.fn>;
    addFamilyMember: ReturnType<typeof vi.fn>;
    deleteFamilyMember: ReturnType<typeof vi.fn>;
  };
  const mockFirestore = {} as any;

  beforeEach(() => {
    vi.clearAllMocks();

    firestoreMocks.doc.mockReturnValue('doc-ref' as any);
    firestoreMocks.collection.mockReturnValue('col-ref' as any);
    firestoreMocks.collectionGroup.mockReturnValue('col-group-ref' as any);
    firestoreMocks.getDoc.mockResolvedValue({ exists: () => false } as any);
    firestoreMocks.getDocs.mockResolvedValue({ docs: [], forEach: vi.fn() } as any);
    firestoreMocks.setDoc.mockResolvedValue(undefined as any);
    firestoreMocks.updateDoc.mockResolvedValue(undefined as any);
    firestoreMocks.deleteDoc.mockResolvedValue(undefined as any);
    firestoreMocks.query.mockReturnValue('query-ref' as any);
    firestoreMocks.where.mockReturnValue('where-ref' as any);
    firestoreMocks.orderBy.mockReturnValue('order-ref' as any);

    mockFamilyService = {
      getFamilyMembers: vi.fn().mockResolvedValue([]),
      addFamilyMember: vi.fn().mockResolvedValue({ id: 'f1', name: 'Test', relationship: 'other', createdAt: '' }),
      deleteFamilyMember: vi.fn().mockResolvedValue(undefined),
    };

    TestBed.configureTestingModule({
      providers: [
        UserService,
        {
          provide: FirebaseService,
          useValue: { firestore: mockFirestore },
        },
        {
          provide: FamilyService,
          useValue: mockFamilyService,
        },
      ],
    });

    service = TestBed.inject(UserService);
  });

  describe('getProfile', () => {
    it('returns null if uid is empty', async () => {
      const result = await service.getProfile('');
      expect(result).toBeNull();
      expect(firestoreMocks.getDoc).not.toHaveBeenCalled();
    });

    it('returns UserProfile when user document exists', async () => {
      firestoreMocks.doc.mockReturnValue('doc-ref' as any);
      firestoreMocks.getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          email: 'test@example.com',
          displayName: 'Test User',
          phone: '11999999999',
          createdAt: '2026-08-01T00:00:00.000Z',
          updatedAt: '2026-08-01T00:00:00.000Z',
        }),
      } as any);

      const profile = await service.getProfile('user-123');

      expect(firestoreMocks.doc).toHaveBeenCalledWith(mockFirestore, 'users', 'user-123');
      expect(profile).toEqual({
        uid: 'user-123',
        email: 'test@example.com',
        displayName: 'Test User',
        photoURL: null,
        name: 'Test User',
        phone: '11999999999',
        themePref: undefined,
        createdAt: '2026-08-01T00:00:00.000Z',
        updatedAt: '2026-08-01T00:00:00.000Z',
      });
    });

    it('returns null when document does not exist', async () => {
      firestoreMocks.doc.mockReturnValue('doc-ref' as any);
      firestoreMocks.getDoc.mockResolvedValue({
        exists: () => false,
      } as any);

      const profile = await service.getProfile('non-existent');
      expect(profile).toBeNull();
    });

    it('handles exceptions gracefully and returns null', async () => {
      firestoreMocks.doc.mockReturnValue('doc-ref' as any);
      firestoreMocks.getDoc.mockRejectedValue(new Error('Firestore error'));

      const profile = await service.getProfile('err-uid');
      expect(profile).toBeNull();
    });
  });

  describe('updateProfile', () => {
    it('does nothing if uid is empty', async () => {
      await service.updateProfile('', { displayName: 'New Name' });
      expect(firestoreMocks.doc).not.toHaveBeenCalled();
    });

    it('updates existing user document in Firestore', async () => {
      firestoreMocks.doc.mockReturnValue('doc-ref' as any);
      firestoreMocks.getDoc.mockResolvedValue({
        exists: () => true,
      } as any);
      firestoreMocks.updateDoc.mockResolvedValue(undefined as any);

      await service.updateProfile('user-123', {
        displayName: 'Updated Name',
        phone: '11988888888',
      });

      expect(firestoreMocks.doc).toHaveBeenCalledWith(mockFirestore, 'users', 'user-123');
      expect(firestoreMocks.updateDoc).toHaveBeenCalledWith(
        'doc-ref',
        expect.objectContaining({
          displayName: 'Updated Name',
          name: 'Updated Name',
          phone: '11988888888',
          updatedAt: expect.any(String),
        }),
      );
    });

    it('creates a new user document when document does not exist yet', async () => {
      firestoreMocks.doc.mockReturnValue('doc-ref' as any);
      firestoreMocks.getDoc.mockResolvedValue({
        exists: () => false,
      } as any);
      firestoreMocks.setDoc.mockResolvedValue(undefined as any);

      await service.updateProfile('user-new', {
        displayName: 'Brand New',
      });

      expect(firestoreMocks.setDoc).toHaveBeenCalledWith(
        'doc-ref',
        expect.objectContaining({
          uid: 'user-new',
          displayName: 'Brand New',
          name: 'Brand New',
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        }),
      );
    });

    it('throws error when updateDoc fails', async () => {
      firestoreMocks.doc.mockReturnValue('doc-ref' as any);
      firestoreMocks.getDoc.mockResolvedValue({ exists: () => true } as any);
      firestoreMocks.updateDoc.mockRejectedValue(new Error('Update failed'));

      await expect(
        service.updateProfile('user-123', { displayName: 'Fail' }),
      ).rejects.toThrow('Update failed');
    });
  });

  describe('getAttendedEvents', () => {
    it('returns empty array when uid is empty', async () => {
      const events = await service.getAttendedEvents('');
      expect(events).toEqual([]);
    });

    it('retrieves events from rsvpEvents and collectionGroup queries', async () => {
      firestoreMocks.doc.mockImplementation((_fs: any, col: string, id: string) => {
        return { col, id } as any;
      });

      firestoreMocks.getDoc.mockImplementation(async (ref: any) => {
        if (ref.col === 'users') {
          return {
            exists: () => true,
            data: () => ({ rsvpEvents: ['event-1'] }),
          } as any;
        }
        if (ref.col === 'events' && ref.id === 'event-1') {
          return {
            exists: () => true,
            id: 'event-1',
            data: () => ({
              title: 'Churrasco de Aniversário',
              category: 'Churrasco',
              description: 'Festa top',
              date: '2026-09-10T18:00:00.000Z',
              location: 'São Paulo',
              pixKey: null,
              status: 'active',
              createdAt: '2026-08-01T00:00:00.000Z',
              updatedAt: '2026-08-01T00:00:00.000Z',
            }),
          } as any;
        }
        if (ref.col === 'events' && ref.id === 'event-2') {
          return {
            exists: () => true,
            id: 'event-2',
            data: () => ({
              title: 'Casamento dos Sonhos',
              category: 'Casamento',
              description: 'Cerimônia',
              date: '2026-10-15T16:00:00.000Z',
              location: 'Campinas',
              pixKey: 'pix@test.com',
              status: 'active',
              createdAt: '2026-08-01T00:00:00.000Z',
              updatedAt: '2026-08-01T00:00:00.000Z',
            }),
          } as any;
        }
        return { exists: () => false } as any;
      });

      firestoreMocks.collectionGroup.mockReturnValue('collection-group-guests' as any);
      firestoreMocks.where.mockReturnValue('where-clause' as any);
      firestoreMocks.query.mockReturnValue('query-ref' as any);
      firestoreMocks.getDocs.mockResolvedValue({
        forEach: (cb: any) => {
          cb({
            id: 'guest-doc-1',
            ref: {
              parent: {
                parent: { id: 'event-2' },
              },
            },
          });
        },
      } as any);

      const events = await service.getAttendedEvents('user-123');

      expect(events.length).toBe(2);
      expect(events[0].id).toBe('event-2');
      expect(events[0].title).toBe('Casamento dos Sonhos');
      expect(events[1].id).toBe('event-1');
      expect(events[1].title).toBe('Churrasco de Aniversário');
    });

    it('returns empty array when error occurs during fetch', async () => {
      firestoreMocks.doc.mockImplementation(() => {
        throw new Error('Firestore read error');
      });

      const events = await service.getAttendedEvents('user-err');
      expect(events).toEqual([]);
    });
  });

  describe('Family operations', () => {
    it('delegates getFamilyMembers to FamilyService', async () => {
      const mockMembers = [{ id: 'fam-1', name: 'Lucas', relationship: 'child' as const, createdAt: '' }];
      mockFamilyService.getFamilyMembers.mockResolvedValue(mockMembers);

      const result = await service.getFamilyMembers('user-123');
      expect(mockFamilyService.getFamilyMembers).toHaveBeenCalledWith('user-123');
      expect(result).toEqual(mockMembers);
    });

    it('delegates addFamilyMember to FamilyService', async () => {
      const newMember = { name: 'Lucas', relationship: 'child' as const };
      await service.addFamilyMember('user-123', newMember);
      expect(mockFamilyService.addFamilyMember).toHaveBeenCalledWith('user-123', newMember);
    });

    it('delegates deleteFamilyMember to FamilyService', async () => {
      await service.deleteFamilyMember('user-123', 'fam-1');
      expect(mockFamilyService.deleteFamilyMember).toHaveBeenCalledWith('user-123', 'fam-1');
    });
  });

  describe('updateThemePreference', () => {
    it('calls upsertProfile with theme preference', async () => {
      const spy = vi.spyOn(service, 'upsertProfile').mockResolvedValue(undefined);
      await service.updateThemePreference('user-123', 'dark');
      expect(spy).toHaveBeenCalledWith('user-123', { themePref: 'dark' });
    });
  });
});
