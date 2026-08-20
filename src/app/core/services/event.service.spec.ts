import { TestBed } from '@angular/core/testing';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { EventService } from './event.service';
import { FirebaseService } from './firebase.service';
import { EventNotificationService } from './event-notification.service';
import { PartyEvent } from '../models';
import { firestoreMocks } from '../../testing/mocks';

vi.mock('firebase/firestore', async () => {
  const { createFirestoreModuleMock } = await import('../../testing/mocks');
  return createFirestoreModuleMock();
});

vi.mock('@firebase/firestore', async () => {
  const { createFirestoreModuleMock } = await import('../../testing/mocks');
  return createFirestoreModuleMock();
});

describe('EventService', () => {
  let service: EventService;
  let mockNotificationService: {
    notifyGuestsOfEventChange: ReturnType<typeof vi.fn>;
    notifyGuestsOfCancellation: ReturnType<typeof vi.fn>;
  };

  const existingEvent: PartyEvent = {
    id: 'evt-100',
    title: 'Aniversário do Lucas',
    category: 'Aniversário',
    description: 'Festa de 30 anos',
    date: '2026-09-10T18:00:00.000Z',
    location: 'Av. Paulista, 1000',
    pixKey: '11999998888',
    status: 'active',
    createdBy: 'user-1',
    collaborators: [],
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();

    firestoreMocks.batch.set.mockReset();
    firestoreMocks.batch.delete.mockReset();
    firestoreMocks.batch.update.mockReset();
    firestoreMocks.batch.commit.mockReset().mockResolvedValue(undefined);

    firestoreMocks.doc.mockReturnValue({ id: 'evt-100' } as any);
    firestoreMocks.collection.mockReturnValue('col-ref' as any);
    firestoreMocks.collectionGroup.mockReturnValue('col-group-ref' as any);
    firestoreMocks.query.mockReturnValue('query-ref' as any);
    firestoreMocks.where.mockReturnValue('where-ref' as any);
    firestoreMocks.orderBy.mockReturnValue('order-ref' as any);
    firestoreMocks.writeBatch.mockReturnValue(firestoreMocks.batch);
    firestoreMocks.getDoc.mockResolvedValue({ exists: () => true, data: () => existingEvent, id: 'evt-100' } as any);
    firestoreMocks.getDocs.mockResolvedValue({ docs: [], forEach: vi.fn() } as any);
    firestoreMocks.addDoc.mockResolvedValue({ id: 'new-evt-id' } as any);
    firestoreMocks.setDoc.mockResolvedValue(undefined as any);
    firestoreMocks.updateDoc.mockResolvedValue(undefined as any);
    firestoreMocks.deleteDoc.mockResolvedValue(undefined as any);

    mockNotificationService = {
      notifyGuestsOfEventChange: vi.fn().mockResolvedValue({}),
      notifyGuestsOfCancellation: vi.fn().mockResolvedValue({}),
    };

    TestBed.configureTestingModule({
      providers: [
        EventService,
        {
          provide: FirebaseService,
          useValue: {
            firestore: {} as any,
          },
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

  describe('getUserEvents', () => {
    it('returns empty array observable if uid is empty', () => {
      let result: PartyEvent[] | undefined;
      service.getUserEvents('').subscribe((events) => {
        result = events;
      });
      expect(result).toEqual([]);
    });

    it('merges owned and collaborated events, deduplicating and sorting by date', () => {
      const ownedDoc = {
        id: 'evt-1',
        data: () => ({
          title: 'Owned Event',
          date: '2026-10-05T18:00:00.000Z',
          createdBy: 'user-123',
          collaborators: [],
        }),
      };
      const duplicateDoc = {
        id: 'evt-1',
        data: () => ({
          title: 'Owned Event (Dupe)',
          date: '2026-10-05T18:00:00.000Z',
          createdBy: 'user-123',
          collaborators: ['user-123'],
        }),
      };
      const collaboratedDoc = {
        id: 'evt-2',
        data: () => ({
          title: 'Collaborated Event Earlier',
          date: '2026-09-01T12:00:00.000Z',
          createdBy: 'other-user',
          collaborators: ['user-123'],
        }),
      };

      let snapshotCallbackCount = 0;
      firestoreMocks.onSnapshot.mockImplementation((_q: any, callback: any) => {
        snapshotCallbackCount++;
        if (snapshotCallbackCount === 1) {
          callback({ docs: [ownedDoc] });
        } else {
          callback({ docs: [duplicateDoc, collaboratedDoc] });
        }
        return vi.fn();
      });

      let emittedEvents: PartyEvent[] = [];
      service.getUserEvents('user-123').subscribe((events) => {
        emittedEvents = events;
      });

      expect(emittedEvents.length).toBe(2);
      expect(emittedEvents[0].id).toBe('evt-2');
      expect(emittedEvents[1].id).toBe('evt-1');
    });
  });

  describe('inviteCollaborator', () => {
    it('creates subcollection document in events/{id}/invitations/{email} with lowercase email', async () => {
      firestoreMocks.doc.mockReturnValue({ path: 'events/evt-100/invitations/friend@test.com' } as any);
      firestoreMocks.setDoc.mockResolvedValue(undefined as any);

      await service.inviteCollaborator('evt-100', 'Friend@Test.COM ', 'Aniversário', 'user-1');

      expect(firestoreMocks.doc).toHaveBeenCalledWith(
        expect.anything(),
        'events',
        'evt-100',
        'invitations',
        'friend@test.com'
      );
      expect(firestoreMocks.setDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          id: 'friend@test.com',
          eventId: 'evt-100',
          eventTitle: 'Aniversário',
          invitedEmail: 'friend@test.com',
          invitedBy: 'user-1',
          createdAt: expect.any(String),
        })
      );
    });
  });

  describe('removeCollaborator', () => {
    it('removes collaborator uid from event collaborators array', async () => {
      firestoreMocks.doc.mockReturnValue({ path: 'events/evt-100' } as any);
      firestoreMocks.updateDoc.mockResolvedValue(undefined as any);

      await service.removeCollaborator('evt-100', 'user-2');

      expect(firestoreMocks.updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          collaborators: expect.objectContaining({
            _type: 'arrayRemove',
            args: ['user-2'],
          }),
        })
      );
    });
  });

  describe('claimPendingInvitations', () => {
    it('does nothing when email or uid is empty', async () => {
      await service.claimPendingInvitations('', 'uid-1');
      await service.claimPendingInvitations('user@test.com', '');
      expect(firestoreMocks.getDocs).not.toHaveBeenCalled();
    });

    it('processes batch updates when pending invitations match email', async () => {
      const mockDoc1 = {
        id: 'user@test.com',
        ref: { id: 'user@test.com', parent: { parent: { id: 'evt-1' } } },
        data: () => ({ eventId: 'evt-1', invitedEmail: 'user@test.com' }),
      };
      const mockDoc2 = {
        id: 'user@test.com',
        ref: { id: 'user@test.com', parent: { parent: { id: 'evt-2' } } },
        data: () => ({ eventId: 'evt-2', invitedEmail: 'user@test.com' }),
      };

      firestoreMocks.getDocs.mockResolvedValue({
        empty: false,
        docs: [mockDoc1, mockDoc2],
      } as any);

      await service.claimPendingInvitations('User@Test.COM ', 'user-123');

      expect(firestoreMocks.query).toHaveBeenCalled();
      expect(firestoreMocks.where).toHaveBeenCalledWith('invitedEmail', '==', 'user@test.com');
      expect(firestoreMocks.writeBatch).toHaveBeenCalled();
      expect(firestoreMocks.batch.update).toHaveBeenCalledTimes(2);
      expect(firestoreMocks.batch.delete).toHaveBeenCalledTimes(2);
      expect(firestoreMocks.batch.commit).toHaveBeenCalledTimes(1);
    });
  });

  describe('createEvent', () => {
    it('creates event document in Firestore with active status and timestamps', async () => {
      firestoreMocks.addDoc.mockResolvedValue({ id: 'new-evt-123' } as any);

      const newId = await service.createEvent({
        title: 'Churrasco',
        description: 'Churrasco no sítio',
        date: '2026-09-15T12:00:00.000Z',
        location: 'Sítio Recanto',
        pixKey: 'pix@test.com',
      });

      expect(newId).toBe('new-evt-123');
      expect(firestoreMocks.addDoc).toHaveBeenCalledWith(
        'col-ref',
        expect.objectContaining({
          title: 'Churrasco',
          status: 'active',
          collaborators: [],
        })
      );
    });
  });

  describe('updateEvent', () => {
    it('detects date change and invokes notifyGuestsOfEventChange', async () => {
      firestoreMocks.getDoc.mockResolvedValue({
        exists: () => true,
        id: 'evt-100',
        data: () => ({ ...existingEvent }),
      } as any);
      firestoreMocks.updateDoc.mockResolvedValue(undefined as any);

      await service.updateEvent('evt-100', {
        date: '2026-09-12T20:00:00.000Z',
      });

      expect(firestoreMocks.updateDoc).toHaveBeenCalled();
      expect(mockNotificationService.notifyGuestsOfEventChange).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'evt-100',
          date: '2026-09-12T20:00:00.000Z',
        }),
        expect.stringContaining('Data: 2026-09-12T20:00:00.000Z')
      );
    });

    it('detects location change and invokes notifyGuestsOfEventChange', async () => {
      firestoreMocks.getDoc.mockResolvedValue({
        exists: () => true,
        id: 'evt-100',
        data: () => ({ ...existingEvent }),
      } as any);
      firestoreMocks.updateDoc.mockResolvedValue(undefined as any);

      await service.updateEvent('evt-100', {
        location: 'Rua Augusta, 500',
      });

      expect(firestoreMocks.updateDoc).toHaveBeenCalled();
      expect(mockNotificationService.notifyGuestsOfEventChange).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'evt-100',
          location: 'Rua Augusta, 500',
        }),
        expect.stringContaining('Local: Rua Augusta, 500')
      );
    });

    it('does not trigger notifications if only description or title changes without date/location change', async () => {
      firestoreMocks.getDoc.mockResolvedValue({
        exists: () => true,
        id: 'evt-100',
        data: () => ({ ...existingEvent }),
      } as any);
      firestoreMocks.updateDoc.mockResolvedValue(undefined as any);

      await service.updateEvent('evt-100', {
        description: 'Nova descrição da festa',
      });

      expect(firestoreMocks.updateDoc).toHaveBeenCalled();
      expect(mockNotificationService.notifyGuestsOfEventChange).not.toHaveBeenCalled();
    });

    it('handles notification dispatch error gracefully without failing update', async () => {
      firestoreMocks.getDoc.mockResolvedValue({
        exists: () => true,
        id: 'evt-100',
        data: () => ({ ...existingEvent }),
      } as any);
      firestoreMocks.updateDoc.mockResolvedValue(undefined as any);
      mockNotificationService.notifyGuestsOfEventChange.mockRejectedValue(
        new Error('Push service failed')
      );

      await expect(
        service.updateEvent('evt-100', {
          date: '2026-09-20T18:00:00.000Z',
        })
      ).resolves.not.toThrow();
    });
  });

  describe('cancelEvent', () => {
    it('updates status to cancelled and triggers cancellation notification', async () => {
      firestoreMocks.getDoc.mockResolvedValue({
        exists: () => true,
        id: 'evt-100',
        data: () => ({ ...existingEvent }),
      } as any);
      firestoreMocks.updateDoc.mockResolvedValue(undefined as any);

      await service.cancelEvent('evt-100');

      expect(firestoreMocks.updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          status: 'cancelled',
        })
      );
      expect(mockNotificationService.notifyGuestsOfCancellation).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'evt-100',
          status: 'cancelled',
        })
      );
    });
  });

  describe('deleteEvent', () => {
    it('calls deleteDoc in Firestore', async () => {
      firestoreMocks.deleteDoc.mockResolvedValue(undefined as any);

      await service.deleteEvent('evt-100');

      expect(firestoreMocks.deleteDoc).toHaveBeenCalled();
    });
  });
});
