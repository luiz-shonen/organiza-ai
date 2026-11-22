import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { FirestoreGateway } from './firestore.gateway';
import type { AppNotification } from '../models';

/** The member's in-app notifications (`users/{uid}/notifications`). */
@Injectable({ providedIn: 'root' })
export class InboxService {
  private readonly gateway = inject(FirestoreGateway);

  private path(uid: string): string {
    return `users/${uid}/notifications`;
  }

  /** Every notification, new and opened, most recent first: the bell's history. */
  watchAll(uid: string): Observable<AppNotification[]> {
    return this.gateway
      .collectionSnapshot<Omit<AppNotification, 'id'>>(this.path(uid))
      .pipe(
        map((docs) =>
          docs
            .map((d) => this.toNotification(d))
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
        ),
      );
  }

  /** New notifications, most recent first. */
  watchUnread(uid: string): Observable<AppNotification[]> {
    return this.gateway.collectionSnapshot<Omit<AppNotification, 'id'>>(this.path(uid)).pipe(
      map((docs) =>
        docs
          .map((d) => this.toNotification(d))
          .filter((n) => !n.readAt)
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      ),
    );
  }

  /** One notification, e.g. the amigo oculto notice of an event; null when there is none. */
  watch(uid: string, id: string): Observable<AppNotification | null> {
    return this.gateway
      .docSnapshot<Omit<AppNotification, 'id'>>(`${this.path(uid)}/${id}`)
      .pipe(map((d) => (d ? this.toNotification(d) : null)));
  }

  async markRead(uid: string, id: string): Promise<void> {
    await this.gateway.updateDoc(`${this.path(uid)}/${id}`, { readAt: new Date().toISOString() });
  }

  /**
   * The member's own record in their history (an invite they answered), already read: it is
   * the history of what they did, not something new.
   */
  async record(uid: string, notification: Omit<AppNotification, 'readAt'>): Promise<void> {
    const { id, ...data } = notification;
    await this.gateway.setDoc(`${this.path(uid)}/${id}`, {
      ...data,
      readAt: new Date().toISOString(),
    });
  }

  /** Writes (or replaces) a notification in someone's inbox, as new. */
  async send(uid: string, notification: Omit<AppNotification, 'readAt'>): Promise<void> {
    const { id, ...data } = notification;
    await this.gateway.setDoc(`${this.path(uid)}/${id}`, { ...data, readAt: null });
  }

  private toNotification(d: Omit<AppNotification, 'id'> & { id: string }): AppNotification {
    return {
      id: d.id,
      kind: d.kind,
      eventId: d.eventId ?? '',
      eventTitle: d.eventTitle ?? '',
      title: d.title ?? '',
      body: d.body ?? '',
      actionLabel: d.actionLabel ?? '',
      actionUrl: d.actionUrl ?? '',
      createdAt: d.createdAt ?? '',
      readAt: d.readAt ?? null,
    };
  }
}
