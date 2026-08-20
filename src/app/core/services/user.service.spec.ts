import { TestBed } from '@angular/core/testing';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { UserService } from './user.service';
import { FirebaseService } from './firebase.service';
import type { UserProfile } from '../models';

const mocks = vi.hoisted(() => ({
  mockDoc: vi.fn(),
  mockGetDoc: vi.fn(),
  mockSetDoc: vi.fn(),
  mockUpdateDoc: vi.fn(),
  mockCollectionGroup: vi.fn(),
  mockQuery: vi.fn(),
  mockWhere: vi.fn(),
  mockGetDocs: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  initializeFirestore: vi.fn(),
  doc: mocks.mockDoc,
  getDoc: mocks.mockGetDoc,
  setDoc: mocks.mockSetDoc,
  updateDoc: mocks.mockUpdateDoc,
  collectionGroup: mocks.mockCollectionGroup,
  query: mocks.mockQuery,
  where: mocks.mockWhere,
  getDocs: mocks.mockGetDocs,
  Timestamp: class Timestamp {
    constructor(public seconds: number, public nanoseconds: number) {}
    toDate() {
      return new Date(this.seconds * 1000);
    }
  },
}));

describe('UserService', () => {
  let service: UserService;
  const mockFirestore = {} as any;

  beforeEach(() => {
    vi.clearAllMocks();

    TestBed.configureTestingModule({
      providers: [
        UserService,
        {
          provide: FirebaseService,
          useValue: { firestore: mockFirestore },
        },
      ],
    });

    service = TestBed.inject(UserService);
  });

  describe('getProfile', () => {
    it('returns null if uid is empty', async () => {
      const result = await service.getProfile('');
      expect(result).toBeNull();
      expect(mocks.mockGetDoc).not.toHaveBeenCalled();
    });

    it('returns UserProfile when user document exists', async () => {
      mocks.mockDoc.mockReturnValue('doc-ref');
      mocks.mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          email: 'test@example.com',
          displayName: 'Test User',
          phone: '11999999999',
          createdAt: '2026-08-01T00:00:00.000Z',
          updatedAt: '2026-08-01T00:00:00.000Z',
        }),
      });

      const profile = await service.getProfile('user-123');

      expect(mocks.mockDoc).toHaveBeenCalledWith(mockFirestore, 'users', 'user-123');
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
      mocks.mockDoc.mockReturnValue('doc-ref');
      mocks.mockGetDoc.mockResolvedValue({
        exists: () => false,
      });

      const profile = await service.getProfile('non-existent');
      expect(profile).toBeNull();
    });

    it('handles exceptions gracefully and returns null', async () => {
      mocks.mockDoc.mockReturnValue('doc-ref');
      mocks.mockGetDoc.mockRejectedValue(new Error('Firestore error'));

      const profile = await service.getProfile('err-uid');
      expect(profile).toBeNull();
    });
  });

  describe('updateProfile', () => {
    it('does nothing if uid is empty', async () => {
      await service.updateProfile('', { displayName: 'New Name' });
      expect(mocks.mockDoc).not.toHaveBeenCalled();
    });

    it('updates existing user document in Firestore', async () => {
      mocks.mockDoc.mockReturnValue('doc-ref');
      mocks.mockGetDoc.mockResolvedValue({
        exists: () => true,
      });
      mocks.mockUpdateDoc.mockResolvedValue(undefined);

      await service.updateProfile('user-123', {
        displayName: 'Updated Name',
        phone: '11988888888',
      });

      expect(mocks.mockDoc).toHaveBeenCalledWith(mockFirestore, 'users', 'user-123');
      expect(mocks.mockUpdateDoc).toHaveBeenCalledWith(
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
      mocks.mockDoc.mockReturnValue('doc-ref');
      mocks.mockGetDoc.mockResolvedValue({
        exists: () => false,
      });
      mocks.mockSetDoc.mockResolvedValue(undefined);

      await service.updateProfile('user-new', {
        displayName: 'Brand New',
      });

      expect(mocks.mockSetDoc).toHaveBeenCalledWith(
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
      mocks.mockDoc.mockReturnValue('doc-ref');
      mocks.mockGetDoc.mockResolvedValue({ exists: () => true });
      mocks.mockUpdateDoc.mockRejectedValue(new Error('Update failed'));

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
      // Mock user document having rsvpEvents
      mocks.mockDoc.mockImplementation((_fs, col, id) => {
        return { col, id };
      });

      mocks.mockGetDoc.mockImplementation(async (ref: any) => {
        if (ref.col === 'users') {
          return {
            exists: () => true,
            data: () => ({ rsvpEvents: ['event-1'] }),
          };
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
          };
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
          };
        }
        return { exists: () => false };
      });

      mocks.mockCollectionGroup.mockReturnValue('collection-group-guests');
      mocks.mockWhere.mockReturnValue('where-clause');
      mocks.mockQuery.mockReturnValue('query-ref');
      mocks.mockGetDocs.mockResolvedValue({
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
      });

      const events = await service.getAttendedEvents('user-123');

      expect(events.length).toBe(2);
      // Sorted descending by date: event-2 (October) before event-1 (September)
      expect(events[0].id).toBe('event-2');
      expect(events[0].title).toBe('Casamento dos Sonhos');
      expect(events[1].id).toBe('event-1');
      expect(events[1].title).toBe('Churrasco de Aniversário');
    });

    it('returns empty array when error occurs during fetch', async () => {
      mocks.mockDoc.mockImplementation(() => {
        throw new Error('Firestore read error');
      });

      const events = await service.getAttendedEvents('user-err');
      expect(events).toEqual([]);
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
