/**
 * What an in-app notification is about: the amigo oculto result, an answered invite to help
 * organise, and what people of an event tell each other: a guest's answer (`presence`), a
 * collaborator joining or leaving (`collaboration`), a presence let in (`approval`), the event
 * cancelled or reopened by its owner (`event-status`).
 */
export type AppNotificationKind =
  | 'secret-santa'
  | 'collaborator'
  | 'presence'
  | 'collaboration'
  | 'approval'
  | 'event-status';

/**
 * A notification in the member's inbox (`users/{uid}/notifications/{id}`), shown at the top of
 * Início until it is opened or dismissed. Written by someone else (the event owner), read and
 * dismissed only by the member.
 */
export interface AppNotification {
  readonly id: string;
  readonly kind: AppNotificationKind;
  readonly eventId: string;
  /** Older notices only: the bell reads the event's title from the event, by `eventId`. */
  readonly eventTitle?: string;
  readonly title: string;
  readonly body: string;
  readonly actionLabel: string;
  /** App path the action opens, e.g. `/amigo-oculto/{token}`. */
  readonly actionUrl: string;
  readonly createdAt: string;
  /** When the member opened or dismissed it; null while it is new. */
  readonly readAt: string | null;
  /** Who did what it tells (the guest who answered…), shown by their profile; missing on older notices. */
  readonly actorUid?: string;
  /** Older notices only: the bell names the actor by `actorUid`. */
  readonly actorName?: string;
}

/** The record of an answered invite to help organise an event, one per event. */
export function collaboratorNotificationId(eventId: string): string {
  return `collaborator_${eventId}`;
}

/** One amigo oculto notice per event: a new draw or a new link replaces the previous one. */
export function secretSantaNotificationId(eventId: string): string {
  return `secret-santa_${eventId}`;
}

/** A guest's answer, one per guest and event: a new answer replaces the previous one. */
export function presenceNotificationId(eventId: string, actorUid: string): string {
  return `presence_${eventId}_${actorUid}`;
}

/** A collaborator joined or left, one per collaborator and event. */
export function collaborationNotificationId(eventId: string, actorUid: string): string {
  return `collaboration_${eventId}_${actorUid}`;
}

/** The guest's presence was let in. */
export function approvalNotificationId(eventId: string): string {
  return `approval_${eventId}`;
}

/** The owner cancelled or reopened the event: one per event, the latest replaces the previous. */
export function eventStatusNotificationId(eventId: string): string {
  return `event-status_${eventId}`;
}
