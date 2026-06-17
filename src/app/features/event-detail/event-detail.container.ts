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
import { EventService, GuestSessionService, ItemService, GuestService, AuthService, UserService } from '../../core/services';
import { PartyEvent, PartyItem, Guest } from '../../core/models';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';

import { EventCardComponent } from './components/event-card/event-card.component';
import { RsvpFormComponent } from './components/rsvp-form/rsvp-form.component';
import { ItemListCardComponent } from './components/item-list-card/item-list-card.component';
import { PixCardComponent } from './components/pix-card/pix-card.component';

@Component({
  selector: 'app-event-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatProgressSpinnerModule,
    EventCardComponent,
    RsvpFormComponent,
    ItemListCardComponent,
    PixCardComponent,
  ],
  templateUrl: './event-detail.container.html',
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

  protected readonly event = signal<PartyEvent | null>(null);
  protected readonly items = signal<PartyItem[]>([]);
  protected readonly guests = signal<Guest[]>([]);
  protected readonly loading = signal(true);
  protected readonly session = this.guestSession.session;
  protected readonly isIdentified = this.guestSession.isIdentified;

  protected readonly guestCount = computed(() => {
    return this.guests().reduce((sum, g) => sum + 1 + g.companionsCount, 0);
  });

  ngOnInit(): void {
    const eventId = this.id();

    // Inicia a sessão anônima do convidado para garantir acesso e segurança
    this.authService.loginAnonymously().catch(console.error);

    const eventSub = this.eventService.getEvent(eventId).subscribe({
      next: (event) => {
        this.event.set(event);
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
    });
  }

  protected async onRsvpConfirm(data: { name: string; phone: string }): Promise<void> {
    this.guestSession.saveSession({ name: data.name, phone: data.phone });

    const user = this.authService.currentUser();
    if (user?.uid && !user.isAnonymous) {
      this.userService.upsertProfile(user.uid, { name: data.name, phone: data.phone }).catch(console.error);
    }

    // RSVP — add or update guest record
    const existingGuest = await this.guestService.getGuestByPhone(this.id(), data.phone);
    if (existingGuest) {
      await this.guestService.updateGuest(this.id(), existingGuest.id, {
        name: data.name,
        phone: data.phone,
        companionsCount: 0,
      });
    } else {
      await this.guestService.addGuest(this.id(), {
        name: data.name,
        phone: data.phone,
        companionsCount: 0,
      });
    }

    this.snackBar.open('Presença confirmada!', '🎉', { duration: 3000 });
  }

  protected async onClaimItemById(itemId: string): Promise<void> {
    const session = this.session();
    if (!session) {
      this.snackBar.open('Por favor, confirme sua presença primeiro.', 'OK', { duration: 3000 });
      return;
    }

    try {
      await this.itemService.claimItem(this.id(), itemId, {
        name: session.name,
        phone: session.phone,
      });
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

  private readonly dialog = inject(MatDialog);

  async cancelRsvp(): Promise<void> {
    const session = this.guestSession.session();
    if (!session?.phone) return;

    const confirmRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Cancelar Presença',
        message: 'Tem certeza que não poderá mais ir? Sua presença será cancelada e os itens que você selecionou voltarão para a lista.',
        confirmLabel: 'Sim, cancelar'
      }
    });

    confirmRef.afterClosed().subscribe(async (result) => {
      if (result) {
        try {
          const existingGuest = await this.guestService.getGuestByPhone(this.id(), session.phone);
          if (existingGuest) {
            await this.guestService.deleteGuest(this.id(), existingGuest.id);
            
            // Unclaim all items claimed by this guest
            const itemsToUnclaim = this.items().filter(item => item.claimedBy?.phone === session.phone);
            for (const item of itemsToUnclaim) {
              await this.itemService.unclaimItem(this.id(), item.id!);
            }
            
            this.guestSession.clearSession();
            this.snackBar.open('Sua presença foi cancelada.', 'OK', { duration: 3000 });
          }
        } catch (err: any) {
          console.error(err);
          this.snackBar.open('Erro ao cancelar presença.', 'OK', { duration: 3000 });
        }
      }
    });
  }
}
