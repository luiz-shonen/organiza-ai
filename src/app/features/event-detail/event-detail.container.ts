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
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { EventService, GuestSessionService, ItemService, GuestService, AuthService } from '../../core/services';
import { PartyEvent, PartyItem, GuestSession, Guest } from '../../core/models';
import { EventHeaderComponent } from './components/event-header/event-header.component';
import { EventInfoCardComponent } from './components/event-info-card/event-info-card.component';
import { ItemListComponent } from './components/item-list/item-list.component';
import { PixCardComponent } from './components/pix-card/pix-card.component';
import { GuestFormDialogComponent, GuestFormDialogData, GuestFormDialogResult } from './components/guest-form-dialog/guest-form-dialog.component';
import { RsvpCardComponent } from './components/rsvp-card/rsvp-card.component';

@Component({
  selector: 'app-event-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatProgressSpinnerModule,
    EventHeaderComponent,
    EventInfoCardComponent,
    ItemListComponent,
    PixCardComponent,
    RsvpCardComponent,
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
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  private readonly authService = inject(AuthService);

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

  protected onRsvp(): void {
    this.openGuestDialog('rsvp');
  }

  protected async onClaimItem(item: PartyItem): Promise<void> {
    const session = this.session();
    if (!session) {
      this.openGuestDialog('claim', item);
      return;
    }

    try {
      await this.itemService.claimItem(this.id(), item.id, {
        name: session.name,
        phone: session.phone,
      });
      this.snackBar.open(`Você assumiu "${item.name}"!`, 'OK', { duration: 3000 });
    } catch {
      this.snackBar.open('Erro ao assumir item. Tente novamente.', 'OK', { duration: 3000 });
    }
  }

  protected async onUnclaimItem(item: PartyItem): Promise<void> {
    try {
      await this.itemService.unclaimItem(this.id(), item.id);
      this.snackBar.open(`Item "${item.name}" liberado.`, 'OK', { duration: 3000 });
    } catch {
      this.snackBar.open('Erro ao liberar item. Tente novamente.', 'OK', { duration: 3000 });
    }
  }

  protected onPixCopied(): void {
    this.snackBar.open('Chave Pix copiada!', 'OK', { duration: 2000 });
  }

  private openGuestDialog(action: 'rsvp' | 'claim', item?: PartyItem): void {
    const dialogRef = this.dialog.open<
      GuestFormDialogComponent,
      GuestFormDialogData,
      GuestFormDialogResult
    >(GuestFormDialogComponent, {
      width: '400px',
      data: { session: this.session() },
      autoFocus: true,
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (!result) return;

      this.guestSession.saveSession({ name: result.name, phone: result.phone });

      // RSVP — add or update guest record
      const existingGuest = await this.guestService.getGuestByPhone(this.id(), result.phone);
      if (existingGuest) {
        await this.guestService.updateGuest(this.id(), existingGuest.id, {
          name: result.name,
          phone: result.phone,
          companionsCount: result.companionsCount,
        });
      } else {
        await this.guestService.addGuest(this.id(), {
          name: result.name,
          phone: result.phone,
          companionsCount: result.companionsCount,
        });
      }

      this.snackBar.open('Presença confirmada!', '🎉', { duration: 3000 });

      // If the dialog was triggered by a claim action, proceed with claiming
      if (action === 'claim' && item) {
        await this.onClaimItem(item);
      }
    });
  }
}
