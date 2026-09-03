import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  input,
  OnInit,
  DestroyRef,
} from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  EventService,
  GuestSessionService,
  ItemService,
  GuestService,
  AuthService,
  UserService,
  FamilyService,
  ConfettiService,
  SeasonalThemeService,
  DrawerService,
} from '../../core/services';
import { PartyEvent, PartyItem, Guest, type RsvpDrawerResult } from '../../core/models';
import {
  FeedbackService,
  OrgDialogService,
  OrgEmptyStateComponent,
  OrgPageLayoutComponent,
} from '../../shared/ui';

import { EventCardComponent } from './components/event-card/event-card.component';
import { RsvpCardComponent } from './components/rsvp-card/rsvp-card.component';
import { ItemListCardComponent } from './components/item-list-card/item-list-card.component';
import { PixCardComponent } from './components/pix-card/pix-card.component';

@Component({
  selector: 'app-event-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatProgressSpinnerModule,
    OrgPageLayoutComponent,
    OrgEmptyStateComponent,
    EventCardComponent,
    RsvpCardComponent,
    ItemListCardComponent,
    PixCardComponent,
  ],
  templateUrl: './event-detail.container.html',
  styleUrl: './event-detail.container.scss',
})
export class EventDetailContainer implements OnInit {
  readonly id = input.required<string>();

  private readonly eventService = inject(EventService);
  private readonly itemService = inject(ItemService);
  private readonly guestService = inject(GuestService);
  private readonly guestSession = inject(GuestSessionService);
  private readonly feedback = inject(FeedbackService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);
  private readonly familyService = inject(FamilyService);
  private readonly confetti = inject(ConfettiService);
  private readonly seasonalThemeService = inject(SeasonalThemeService);
  private readonly dialogs = inject(OrgDialogService);
  private readonly drawerService = inject(DrawerService);

  protected readonly event = signal<PartyEvent | null>(null);
  protected readonly items = signal<PartyItem[]>([]);
  protected readonly guests = signal<Guest[]>([]);
  protected readonly loading = signal(true);
  protected readonly rsvpLoading = signal(false);
  protected readonly session = this.guestSession.session;

  protected readonly guestCount = computed(() => {
    return this.guests().reduce(
      (sum, guest) => sum + 1 + (guest.companions?.length ?? guest.companionsCount ?? 0),
      0,
    );
  });

  protected readonly isUserConfirmed = computed(() => {
    const user = this.authService.currentUser();
    if (user && !user.isAnonymous) {
      return this.guests().some((g) => g.id === user.uid || g.uid === user.uid);
    }
    const session = this.session();
    if (session?.phone) {
      return this.guests().some((g) => g.phone === session.phone);
    }
    return false;
  });

  protected readonly currentGuestName = computed(() => {
    const user = this.authService.currentUser();
    if (user && !user.isAnonymous) {
      const found = this.guests().find((g) => g.id === user.uid || g.uid === user.uid);
      if (found) {
        return found.name;
      }
      return user.displayName ?? null;
    }
    return this.session()?.name ?? null;
  });

  protected readonly currentUserId = computed(() => {
    const user = this.authService.currentUser();
    if (user && !user.isAnonymous) {
      return user.uid;
    }
    return this.session()?.phone ?? null;
  });

  ngOnInit(): void {
    const eventId = this.id();

    this.authService.loginAnonymously().catch(console.error);

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

    this.destroyRef.onDestroy(() => {
      eventSub.unsubscribe();
      itemsSub.unsubscribe();
      guestsSub.unsubscribe();
      this.seasonalThemeService.resetToAuto();
    });
  }

  protected async onConfirmRsvp(event?: Event): Promise<void> {
    this.rsvpLoading.set(true);
    try {
      let user = this.authService.currentUser();
      if (!user || user.isAnonymous) {
        await this.authService.loginWithGoogle();
        user = this.authService.currentUser();
      }

      if (user && !user.isAnonymous) {
        const name = user.displayName || user.email?.split('@')[0] || 'Convidado';
        const email = user.email ?? '';
        const photoUrl = user.photoURL ?? '';
        const phone = user.phoneNumber ?? '';

        const familyMembers = await this.familyService.getFamilyMembers(user.uid);

        this.drawerService.open({
          kind: 'rsvp',
          trigger: event?.currentTarget as HTMLElement | undefined,
          data: { session: { name, phone }, familyMembers, userId: user.uid },
          onComplete: async (result: RsvpDrawerResult) => {
            this.rsvpLoading.set(true);
            try {
              await this.guestService.batchConfirmRsvp(
                this.id(),
                {
                  uid: user.uid,
                  name: result.name || name,
                  email,
                  phone: result.phone || phone,
                  photoUrl,
                  companions: result.companions,
                },
                result.selectedFamilyMembers ?? [],
              );

              this.guestSession.saveSession({
                name: result.name || name,
                phone: result.phone || phone,
              });
              this.userService
                .upsertProfile(user.uid, {
                  name: result.name || name,
                  phone: result.phone || phone,
                })
                .catch(console.error);

              this.confetti.fireSuccessConfetti();
              this.feedback.success('Presença confirmada!');
            } catch (err) {
              console.error(err);
              this.feedback.error('Erro ao confirmar presença.', { duration: 4000 });
            } finally {
              this.rsvpLoading.set(false);
            }
          },
        });
        return;
      }
    } catch (err: unknown) {
      console.error(err);
      this.feedback.error('Erro ao confirmar presença com o Google.', { duration: 4000 });
    } finally {
      this.rsvpLoading.set(false);
    }
  }

  protected async onCancelRsvp(): Promise<void> {
    this.dialogs
      .confirm({
        title: 'Cancelar Presença',
        message:
          'Tem certeza que não poderá mais ir? Sua presença será cancelada e os itens que você selecionou voltarão para a lista.',
        confirmLabel: 'Sim, cancelar',
      })
      .subscribe(async (result) => {
        if (result) {
          this.rsvpLoading.set(true);
          try {
            const user = this.authService.currentUser();
            const session = this.guestSession.session();
            const targetUid = user && !user.isAnonymous ? user.uid : undefined;

            if (targetUid) {
              await this.guestService.cancelRsvp(this.id(), targetUid, targetUid);
            } else if (session?.phone) {
              const existingGuest = await this.guestService.getGuestByPhone(
                this.id(),
                session.phone,
              );
              if (existingGuest) {
                await this.guestService.cancelRsvp(this.id(), existingGuest.id, session.phone);
              }
            }

            this.guestSession.clearSession();
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
    if (!this.isUserConfirmed()) {
      this.feedback.info('Por favor, confirme sua presença primeiro.');
      return;
    }

    const user = this.authService.currentUser();
    const session = this.session();
    const name = this.currentGuestName() || 'Convidado';
    const phone = user?.phoneNumber || session?.phone || '';

    try {
      await this.itemService.claimItem(this.id(), itemId, {
        name,
        phone,
      });
      this.confetti.fireSuccessConfetti();
      this.feedback.success('Item assumido com sucesso!');
    } catch {
      this.feedback.error('Erro ao assumir item. Tente novamente.');
    }
  }

  protected async onUnclaimItemById(itemId: string): Promise<void> {
    try {
      await this.itemService.unclaimItem(this.id(), itemId);
      this.feedback.success('Item liberado.');
    } catch {
      this.feedback.error('Erro ao liberar item. Tente novamente.');
    }
  }

  protected onPixCopied(): void {
    this.feedback.success('Chave Pix copiada!', { duration: 2000 });
  }
}
