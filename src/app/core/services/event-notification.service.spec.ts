import { TestBed } from '@angular/core/testing';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { EventNotificationService } from './event-notification.service';
import { NotificationService } from './notification.service';
import { PartyEvent } from '../models';

describe('EventNotificationService', () => {
  let service: EventNotificationService;
  let mockNotificationService: {
    sendLocalNotification: ReturnType<typeof vi.fn>;
  };

  const mockEvent: PartyEvent = {
    id: 'evt-123',
    title: 'Churrasco da Turma',
    description: 'Comemoração de fim de ano',
    date: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
    location: 'Rua das Flores, 123',
    pixKey: '12345678900',
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    localStorage.clear();
    mockNotificationService = {
      sendLocalNotification: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        EventNotificationService,
        { provide: NotificationService, useValue: mockNotificationService },
      ],
    });

    service = TestBed.inject(EventNotificationService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should dispatch critical change notification with summary and return record', async () => {
    const record = await service.notifyGuestsOfEventChange(
      mockEvent,
      'Horário alterado para 19:00',
      5,
    );

    expect(mockNotificationService.sendLocalNotification).toHaveBeenCalledWith(
      'Alteração no evento: Churrasco da Turma',
      'O evento foi atualizado: Horário alterado para 19:00',
    );
    expect(record.type).toBe('change');
    expect(record.eventId).toBe('evt-123');
    expect(record.recipientCount).toBe(5);
  });

  it('should dispatch cancellation notification and return record', async () => {
    const record = await service.notifyGuestsOfCancellation(mockEvent, 10);

    expect(mockNotificationService.sendLocalNotification).toHaveBeenCalledWith(
      'Evento cancelado: Churrasco da Turma',
      'O evento "Churrasco da Turma" foi cancelado pelo organizador.',
    );
    expect(record.type).toBe('cancellation');
    expect(record.eventId).toBe('evt-123');
    expect(record.recipientCount).toBe(10);
  });

  it('should evaluate 7-day reminder and dispatch notification when event is ~6-7 days away', () => {
    const now = new Date('2026-08-20T10:00:00Z');
    const eventIn6Days: PartyEvent = {
      ...mockEvent,
      id: 'evt-7d',
      title: 'Festa de Aniversário',
      date: new Date('2026-08-26T10:00:00Z').toISOString(),
    };

    const records = service.evaluateCountdownReminders([eventIn6Days], now);

    expect(records.length).toBe(1);
    expect(records[0].type).toBe('reminder_7d');
    expect(mockNotificationService.sendLocalNotification).toHaveBeenCalledWith(
      'Faltam 7 dias: Festa de Aniversário',
      'O evento "Festa de Aniversário" está chegando em 1 semana!',
    );
    expect(service.isReminderSent('evt-7d', 'reminder_7d')).toBe(true);
  });

  it('should evaluate 1-day reminder and dispatch notification when event is within 24 hours', () => {
    const now = new Date('2026-08-20T10:00:00Z');
    const eventIn18Hours: PartyEvent = {
      ...mockEvent,
      id: 'evt-1d',
      title: 'Jantar Especial',
      date: new Date('2026-08-21T04:00:00Z').toISOString(),
    };

    const records = service.evaluateCountdownReminders([eventIn18Hours], now);

    expect(records.length).toBe(1);
    expect(records[0].type).toBe('reminder_1d');
    expect(mockNotificationService.sendLocalNotification).toHaveBeenCalledWith(
      'Falta 1 dia: Jantar Especial',
      'Seu evento "Jantar Especial" acontece amanhã! Prepare-se.',
    );
    expect(service.isReminderSent('evt-1d', 'reminder_1d')).toBe(true);
  });

  it('should deduplicate reminders and not re-fire when already marked sent in localStorage', () => {
    const now = new Date('2026-08-20T10:00:00Z');
    const eventIn18Hours: PartyEvent = {
      ...mockEvent,
      id: 'evt-dup',
      date: new Date('2026-08-21T04:00:00Z').toISOString(),
    };

    // Pre-set deduplication flag
    service.markReminderSent('evt-dup', 'reminder_1d');

    const records = service.evaluateCountdownReminders([eventIn18Hours], now);

    expect(records.length).toBe(0);
    expect(mockNotificationService.sendLocalNotification).not.toHaveBeenCalled();
  });

  it('should ignore past events or cancelled events', () => {
    const now = new Date('2026-08-20T10:00:00Z');
    const pastEvent: PartyEvent = {
      ...mockEvent,
      id: 'evt-past',
      date: new Date('2026-08-19T10:00:00Z').toISOString(),
    };
    const cancelledEvent: PartyEvent = {
      ...mockEvent,
      id: 'evt-cancelled',
      status: 'cancelled',
      date: new Date('2026-08-21T10:00:00Z').toISOString(),
    };

    const records = service.evaluateCountdownReminders([pastEvent, cancelledEvent], now);

    expect(records.length).toBe(0);
    expect(mockNotificationService.sendLocalNotification).not.toHaveBeenCalled();
  });
});
