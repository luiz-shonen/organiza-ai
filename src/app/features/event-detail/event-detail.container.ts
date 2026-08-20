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
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  EventService,
  GuestSessionService,
  ItemService,
  GuestService,
  AuthService,
  UserService,
  ConfettiService,
  SeasonalThemeService,
} from '../../core/services';
import { PartyEvent, PartyItem, Guest } from '../../core/models';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';

import { EventCardComponent } from './components/event-card/event-card.component';
import { RsvpCardComponent } from './components/rsvp-card/rsvp-card.component';
import { ItemListCardComponent } from './components/item-list-card/item-list-card.component';
import { PixCardComponent } from './components/pix-card/pix-card.component';

@Component({
  selector: 'app-event-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatProgressSpinnerModule,
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
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  private readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);
  private readonly confetti = inject(ConfettiService);
  private readonly seasonalThemeService = inject(SeasonalThemeService);
  private readonly dialog = inject(MatDialog);

  protected readonly event = signal<PartyEvent | null>(null);
  protected readonly items = signal<PartyItem[]>([]);
  protected readonly guests = signal<Guest[]>([]);
  protected readonly loading = signal(true);
  protected readonly rsvpLoading = signal(false);
  protected readonly session = this.guestSession.session;

  protected readonly guestCount = computed(() => {
    return this.guests().reduce((sum, g) => sum + 1 + (g.companionsCount ?? 0), 0);
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
          this.seasonalThemeService.evaluateEventTheme(event.date, event.title);
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

  protected async onConfirmRsvp(): Promise<void> {
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

        await this.guestService.saveVerifiedRsvp(this.id(), {
          uid: user.uid,
          name,
          email,
          photoUrl,
          phone,
        });

        this.guestSession.saveSession({ name, phone });
        this.userService.upsertProfile(user.uid, { name, phone }).catch(console.error);

        this.confetti.fireSuccessConfetti();
        this.snackBar.open('Presença confirmada!', '🎉', { duration: 3000 });
      }
    } catch (err: unknown) {
      console.error(err);
      this.snackBar.open('Erro ao confirmar presença com o Google.', 'OK', { duration: 4000 });
    } finally {
      this.rsvpLoading.set(false);
    }
  }

  protected async onCancelRsvp(): Promise<void> {
    const confirmRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Cancelar Presença',
        message:
          'Tem certeza que não poderá mais ir? Sua presença será cancelada e os itens que você selecionou voltarão para a lista.',
        confirmLabel: 'Sim, cancelar',
      },
    });

    confirmRef.afterClosed().subscribe(async (result) => {
      if (result) {
        this.rsvpLoading.set(true);
        try {
          const user = this.authService.currentUser();
          const session = this.guestSession.session();
          const targetUid = user && !user.isAnonymous ? user.uid : undefined;

          if (targetUid) {
            await this.guestService.cancelRsvp(this.id(), targetUid, targetUid);
          } else if (session?.phone) {
            const existingGuest = await this.guestService.getGuestByPhone(this.id(), session.phone);
            if (existingGuest) {
              await this.guestService.cancelRsvp(this.id(), existingGuest.id, session.phone);
            }
          }

          this.guestSession.clearSession();
          this.snackBar.open('Sua presença foi cancelada.', 'OK', { duration: 3000 });
        } catch (err: unknown) {
          console.error(err);
          this.snackBar.open('Erro ao cancelar presença.', 'OK', { duration: 3000 });
        } finally {
          this.rsvpLoading.set(false);
        }
      }
    });
  }

  protected async onClaimItemById(itemId: string): Promise<void> {
    if (!this.isUserConfirmed()) {
      this.snackBar.open('Por favor, confirme sua presença primeiro.', 'OK', { duration: 3000 });
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
      this.snackBar.open('Item assumido com sucesso!', 'OK', { duration: 3000 });
    } catch {
      this.snackBar.open('Erro ao assumir item. Tente novamente.', 'OK', { duration: 3000 });
    }
  }

  protected async onUnclaimItemById(itemId: string): Promise<void> {
    try {
      await this.itemService.unclaimItem(this.id(), itemId);
      this.snackBar.open('Item liberado.', 'OK', { duration: 3000 });
    } catch {
      this.snackBar.open('Erro ao liberar item. Tente novamente.', 'OK', { duration: 3000 });
    }
  }

  protected onPixCopied(): void {
    this.snackBar.open('Chave Pix copiada!', 'OK', { duration: 2000 });
  }
}
