import { Injectable, inject } from '@angular/core';
import { NotificationService } from './notification.service';
import {
  PartyEvent,
  EventNotificationRecord,
  EventNotificationType,
} from '../models';

@Injectable({
  providedIn: 'root',
})
export class EventNotificationService {
  private readonly notificationService = inject(NotificationService);

  private readonly MS_PER_DAY = 24 * 60 * 60 * 1000;
  private readonly SEVEN_DAYS_MS = 7 * this.MS_PER_DAY;
  private readonly ONE_DAY_MS = 1 * this.MS_PER_DAY;

  getStorageKey(eventId: string, type: EventNotificationType): string {
    return `reminder_sent_${eventId}_${type}`;
  }

  isReminderSent(eventId: string, type: EventNotificationType): boolean {
    try {
      return typeof localStorage !== 'undefined' && !!localStorage.getItem(this.getStorageKey(eventId, type));
    } catch {
      return false;
    }
  }

  markReminderSent(eventId: string, type: EventNotificationType): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(this.getStorageKey(eventId, type), new Date().toISOString());
      }
    } catch (e) {
      console.warn('Could not save notification deduplication key to localStorage', e);
    }
  }

  async notifyGuestsOfEventChange(
    event: PartyEvent,
    changeSummary: string,
    recipientCount = 0
  ): Promise<EventNotificationRecord> {
    const title = `Alteração no evento: ${event.title}`;
    const body = `O evento foi atualizado: ${changeSummary}`;

    this.notificationService.sendLocalNotification(title, body);

    const record: EventNotificationRecord = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      eventId: event.id,
      type: 'change',
      title,
      body,
      sentAt: new Date().toISOString(),
      recipientCount,
    };

    return record;
  }

  async notifyGuestsOfCancellation(
    event: PartyEvent,
    recipientCount = 0
  ): Promise<EventNotificationRecord> {
    const title = `Evento cancelado: ${event.title}`;
    const body = `O evento "${event.title}" foi cancelado pelo organizador.`;

    this.notificationService.sendLocalNotification(title, body);

    const record: EventNotificationRecord = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      eventId: event.id,
      type: 'cancellation',
      title,
      body,
      sentAt: new Date().toISOString(),
      recipientCount,
    };

    return record;
  }

  evaluateCountdownReminders(events: PartyEvent[], referenceNow = new Date()): EventNotificationRecord[] {
    const dispatched: EventNotificationRecord[] = [];
    const nowMs = referenceNow.getTime();

    for (const event of events) {
      if (event.status === 'cancelled') {
        continue;
      }

      const eventDate = new Date(event.date);
      if (isNaN(eventDate.getTime())) {
        continue;
      }

      const diffMs = eventDate.getTime() - nowMs;

      // Skip past events
      if (diffMs <= 0) {
        continue;
      }

      // Check 1-Day Reminder (diffMs <= 24h)
      if (diffMs <= this.ONE_DAY_MS) {
        if (!this.isReminderSent(event.id, 'reminder_1d')) {
          const title = `Falta 1 dia: ${event.title}`;
          const body = `Seu evento "${event.title}" acontece amanhã! Prepare-se.`;

          this.notificationService.sendLocalNotification(title, body);
          this.markReminderSent(event.id, 'reminder_1d');

          dispatched.push({
            id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            eventId: event.id,
            type: 'reminder_1d',
            title,
            body,
            sentAt: new Date().toISOString(),
            recipientCount: 1,
          });
        }
      }
      // Check 7-Day Reminder (diffMs <= 7 days AND diffMs > 1 day)
      else if (diffMs <= this.SEVEN_DAYS_MS) {
        if (!this.isReminderSent(event.id, 'reminder_7d')) {
          const title = `Faltam 7 dias: ${event.title}`;
          const body = `O evento "${event.title}" está chegando em 1 semana!`;

          this.notificationService.sendLocalNotification(title, body);
          this.markReminderSent(event.id, 'reminder_7d');

          dispatched.push({
            id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            eventId: event.id,
            type: 'reminder_7d',
            title,
            body,
            sentAt: new Date().toISOString(),
            recipientCount: 1,
          });
        }
      }
    }

    return dispatched;
  }
}
