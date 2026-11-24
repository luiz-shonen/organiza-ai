import { NgTemplateOutlet } from '@angular/common';
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
  untracked,
} from '@angular/core';
import {
  EventService,
  ItemService,
  GuestService,
  AuthService,
  CollaboratorInvitesService,
  UserService,
  FamilyService,
  NameSyncService,
  ConfettiService,
  CelebrationSoundService,
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
  type SecretSantaParticipantInput,
  type SecretSantaRosterEntry,
  type EventInvitation,
} from '../../core/models';
import {
  addClaimEntry,
  buildFamilyChecklist,
  buildGuestHouseholds,
  countGuests,
  isPet,
  buildItemProgress,
  buildSecretSantaRevealUrl,
  buildSecretSantaWhatsAppUrl,
  buildRsvpSecretSantaEntries,
  findSecretSantaDuplicates,
  hasStarted,
  splitGuestsByApproval,
  type PendingGuest,
  isSecretSantaDrawOutdated,
  isSecretSantaOpen,
  isSecretSantaSelfJoinOpen,
  secretSantaDrawDeadline,
  rsvpSecretSantaEntryId,
  secretSantaRsvpId,
  removeClaimEntry,
  toggleBought,
  buildGuestListDocument,
  printHtmlDocument,
} from '../../core/utils';
import {
  OrgSkeletonComponent,
  OrgButtonComponent,
  OrgCardHeaderComponent,
  OrgSurfaceComponent,
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
import { CollaboratorsManagerService } from '../organizer/event-editor/collaborators-manager.service';
import { EventOrnamentComponent } from './components/event-ornament/event-ornament.component';
import { SecretSantaRosterCardComponent } from './components/secret-santa-roster-card/secret-santa-roster-card.component';
import { SharePanelComponent } from '../organizer/event-editor/components/share-panel/share-panel.component';
import { KnownPeopleService } from '../../core/services/known-people.service';
import { personKey, type KnownPerson } from '../../core/utils/known-people.utils';
import {
  SecretSantaParticipantsComponent,
  type SecretSantaParticipantUpdate,
} from '../organizer/event-editor/components/secret-santa-participants/secret-santa-participants.component';

@Component({
  selector: 'app-event-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgTemplateOutlet,
    OrgSkeletonComponent,
    OrgButtonComponent,
    OrgCardHeaderComponent,
    OrgSurfaceComponent,
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
    SecretSantaParticipantsComponent,
    SharePanelComponent,
    EventOrnamentComponent,
    SecretSantaRosterCardComponent,
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
  private readonly collaboratorInvites = inject(CollaboratorInvitesService);
  private readonly userService = inject(UserService);
  private readonly familyService = inject(FamilyService);
  private readonly nameSync = inject(NameSyncService);
  private readonly confetti = inject(ConfettiService);
  private readonly celebrationSound = inject(CelebrationSoundService);
  private readonly seasonalThemeService = inject(SeasonalThemeService);
  private readonly dialogs = inject(OrgDialogService);
  private readonly drawerService = inject(DrawerService);
  private readonly collaboratorsManager = inject(CollaboratorsManagerService);
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
   * "Aprovar presenças": only approved guests count (the list, the total, the
   * amigo oculto); the ones waiting go to the organizers' "Aguardando aprovação".
   */
  private readonly guestSplit = computed(() =>
    splitGuestsByApproval(this.profiledGuests(), !!this.event()?.requireApproval),
  );

  /**
   * The public profile (name and photo) of each account on this page: the guests who answered
   * and who joined the amigo oculto. A guest is shown as their profile names them now, not as
   * they were named when they answered.
   */
  private readonly publicProfiles = signal<
    Readonly<Record<string, { name: string; photoURL: string | null }>>
  >({});
  private publicProfilesLoadedFor = '';
  private readonly loadPublicProfiles = effect(() => {
    const uids = [
      ...this.guests()
        .filter((guest) => !guest.primaryGuestId && guest.uid)
        .map((guest) => guest.uid as string),
      ...this.secretSantaRoster()
        .map((entry) => /^rsvp_([^_]+)$/.exec(entry.id)?.[1])
        .filter((uid): uid is string => !!uid),
      ...this.secretSantaParticipants()
        .filter((p) => p.joinedBy && p.id === secretSantaRsvpId(p.joinedBy))
        .map((p) => p.joinedBy as string),
      // Added by the organizers from a guest with an account, and the links of the draw.
      ...Object.values(this.secretSantaAccounts()),
      ...(this.secretSantaDraw()?.links ?? []).map((link) => link.uid ?? ''),
      // The member themself (their own RSVP card greets them by name).
      this.memberUid() ?? '',
      // Who said "Não poderei ir" (by account) and who brings something (the household's uid).
      ...this.declines().map((decline) => decline.id),
      ...this.claims().map((claims) => claims.id),
    ].filter(Boolean);
    const key = [...new Set(uids)].sort().join(',');
    if (!key || key === this.publicProfilesLoadedFor) return;
    this.publicProfilesLoadedFor = key;
    this.userService
      .publicProfiles(key.split(','))
      .then((profiles) => this.publicProfiles.set(profiles))
      .catch(console.error);
  });
  /** The guests, each named (and pictured) as their account's profile is now. */
  private readonly profiledGuests = computed(() => {
    const profiles = this.publicProfiles();
    return this.guests().map((guest) => {
      const profile = !guest.primaryGuestId && guest.uid ? profiles[guest.uid] : undefined;
      return profile
        ? { ...guest, name: profile.name, photoUrl: profile.photoURL || guest.photoUrl }
        : guest;
    });
  });
  /**
   * The name of an amigo oculto entry: one tied to an account (the guest's own entry, or one the
   * organizers added from a guest with an account) follows that account's profile.
   */
  private profiledSantaName(id: string, name: string): string {
    const uid = /^rsvp_([^_]+)$/.exec(id)?.[1] ?? this.secretSantaAccounts()[id];
    return (uid && this.publicProfiles()[uid]?.name) || name;
  }
  /** "Não poderão ir", named as each account's profile is now. */
  protected readonly declinesView = computed(() => {
    const profiles = this.publicProfiles();
    return this.declines().map((decline) => ({
      ...decline,
      name: profiles[decline.id]?.name || decline.name,
    }));
  });
  /**
   * What each household brings: the account holder's own lines named as their profile is now
   * (relatives and companions have no account and keep the name they were given).
   */
  private readonly profiledClaims = computed(() => {
    const profiles = this.publicProfiles();
    return this.claims().map((claims) => {
      const name = profiles[claims.id]?.name;
      return name
        ? {
            ...claims,
            name,
            entries: claims.entries.map((entry) =>
              entry.memberId === null ? { ...entry, who: name } : entry,
            ),
          }
        : claims;
    });
  });
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
    buildGuestHouseholds(this.listedGuests(), this.items(), this.profiledClaims()),
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
  /** Everyone written in the draw, including who still waits for approval. */
  private readonly allSecretSantaParticipants = signal<SecretSantaParticipant[]>([]);
  /** Guests whose presence still waits for the owner ("Aprovar presenças"), by account. */
  private readonly pendingSantaUids = computed(
    () =>
      new Set(
        this.guests()
          .filter((g) => g.approved === false && !g.primaryGuestId)
          .map((g) => g.uid ?? g.id),
      ),
  );
  /**
   * Who is in the draw: a guest who joined while waiting for approval counts only once
   * approved (refused, their entries go with the answer).
   */
  protected readonly secretSantaParticipants = computed(() => {
    const pending = this.pendingSantaUids();
    return this.allSecretSantaParticipants().filter((p) => !p.joinedBy || !pending.has(p.joinedBy));
  });
  protected readonly secretSantaDraw = signal<SecretSantaDraw | null>(null);
  protected readonly secretSantaDrawing = signal(false);
  private readonly loadSecretSantaParticipants = effect((onCleanup) => {
    if (!this.showSecretSanta()) {
      this.allSecretSantaParticipants.set([]);
      return;
    }
    const sub = this.secretSantaService.listParticipants(this.id()).subscribe({
      next: (participants) => this.allSecretSantaParticipants.set(participants),
      error: () => this.allSecretSantaParticipants.set([]),
    });
    onCleanup(() => sub.unsubscribe());
  });
  /**
   * The organizers keep the guests' roster (names and gift ideas) in line with the participants
   * once per visit: participants added before the roster existed show up for the guests too.
   */
  private rosterSyncedFor: string | null = null;
  private readonly syncSecretSantaRoster = effect(() => {
    const participants = this.secretSantaParticipants();
    if (!this.canEditEvent() || !participants.length || this.rosterSyncedFor === this.id()) return;
    this.rosterSyncedFor = this.id();
    void this.secretSantaService.syncRoster(this.id(), participants).catch(() => undefined);
  });

  /** A signed-in guest's view of the amigo oculto: who takes part and their gift ideas. */
  protected readonly secretSantaRoster = signal<SecretSantaRosterEntry[]>([]);
  /** The roster as shown: the account's own entries named as its profile is now. */
  protected readonly secretSantaRosterView = computed(() => {
    // Who still waits for approval is not in the draw yet: only they see their own entries.
    const pending = this.pendingSantaUids();
    const me = this.memberUid();
    return this.secretSantaRoster()
      .filter((entry) => {
        const uid = /^rsvp_([^_]+)/.exec(entry.id)?.[1];
        return !uid || uid === me || !pending.has(uid);
      })
      .map((entry) => ({ ...entry, name: this.profiledSantaName(entry.id, entry.name) }));
  });
  /** The organizers' list, named the same way. */
  protected readonly secretSantaParticipantsView = computed(() =>
    this.secretSantaParticipants().map((p) => ({
      ...p,
      name: this.profiledSantaName(p.id, p.name),
    })),
  );
  /**
   * The guest's "Amigo oculto" card, at the bottom of the invite: who is in, with their ideas;
   * also for a guest who confirmed (or waits for approval) and is not in yet, to join from there.
   */
  protected readonly showSecretSantaRoster = computed(
    () =>
      !!this.event()?.secretSanta?.enabled &&
      !this.canEdit() &&
      !!this.memberUid() &&
      (this.secretSantaRoster().length > 0 || this.isUserConfirmed()),
  );
  /** Shown in the card while the guest's presence waits for the owner's approval. */
  protected readonly secretSantaRosterNotice = computed(() =>
    this.isUserPending()
      ? 'Sua presença ainda espera a aprovação de quem organiza. Sua participação no amigo ' +
        'oculto passa a valer assim que ela for aprovada.'
      : '',
  );
  /**
   * The organizer in the participants list: "Participar também" puts them in their own draw,
   * named as on their profile, with the profile's phone.
   */
  protected readonly secretSantaSelf = computed(() => {
    const uid = this.memberUid();
    if (!uid) return null;
    return {
      uid,
      name: this.publicProfiles()[uid]?.name || this.currentGuestName() || '',
      phone: this.myPhone(),
    };
  });

  /** The confirmed guest may still join and is not in: "Participar do amigo oculto". */
  protected readonly canJoinSecretSanta = computed(() => {
    const santa = this.mySecretSanta();
    return this.isUserConfirmed() && !!santa?.open && !santa.joined['self'];
  });

  /** Opens the same form to join: named as on the profile, with the profile's phone. */
  protected onJoinSecretSanta(): void {
    const uid = this.memberUid();
    if (!uid) return;
    this.editingOwnSecretSanta.set({
      id: secretSantaRsvpId(uid),
      name: this.publicProfiles()[uid]?.name || this.currentGuestName() || '',
      phone: this.myPhone(),
      giftOptions: [],
      guestId: uid,
    });
  }
  /** The guest's own entries in the roster (`rsvp_{uid}…`), while they may still change them. */
  protected readonly myEditableSecretSantaIds = computed(() => {
    const uid = this.memberUid();
    if (!uid || !this.mySecretSanta()?.open) return [];
    const own = secretSantaRsvpId(uid);
    return this.secretSantaRoster()
      .map((entry) => entry.id)
      .filter((id) => id === own || id.startsWith(own + '_'));
  });
  /** The own entry open in the edit sheet (the pencil in the guest's "Amigo oculto"). */
  protected readonly editingOwnSecretSanta = signal<SecretSantaParticipant | null>(null);

  protected async onEditOwnSecretSanta(id: string): Promise<void> {
    try {
      const [entry] = await this.secretSantaService.getOwnEntries(this.id(), [id]);
      if (entry) this.editingOwnSecretSanta.set(entry);
      else this.feedback.error('Não encontramos essa inscrição no amigo oculto.');
    } catch (err) {
      this.feedback.error(explainError('Não foi possível abrir o amigo oculto.', err));
    }
  }

  /** "Sair do amigo oculto" from the card: that entry (theirs, a relative's) leaves the draw. */
  protected async onLeaveOwnSecretSanta(id: string): Promise<void> {
    const uid = this.memberUid();
    const editing = this.editingOwnSecretSanta();
    if (!uid) return;
    const self = id === secretSantaRsvpId(uid);
    const leave = await firstValueFrom(
      this.dialogs.confirm({
        title: 'Sair do amigo oculto',
        message: self
          ? 'Você sai do sorteio. Enquanto as inscrições estiverem abertas, dá para entrar de novo.'
          : `${editing?.name ?? 'Essa pessoa'} sai do sorteio.`,
        confirmLabel: 'Sair',
        cancelLabel: 'Ficar',
        tone: 'danger',
      }),
    );
    if (!leave) return;
    try {
      await this.secretSantaService.saveOwnEntries(this.id(), uid, [], [id]);
      this.editingOwnSecretSanta.set(null);
      this.mySecretSantaVersion.update((v) => v + 1);
      this.feedback.success(self ? 'Você saiu do amigo oculto.' : 'Saiu do amigo oculto.');
    } catch (err) {
      console.error(err);
      this.feedback.error(
        explainError('Não foi possível sair do amigo oculto. Tente novamente.', err),
      );
    }
  }

  /** Saves the guest's own entry from the sheet; the sheet closes when it worked. */
  protected readonly saveOwnSecretSantaEntry = async (
    participant: SecretSantaParticipantInput,
  ): Promise<boolean> => {
    const uid = this.memberUid();
    const editing = this.editingOwnSecretSanta();
    if (!uid || !editing) return false;
    const existed = this.secretSantaRoster().some((entry) => entry.id === editing.id);
    try {
      await this.secretSantaService.saveOwnEntries(
        this.id(),
        uid,
        [{ id: editing.id, input: participant }],
        [],
        existed ? [editing.id] : [],
      );
      this.editingOwnSecretSanta.set(null);
      this.mySecretSantaVersion.update((v) => v + 1);
      await this.syncSantaPhoneToProfile(uid, editing.id, participant.phone);
      this.feedback.success(existed ? 'Amigo oculto atualizado.' : 'Você entrou no amigo oculto!');
      return true;
    } catch (err) {
      console.error(err);
      this.feedback.error(explainError('Não foi possível salvar. Tente novamente.', err));
      return false;
    }
  };

  /**
   * A phone typed in an amigo oculto entry that comes from a profile updates that profile: the
   * guest's own (`rsvp_{uid}`, or the organizer's entry with their uid) or a relative's
   * (`rsvp_{uid}_f_{id}`). One phone per person, the same everywhere.
   */
  private async syncSantaPhoneToProfile(
    uid: string,
    entryId: string,
    phone: string,
  ): Promise<void> {
    const digits = (value: string | null | undefined) => (value ?? '').replace(/\D/g, '');
    if (!digits(phone)) return;
    try {
      if (entryId === secretSantaRsvpId(uid) || entryId === uid) {
        if (digits(phone) === digits(this.myPhone())) return;
        await this.userService.updateProfile(uid, { phone });
        this.myPhone.set(phone);
        this.feedback.info('Seu telefone também foi atualizado no perfil.');
        return;
      }
      const familyPrefix = `${secretSantaRsvpId(uid)}_f_`;
      if (entryId.startsWith(familyPrefix)) {
        await this.familyService.updateFamilyMemberPhone(
          uid,
          entryId.slice(familyPrefix.length),
          phone,
        );
      }
    } catch (err) {
      console.error(err);
      this.feedback.error(explainError('O telefone não foi atualizado no perfil.', err));
    }
  }

  private readonly loadSecretSantaRoster = effect((onCleanup) => {
    if (!this.event()?.secretSanta?.enabled || this.canEdit() || !this.memberUid()) {
      this.secretSantaRoster.set([]);
      return;
    }
    const sub = this.secretSantaService.listRoster(this.id()).subscribe({
      next: (entries) => this.secretSantaRoster.set(entries),
      error: () => this.secretSantaRoster.set([]),
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
          canLeave: isSecretSantaOpen(settings),
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
    const profiles = this.publicProfiles();
    const accounts = this.secretSantaAccounts();
    return (this.secretSantaDraw()?.links ?? []).map((link) => ({
      participantId: link.participantId,
      name: profiles[link.uid ?? accounts[link.participantId] ?? '']?.name || link.name,
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
    return this.currentGuestName() || user?.email?.split('@')[0] || 'Convidado(a)';
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
    buildItemProgress(this.items(), this.profiledClaims(), this.memberUid()),
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
    // Only the owner and the collaborators organise; a super admin is a guest here like anyone,
    // and looks after other people's events from the admin area. While an invite to help is
    // waiting for an answer, they are a guest too: organising starts with "Aceitar".
    if (event.createdBy === uid) return true;
    return (event.collaborators ?? []).includes(uid) && !this.pendingCollaboratorInvite();
  });
  /** The viewer's unanswered invite to help organise this event, if any. */
  private readonly pendingCollaboratorInvite = computed(() =>
    this.collaboratorInvites.forEvent(this.id()),
  );

  /**
   * Organizers' top row: on the left the guest's answer (a collaborator) or a small festive
   * scene (the owner, who has no presence to confirm), with "Quem vai" under it; on the right
   * the share panel with the amigo oculto under it.
   */
  protected readonly organizerTopRow = computed(() => this.canEditEvent());
  protected readonly ownerTopRow = computed(() => this.isOwner() && this.canEditEvent());

  /** Organizers edit the event only until it starts; afterwards it is history. */
  protected readonly canEditEvent = computed(
    () => this.canEdit() && !hasStarted(this.event()?.date),
  );

  /** People going; pets are counted apart (`petCount`). */
  private readonly confirmedCounts = computed(() => countGuests(this.listedGuests()));
  protected readonly guestCount = computed(() => this.confirmedCounts().people);
  protected readonly petCount = computed(() => this.confirmedCounts().pets);

  /** Only signed-in accounts answer invites; there are no anonymous guests. */
  protected readonly isUserConfirmed = computed(() => {
    const uid = this.memberUid();
    return !!uid && this.guests().some((g) => g.id === uid || g.uid === uid);
  });

  protected readonly currentGuestName = computed(() => {
    const uid = this.memberUid();
    if (!uid) return null;
    // The account's profile name first: the guest's own answer keeps the name typed back then.
    const found = this.guests().find((g) => g.id === uid || g.uid === uid);
    return (
      this.publicProfiles()[uid]?.name || found?.name || this.authService.displayName() || null
    );
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
    // The draw waits for the day chosen for it (the button says so; the rules hold it too).
    const opens = secretSantaDrawDeadline(event.secretSanta?.drawDate);
    if (opens && Date.now() < opens.getTime()) return;
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
        this.secretSantaParticipantsView(),
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
        message: `Com o novo link, ${link.name.split(/\s+/)[0]} pode ver de novo quem tirou (a mesma pessoa). O link antigo para de funcionar.`,
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
        this.secretSantaParticipantsView(),
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

  /**
   * "Juntar": the two become one. Two different phones: the organizer picks which one stays (the
   * one from the invite, or the one typed by hand); only one: that one.
   */
  protected async onMergeSecretSanta(pair: SecretSantaDuplicate): Promise<void> {
    const { keep, drop } = pair;
    const digits = (phone: string) => phone.replace(/\D/g, '');
    let phone = keep.phone || drop.phone;
    if (keep.phone && drop.phone && digits(keep.phone) !== digits(drop.phone)) {
      const choice = await firstValueFrom(
        this.dialogs.choose({
          title: 'Qual telefone fica?',
          message:
            `${keep.name} tem dois telefones: ${keep.phone}, do convite, e ${drop.phone}, ` +
            'adicionado à mão. O link do sorteio vai para o que ficar.',
          confirmLabel: `${keep.phone} (do convite)`,
          extraLabel: `${drop.phone} (à mão)`,
          cancelLabel: 'Cancelar',
        }),
      );
      if (choice === 'cancel') return;
      phone = choice === 'confirm' ? keep.phone : drop.phone;
    }
    this.secretSantaBusyDuplicate.set(pair.drop.id);
    try {
      await this.secretSantaService.mergeDuplicate(this.id(), pair, phone);
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

  /** The invite's address, for the organizers' share panel. */
  protected readonly eventUrl = computed(() => `${location.origin}/evento/${this.id()}`);

  private readonly knownPeopleService = inject(KnownPeopleService);
  private readonly knownPeopleAll = signal<KnownPerson[]>([]);
  private knownPeopleRequested = false;
  /** People the organizer knows from other events and family, not in this draw yet. */
  protected readonly secretSantaKnownPeople = computed(() => {
    const taken = new Set(this.secretSantaParticipants().map((p) => personKey(p.name)));
    return this.knownPeopleAll().filter((person) => !taken.has(personKey(person.name)));
  });
  private readonly loadKnownPeople = effect(() => {
    if (this.knownPeopleRequested || !this.canEditEvent() || !this.showSecretSanta()) return;
    const uid = this.authService.currentUser()?.uid;
    if (!uid) return;
    this.knownPeopleRequested = true;
    void this.knownPeopleService
      .list(uid, this.id())
      .then((people) => this.knownPeopleAll.set(people))
      .catch(() => undefined);
  });

  /**
   * Handed to "Adicionar alguém à mão": the form clears only once the person was added. Someone
   * already in the draw with the same phone or name is pointed out first: typed by hand, the
   * organizer replaces it with what they typed now or adds another person; joined from the
   * invite (theirs to change), the organizer adds another person or gives up.
   */
  protected readonly saveNewSecretSantaParticipant = async (
    participant: SecretSantaParticipantInput,
  ): Promise<boolean> => {
    // "Participar também": the organizer's own entry, their phone being the profile's.
    const uid = this.memberUid();
    if (uid && participant.guestId === uid) {
      const added = await this.addSecretSantaParticipants([participant]);
      if (added) await this.syncSantaPhoneToProfile(uid, uid, participant.phone);
      return added;
    }
    const match = this.sameSecretSantaPerson(participant);
    if (!match) return this.addSecretSantaParticipants([participant]);
    const { same, by } = match;
    const why = by === 'phone' ? `com o telefone ${same.phone}` : 'com esse nome';
    const shown = this.profiledSantaName(same.id, same.name);
    if (same.joinedBy || same.guestId) {
      const add = await firstValueFrom(
        this.dialogs.confirm({
          title: 'Essa pessoa já está no amigo oculto',
          message:
            `${shown} já está no sorteio ${why} e entrou pelo convite. Se for a mesma pessoa, ` +
            'não precisa adicionar de novo. Se for outra pessoa, adicione mesmo assim.',
          confirmLabel: 'Adicionar mesmo assim',
          cancelLabel: 'Cancelar',
        }),
      );
      return add ? this.addSecretSantaParticipants([participant]) : false;
    }
    const choice = await firstValueFrom(
      this.dialogs.choose({
        title: 'Essa pessoa já está no amigo oculto',
        message:
          `${shown} já está no sorteio ${why}. É a mesma pessoa? Troque pelos dados que você ` +
          'digitou agora. É outra pessoa? Adicione as duas.',
        confirmLabel: 'Trocar pelos novos dados',
        extraLabel: 'É outra pessoa',
        cancelLabel: 'Cancelar',
      }),
    );
    if (choice === 'extra') return this.addSecretSantaParticipants([participant]);
    if (choice !== 'confirm') return false;
    try {
      await this.secretSantaService.updateParticipant(this.id(), same.id, participant);
      this.feedback.success(`${participant.name} atualizado(a) no amigo oculto.`);
      return true;
    } catch (error) {
      this.feedback.error(explainError('Não foi possível atualizar o participante', error));
      return false;
    }
  };

  /** Someone already in the draw with the same phone (first) or the same name. */
  private sameSecretSantaPerson(
    participant: SecretSantaParticipantInput,
  ): { same: SecretSantaParticipant; by: 'phone' | 'name' } | null {
    const digits = (phone: string) => phone.replace(/\D/g, '');
    const phone = digits(participant.phone);
    const people = this.secretSantaParticipants();
    const byPhone = phone ? people.find((p) => digits(p.phone) === phone) : undefined;
    if (byPhone) return { same: byPhone, by: 'phone' };
    const name = personKey(participant.name);
    const byName = people.find(
      (p) => personKey(p.name) === name || personKey(this.profiledSantaName(p.id, p.name)) === name,
    );
    return byName ? { same: byName, by: 'name' } : null;
  }

  /** True when every participant was added. */
  protected async addSecretSantaParticipants(
    participants: readonly SecretSantaParticipantInput[],
  ): Promise<boolean> {
    try {
      for (const participant of participants) {
        await this.secretSantaService.addParticipant(this.id(), participant);
      }
      return true;
    } catch (error) {
      this.feedback.error(
        explainError(
          participants.length > 1
            ? 'Não foi possível adicionar os participantes'
            : 'Não foi possível adicionar o participante',
          error,
        ),
      );
      return false;
    }
  }

  protected async updateSecretSantaParticipant({
    index,
    participant,
  }: SecretSantaParticipantUpdate): Promise<void> {
    const saved = this.secretSantaParticipants()[index];
    if (!saved) return;
    try {
      await this.secretSantaService.updateParticipant(this.id(), saved.id, participant);
      // The organizer's own entry: their phone is the profile's.
      const uid = this.memberUid();
      if (uid && participant.guestId === uid) {
        await this.syncSantaPhoneToProfile(uid, uid, participant.phone);
      }
      this.feedback.success('Participante atualizado');
    } catch (error) {
      this.feedback.error(explainError('Não foi possível atualizar o participante', error));
    }
  }

  /**
   * A gift idea changed or taken out right in a list: asked first, so a slip of the finger
   * changes nothing. Null: the person gave up.
   */
  private async confirmGiftChange(
    gifts: readonly string[],
    gift: number,
    text: string | null,
  ): Promise<string[] | null> {
    const current = gifts[gift];
    if (current === undefined) return null;
    const ok = await firstValueFrom(
      this.dialogs.confirm(
        text === null
          ? {
              title: 'Apagar ideia de presente?',
              message: `"${current}" sai da lista de ideias.`,
              confirmLabel: 'Apagar',
              cancelLabel: 'Cancelar',
              tone: 'danger',
            }
          : {
              title: 'Salvar alteração?',
              message: `"${current}" passa a ser "${text}".`,
              confirmLabel: 'Salvar',
              cancelLabel: 'Cancelar',
            },
      ),
    );
    if (!ok) return null;
    return text === null
      ? gifts.filter((_, i) => i !== gift)
      : gifts.map((value, i) => (i === gift ? text : value));
  }

  /** The organizers change anyone's gift ideas right in the participants list. */
  protected async onEditSecretSantaGift(change: {
    participant: number;
    gift: number;
    text?: string;
  }): Promise<void> {
    const saved = this.secretSantaParticipants()[change.participant];
    if (!saved) return;
    const gifts = await this.confirmGiftChange(saved.giftOptions, change.gift, change.text ?? null);
    if (!gifts) return;
    try {
      await this.secretSantaService.updateGiftOptions(this.id(), saved.id, gifts);
      this.feedback.success(change.text === undefined ? 'Ideia apagada.' : 'Ideia atualizada.');
    } catch (error) {
      this.feedback.error(explainError('Não foi possível salvar a ideia de presente', error));
    }
  }

  protected onRemoveSecretSantaGift(change: { participant: number; gift: number }): Promise<void> {
    return this.onEditSecretSantaGift(change);
  }

  /** A guest changes their own gift ideas (theirs, a relative's) right in the amigo oculto card. */
  protected async onEditOwnSecretSantaGift(change: {
    id: string;
    gift: number;
    text?: string;
  }): Promise<void> {
    const uid = this.memberUid();
    if (!uid) return;
    try {
      const [entry] = await this.secretSantaService.getOwnEntries(this.id(), [change.id]);
      if (!entry) return;
      const gifts = await this.confirmGiftChange(
        entry.giftOptions,
        change.gift,
        change.text ?? null,
      );
      if (!gifts) return;
      const input: SecretSantaParticipantInput = {
        name: entry.name,
        phone: entry.phone,
        giftOptions: gifts,
        ...(entry.guestId ? { guestId: entry.guestId } : {}),
      };
      await this.secretSantaService.saveOwnEntries(
        this.id(),
        uid,
        [{ id: entry.id, input }],
        [],
        [entry.id],
      );
      this.mySecretSantaVersion.update((v) => v + 1);
      this.feedback.success(change.text === undefined ? 'Ideia apagada.' : 'Ideia atualizada.');
    } catch (err) {
      console.error(err);
      this.feedback.error(explainError('Não foi possível salvar a ideia de presente', err));
    }
  }

  protected onRemoveOwnSecretSantaGift(change: { id: string; gift: number }): Promise<void> {
    return this.onEditOwnSecretSantaGift(change);
  }

  protected async removeSecretSantaParticipant(index: number): Promise<void> {
    const saved = this.secretSantaParticipants()[index];
    if (!saved) return;
    const confirmed = await firstValueFrom(
      this.dialogs.confirm({
        title: 'Remover participante',
        message: this.secretSantaDraw()
          ? `${saved.name} sai do amigo oculto. O sorteio já foi feito: será preciso sortear de novo.`
          : `${saved.name} sai do amigo oculto deste evento.`,
        confirmLabel: 'Remover',
        tone: 'danger',
      }),
    );
    if (!confirmed) return;
    try {
      await this.secretSantaService.removeParticipant(this.id(), saved.id);
    } catch (error) {
      this.feedback.error(explainError('Não foi possível remover o participante', error));
    }
  }

  protected onEditSecretSanta(): void {
    // Always the amigo oculto step, not the step left open last time.
    void this.router.navigate(['/meus-eventos/evento', this.id()], {
      queryParams: { passo: 'amigo-oculto' },
    });
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

  /** Google sign-in from the invite itself; null when they closed it or were sent to log in. */
  private async signInToAnswer(): Promise<ReturnType<AuthService['currentUser']>> {
    try {
      await this.authService.loginWithGoogle();
      return this.authService.currentUser();
    } catch (err: unknown) {
      const code = (err as { code?: string } | null)?.code ?? '';
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        return null;
      }
      await this.router.navigate(['/login'], {
        queryParams: { redirect: '/evento/' + this.id() },
      });
      return null;
    }
  }

  protected async onConfirmRsvp(event?: Event, editing = false): Promise<void> {
    this.rsvpLoading.set(true);
    try {
      let user = this.authService.currentUser();
      if (!user || user.isAnonymous) {
        // Answering needs an account: Google right here, then on with the answer. Only when the
        // pop-up cannot open does the sign-in page take over (and bring them back).
        user = await this.signInToAnswer();
        if (!user) return;
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
          updateFamilyMember: async (memberId, changes) => {
            try {
              await this.familyService.updateFamilyMember(user.uid, memberId, changes);
              // The events this relative was confirmed in follow (in the background).
              void this.nameSync
                .syncFamilyMemberName(user.uid, memberId, changes.name, changes.relationship)
                .catch(() => undefined);
              this.feedback.success(`${changes.name} foi atualizado(a).`);
            } catch (err) {
              console.error(err);
              this.feedback.error(
                explainError('Não foi possível atualizar o familiar. Tente novamente.', err),
              );
              throw err;
            }
          },
          removeFamilyMember: async (memberId) => {
            const name = familyMembers.find((member) => member.id === memberId)?.name ?? '';
            const confirmed = await firstValueFrom(
              this.dialogs.confirm({
                title: 'Remover familiar',
                message: `${name || 'Este familiar'} sai da sua família e deixa de aparecer para confirmar presença junto com você.`,
                confirmLabel: 'Remover',
                tone: 'danger',
              }),
            );
            if (!confirmed) return false;
            try {
              await this.familyService.deleteFamilyMember(user.uid, memberId);
              this.feedback.success(`${name || 'Familiar'} foi removido(a) da sua família.`);
              return true;
            } catch (err) {
              console.error(err);
              this.feedback.error(
                explainError('Não foi possível remover o familiar. Tente novamente.', err),
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
            } else if (existing && santa) {
              // "Editar presença" no longer asks the amigo oculto (its card does): relatives and
              // companions no longer going leave it with the presence.
              await this.dropSecretSantaNotGoing(user.uid, result, santa.existingIds);
            }

            if (existing) {
              this.feedback.success('Presença atualizada!');
            } else if (this.event()?.requireApproval) {
              this.feedback.success('Pronto! Agora é só esperar quem organiza aprovar.');
            } else {
              this.confetti.fireSuccessConfetti();
              this.celebrationSound.play(this.event()?.category);
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
      // Pets go to the party, not to the draw.
      ...familyMembers
        .filter((member) => !isPet(member.relationship))
        .map((member) => `f:${member.id}`),
      ...[...new Set(companions)].map((name) => `c:${name}`),
    ];
    const idToKey = new Map(keys.map((key) => [rsvpSecretSantaEntryId(uid, key), key]));
    const entries = await this.secretSantaService.getOwnEntries(this.id(), [...idToKey.keys()]);
    // A relative's or companion's own WhatsApp, typed before; the guest's phone was only a fallback.
    const ownPhone = entries.find((entry) => idToKey.get(entry.id) === 'self')?.phone;
    const phones = Object.fromEntries(
      entries
        .map((entry) => [idToKey.get(entry.id) ?? 'self', entry.phone ?? ''] as const)
        .filter(([key, phone]) => key !== 'self' && phone && phone !== ownPhone),
    );
    return {
      existingIds: entries.map((entry) => entry.id),
      data: {
        open: isSecretSantaSelfJoinOpen(settings),
        canLeave: isSecretSantaOpen(settings),
        giftOptions: settings.giftOptions,
        maxGiftOptions: settings.maxGiftOptions ?? SECRET_SANTA_DEFAULT_GIFT_OPTIONS,
        joined: Object.fromEntries(
          entries.map((entry) => [idToKey.get(entry.id) ?? 'self', entry.giftOptions]),
        ),
        phones,
      },
    };
  }

  /**
   * An event that asks for approval: a guest who confirmed (waiting or approved) may join; the
   * entry counts in the draw once the presence is approved.
   */
  private mayJoinSecretSanta(uid: string): boolean {
    if (!this.event()?.requireApproval) return true;
    return this.guests().some((g) => g.id === uid || g.uid === uid);
  }

  /** The entries of relatives and companions no longer going leave the draw. */
  private async dropSecretSantaNotGoing(
    uid: string,
    result: RsvpDrawerResult,
    existingIds: readonly string[],
  ): Promise<void> {
    const going = new Set([
      rsvpSecretSantaEntryId(uid, 'self'),
      ...(result.selectedFamilyMembers ?? []).map((m) => rsvpSecretSantaEntryId(uid, `f:${m.id}`)),
      ...result.companions.map((c) => rsvpSecretSantaEntryId(uid, `c:${c.name}`)),
    ]);
    const gone = existingIds.filter((id) => !going.has(id));
    if (!gone.length) return;
    try {
      await this.secretSantaService.saveOwnEntries(this.id(), uid, [], gone);
      this.mySecretSantaVersion.update((v) => v + 1);
    } catch (err) {
      console.error(err);
    }
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
          const santaIds = this.allSecretSantaParticipants()
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
        phones: result.secretSantaPhones,
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

  /** An invite to help organise this event, sent to the viewer's e-mail and not answered yet. */
  protected readonly collaboratorInvite = computed(() =>
    this.isOwner() ? null : this.pendingCollaboratorInvite(),
  );
  /** Seeing the invite here is opening it: the bell stops counting it. */
  private readonly markInviteSeen = effect(() => {
    const invite = this.collaboratorInvite();
    if (invite) untracked(() => this.collaboratorInvites.markSeen(invite));
  });
  private readonly loadCollaboratorInvites = effect(() => {
    if (this.memberUid()) untracked(() => void this.collaboratorInvites.refresh());
  });

  protected async acceptCollaboratorInvite(invite: EventInvitation): Promise<void> {
    try {
      await this.collaboratorInvites.accept(invite);
      this.feedback.success('Pronto! Agora você colabora neste evento.');
    } catch (err) {
      this.feedback.error(explainError('Não foi possível aceitar o convite', err));
    }
  }

  protected async declineCollaboratorInvite(invite: EventInvitation): Promise<void> {
    try {
      await this.collaboratorInvites.decline(invite);
      this.feedback.success('Convite recusado.');
    } catch (err) {
      this.feedback.error(explainError('Não foi possível recusar o convite', err));
    }
  }

  /** "Colaboradores" beside "Editar evento": the same drawer as in the editor. */
  /** A collaborator steps back: after confirming, they are a guest of the event again. */
  protected async onLeaveCollaboration(): Promise<void> {
    const uid = this.memberUid();
    const event = this.event();
    if (!uid || !event || this.isOwner()) return;
    const confirmed = await firstValueFrom(
      this.dialogs.confirm({
        title: 'Sair da colaboração?',
        message: `Você deixa de ajudar a organizar "${event.title}": a lista de itens, os convidados e o amigo oculto. Para voltar, quem organiza precisa convidar você de novo.`,
        confirmLabel: 'Sair',
        tone: 'danger',
        icon: 'logout',
      }),
    );
    if (!confirmed) return;
    try {
      await this.eventService.leaveCollaboration(event.id, uid);
      this.feedback.success('Você saiu da colaboração deste evento.');
    } catch (err) {
      this.feedback.error(explainError('Não foi possível sair da colaboração', err));
    }
  }

  protected openCollaborators(): void {
    const event = this.event();
    if (event && this.isOwner()) this.collaboratorsManager.open(event);
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

  /**
   * "Baixar": the "Confirmados" list as a PDF, in the same look as the printed page. The PDF
   * code (jsPDF) loads only now, on the first press.
   */
  protected async downloadGuests(): Promise<void> {
    const event = this.event();
    if (!event) return;
    try {
      const { buildGuestListPdf, guestListPdfName } = await import('./guest-list-pdf');
      buildGuestListPdf({
        event,
        households: this.households(),
        hasItems: this.progress().length > 0,
      }).save(guestListPdfName(event.title));
    } catch (err) {
      console.error(err);
      this.feedback.error(explainError('Não foi possível gerar o PDF. Tente novamente.', err));
    }
  }

  /** "Imprimir": the "Confirmados" list alone, laid out for paper in the app's look. */
  protected printGuests(): void {
    const event = this.event();
    if (!event) return;
    printHtmlDocument(
      buildGuestListDocument({
        event,
        households: this.households(),
        hasItems: this.progress().length > 0,
      }),
    );
  }
}
