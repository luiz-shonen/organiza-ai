import { TestBed } from '@angular/core/testing';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { of } from 'rxjs';
import { EventService } from './event.service';
import { FirestoreGateway } from './firestore.gateway';
import { EventNotificationService } from './event-notification.service';
import { createMockFirestoreGateway, MockFirestoreGateway } from '../../testing/mocks';

describe('EventService', () => {
  let service: EventService;
  let mockGateway: MockFirestoreGateway;
  let mockNotificationService: {
    notifyGuestsOfEventChange: ReturnType<typeof vi.fn>;
    notifyGuestsOfCancellation: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockGateway = createMockFirestoreGateway();
    mockNotificationService = {
      notifyGuestsOfEventChange: vi.fn().mockResolvedValue(undefined),
      notifyGuestsOfCancellation: vi.fn().mockResolvedValue(undefined),
    };

    TestBed.configureTestingModule({
      providers: [
        EventService,
        {
          provide: FirestoreGateway,
          useValue: mockGateway,
        },
        {
          provide: EventNotificationService,
          useValue: mockNotificationService,
        },
      ],
    });

    service = TestBed.inject(EventService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('listEvents', () => {
    it('returns observable of party events sorted by date', () => {
      const mockDocs = [
        {
          id: 'event-1',
          title: 'Festa 1',
          date: '2026-10-01T00:00:00.000Z',
          category: 'Party',
        },
      ];
      mockGateway.collectionSnapshot.mockReturnValue(of(mockDocs));

      let result: any = null;
      service.listEvents().subscribe((events) => {
        result = events;
      });

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Festa 1');
      expect(mockGateway.collectionSnapshot).toHaveBeenCalledWith('events', expect.anything());
    });
  });

  describe('getUserEvents', () => {
    it('returns empty array when uid is not provided', () => {
      let result: any = null;
      service.getUserEvents('').subscribe((events) => {
        result = events;
      });
      expect(result).toEqual([]);
    });

    it('combines owned and collaborated events without duplicates', () => {
      const owned = [
        { id: 'e1', title: 'Owned Event', date: '2026-06-01T00:00:00.000Z' },
        { id: 'shared', title: 'Shared Event', date: '2026-08-01T00:00:00.000Z' },
      ];
      const collaborated = [
        { id: 'shared', title: 'Shared Event', date: '2026-08-01T00:00:00.000Z' },
        { id: 'e2', title: 'Collab Event', date: '2026-07-01T00:00:00.000Z' },
      ];

      mockGateway.collectionSnapshot.mockReturnValueOnce(of(owned));
      mockGateway.collectionSnapshot.mockReturnValueOnce(of(collaborated));

      let result: any[] = [];
      service.getUserEvents('user-123').subscribe((events) => {
        result = events;
      });

      expect(result).toHaveLength(3);
      expect(result[0].id).toBe('e1');
      expect(result[1].id).toBe('e2');
      expect(result[2].id).toBe('shared');
    });
  });

  describe('getEvent', () => {
    it('returns observable of single event', () => {
      mockGateway.docSnapshot.mockReturnValue(
        of({ id: 'evt-1', title: 'Single Event', date: '2026-10-01T00:00:00.000Z' }),
      );

      let result: any = null;
      service.getEvent('evt-1').subscribe((event) => {
        result = event;
      });

      expect(result.id).toBe('evt-1');
      expect(result.title).toBe('Single Event');
    });

    it('returns null when document does not exist', () => {
      mockGateway.docSnapshot.mockReturnValue(of(null));

      let result: any = undefined;
      service.getEvent('evt-none').subscribe((event) => {
        result = event;
      });

      expect(result).toBeNull();
    });
  });

  describe('createEvent', () => {
    it('adds new document to events collection with timestamps and active status', async () => {
      mockGateway.addDoc.mockResolvedValue('new-evt-id');

      const id = await service.createEvent({
        title: 'New Birthday',
        category: 'Birthday',
        description: 'Fun party',
        date: '2026-12-01T20:00:00.000Z',
        location: 'Club',
        pixKey: null,
        createdBy: 'user-123',
        creatorEmail: 'user@example.com',
      });

      expect(mockGateway.addDoc).toHaveBeenCalledWith('events', expect.objectContaining({
        title: 'New Birthday',
        status: 'active',
        collaborators: [],
        createdAt: expect.any(String),
      }));
      expect(id).toBe('new-evt-id');
    });
  });

  describe('updateEvent', () => {
    it('updates event and notifies guests when date or location changes', async () => {
      mockGateway.getDocWithId.mockResolvedValue({
        id: 'evt-1',
        title: 'Old Title',
        date: '2026-05-01T00:00:00.000Z',
        location: 'Old Location',
      });

      await service.updateEvent('evt-1', {
        date: '2026-06-01T00:00:00.000Z',
        location: 'New Location',
      });

      expect(mockGateway.updateDoc).toHaveBeenCalledWith(
        'events/evt-1',
        expect.objectContaining({
          date: '2026-06-01T00:00:00.000Z',
          location: 'New Location',
          updatedAt: expect.any(String),
        }),
      );

      expect(mockNotificationService.notifyGuestsOfEventChange).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'evt-1',
          date: '2026-06-01T00:00:00.000Z',
          location: 'New Location',
        }),
        'Data: 2026-06-01T00:00:00.000Z, Local: New Location',
      );
    });

    it('does not send notification when date and location remain unchanged', async () => {
      mockGateway.getDocWithId.mockResolvedValue({
        id: 'evt-1',
        title: 'Old Title',
        date: '2026-05-01T00:00:00.000Z',
        location: 'Same Location',
      });

      await service.updateEvent('evt-1', {
        description: 'New Description',
      });

      expect(mockNotificationService.notifyGuestsOfEventChange).not.toHaveBeenCalled();
    });

    it('handles notification dispatch error gracefully without failing update', async () => {
      mockGateway.getDocWithId.mockResolvedValue({
        id: 'evt-1',
        date: '2026-05-01T00:00:00.000Z',
      });
      mockNotificationService.notifyGuestsOfEventChange.mockRejectedValue(new Error('Push service failed'));

      await expect(
        service.updateEvent('evt-1', { date: '2026-07-01T00:00:00.000Z' }),
      ).resolves.not.toThrow();
    });
  });

  describe('cancelEvent', () => {
    it('sets status to cancelled and sends cancellation notification', async () => {
      mockGateway.getDocWithId.mockResolvedValue({
        id: 'evt-1',
        title: 'Cancelled Party',
        status: 'active',
      });

      await service.cancelEvent('evt-1');

      expect(mockGateway.updateDoc).toHaveBeenCalledWith('events/evt-1', {
        status: 'cancelled',
        updatedAt: expect.any(String),
      });

      expect(mockNotificationService.notifyGuestsOfCancellation).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'evt-1',
          title: 'Cancelled Party',
          status: 'cancelled',
        }),
      );
    });
  });

  describe('deleteEvent', () => {
    it('deletes event document', async () => {
      await service.deleteEvent('evt-1');
      expect(mockGateway.deleteDoc).toHaveBeenCalledWith('events/evt-1');
    });
  });

  describe('collaborator management', () => {
    it('inviteCollaborator creates invitation document', async () => {
      await service.inviteCollaborator('evt-1', 'Collab@Test.com', 'My Party', 'Host');

      expect(mockGateway.setDoc).toHaveBeenCalledWith(
        'events/evt-1/invitations/collab@test.com',
        {
          id: 'collab@test.com',
          eventId: 'evt-1',
          eventTitle: 'My Party',
          invitedEmail: 'collab@test.com',
          invitedBy: 'Host',
          createdAt: expect.any(String),
        },
      );
    });

    it('removeCollaborator removes UID using arrayRemove', async () => {
      await service.removeCollaborator('evt-1', 'user-collab-1');

      expect(mockGateway.arrayRemove).toHaveBeenCalledWith('user-collab-1');
      expect(mockGateway.updateDoc).toHaveBeenCalledWith('events/evt-1', {
        collaborators: expect.anything(),
        updatedAt: expect.any(String),
      });
    });

    it('listPendingInvitations returns mapped invitations observable', () => {
      mockGateway.collectionSnapshot.mockReturnValue(
        of([
          {
            id: 'invited@test.com',
            eventId: 'evt-1',
            eventTitle: 'Party',
            invitedEmail: 'invited@test.com',
            invitedBy: 'Host',
            createdAt: '2026-01-01T00:00:00.000Z',
          },
        ]),
      );

      let result: any = null;
      service.listPendingInvitations('evt-1').subscribe((invites) => {
        result = invites;
      });

      expect(result).toHaveLength(1);
      expect(result[0].invitedEmail).toBe('invited@test.com');
    });

    it('claimPendingInvitations finds invitations and claims them via batch', async () => {
      mockGateway.getCollectionGroupDocs.mockResolvedValue([
        { id: 'user@test.com', eventId: 'evt-100' },
      ]);

      await service.claimPendingInvitations('User@Test.com', 'uid-999');

      expect(mockGateway.getCollectionGroupDocs).toHaveBeenCalledWith(
        'invitations',
        expect.anything(),
      );
      expect(mockGateway.runBatch).toHaveBeenCalled();
      expect(mockGateway.batchOps.update).toHaveBeenCalledWith('events/evt-100', {
        collaborators: expect.anything(),
        updatedAt: expect.any(String),
      });
      expect(mockGateway.batchOps.delete).toHaveBeenCalledWith('events/evt-100/invitations/user@test.com');
    });

    it('claimPendingInvitations returns early if email or uid is empty or no invites found', async () => {
      await service.claimPendingInvitations('', 'uid-1');
      expect(mockGateway.getCollectionGroupDocs).not.toHaveBeenCalled();

      mockGateway.getCollectionGroupDocs.mockResolvedValue([]);
      await service.claimPendingInvitations('test@test.com', 'uid-1');
      expect(mockGateway.runBatch).not.toHaveBeenCalled();
    });
  });
});
