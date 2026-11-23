import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { of, switchMap } from 'rxjs';
import {
  AuthService,
  CollaboratorInvitesService,
  EventService,
  InboxService,
} from '../../../core/services';
import type { EventInvitation } from '../../../core/models';
import { OrgNotificationMenuComponent, type OrgNotificationItem } from '../../ui';

interface BellItem extends OrgNotificationItem {
  readonly url: string;
  /** An inbox notification is marked read when opened; an invite stays until answered. */
  readonly inboxId: string | null;
  /** The invite itself: opening it marks it seen. */
  readonly invite: EventInvitation | null;
}

/**
 * The header's bell: new notifications (the amigo oculto result…) and invites to help organise an
 * event, each opening where it is answered.
 */
@Component({
  selector: 'app-notification-bell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [OrgNotificationMenuComponent],
  template: `<org-notification-menu
    [items]="items()"
    (opened)="refresh()"
    (selected)="open($event)"
  />`,
})
export class NotificationBellComponent {
  private readonly auth = inject(AuthService);
  private readonly inbox = inject(InboxService);
  private readonly invites = inject(CollaboratorInvitesService);
  private readonly router = inject(Router);
  private readonly events = inject(EventService);

  private readonly uid = computed(() => this.auth.currentUser()?.uid ?? null);
  private readonly history = toSignal(
    toObservable(this.uid).pipe(switchMap((uid) => (uid ? this.inbox.watchAll(uid) : of([])))),
    { initialValue: [] },
  );

  /**
   * Who organizes each event the notices are about, by event id: the face and name beside a
   * notice ("Natal · por Jéssica"), as on an invite to help organise. Their profile's, now.
   */
  private readonly organizers = signal<
    Readonly<Record<string, { readonly name: string; readonly photo: string | null }>>
  >({});
  private readonly loadOrganizers = effect(() => {
    const known = this.organizers();
    const missing = [...new Set(this.history().map((n) => n.eventId))].filter(
      (id) => id && !(id in known),
    );
    if (!missing.length) return;
    void Promise.all(
      missing.map(async (eventId) => {
        const event = await this.events.getEventById(eventId).catch(() => null);
        const [named] = event ? await this.events.withOrganizerNames([event]) : [];
        const name = named?.creatorName?.trim() ?? '';
        return [eventId, { name, photo: named?.creatorPhoto ?? null }] as const;
      }),
    ).then((found) => this.organizers.update((all) => ({ ...all, ...Object.fromEntries(found) })));
  });

  protected readonly items = computed<BellItem[]>(() =>
    [
      ...this.invites.invites().map((invite) => ({
        key: `invite_${invite.eventId}`,
        icon: 'handshake' as const,
        person: invite.invitedByName
          ? { name: invite.invitedByName, photo: invite.invitedByPhoto ?? null }
          : null,
        title: 'Convite para colaborar',
        body: [
          invite.eventTitle || 'Um evento',
          invite.invitedByName && `por ${invite.invitedByName}`,
        ]
          .filter(Boolean)
          .join(' · '),
        url: `/evento/${invite.eventId}`,
        inboxId: null,
        invite,
        unread: !this.invites.isSeen(invite),
        pinned: true,
      })),
      ...this.history().map((notification) => {
        const organizer = this.organizerOf(notification.eventId);
        return {
          key: notification.id,
          icon:
            notification.kind === 'secret-santa'
              ? ('redeem' as const)
              : notification.kind === 'collaborator'
                ? ('handshake' as const)
                : ('notifications' as const),
          person: organizer,
          title: notification.title,
          body:
            notification.kind === 'collaborator'
              ? notification.body
              : [notification.eventTitle || notification.body, organizer && `por ${organizer.name}`]
                  .filter(Boolean)
                  .join(' · '),
          url: notification.actionUrl,
          inboxId: notification.id,
          invite: null,
          unread: !notification.readAt,
        };
      }),
    ].sort((a, b) => Number(b.unread) - Number(a.unread)),
  );

  private organizerOf(eventId: string): { name: string; photo: string | null } | null {
    const organizer = this.organizers()[eventId];
    return organizer?.name ? organizer : null;
  }

  protected refresh(): void {
    void this.invites.refresh();
  }

  protected open(item: OrgNotificationItem): void {
    const bellItem = this.items().find((i) => i.key === item.key);
    if (!bellItem) return;
    const uid = this.uid();
    if (bellItem.inboxId && uid) this.inbox.markRead(uid, bellItem.inboxId).catch(() => undefined);
    if (bellItem.invite) this.invites.markSeen(bellItem.invite);
    void this.router.navigateByUrl(bellItem.url);
  }
}
