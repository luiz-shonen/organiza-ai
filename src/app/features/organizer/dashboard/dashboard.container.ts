import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
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
import { formatDate, shareWhatsApp } from '../../../core/utils';
import { PartyEvent } from '../../../core/models';
import { FeedbackService, OrgDialogService } from '../../../shared/ui';
import {
  EventDashboardFiltersComponent,
  EventStatusFilter,
  EventFilterCounts,
} from './components/event-filters/event-filters.component';
import {
  OrgButtonComponent,
  OrgDataColumn,
  OrgDataTableComponent,
  OrgEmptyStateComponent,
  OrgIconButtonComponent,
  OrgPageHeaderComponent,
  OrgPageLayoutComponent,
  OrgSurfaceComponent,
} from '../../../shared/ui';

@Component({
  selector: 'app-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatMenuModule,
    EventDashboardFiltersComponent,
    OrgPageLayoutComponent,
    OrgPageHeaderComponent,
    OrgSurfaceComponent,
    OrgEmptyStateComponent,
    OrgButtonComponent,
    OrgDataTableComponent,
    OrgIconButtonComponent,
  ],
  templateUrl: './dashboard.container.html',
  styleUrl: './dashboard.container.scss',
})
export class DashboardContainer {
  private readonly eventService = inject(EventService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly feedback = inject(FeedbackService);
  private readonly clipboard = inject(Clipboard);
  private readonly dialogs = inject(OrgDialogService);
  private readonly notificationService = inject(NotificationService);
  private readonly eventNotificationService = inject(EventNotificationService);

  protected readonly events$ = this.eventService.listEvents();
  protected readonly events = toSignal(this.events$);
  protected readonly isSuperAdmin = this.authService.isSuperAdmin;
  protected readonly user = this.authService.currentUser;
  protected readonly tableColumns: readonly OrgDataColumn<PartyEvent>[] = [
    { id: 'title', label: 'Evento', value: (event) => event.title },
    { id: 'date', label: 'Data', value: (event) => this.formatDate(event.date) },
    { id: 'location', label: 'Local', value: (event) => event.location },
  ];

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

  protected createEvent(): void {
    void this.router.navigate(['/meus-eventos/evento/novo']);
  }

  protected stopRowClick(event: Event): void {
    event.stopPropagation();
  }

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
    this.dialogs
      .confirm({
        title: 'Cancelar Evento',
        message: `Tem certeza que deseja cancelar o evento "${event.title}"? Ele será movido para os cancelados e o link público avisará sobre o cancelamento.`,
        confirmLabel: 'Cancelar Evento',
      })
      .subscribe(async (result) => {
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
    shareWhatsApp(event.title, this.formatDate(event.date), event.location, url);
  }

  protected copyLink(event: PartyEvent): void {
    const url = `${location.origin}/evento/${event.id}`;
    this.clipboard.copy(url);
    this.feedback.success('Link copiado!', { duration: 2000 });
  }

  protected formatDate(dateStr: string): string {
    return formatDate(dateStr);
  }
}
