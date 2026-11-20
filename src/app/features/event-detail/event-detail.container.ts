import { explainError } from '../../core/utils/error.utils';
import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  input,
  OnInit,
  DestroyRef,
  effect,
} from '@angular/core';
import {
  EventService,
  ItemService,
  GuestService,
  AuthService,
  UserService,
  FamilyService,
  ConfettiService,
  SeasonalThemeService,
  DrawerService,
  ClaimService,
  SecretSantaService,
  InboxService,
} from '../../core/services';
import {
  PartyEvent,
  PartyItem,
  Guest,
  type EventClaims,
  type FamilyChecklistRow,
  type FamilyMember,
  type GuestDecline,
  type ItemClaimRequest,
  type RsvpDrawerResult,
  type RsvpSecretSantaData,
  type AppNotification,
  SECRET_SANTA_DEFAULT_GIFT_OPTIONS,
  type SecretSantaDuplicate,
  secretSantaNotificationId,
  type SecretSantaDraw,
  type SecretSantaParticipant,
} from '../../core/models';
import {
  addClaimEntry,
  buildFamilyChecklist,
  buildGuestHouseholds,
  buildItemProgress,
  buildSecretSantaRevealUrl,
  buildSecretSantaWhatsAppUrl,
  buildRsvpSecretSantaEntries,
  findSecretSantaDuplicates,
  hasStarted,
  splitGuestsByApproval,
  type PendingGuest,
  isSecretSantaDrawOutdated,
  isSecretSantaSelfJoinOpen,
  rsvpSecretSantaEntryId,
  secretSantaRsvpId,
  removeClaimEntry,
  toggleBought,
} from '../../core/utils';
import {
  OrgSkeletonComponent,
  FeedbackService,
  OrgDialogService,
  OrgEmptyStateComponent,
  OrgPageLayoutComponent,
} from '../../shared/ui';

import { EventCardComponent } from './components/event-card/event-card.component';
import {
  RsvpCardComponent,
  type RsvpDeclineResult,
  type RsvpSantaJoin,
} from './components/rsvp-card/rsvp-card.component';
import { ItemListCardComponent } from './components/item-list-card/item-list-card.component';
import { PixCardComponent } from './components/pix-card/pix-card.component';
import { FamilyChecklistCardComponent } from './components/family-checklist-card/family-checklist-card.component';
import { GuestListCardComponent } from './components/guest-list-card/guest-list-card.component';
import {
  ClaimSheetComponent,
  type ClaimPerson,
} from './components/claim-sheet/claim-sheet.component';
import {
  SecretSantaCardComponent,
  type SecretSantaShareLink,
} from './components/secret-santa-card/secret-santa-card.component';
import { NotificationCardComponent } from '../../shared/components/notification-card/notification-card.component';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-event-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    OrgSkeletonComponent,
    OrgPageLayoutComponent,
    OrgEmptyStateComponent,
    EventCardComponent,
    RsvpCardComponent,
    ItemListCardComponent,
    PixCardComponent,
    FamilyChecklistCardComponent,
    GuestListCardComponent,
    ClaimSheetComponent,
    SecretSantaCardComponent,
    NotificationCardComponent,
  ],
  templateUrl: './event-detail.container.html',
  styleUrl: './event-detail.container.scss',
})
export class EventDetailContainer implements OnInit {
  readonly id = input.required<string>();

  private readonly eventService = inject(EventService);
  private readonly itemService = inject(ItemService);
  private readonly guestService = inject(GuestService);
  private readonly feedback = inject(FeedbackService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);
  private readonly familyService = inject(FamilyService);
  private readonly confetti = inject(ConfettiService);
  private readonly seasonalThemeService = inject(SeasonalThemeService);
  private readonly dialogs = inject(OrgDialogService);
  private readonly drawerService = inject(DrawerService);
  private readonly claimService = inject(ClaimService);
  private readonly router = inject(Router);
  private readonly secretSantaService = inject(SecretSantaService);
  private readonly inbox = inject(InboxService);

  /** "Sorteio do amigo oculto feito!" for this member, when they take part with their account. */
  protected readonly secretSantaNotice = signal<AppNotification | null>(null);
  private readonly loadSecretSantaNotice = effect((onCleanup) => {
    const uid = this.memberUid();
    if (!uid || this.isOwner()) {
      this.secretSantaNotice.set(null);
      return;
    }
    const sub = this.inbox.watch(uid, secretSantaNotificationId(this.id())).subscribe({
      next: (notice) => this.secretSantaNotice.set(notice),
      error: () => this.secretSantaNotice.set(null),
    });
    onCleanup(() => sub.unsubscribe());
  });

  protected openSecretSantaNotice(notice: AppNotification): void {
    const uid = this.memberUid();
    if (uid) this.inbox.markRead(uid, notice.id).catch(console.error);
    void this.router.navigateByUrl(notice.actionUrl);
  }

  protected readonly event = signal<PartyEvent | null>(null);
  protected readonly items = signal<PartyItem[]>([]);
  protected readonly guests = signal<Guest[]>([]);
  protected readonly loading = signal(true);
  protected readonly rsvpLoading = signal(false);
  protected readonly claims = signal<EventClaims[]>([]);
  private readonly familyMembers = signal<FamilyMember[]>([]);
  /** The family list is read once per visit, even when it turns out empty. */
  private familyLoaded = false;
  /** Item open in the "Eu levo" sheet. */
  private readonly claimingItemId = signal<string | null>(null);
  protected readonly claimSaving = signal(false);

  protected readonly memberUid = computed(() => {
    const user = this.authService.currentUser();
    return user && !user.isAnonymous ? user.uid : null;
  });

  /** The member said they cannot attend; cleared when they confirm after all. */
  protected readonly declined = signal(false);
  private readonly loadDeclined = effect(() => {
    const uid = this.memberUid();
    const eventId = this.id();
    if (!uid) {
      this.declined.set(false);
      return;
    }
    this.userService
      .getDeclinedEvents(uid)
      .then((ids) => this.declined.set(ids.includes(eventId)))
      .catch(console.error);
  });

  protected readonly isDeclined = computed(() => this.declined() && !this.isUserConfirmed());

  /**
   * "Aprovar quem confirma pelo link": only approved guests count (the list, the total, the
   * amigo oculto); the ones waiting go to the organizers' "Aguardando aprovação".
   */
  private readonly guestSplit = computed(() =>
    splitGuestsByApproval(this.guests(), !!this.event()?.requireApproval),
  );
  private readonly listedGuests = computed(() => this.guestSplit().approved);
  protected readonly pendingGuests = computed<PendingGuest[]>(() =>
    this.canEdit() ? this.guestSplit().pending : [],
  );
  protected readonly approvingGuestId = signal<string | null>(null);
  /** The member confirmed, and the owner has not approved it yet. */
  protected readonly isUserPending = computed(() => {
    const uid = this.memberUid();
    return (
      !!uid &&
      !!this.event()?.requireApproval &&
      this.guests().some((g) => (g.id === uid || g.uid === uid) && g.approved === false)
    );
  });

  /** "Quem vai": every confirmed household, who comes with them and what they bring. */
  protected readonly households = computed(() =>
    buildGuestHouseholds(this.listedGuests(), this.items(), this.claims()),
  );

  /** Who said "Não poderei ir"; only the organizers may read it, so it loads for them only. */
  protected readonly declines = signal<GuestDecline[]>([]);
  private declinesLoadedFor: string | null = null;
  private readonly loadDeclines = effect((onCleanup) => {
    if (!this.canEdit()) {
      this.declines.set([]);
      return;
    }
    const eventId = this.id();
    if (this.declinesLoadedFor === eventId) return;
    this.declinesLoadedFor = eventId;
    const sub = this.guestService.listDeclines(eventId).subscribe({
      next: (declines) => this.declines.set(declines),
      error: () => this.declines.set([]),
    });
    onCleanup(() => {
      sub.unsubscribe();
      this.declinesLoadedFor = null;
    });
  });

  /** Amigo oculto: the organizers see the participants; only the owner reads the draw. */
  protected readonly showSecretSanta = computed(
    () => !!this.event()?.secretSanta?.enabled && this.canEdit(),
  );
  protected readonly secretSantaParticipants = signal<SecretSantaParticipant[]>([]);
  protected readonly secretSantaDraw = signal<SecretSantaDraw | null>(null);
  protected readonly secretSantaDrawing = signal(false);
  private readonly loadSecretSantaParticipants = effect((onCleanup) => {
    if (!this.showSecretSanta()) {
      this.secretSantaParticipants.set([]);
      return;
    }
    const sub = this.secretSantaService.listParticipants(this.id()).subscribe({
      next: (participants) => this.secretSantaParticipants.set(participants),
      error: () => this.secretSantaParticipants.set([]),
    });
    onCleanup(() => sub.unsubscribe());
  });
  private readonly loadSecretSantaDraw = effect((onCleanup) => {
    if (!this.showSecretSanta() || !this.isOwner()) {
      this.secretSantaDraw.set(null);
      return;
    }
    const sub = this.secretSantaService.watchDraw(this.id()).subscribe({
      next: (draw) => this.secretSantaDraw.set(draw),
      error: () => this.secretSantaDraw.set(null),
    });
    onCleanup(() => sub.unsubscribe());
  });
  /** When each link was opened (by token), live: links open once. */
  private readonly secretSantaOpenedAt = signal<Record<string, string | null>>({});
  private readonly watchSecretSantaOpened = effect((onCleanup) => {
    const tokens = (this.secretSantaDraw()?.links ?? []).map((link) => link.token);
    this.secretSantaOpenedAt.set({});
    const subs = tokens.map((token) =>
      this.secretSantaService.watchOpenedAt(token).subscribe({
        next: (openedAt) =>
          this.secretSantaOpenedAt.update((all) => ({ ...all, [token]: openedAt })),
        error: () => undefined,
      }),
    );
    onCleanup(() => subs.forEach((sub) => sub.unsubscribe()));
  });
  protected readonly secretSantaResendingId = signal<string | null>(null);
  /**
   * Participants added from a confirmed guest with an account, by participant id: the draw
   * also tells them in the app. Relatives and companions have no account of their own.
   */
  private readonly secretSantaAccounts = computed<Record<string, string>>(() => {
    const uidByGuest = new Map(
      this.guests()
        .filter((guest) => guest.uid)
        .map((guest) => [guest.id, guest.uid!] as const),
    );
    const accounts: Record<string, string> = {};
    for (const participant of this.secretSantaParticipants()) {
      const own =
        participant.joinedBy && participant.id === secretSantaRsvpId(participant.joinedBy)
          ? participant.joinedBy
          : undefined;
      const uid = own ?? (participant.guestId ? uidByGuest.get(participant.guestId) : undefined);
      if (uid) accounts[participant.id] = uid;
    }
    return accounts;
  });
  /** The same person twice: sure pairs are joined at once, doubtful ones go to the card. */
  private readonly secretSantaDuplicates = computed(() =>
    findSecretSantaDuplicates(this.secretSantaParticipants()),
  );
  protected readonly secretSantaDoubtful = computed(() =>
    this.secretSantaDuplicates().filter((pair) => !pair.sure),
  );
  protected readonly secretSantaBusyDuplicate = signal<string | null>(null);
  private readonly mergingSecretSanta = new Set<string>();
  /**
   * Someone typed by the organizer joined from the invite too (same guest, or same phone and
   * first name): the two entries become one, tied to the account. Each pair is tried once per
   * visit; another organizer's page may have merged it already.
   */
  private readonly autoMergeSecretSanta = effect(() => {
    if (!this.canEdit()) return;
    for (const pair of this.secretSantaDuplicates()) {
      if (!pair.sure || this.mergingSecretSanta.has(pair.drop.id)) continue;
      this.mergingSecretSanta.add(pair.drop.id);
      this.secretSantaService.mergeDuplicate(this.id(), pair).catch(console.error);
    }
  });
  protected readonly secretSantaSelfJoinOpen = computed(() =>
    isSecretSantaSelfJoinOpen(this.event()?.secretSanta),
  );

  /**
   * Where the member stands in the amigo oculto (only their own entry: they cannot read the
   * list), for the presence card. Reloaded after they change it.
   */
  protected readonly mySecretSanta = signal<RsvpSecretSantaData | null>(null);
  protected readonly myPhone = signal('');
  private readonly mySecretSantaVersion = signal(0);
  private readonly loadMySecretSanta = effect((onCleanup) => {
    const uid = this.memberUid();
    const settings = this.event()?.secretSanta;
    this.mySecretSantaVersion();
    if (!uid || !settings?.enabled) {
      this.mySecretSanta.set(null);
      return;
    }
    let active = true;
    onCleanup(() => (active = false));
    Promise.all([
      this.secretSantaService.getOwnEntries(this.id(), [secretSantaRsvpId(uid)]),
      this.userService.getProfile(uid).catch(() => null),
    ])
      .then(([entries, profile]) => {
        if (!active) return;
        this.myPhone.set(profile?.phone || this.authService.currentUser()?.phoneNumber || '');
        this.mySecretSanta.set({
          open: isSecretSantaSelfJoinOpen(settings) && this.mayJoinSecretSanta(uid),
          ...(this.waitsForApproval(uid) ? { waitingApproval: true } : {}),
          giftOptions: settings.giftOptions,
          maxGiftOptions: settings.maxGiftOptions ?? SECRET_SANTA_DEFAULT_GIFT_OPTIONS,
          joined: Object.fromEntries(entries.map((entry) => ['self', entry.giftOptions])),
        });
      })
      .catch(console.error);
  });

  protected readonly secretSantaLinks = computed<SecretSantaShareLink[]>(() => {
    const origin = typeof location === 'undefined' ? '' : location.origin;
    const opened = this.secretSantaOpenedAt();
    return (this.secretSantaDraw()?.links ?? []).map((link) => ({
      participantId: link.participantId,
      name: link.name,
      phone: link.phone,
      url: buildSecretSantaRevealUrl(origin, link.token),
      openedAt: opened[link.token] ?? null,
      notifiedInApp: !!link.uid,
    }));
  });
  protected readonly secretSantaOutdated = computed(() =>
    isSecretSantaDrawOutdated(
      this.secretSantaDraw(),
      this.secretSantaParticipants().map((p) => p.id),
    ),
  );

  /**
   * Início finds confirmed events in the profile's rsvpEvents. A presence confirmed before that
   * list was kept is added the first time the member opens the event.
   */
  private attendingSyncedFor: string | null = null;
  private readonly syncAttending = effect(() => {
    const uid = this.memberUid();
    if (!uid || !this.isUserConfirmed() || this.attendingSyncedFor === uid) return;
    this.attendingSyncedFor = uid;
    this.userService.setAttending(uid, this.id(), true).catch(console.error);
  });

  /** The name the organizer sees on a decline. */
  private declineName(): string {
    const user = this.authService.currentUser();
    return (
      this.currentGuestName() || user?.displayName || user?.email?.split('@')[0] || 'Convidado(a)'
    );
  }

  /** Opening the invite link puts the event on the member's Início; nothing else does. */
  private rememberedFor: string | null = null;
  private readonly rememberInvite = effect(() => {
    const uid = this.memberUid();
    const event = this.event();
    if (!uid || !event || event.createdBy === uid || (event.collaborators ?? []).includes(uid)) {
      return;
    }
    if (this.rememberedFor === uid) return;
    this.rememberedFor = uid;
    this.userService.rememberInvitedEvent(uid, event.id).catch(console.error);
  });

  protected readonly progress = computed(() =>
    buildItemProgress(this.items(), this.claims(), this.memberUid()),
  );

  private readonly myClaims = computed(() => {
    const uid = this.memberUid();
    return uid ? (this.claims().find((claims) => claims.id === uid) ?? null) : null;
  });

  protected readonly checklist = computed(() =>
    buildFamilyChecklist(this.items(), this.myClaims()),
  );

  protected readonly claimingEntry = computed(
    () => this.progress().find((entry) => entry.item.id === this.claimingItemId()) ?? null,
  );

  /** "Quem da família vai levar?": the member and only the relatives confirmed for this event. */
  protected readonly claimPeople = computed<ClaimPerson[]>(() => {
    const uid = this.memberUid();
    const going = new Set(
      this.guests()
        .filter((guest) => uid && guest.primaryGuestId === uid)
        .map((guest) => guest.id.replace(`${uid}_`, '')),
    );
    return [
      { id: null, name: 'Você' },
      ...this.familyMembers()
        .filter((member) => going.has(member.id))
        .map((member) => ({ id: member.id, name: member.name })),
    ];
  });

  protected readonly isOwner = computed(() => {
    const uid = this.memberUid();
    return !!uid && this.event()?.createdBy === uid;
  });

  protected readonly canEdit = computed(() => {
    const uid = this.memberUid();
    const event = this.event();
    if (!uid || !event) return false;
    return (
      event.createdBy === uid ||
      (event.collaborators ?? []).includes(uid) ||
      this.authService.isSuperAdmin()
    );
  });

  /** Organizers edit the event only until it starts; afterwards it is history. */
  protected readonly canEditEvent = computed(
    () => this.canEdit() && !hasStarted(this.event()?.date),
  );

  protected readonly guestCount = computed(() => {
    return this.listedGuests().reduce(
      (sum, guest) => sum + 1 + (guest.companions?.length ?? guest.companionsCount ?? 0),
      0,
    );
  });

  /** Only signed-in accounts answer invites; there are no anonymous guests. */
  protected readonly isUserConfirmed = computed(() => {
    const uid = this.memberUid();
    return !!uid && this.guests().some((g) => g.id === uid || g.uid === uid);
  });

  protected readonly currentGuestName = computed(() => {
    const uid = this.memberUid();
    if (!uid) return null;
    const found = this.guests().find((g) => g.id === uid || g.uid === uid);
    return found?.name ?? this.authService.currentUser()?.displayName ?? null;
  });

  ngOnInit(): void {
    const eventId = this.id();

    const eventSub = this.eventService.getEvent(eventId).subscribe({
      next: (event) => {
        this.event.set(event);
        if (event) {
          this.seasonalThemeService.evaluateEventTheme(event.date, event.title, event.category);
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });

    const itemsSub = this.itemService.listItems(eventId).subscribe({
      next: (items) => this.items.set(items),
    });

    const guestsSub = this.guestService.listGuests(eventId).subscribe({
      next: (guests) => this.guests.set(guests),
    });

    const claimsSub = this.claimService.listClaims(eventId).subscribe({
      next: (claims) => this.claims.set(claims),
    });

    this.destroyRef.onDestroy(() => {
      eventSub.unsubscribe();
      itemsSub.unsubscribe();
      guestsSub.unsubscribe();
      claimsSub.unsubscribe();
      this.seasonalThemeService.resetToAuto();
    });
  }

  protected async onDrawSecretSanta(): Promise<void> {
    const event = this.event();
    if (!event || !this.isOwner() || this.secretSantaDrawing()) return;
    const previous = this.secretSantaDraw();
    if (previous) {
      const confirmed = await firstValueFrom(
        this.dialogs.confirm({
          title: 'Sortear de novo?',
          message:
            'Os links enviados antes deixam de funcionar e cada pessoa recebe um novo link. Você vai precisar enviar os links de novo.',
          confirmLabel: 'Sortear de novo',
          cancelLabel: 'Manter sorteio',
          tone: 'danger',
          icon: 'cancel',
        }),
      );
      if (!confirmed) return;
    }
    this.secretSantaDrawing.set(true);
    try {
      const draw = await this.secretSantaService.draw(
        event,
        this.secretSantaParticipants(),
        previous,
        this.secretSantaAccounts(),
      );
      const inApp = draw.links.filter((link) => link.uid).length;
      this.feedback.success(
        inApp
          ? `Sorteio feito! ${inApp === 1 ? '1 pessoa foi avisada' : inApp + ' pessoas foram avisadas'} no app. Envie também o link pelo WhatsApp.`
          : 'Sorteio feito! Agora envie o link de cada pessoa.',
      );
    } catch (error) {
      this.feedback.error(explainError('Não foi possível fazer o sorteio. Tente de novo.', error));
    } finally {
      this.secretSantaDrawing.set(false);
    }
  }

  protected onSendSecretSanta(link: SecretSantaShareLink): void {
    const url = buildSecretSantaWhatsAppUrl({
      name: link.name,
      phone: link.phone,
      eventTitle: this.event()?.title ?? '',
      url: link.url,
      organizerName: this.event()?.creatorName ?? '',
    });
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  /** A new link for one person, with the same person drawn; the old link stops working. */
  protected async onResendSecretSanta(link: SecretSantaShareLink): Promise<void> {
    const event = this.event();
    const draw = this.secretSantaDraw();
    if (!event || !draw || !this.isOwner() || this.secretSantaResendingId()) return;
    const confirmed = await firstValueFrom(
      this.dialogs.confirm({
        title: `Novo link para ${link.name}?`,
        message: `O link atual de ${link.name} deixa de funcionar. ${link.name} continua com a mesma pessoa sorteada; depois é só enviar o novo link.`,
        confirmLabel: 'Criar novo link',
        cancelLabel: 'Voltar',
      }),
    );
    if (!confirmed) return;
    this.secretSantaResendingId.set(link.participantId);
    try {
      await this.secretSantaService.resendLink(
        event,
        draw,
        link.participantId,
        this.secretSantaParticipants(),
        this.secretSantaAccounts(),
      );
      this.feedback.success(`Novo link de ${link.name} pronto. Toque em WhatsApp para enviar.`);
    } catch (error) {
      this.feedback.error(
        error instanceof Error && error.message.includes('sorteie de novo')
          ? error.message
          : 'Não foi possível criar o novo link. Tente de novo.',
      );
    } finally {
      this.secretSantaResendingId.set(null);
    }
  }

  protected async onMergeSecretSanta(pair: SecretSantaDuplicate): Promise<void> {
    this.secretSantaBusyDuplicate.set(pair.drop.id);
    try {
      await this.secretSantaService.mergeDuplicate(this.id(), pair);
      this.feedback.success(`${pair.keep.name} agora aparece uma vez só.`);
    } catch (err) {
      console.error(err);
      this.feedback.error(explainError('Não foi possível juntar. Tente novamente.', err));
    } finally {
      this.secretSantaBusyDuplicate.set(null);
    }
  }

  protected async onDistinctSecretSanta(pair: SecretSantaDuplicate): Promise<void> {
    this.secretSantaBusyDuplicate.set(pair.drop.id);
    try {
      await this.secretSantaService.markDistinct(this.id(), pair);
    } catch (err) {
      console.error(err);
      this.feedback.error(explainError('Não foi possível salvar. Tente novamente.', err));
    } finally {
      this.secretSantaBusyDuplicate.set(null);
    }
  }

  protected async onSecretSantaSelfJoin(open: boolean): Promise<void> {
    const event = this.event();
    if (!event?.secretSanta || !this.isOwner()) return;
    try {
      await this.secretSantaService.setSelfJoin(event.id, event.secretSanta, open);
      this.feedback.success(
        open
          ? 'Os convidados podem entrar no amigo oculto pelo convite.'
          : 'Inscrições pelo convite fechadas.',
      );
    } catch (err) {
      console.error(err);
      this.feedback.error(
        explainError('Não foi possível mudar as inscrições. Tente novamente.', err),
      );
    }
  }

  /** "Quero participar só do amigo oculto": in the draw without going. */
  protected async onJoinSecretSantaOnly(join: RsvpSantaJoin): Promise<void> {
    const uid = this.memberUid();
    if (!uid) return;
    this.rsvpLoading.set(true);
    try {
      await this.saveOwnSecretSanta(uid, join);
      this.feedback.success('Você entrou no amigo oculto!');
    } catch (err) {
      console.error(err);
      this.feedback.error(
        explainError('Não foi possível entrar no amigo oculto. Tente novamente.', err),
      );
    } finally {
      this.rsvpLoading.set(false);
    }
  }

  protected async onLeaveSecretSanta(): Promise<void> {
    const uid = this.memberUid();
    if (!uid) return;
    this.rsvpLoading.set(true);
    try {
      await this.secretSantaService.saveOwnEntries(this.id(), uid, [], [secretSantaRsvpId(uid)]);
      this.mySecretSantaVersion.update((v) => v + 1);
      this.feedback.success('Você saiu do amigo oculto.');
    } catch (err) {
      console.error(err);
      this.feedback.error(
        explainError('Não foi possível sair do amigo oculto. Tente novamente.', err),
      );
    } finally {
      this.rsvpLoading.set(false);
    }
  }

  /**
   * The member's own entry, for someone not going: in the draw with `join`, or out of it (null).
   * Relatives and companions only take part with a confirmed presence, so they always leave.
   */
  private async saveOwnSecretSanta(
    uid: string,
    join: RsvpSantaJoin | null,
    others: readonly string[] = this.ownSecretSantaOthers(uid),
  ): Promise<void> {
    if (!this.mySecretSanta()?.open) return;
    const selfId = secretSantaRsvpId(uid);
    const entries = join
      ? [
          {
            id: selfId,
            input: {
              name: this.declineName(),
              phone: join.phone,
              giftOptions: [...join.gifts],
              guestId: uid,
            },
          },
        ]
      : [];
    const wasIn = !!this.mySecretSanta()?.joined['self'];
    await this.secretSantaService.saveOwnEntries(
      this.id(),
      uid,
      entries,
      join ? others : [selfId, ...others],
      wasIn ? [selfId] : [],
    );
    this.mySecretSantaVersion.update((v) => v + 1);
  }

  /** The entries of the relatives and companions confirmed with the member's presence. */
  private ownSecretSantaOthers(uid: string): string[] {
    const mine = this.guests().find((guest) => guest.id === uid || guest.uid === uid);
    return [
      ...this.guests()
        .filter((guest) => guest.primaryGuestId === uid)
        .map((guest) => rsvpSecretSantaEntryId(uid, `f:${guest.id.replace(`${uid}_`, '')}`)),
      ...(mine?.companions ?? []).map((c) => rsvpSecretSantaEntryId(uid, `c:${c.name}`)),
    ];
  }

  /** After "Não poderei ir": stays in (or leaves) the amigo oculto; never fails the answer. */
  private async afterDeclineSecretSanta(
    uid: string,
    result: RsvpDeclineResult,
    others?: readonly string[],
  ): Promise<void> {
    try {
      await this.saveOwnSecretSanta(uid, result.santa, others);
      if (result.santa) this.feedback.success('Você continua no amigo oculto.');
    } catch (err) {
      console.error(err);
      this.feedback.error(
        explainError('Sua resposta foi salva, mas não deu para salvar o amigo oculto.', err),
      );
    }
  }

  protected onEditSecretSanta(): void {
    void this.router.navigate(['/meus-eventos/evento', this.id()]);
  }

  protected onEditRsvp(): Promise<void> {
    return this.onConfirmRsvp(undefined, true);
  }

  /** "Não poderei ir" on an invite not answered yet: nothing to cancel, only the answer. */
  protected async onDeclineRsvp(
    result: RsvpDeclineResult = { message: '', santa: null },
  ): Promise<void> {
    const uid = this.memberUid();
    if (!uid) return;
    this.rsvpLoading.set(true);
    try {
      await this.guestService.saveDecline(this.id(), uid, this.declineName(), result.message);
      await this.userService.setDeclined(uid, this.id(), true);
      this.declined.set(true);
      this.feedback.success('Tudo bem, avisamos que você não poderá ir.');
      await this.afterDeclineSecretSanta(uid, result);
    } catch (err: unknown) {
      this.feedback.error(explainError('Não foi possível recusar o convite', err));
    } finally {
      this.rsvpLoading.set(false);
    }
  }

  protected async onConfirmRsvp(event?: Event, editing = false): Promise<void> {
    this.rsvpLoading.set(true);
    try {
      const user = this.authService.currentUser();
      if (!user || user.isAnonymous) {
        // Answering needs an account: sign in, then come back to this invite.
        await this.router.navigate(['/login'], {
          queryParams: { redirect: '/evento/' + this.id() },
        });
        return;
      }

      // The guest is named as on their profile; the RSVP never edits the name.
      const profile = await this.userService.getProfile(user.uid);
      const name =
        profile?.name?.trim() || user.displayName || user.email?.split('@')[0] || 'Convidado';
      const email = user.email ?? '';
      const photoUrl = user.photoURL ?? '';
      const phone = profile?.phone || user.phoneNumber || '';

      const familyMembers = await this.familyService.getFamilyMembers(user.uid);
      const mine = this.guests().find((guest) => guest.id === user.uid || guest.uid === user.uid);
      const familyPrefix = `${user.uid}_`;
      const confirmedFamilyIds = this.guests()
        .filter((guest) => guest.primaryGuestId === user.uid)
        .map((guest) => guest.id.replace(familyPrefix, ''));
      const existing =
        editing && mine
          ? {
              companions: (mine.companions ?? []).map((companion) => companion.name),
              familyMemberIds: confirmedFamilyIds,
            }
          : undefined;

      const santa = await this.loadDrawerSecretSanta(user.uid, familyMembers, [
        ...(profile?.savedCompanions ?? []),
        ...(existing?.companions ?? []),
      ]);

      this.drawerService.open({
        kind: 'rsvp',
        trigger: event?.currentTarget as HTMLElement | undefined,
        data: {
          session: { name, phone },
          savedCompanions: profile?.savedCompanions ?? [],
          familyMembers,
          userId: user.uid,
          existing,
          ...(santa ? { secretSanta: santa.data } : {}),
          addFamilyMember: async (member) => {
            try {
              const saved = await this.familyService.addFamilyMember(user.uid, member);
              this.feedback.success(`${saved.name} foi adicionado(a) à sua família.`);
              return saved;
            } catch (err) {
              console.error(err);
              this.feedback.error(
                explainError('Não foi possível adicionar o familiar. Tente novamente.', err),
              );
              throw err;
            }
          },
        },
        onComplete: async (result: RsvpDrawerResult) => {
          const newPhone = result.phone || phone;
          // The RSVP phone is the profile phone: changing it here changes it there too.
          if (newPhone !== phone && !(await this.confirmPhoneChange(newPhone))) {
            this.feedback.info('Nada foi salvo. Seu telefone continua o mesmo.');
            return;
          }
          this.rsvpLoading.set(true);
          try {
            await this.guestService.batchConfirmRsvp(
              this.id(),
              {
                uid: user.uid,
                name,
                email,
                phone: newPhone,
                photoUrl,
                companions: result.companions,
                pendingApproval: !!this.event()?.requireApproval && !mine,
              },
              result.selectedFamilyMembers ?? [],
              confirmedFamilyIds.filter(
                (id) => !(result.selectedFamilyMembers ?? []).some((member) => member.id === id),
              ),
            );
            this.userService.setAttending(user.uid, this.id(), true).catch(console.error);
            this.userService
              .rememberCompanions(
                user.uid,
                result.companions.map((companion) => companion.name),
              )
              .catch(console.error);
            if (this.declined()) {
              await this.userService.setDeclined(user.uid, this.id(), false);
              this.guestService.removeDecline(this.id(), user.uid).catch(console.error);
              this.declined.set(false);
            }

            if (newPhone !== phone) {
              this.userService.upsertProfile(user.uid, { phone: newPhone }).catch(console.error);
            }

            if (result.secretSanta && santa) {
              await this.saveDrawerSecretSanta(user.uid, name, newPhone, result, santa.existingIds);
            }

            if (existing) {
              this.feedback.success('Presença atualizada!');
            } else if (this.event()?.requireApproval) {
              this.feedback.success('Pronto! Agora é só esperar quem organiza aprovar.');
            } else {
              this.confetti.fireSuccessConfetti();
              this.feedback.success('Presença confirmada!');
            }
          } catch (err) {
            console.error(err);
            this.feedback.error(explainError('Não foi possível confirmar a presença', err), {
              duration: 4000,
            });
          } finally {
            this.rsvpLoading.set(false);
          }
        },
      });
    } catch (err: unknown) {
      console.error(err);
      this.feedback.error(
        explainError('Não foi possível abrir a confirmação. Tente novamente.', err),
        {
          duration: 4000,
        },
      );
    } finally {
      this.rsvpLoading.set(false);
    }
  }

  /**
   * What the drawer needs to ask "Quem vai participar do amigo oculto?": the entries this member
   * already wrote (themself, relatives, companions), read one by one. Null without amigo oculto.
   */
  private async loadDrawerSecretSanta(
    uid: string,
    familyMembers: readonly FamilyMember[],
    companions: readonly string[],
  ): Promise<{ data: RsvpSecretSantaData; existingIds: string[] } | null> {
    const settings = this.event()?.secretSanta;
    if (!settings?.enabled) return null;
    const keys = [
      'self',
      ...familyMembers.map((member) => `f:${member.id}`),
      ...[...new Set(companions)].map((name) => `c:${name}`),
    ];
    const idToKey = new Map(keys.map((key) => [rsvpSecretSantaEntryId(uid, key), key]));
    const entries = await this.secretSantaService.getOwnEntries(this.id(), [...idToKey.keys()]);
    return {
      existingIds: entries.map((entry) => entry.id),
      data: {
        open: isSecretSantaSelfJoinOpen(settings) && this.mayJoinSecretSanta(uid),
        ...(this.waitsForApproval(uid) ? { waitingApproval: true } : {}),
        giftOptions: settings.giftOptions,
        maxGiftOptions: settings.maxGiftOptions ?? SECRET_SANTA_DEFAULT_GIFT_OPTIONS,
        joined: Object.fromEntries(
          entries.map((entry) => [idToKey.get(entry.id) ?? 'self', entry.giftOptions]),
        ),
      },
    };
  }

  /** An event that asks for approval: only an approved guest joins the amigo oculto alone. */
  private mayJoinSecretSanta(uid: string): boolean {
    if (!this.event()?.requireApproval) return true;
    const mine = this.guests().find((g) => g.id === uid || g.uid === uid);
    return !!mine && mine.approved !== false;
  }

  private waitsForApproval(uid: string): boolean {
    return !!this.event()?.requireApproval && !this.mayJoinSecretSanta(uid);
  }

  protected async onApproveGuest(guest: PendingGuest): Promise<void> {
    this.approvingGuestId.set(guest.id);
    try {
      await this.guestService.approveGuest(this.id(), guest.id);
      this.feedback.success(`${guest.name} entrou na lista.`);
    } catch (err) {
      console.error(err);
      this.feedback.error(explainError('Não foi possível aprovar. Tente novamente.', err));
    } finally {
      this.approvingGuestId.set(null);
    }
  }

  protected onRefuseGuest(guest: PendingGuest): void {
    this.dialogs
      .confirm({
        title: `Recusar ${guest.name}?`,
        message:
          'A confirmação sai da lista de espera, com quem vinha junto. A pessoa pode confirmar de novo pelo link, e você decide outra vez.',
        confirmLabel: 'Recusar',
        cancelLabel: 'Voltar',
        tone: 'danger',
        icon: 'cancel',
      })
      .subscribe(async (confirmed) => {
        if (!confirmed) return;
        this.approvingGuestId.set(guest.id);
        try {
          const uid = this.guests().find((g) => g.id === guest.id)?.uid ?? guest.id;
          const santaIds = this.secretSantaParticipants()
            .filter((p) => p.joinedBy === uid)
            .map((p) => p.id);
          await this.guestService.refuseGuest(this.id(), guest.id, guest.familyGuestIds, santaIds);
          this.feedback.success(`A confirmação de ${guest.name} foi recusada.`);
        } catch (err) {
          console.error(err);
          this.feedback.error(explainError('Não foi possível recusar. Tente novamente.', err));
        } finally {
          this.approvingGuestId.set(null);
        }
      });
  }

  /** Writes who the member put in the draw; the presence is saved even if this fails. */
  private async saveDrawerSecretSanta(
    uid: string,
    name: string,
    phone: string,
    result: RsvpDrawerResult,
    existingIds: readonly string[],
  ): Promise<void> {
    try {
      const entries = buildRsvpSecretSantaEntries({
        uid,
        name,
        phone,
        familyMembers: result.selectedFamilyMembers,
        companions: result.companions.map((companion) => companion.name),
        choice: result.secretSanta ?? {},
      });
      const keep = new Set(entries.map((entry) => entry.id));
      await this.secretSantaService.saveOwnEntries(
        this.id(),
        uid,
        entries,
        existingIds.filter((id) => !keep.has(id)),
        existingIds,
      );
      this.mySecretSantaVersion.update((v) => v + 1);
    } catch (err) {
      console.error(err);
      this.feedback.error(
        explainError('Sua presença foi salva, mas não deu para salvar o amigo oculto.', err),
      );
    }
  }

  /** Asks before the RSVP changes the profile phone as well. */
  private confirmPhoneChange(newPhone: string): Promise<boolean> {
    return new Promise((resolve) => {
      this.dialogs
        .confirm({
          title: 'Atualizar seu telefone?',
          message: 'O telefone do seu perfil também passa a ser ' + newPhone + '.',
          confirmLabel: 'Atualizar',
          cancelLabel: 'Cancelar',
          icon: 'info',
        })
        .subscribe((confirmed) => resolve(!!confirmed));
    });
  }

  protected async onCancelRsvp(
    answer: RsvpDeclineResult = { message: '', santa: null },
  ): Promise<void> {
    const message = answer.message;
    this.dialogs
      .confirm({
        title: 'Cancelar Presença',
        message:
          'Tem certeza que não poderá mais ir? Sua presença será cancelada e os itens que você selecionou voltarão para a lista.',
        confirmLabel: 'Cancelar presença',
        cancelLabel: 'Continuo indo',
        tone: 'danger',
        icon: 'cancel',
      })
      .subscribe(async (result) => {
        if (result) {
          this.rsvpLoading.set(true);
          try {
            const targetUid = this.memberUid();

            if (targetUid) {
              // Read before the presence goes: the relatives leave the amigo oculto with it.
              const santaOthers = this.ownSecretSantaOthers(targetUid);
              await this.guestService.cancelRsvp(this.id(), targetUid, targetUid, targetUid);
              // Remembered as declined, so Início shows it as "Recusado" and the organizer sees why.
              this.declined.set(true);
              this.userService.setDeclined(targetUid, this.id(), true).catch(console.error);
              this.userService.setAttending(targetUid, this.id(), false).catch(console.error);
              this.guestService
                .saveDecline(this.id(), targetUid, this.declineName(), message)
                .catch(console.error);
              await this.afterDeclineSecretSanta(targetUid, answer, santaOthers);
            }

            this.feedback.success('Sua presença foi cancelada.');
          } catch (err: unknown) {
            this.feedback.error(explainError('Não foi possível cancelar a presença', err));
          } finally {
            this.rsvpLoading.set(false);
          }
        }
      });
  }

  protected async onClaimItemById(itemId: string): Promise<void> {
    if (!this.isUserConfirmed() || !this.memberUid()) {
      this.feedback.info('Por favor, confirme sua presença primeiro.');
      return;
    }
    if (this.isUserPending()) {
      this.feedback.info('Sua presença ainda espera a aprovação de quem organiza.');
      return;
    }
    if (!this.familyLoaded) {
      try {
        this.familyMembers.set(await this.familyService.getFamilyMembers(this.memberUid()!));
        this.familyLoaded = true;
      } catch {
        // Without the family list the account holder can still claim for themself.
      }
    }
    this.claimingItemId.set(itemId);
  }

  protected closeClaimSheet(): void {
    this.claimingItemId.set(null);
  }

  protected async onConfirmClaim(request: ItemClaimRequest): Promise<void> {
    const ownName = this.currentGuestName() || 'Convidado';
    const entries = addClaimEntry(this.myClaims()?.entries ?? [], {
      ...request,
      who: request.memberId ? request.who : ownName,
    });
    this.claimSaving.set(true);
    try {
      await this.saveMyClaims(entries);
      this.claimingItemId.set(null);
      this.confetti.fireSuccessConfetti();
      this.feedback.success('Item assumido com sucesso!');
    } catch (error) {
      this.feedback.error(explainError('Não foi possível assumir o item', error));
    } finally {
      this.claimSaving.set(false);
    }
  }

  protected async onToggleBought(row: FamilyChecklistRow): Promise<void> {
    try {
      await this.saveMyClaims(
        toggleBought(this.myClaims()?.entries ?? [], row.itemId, row.memberId),
      );
    } catch (error) {
      this.feedback.error(explainError('Não foi possível salvar. Tente novamente.', error));
    }
  }

  protected async onRemoveClaim(row: FamilyChecklistRow): Promise<void> {
    try {
      await this.saveMyClaims(
        removeClaimEntry(this.myClaims()?.entries ?? [], row.itemId, row.memberId),
      );
      this.feedback.success('Item liberado.');
    } catch (error) {
      this.feedback.error(explainError('Não foi possível liberar o item', error));
    }
  }

  protected editEvent(): void {
    void this.router.navigate(['/meus-eventos/evento', this.id()]);
  }

  /** Saves the household document; the snapshot listener refreshes the screen. */
  private async saveMyClaims(entries: EventClaims['entries']): Promise<void> {
    const uid = this.memberUid();
    if (!uid) return;
    await this.claimService.saveClaims(this.id(), uid, this.currentGuestName() || '', entries);
  }

  protected exportGuests(): void {
    const quote = (value: string) => `"${value.replace(/"/g, '""')}"`;
    const rows = this.households().map((household) =>
      [household.name, household.phone, household.people.join(', '), household.bring.join(', ')]
        .map(quote)
        .join(','),
    );
    const csv = ['Nome,Telefone,Quem vai junto,O que leva', ...rows].join('\n');
    // The byte order mark makes Excel read the accents as UTF-8.
    const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `convidados-${this.event()?.title || 'evento'}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  protected printGuests(): void {
    window.print();
  }
}
