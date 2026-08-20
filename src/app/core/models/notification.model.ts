export type EventNotificationType = 'change' | 'cancellation' | 'reminder_7d' | 'reminder_1d';

export interface EventNotificationRecord {
  id: string;
  eventId: string;
  type: EventNotificationType;
  title: string;
  body: string;
  sentAt: string;
  recipientCount: number;
}
