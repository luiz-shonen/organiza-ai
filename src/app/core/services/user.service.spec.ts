import { TestBed } from '@angular/core/testing';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { UserService } from './user.service';
import { FirestoreGateway } from './firestore.gateway';
import { FamilyService } from './family.service';
import { createMockFirestoreGateway, MockFirestoreGateway } from '../../testing/mocks';

describe('UserService', () => {
  let service: UserService;
  let mockGateway: MockFirestoreGateway;
  let mockFamilyService: {
    getFamilyMembers: ReturnType<typeof vi.fn>;
    addFamilyMember: ReturnType<typeof vi.fn>;
    deleteFamilyMember: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockGateway = createMockFirestoreGateway();
    mockFamilyService = {
      getFamilyMembers: vi.fn(),
      addFamilyMember: vi.fn(),
      deleteFamilyMember: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        UserService,
        {
          provide: FirestoreGateway,
          useValue: mockGateway,
        },
        {
          provide: FamilyService,
          useValue: mockFamilyService,
        },
      ],
    });

    service = TestBed.inject(UserService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getProfile', () => {
    it('returns null when uid is empty or not provided', async () => {
      const profile = await service.getProfile('');
      expect(profile).toBeNull();
      expect(mockGateway.getDoc).not.toHaveBeenCalled();
    });

    it('returns UserProfile when user document exists', async () => {
      mockGateway.getDoc.mockResolvedValue({
        email: 'luiz@example.com',
        displayName: 'Luiz',
        name: 'Luiz',
        phone: '11999999999',
        photoURL: 'https://avatar.png',
        themePref: 'dark',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-02T00:00:00.000Z',
      });

      const profile = await service.getProfile('user-123');

      expect(mockGateway.getDoc).toHaveBeenCalledWith('users/user-123');
      expect(profile).toEqual({
        uid: 'user-123',
        email: 'luiz@example.com',
        displayName: 'Luiz',
        photoURL: 'https://avatar.png',
        name: 'Luiz',
        phone: '11999999999',
        themePref: 'dark',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-02T00:00:00.000Z',
      });
    });

    it('handles Timestamp createdAt and updatedAt properly', async () => {
      mockGateway.timestampToDate.mockReturnValue(new Date('2026-03-01T00:00:00.000Z'));
      mockGateway.getDoc.mockResolvedValue({
        email: 'luiz@example.com',
        displayName: 'Luiz',
        createdAt: { seconds: 1772323200, nanoseconds: 0 },
        updatedAt: { seconds: 1772323200, nanoseconds: 0 },
      });

      const profile = await service.getProfile('user-123');
      expect(profile?.createdAt).toBe('2026-03-01T00:00:00.000Z');
      expect(profile?.updatedAt).toBe('2026-03-01T00:00:00.000Z');
    });

    it('returns null when user document does not exist', async () => {
      mockGateway.getDoc.mockResolvedValue(null);

      const profile = await service.getProfile('non-existing-user');
      expect(profile).toBeNull();
    });

    it('returns null when Firestore throws an error', async () => {
      mockGateway.getDoc.mockRejectedValue(new Error('Network error'));

      const profile = await service.getProfile('user-123');
      expect(profile).toBeNull();
    });
  });

  describe('updateProfile', () => {
    it('does nothing when uid is empty', async () => {
      await service.updateProfile('', { displayName: 'New Name' });
      expect(mockGateway.getDoc).not.toHaveBeenCalled();
      expect(mockGateway.updateDoc).not.toHaveBeenCalled();
    });

    it('updates existing user document in Firestore', async () => {
      mockGateway.getDoc.mockResolvedValue({ uid: 'user-123' });

      await service.updateProfile('user-123', {
        displayName: 'Updated Name',
        phone: '11988888888',
      });

      expect(mockGateway.updateDoc).toHaveBeenCalledWith(
        'users/user-123',
        expect.objectContaining({
          displayName: 'Updated Name',
          name: 'Updated Name',
          phone: '11988888888',
          updatedAt: expect.any(String),
        }),
      );
    });

    it('creates a new user document when document does not exist yet', async () => {
      mockGateway.getDoc.mockResolvedValue(null);

      await service.updateProfile('user-new', {
        displayName: 'Brand New',
      });

      expect(mockGateway.setDoc).toHaveBeenCalledWith(
        'users/user-new',
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
      mockGateway.getDoc.mockResolvedValue({ uid: 'user-123' });
      mockGateway.updateDoc.mockRejectedValue(new Error('Update failed'));

      await expect(
        service.updateProfile('user-123', { displayName: 'Fail' }),
      ).rejects.toThrow('Update failed');
    });
  });

  describe('upsertProfile and updateThemePreference', () => {
    it('delegates upsertProfile to updateProfile', async () => {
      const spy = vi.spyOn(service, 'updateProfile').mockResolvedValue(undefined);
      await service.upsertProfile('user-123', { phone: '11999999999' });
      expect(spy).toHaveBeenCalledWith('user-123', { phone: '11999999999' });
    });

    it('updates theme preference correctly', async () => {
      const spy = vi.spyOn(service, 'upsertProfile').mockResolvedValue(undefined);
      await service.updateThemePreference('user-123', 'dark');
      expect(spy).toHaveBeenCalledWith('user-123', { themePref: 'dark' });
    });
  });

  describe('getAttendedEvents', () => {
    it('returns empty array if uid is empty', async () => {
      const events = await service.getAttendedEvents('');
      expect(events).toEqual([]);
    });

    it('retrieves events from rsvpEvents and collectionGroup queries', async () => {
      mockGateway.getDoc.mockResolvedValue({
        rsvpEvents: ['event-1'],
      });

      mockGateway.getCollectionGroupDocs.mockResolvedValue([
        { eventId: 'event-2' },
      ]);

      mockGateway.getDocWithId.mockImplementation((path: string) => {
        if (path === 'events/event-1') {
          return Promise.resolve({
            id: 'event-1',
            title: 'Churrasco da Firma',
            date: '2026-07-15T12:00:00.000Z',
            location: 'Sítio',
            category: 'Aniversário',
            status: 'active',
          });
        }
        if (path === 'events/event-2') {
          return Promise.resolve({
            id: 'event-2',
            title: 'Casamento dos Sonhos',
            date: '2026-08-20T18:00:00.000Z',
            location: 'Igreja',
            category: 'Casamento',
            status: 'active',
          });
        }
        return Promise.resolve(null);
      });

      const events = await service.getAttendedEvents('user-123');

      expect(events.length).toBe(2);
      expect(events[0].id).toBe('event-2');
      expect(events[0].title).toBe('Casamento dos Sonhos');
      expect(events[1].id).toBe('event-1');
    });

    it('returns empty array when error occurs during fetch', async () => {
      mockGateway.getDoc.mockRejectedValue(new Error('Firestore read error'));

      const events = await service.getAttendedEvents('user-123');
      expect(events).toEqual([]);
    });
  });

  describe('family delegation', () => {
    it('delegates getFamilyMembers to FamilyService', async () => {
      const mockMembers = [{ id: 'fam-1', name: 'Lucas', relationship: 'child' as const }];
      mockFamilyService.getFamilyMembers.mockResolvedValue(mockMembers);

      const result = await service.getFamilyMembers('user-123');
      expect(mockFamilyService.getFamilyMembers).toHaveBeenCalledWith('user-123');
      expect(result).toBe(mockMembers);
    });

    it('delegates addFamilyMember to FamilyService', async () => {
      const newMember = { name: 'Mariana', relationship: 'spouse' as const };
      await service.addFamilyMember('user-123', newMember);
      expect(mockFamilyService.addFamilyMember).toHaveBeenCalledWith('user-123', newMember);
    });

    it('delegates deleteFamilyMember to FamilyService', async () => {
      await service.deleteFamilyMember('user-123', 'fam-1');
      expect(mockFamilyService.deleteFamilyMember).toHaveBeenCalledWith('user-123', 'fam-1');
    });
  });
});
