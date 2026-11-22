import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { of, switchMap } from 'rxjs';
import { AuthService, CollaboratorInvitesService, InboxService } from '../../../core/services';
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

  private readonly uid = computed(() => this.auth.currentUser()?.uid ?? null);
  private readonly history = toSignal(
    toObservable(this.uid).pipe(switchMap((uid) => (uid ? this.inbox.watchAll(uid) : of([])))),
    { initialValue: [] },
  );

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
      ...this.history().map((notification) => ({
        key: notification.id,
        icon:
          notification.kind === 'secret-santa'
            ? ('redeem' as const)
            : notification.kind === 'collaborator'
              ? ('handshake' as const)
              : ('notifications' as const),
        person: null,
        title: notification.title,
        body:
          notification.kind === 'collaborator'
            ? notification.body
            : notification.eventTitle || notification.body,
        url: notification.actionUrl,
        inboxId: notification.id,
        invite: null,
        unread: !notification.readAt,
      })),
    ].sort((a, b) => Number(b.unread) - Number(a.unread)),
  );

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
