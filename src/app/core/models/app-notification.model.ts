/** What an in-app notification is about. */
export type AppNotificationKind = 'secret-santa';

/**
 * A notification in the member's inbox (`users/{uid}/notifications/{id}`), shown at the top of
 * Início until it is opened or dismissed. Written by someone else (the event owner), read and
 * dismissed only by the member.
 */
export interface AppNotification {
  readonly id: string;
  readonly kind: AppNotificationKind;
  readonly eventId: string;
  readonly eventTitle: string;
  readonly title: string;
  readonly body: string;
  readonly actionLabel: string;
  /** App path the action opens, e.g. `/amigo-oculto/{token}`. */
  readonly actionUrl: string;
  readonly createdAt: string;
  /** When the member opened or dismissed it; null while it is new. */
  readonly readAt: string | null;
}

/** One amigo oculto notice per event: a new draw or a new link replaces the previous one. */
export function secretSantaNotificationId(eventId: string): string {
  return `secret-santa_${eventId}`;
}
