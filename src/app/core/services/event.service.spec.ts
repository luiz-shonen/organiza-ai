import { TestBed } from '@angular/core/testing';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { EventService } from './event.service';
import { FirebaseService } from './firebase.service';
import { EventNotificationService } from './event-notification.service';
import { PartyEvent } from '../models';

const mocks = vi.hoisted(() => ({
  mockCollection: vi.fn(),
  mockDoc: vi.fn(),
  mockAddDoc: vi.fn(),
  mockUpdateDoc: vi.fn(),
  mockDeleteDoc: vi.fn(),
  mockGetDoc: vi.fn(),
  mockOnSnapshot: vi.fn(),
  mockOrderBy: vi.fn(),
  mockQuery: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  collection: mocks.mockCollection,
  doc: mocks.mockDoc,
  addDoc: mocks.mockAddDoc,
  updateDoc: mocks.mockUpdateDoc,
  deleteDoc: mocks.mockDeleteDoc,
  getDoc: mocks.mockGetDoc,
  onSnapshot: mocks.mockOnSnapshot,
  orderBy: mocks.mockOrderBy,
  query: mocks.mockQuery,
  Timestamp: class Timestamp {
    constructor(public seconds: number, public nanoseconds: number) {}
    toDate() {
      return new Date(this.seconds * 1000);
    }
  },
}));

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
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();

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

  describe('createEvent', () => {
    it('creates event document in Firestore with active status and timestamps', async () => {
      mocks.mockAddDoc.mockResolvedValue({ id: 'new-evt-123' });

      const newId = await service.createEvent({
        title: 'Churrasco',
        description: 'Churrasco no sítio',
        date: '2026-09-15T12:00:00.000Z',
        location: 'Sítio Recanto',
        pixKey: 'pix@test.com',
      });

      expect(newId).toBe('new-evt-123');
      expect(mocks.mockAddDoc).toHaveBeenCalledWith(
        undefined,
        expect.objectContaining({
          title: 'Churrasco',
          status: 'active',
        })
      );
    });
  });

  describe('updateEvent', () => {
    it('detects date change and invokes notifyGuestsOfEventChange', async () => {
      mocks.mockGetDoc.mockResolvedValue({
        exists: () => true,
        id: 'evt-100',
        data: () => ({ ...existingEvent }),
      });
      mocks.mockUpdateDoc.mockResolvedValue(undefined);

      await service.updateEvent('evt-100', {
        date: '2026-09-12T20:00:00.000Z',
      });

      expect(mocks.mockUpdateDoc).toHaveBeenCalled();
      expect(mockNotificationService.notifyGuestsOfEventChange).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'evt-100',
          date: '2026-09-12T20:00:00.000Z',
        }),
        expect.stringContaining('Data: 2026-09-12T20:00:00.000Z')
      );
    });

    it('detects location change and invokes notifyGuestsOfEventChange', async () => {
      mocks.mockGetDoc.mockResolvedValue({
        exists: () => true,
        id: 'evt-100',
        data: () => ({ ...existingEvent }),
      });
      mocks.mockUpdateDoc.mockResolvedValue(undefined);

      await service.updateEvent('evt-100', {
        location: 'Rua Augusta, 500',
      });

      expect(mocks.mockUpdateDoc).toHaveBeenCalled();
      expect(mockNotificationService.notifyGuestsOfEventChange).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'evt-100',
          location: 'Rua Augusta, 500',
        }),
        expect.stringContaining('Local: Rua Augusta, 500')
      );
    });

    it('does not trigger notifications if only description or title changes without date/location change', async () => {
      mocks.mockGetDoc.mockResolvedValue({
        exists: () => true,
        id: 'evt-100',
        data: () => ({ ...existingEvent }),
      });
      mocks.mockUpdateDoc.mockResolvedValue(undefined);

      await service.updateEvent('evt-100', {
        description: 'Nova descrição da festa',
      });

      expect(mocks.mockUpdateDoc).toHaveBeenCalled();
      expect(mockNotificationService.notifyGuestsOfEventChange).not.toHaveBeenCalled();
    });

    it('handles notification dispatch error gracefully without failing update', async () => {
      mocks.mockGetDoc.mockResolvedValue({
        exists: () => true,
        id: 'evt-100',
        data: () => ({ ...existingEvent }),
      });
      mocks.mockUpdateDoc.mockResolvedValue(undefined);
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
      mocks.mockGetDoc.mockResolvedValue({
        exists: () => true,
        id: 'evt-100',
        data: () => ({ ...existingEvent }),
      });
      mocks.mockUpdateDoc.mockResolvedValue(undefined);

      await service.cancelEvent('evt-100');

      expect(mocks.mockUpdateDoc).toHaveBeenCalledWith(
        undefined,
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
      mocks.mockDeleteDoc.mockResolvedValue(undefined);

      await service.deleteEvent('evt-100');

      expect(mocks.mockDeleteDoc).toHaveBeenCalled();
    });
  });
});
