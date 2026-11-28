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
  PublicProfileService,
  PushService,
} from '../../../core/services';
import type { AppNotification, EventInvitation } from '../../../core/models';
import {
  FeedbackService,
  OrgNotificationMenuComponent,
  type OrgIconName,
  type OrgNotificationItem,
  type OrgNotificationMenuFooter,
} from '../../ui';

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
    [footer]="pushFooter()"
    (opened)="refresh()"
    (selected)="open($event)"
    (footerSelected)="togglePush()"
  />`,
})
export class NotificationBellComponent {
  private readonly auth = inject(AuthService);
  private readonly inbox = inject(InboxService);
  private readonly invites = inject(CollaboratorInvitesService);
  private readonly router = inject(Router);
  private readonly events = inject(EventService);
  private readonly push = inject(PushService);
  private readonly feedback = inject(FeedbackService);
  private readonly profiles = inject(PublicProfileService);

  /** "Ativar notificações no celular", under the list: only ever asked from here. */
  protected readonly pushFooter = computed<OrgNotificationMenuFooter | null>(() => {
    switch (this.push.state()) {
      case 'off':
        return {
          icon: 'notifications_active',
          title: 'Ativar notificações no celular',
          body: 'Receba os avisos mesmo com o app fechado.',
        };
      case 'on':
        return {
          icon: 'notifications_active',
          title: 'Notificações ativadas',
          body: 'Neste aparelho. Toque para desativar.',
        };
      case 'blocked':
        return {
          icon: 'notifications',
          title: 'Notificações bloqueadas',
          body: 'Libere nas configurações do navegador.',
          disabled: true,
        };
      case 'install':
        return {
          icon: 'notifications',
          title: 'Notificações no iPhone',
          body: 'Adicione o app à Tela de Início para ativar.',
          disabled: true,
        };
      default:
        return null;
    }
  });

  private readonly uid = computed(() => this.auth.currentUser()?.uid ?? null);
  private readonly history = toSignal(
    toObservable(this.uid).pipe(switchMap((uid) => (uid ? this.inbox.watchAll(uid) : of([])))),
    { initialValue: [] },
  );

  /**
   * Each event the notices are about, by event id: its title now and who owns it (`createdBy`).
   * The notice keeps only the event id; the title and the organizer's name are read here.
   */
  private readonly eventsById = signal<
    Readonly<Record<string, { readonly title: string; readonly owner: string }>>
  >({});
  private readonly loadEvents = effect(() => {
    const known = this.eventsById();
    const missing = [...new Set(this.history().map((n) => n.eventId))].filter(
      (id) => id && !(id in known),
    );
    if (!missing.length) return;
    void Promise.all(
      missing.map(async (eventId) => {
        const event = await this.events.getEventById(eventId).catch(() => null);
        return [eventId, { title: event?.title ?? '', owner: event?.createdBy ?? '' }] as const;
      }),
    ).then((found) => this.eventsById.update((all) => ({ ...all, ...Object.fromEntries(found) })));
  });
  /** The people the bell shows (who wrote each notice, who owns each event, who invites). */
  private readonly watchPeople = effect(() => {
    this.profiles.watch([
      ...this.history().map((n) => n.actorUid),
      ...Object.values(this.eventsById()).map((event) => event.owner),
      ...this.invites.invites().map((invite) => invite.invitedBy),
    ]);
  });

  protected readonly items = computed<BellItem[]>(() =>
    [
      ...this.invites.invites().map((invite) => {
        const inviter = this.personOf(
          invite.invitedBy,
          invite.invitedByName,
          invite.invitedByPhoto,
        );
        return {
          key: `invite_${invite.eventId}`,
          icon: 'handshake' as const,
          person: inviter,
          title: 'Convite para colaborar',
          body: [invite.eventTitle || 'Um evento', inviter && `por ${inviter.name}`]
            .filter(Boolean)
            .join(' · '),
          url: `/evento/${invite.eventId}`,
          inboxId: null,
          invite,
          unread: !this.invites.isSeen(invite),
          pinned: true,
        };
      }),
      ...this.history().map((notification) => {
        const event = this.eventsById()[notification.eventId];
        const organizer = this.personOf(event?.owner);
        const eventTitle = event?.title || notification.eventTitle;
        return {
          key: notification.id,
          icon: iconOf(notification),
          person: fromPerson(notification)
            ? this.personOf(notification.actorUid, notification.actorName)
            : organizer,
          title: notification.title,
          body:
            notification.kind === 'collaborator' || fromPerson(notification)
              ? notification.body
              : [eventTitle || notification.body, organizer && `por ${organizer.name}`]
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

  /** A person by account, as their profile shows them now; what older data stored otherwise. */
  private personOf(
    uid: string | undefined,
    storedName?: string,
    storedPhoto?: string | null,
  ): { name: string; photo: string | null } | null {
    const profile = uid ? this.profiles.profiles()[uid] : undefined;
    if (profile) return { name: profile.name, photo: profile.photoURL };
    return storedName ? { name: storedName, photo: storedPhoto ?? null } : null;
  }

  /** A tap while the last one still runs does nothing. */
  private pushBusy = false;

  protected async togglePush(): Promise<void> {
    if (this.pushBusy) return;
    this.pushBusy = true;
    try {
      await this.applyPush();
    } finally {
      this.pushBusy = false;
    }
  }

  private async applyPush(): Promise<void> {
    if (this.push.state() === 'on') {
      await this.push.disable();
      this.feedback.info('Notificações desativadas neste aparelho.');
      return;
    }
    if (await this.push.enable()) {
      this.feedback.success('Pronto! Os avisos chegam neste aparelho.');
    } else if (this.push.state() === 'blocked') {
      this.feedback.info('Notificações bloqueadas. Libere nas configurações do navegador.');
    } else {
      this.feedback.error('Não foi possível ativar as notificações. Tente novamente.');
    }
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

/** A notice about something a person did (answered, joined, left, let in): their face shows. */
function fromPerson(notification: AppNotification): boolean {
  return ['presence', 'collaboration', 'approval'].includes(notification.kind);
}

function iconOf(notification: AppNotification): OrgIconName {
  switch (notification.kind) {
    case 'secret-santa':
      return 'redeem';
    case 'collaborator':
    case 'collaboration':
      return 'handshake';
    case 'presence':
    case 'approval':
      return 'how_to_reg';
    case 'event-status':
      return 'event';
    default:
      return 'notifications';
  }
}
