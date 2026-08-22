import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  OnInit,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { toSignal } from '@angular/core/rxjs-interop';
import { effect } from '@angular/core';
import { Clipboard } from '@angular/cdk/clipboard';
import {
  EventService,
  AuthService,
  NotificationService,
  EventNotificationService,
} from '../../../core/services';
import { PartyEvent } from '../../../core/models';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { FeedbackService } from '../../../shared/ui';
import {
  EventDashboardFiltersComponent,
  EventStatusFilter,
  EventFilterCounts,
} from '../../organizer/dashboard/components/event-filters/event-filters.component';
import {
  OrgButtonDirective,
  OrgEmptyStateComponent,
  OrgIconButtonDirective,
  OrgIconComponent,
  OrgPageHeaderComponent,
  OrgPageLayoutComponent,
  OrgSurfaceDirective,
} from '../../../shared/ui';

@Component({
  selector: 'app-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatMenuModule,
    EventDashboardFiltersComponent,
    OrgPageLayoutComponent,
    OrgPageHeaderComponent,
    OrgSurfaceDirective,
    OrgEmptyStateComponent,
    OrgButtonDirective,
    OrgIconButtonDirective,
    OrgIconComponent,
  ],
  templateUrl: './dashboard.container.html',
  styleUrl: './dashboard.container.scss',
})
export class DashboardContainer implements OnInit {
  private readonly eventService = inject(EventService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly feedback = inject(FeedbackService);
  private readonly clipboard = inject(Clipboard);
  private readonly dialog = inject(MatDialog);
  private readonly notificationService = inject(NotificationService);
  private readonly eventNotificationService = inject(EventNotificationService);

  protected readonly events$ = this.eventService.listEvents();
  protected readonly events = toSignal(this.events$);
  protected readonly isSuperAdmin = this.authService.isSuperAdmin;
  protected readonly user = this.authService.currentUser;
  protected readonly displayedColumns = ['title', 'date', 'location', 'actions'];

  readonly activeFilter = signal<EventStatusFilter>('all');

  readonly filterCounts = computed<EventFilterCounts>(() => {
    const all = this.events() ?? [];
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    let upcoming = 0;
    let past = 0;
    let cancelled = 0;

    for (const e of all) {
      if (e.status === 'cancelled') {
        cancelled++;
      } else {
        const eventDate = new Date(e.date);
        if (eventDate >= now) {
          upcoming++;
        } else {
          past++;
        }
      }
    }

    return {
      all: all.length,
      upcoming,
      past,
      cancelled,
    };
  });

  readonly filteredEvents = computed(() => {
    const all = this.events();
    if (!all) return [];
    const filter = this.activeFilter();
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    return all.filter((e) => {
      const isCancelled = e.status === 'cancelled';
      const eventDate = new Date(e.date);

      switch (filter) {
        case 'upcoming':
          return !isCancelled && eventDate >= now;
        case 'past':
          return !isCancelled && eventDate < now;
        case 'cancelled':
          return isCancelled;
        case 'all':
        default:
          return true;
      }
    });
  });

  protected readonly nextEvent = computed(() => {
    const all = this.events();
    if (!all) return null;
    const upcoming = all.filter((e) => {
      const isCancelled = e.status === 'cancelled';
      const eventDate = new Date(e.date);
      const now = new Date();
      return !isCancelled && eventDate >= now;
    });
    // Already ordered by date ASC from the service
    return upcoming.length > 0 ? upcoming[0] : null;
  });

  protected readonly nextEventDays = computed(() => {
    const event = this.nextEvent();
    if (!event) return null;
    const eventDate = new Date(event.date);
    const now = new Date();
    eventDate.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    const diffTime = Math.abs(eventDate.getTime() - now.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  });

  constructor() {
    effect(() => {
      const all = this.events();
      if (all && all.length > 0) {
        this.eventNotificationService.evaluateCountdownReminders(all);
      }
    });

    effect(() => {
      const event = this.nextEvent();
      const days = this.nextEventDays();
      if (event && days !== null && days <= 7) {
        const notifiedKey = `notified_event_${event.id}`;
        if (!localStorage.getItem(notifiedKey)) {
          let timeText = `Faltam ${days} dias`;
          if (days === 0) timeText = 'É hoje!';
          if (days === 1) timeText = 'Amanhã!';

          this.notificationService.sendLocalNotification(
            'Evento se aproximando!',
            `Seu evento "${event.title}" está chegando. ${timeText}.`,
          );
          localStorage.setItem(notifiedKey, 'true');
        }
      }
    });
  }

  ngOnInit(): void {}

  protected editEvent(event: PartyEvent): void {
    this.router.navigate(['/meus-eventos/evento', event.id]);
  }

  protected openPublicEvent(event: PartyEvent): void {
    window.open(`/evento/${event.id}`, '_blank');
  }

  protected isHistoryEvent(dateStr: string): boolean {
    const eventDate = new Date(dateStr);
    const now = new Date();
    eventDate.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    return eventDate < now;
  }

  protected async cancelEvent(event: PartyEvent): Promise<void> {
    const confirmRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Cancelar Evento',
        message: `Tem certeza que deseja cancelar o evento "${event.title}"? Ele será movido para os cancelados e o link público avisará sobre o cancelamento.`,
        confirmLabel: 'Cancelar Evento',
      },
    });

    confirmRef.afterClosed().subscribe(async (result) => {
      if (result) {
        try {
          await this.eventService.cancelEvent(event.id);
          this.feedback.success('Evento cancelado com sucesso!');
        } catch {
          this.feedback.error('Erro ao cancelar evento.');
        }
      }
    });
  }

  async logout(): Promise<void> {
    try {
      await this.authService.logout();
      this.router.navigate(['/login']);
    } catch (err) {
      console.error(err);
      this.feedback.error('Erro ao sair da conta');
    }
  }

  protected shareWhatsApp(event: PartyEvent): void {
    const url = `${location.origin}/evento/${event.id}`;
    const text = `🎉 Você está convidado(a) para *${event.title}*!\n\n📅 ${this.formatDate(event.date)}\n📍 ${event.location}\n\nConfirme sua presença e veja o que levar:\n${url}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
  }

  protected copyLink(event: PartyEvent): void {
    const url = `${location.origin}/evento/${event.id}`;
    this.clipboard.copy(url);
    this.feedback.success('Link copiado!', { duration: 2000 });
  }

  protected formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }
}
