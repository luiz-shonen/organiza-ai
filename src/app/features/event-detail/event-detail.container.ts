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
} from '../../core/models';
import {
  addClaimEntry,
  buildFamilyChecklist,
  buildGuestHouseholds,
  buildItemProgress,
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
import { RsvpCardComponent } from './components/rsvp-card/rsvp-card.component';
import { ItemListCardComponent } from './components/item-list-card/item-list-card.component';
import { PixCardComponent } from './components/pix-card/pix-card.component';
import { FamilyChecklistCardComponent } from './components/family-checklist-card/family-checklist-card.component';
import { GuestListCardComponent } from './components/guest-list-card/guest-list-card.component';
import {
  ClaimSheetComponent,
  type ClaimPerson,
} from './components/claim-sheet/claim-sheet.component';
import { Router } from '@angular/router';

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

  /** "Quem vai": every confirmed household, who comes with them and what they bring. */
  protected readonly households = computed(() =>
    buildGuestHouseholds(this.guests(), this.items(), this.claims()),
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

  protected readonly claimPeople = computed<ClaimPerson[]>(() => [
    { id: null, name: 'Você' },
    ...this.familyMembers().map((member) => ({ id: member.id, name: member.name })),
  ]);

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

  protected readonly guestCount = computed(() => {
    return this.guests().reduce(
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

  protected onEditRsvp(): Promise<void> {
    return this.onConfirmRsvp(undefined, true);
  }

  /** "Não poderei ir" on an invite not answered yet: nothing to cancel, only the answer. */
  protected async onDeclineRsvp(message = ''): Promise<void> {
    const uid = this.memberUid();
    if (!uid) return;
    this.rsvpLoading.set(true);
    try {
      await this.guestService.saveDecline(this.id(), uid, this.declineName(), message);
      await this.userService.setDeclined(uid, this.id(), true);
      this.declined.set(true);
      this.feedback.success('Tudo bem, avisamos que você não poderá ir.');
    } catch (err: unknown) {
      console.error(err);
      this.feedback.error('Não foi possível recusar o convite. Tente novamente.');
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

      this.drawerService.open({
        kind: 'rsvp',
        trigger: event?.currentTarget as HTMLElement | undefined,
        data: {
          session: { name, phone },
          savedCompanions: profile?.savedCompanions ?? [],
          familyMembers,
          userId: user.uid,
          existing,
          addFamilyMember: async (member) => {
            try {
              const saved = await this.familyService.addFamilyMember(user.uid, member);
              this.feedback.success(`${saved.name} foi adicionado(a) à sua família.`);
              return saved;
            } catch (err) {
              console.error(err);
              this.feedback.error('Não foi possível adicionar o familiar. Tente novamente.');
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

            if (existing) {
              this.feedback.success('Presença atualizada!');
            } else {
              this.confetti.fireSuccessConfetti();
              this.feedback.success('Presença confirmada!');
            }
          } catch (err) {
            console.error(err);
            this.feedback.error('Erro ao confirmar presença.', { duration: 4000 });
          } finally {
            this.rsvpLoading.set(false);
          }
        },
      });
    } catch (err: unknown) {
      console.error(err);
      this.feedback.error('Não foi possível abrir a confirmação. Tente novamente.', {
        duration: 4000,
      });
    } finally {
      this.rsvpLoading.set(false);
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

  protected async onCancelRsvp(message = ''): Promise<void> {
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
              await this.guestService.cancelRsvp(this.id(), targetUid, targetUid, targetUid);
              // Remembered as declined, so Início shows it as "Recusado" and the organizer sees why.
              this.declined.set(true);
              this.userService.setDeclined(targetUid, this.id(), true).catch(console.error);
              this.userService.setAttending(targetUid, this.id(), false).catch(console.error);
              this.guestService
                .saveDecline(this.id(), targetUid, this.declineName(), message)
                .catch(console.error);
            }

            this.feedback.success('Sua presença foi cancelada.');
          } catch (err: unknown) {
            console.error(err);
            this.feedback.error('Erro ao cancelar presença.');
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
    } catch {
      this.feedback.error('Erro ao assumir item. Tente novamente.');
    } finally {
      this.claimSaving.set(false);
    }
  }

  protected async onToggleBought(row: FamilyChecklistRow): Promise<void> {
    try {
      await this.saveMyClaims(
        toggleBought(this.myClaims()?.entries ?? [], row.itemId, row.memberId),
      );
    } catch {
      this.feedback.error('Não foi possível salvar. Tente novamente.');
    }
  }

  protected async onRemoveClaim(row: FamilyChecklistRow): Promise<void> {
    try {
      await this.saveMyClaims(
        removeClaimEntry(this.myClaims()?.entries ?? [], row.itemId, row.memberId),
      );
      this.feedback.success('Item liberado.');
    } catch {
      this.feedback.error('Erro ao liberar item. Tente novamente.');
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
