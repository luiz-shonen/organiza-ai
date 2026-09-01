import { TestBed } from '@angular/core/testing';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { UserService } from './user.service';
import { FirestoreGateway } from './firestore.gateway';
import { EventService } from './event.service';
import { createMockFirestoreGateway, MockFirestoreGateway } from '../../testing/mocks';
import type { PartyEvent } from '../models';

describe('UserService', () => {
  let service: UserService;
  let mockGateway: MockFirestoreGateway;
  let mockEventService: {
    getEventById: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockGateway = createMockFirestoreGateway();
    mockEventService = {
      getEventById: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        UserService,
        {
          provide: FirestoreGateway,
          useValue: mockGateway,
        },
        {
          provide: EventService,
          useValue: mockEventService,
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

      await expect(service.updateProfile('user-123', { displayName: 'Fail' })).rejects.toThrow(
        'Update failed',
      );
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

    it('retrieves events and delegates fetching to EventService', async () => {
      mockGateway.getDoc.mockResolvedValue({
        rsvpEvents: ['event-1'],
      });

      mockGateway.getCollectionGroupDocs.mockResolvedValue([{ eventId: 'event-2' }]);

      const evt1: PartyEvent = {
        id: 'event-1',
        title: 'Churrasco da Firma',
        description: 'Churrasco anual',
        date: '2026-07-15T12:00:00.000Z',
        location: 'Sítio',
        category: 'Aniversário',
        pixKey: null,
        status: 'active',
        createdAt: '2026-07-01T00:00:00.000Z',
        updatedAt: '2026-07-01T00:00:00.000Z',
      };

      const evt2: PartyEvent = {
        id: 'event-2',
        title: 'Casamento dos Sonhos',
        description: 'Casamento na praia',
        date: '2026-08-20T18:00:00.000Z',
        location: 'Igreja',
        category: 'Casamento',
        pixKey: null,
        status: 'active',
        createdAt: '2026-08-01T00:00:00.000Z',
        updatedAt: '2026-08-01T00:00:00.000Z',
      };

      mockEventService.getEventById.mockImplementation(async (eventId: string) => {
        if (eventId === 'event-1') return evt1;
        if (eventId === 'event-2') return evt2;
        return null;
      });

      const events = await service.getAttendedEvents('user-123');

      expect(events.length).toBe(2);
      expect(events[0].id).toBe('event-2');
      expect(events[0].title).toBe('Casamento dos Sonhos');
      expect(events[1].id).toBe('event-1');
      expect(mockEventService.getEventById).toHaveBeenCalledWith('event-1');
      expect(mockEventService.getEventById).toHaveBeenCalledWith('event-2');
    });

    it('returns empty array when error occurs during fetch', async () => {
      mockGateway.getDoc.mockRejectedValue(new Error('Firestore read error'));

      const events = await service.getAttendedEvents('user-123');
      expect(events).toEqual([]);
    });
  });
});
