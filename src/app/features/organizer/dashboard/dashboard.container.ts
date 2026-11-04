import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { Router } from '@angular/router';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Clipboard } from '@angular/cdk/clipboard';
import { firstValueFrom, of, switchMap } from 'rxjs';
import {
  AuthService,
  ClaimService,
  EventNotificationService,
  EventService,
  GuestService,
  ItemService,
  NotificationService,
  UserService,
} from '../../../core/services';
import { buildItemProgress, daysUntil, hasStarted, shareWhatsApp } from '../../../core/utils';
import type { PartyEvent } from '../../../core/models';
import {
  FeedbackService,
  OrgButtonComponent,
  OrgEmptyStateComponent,
  OrgExpansionPanelComponent,
  OrgFilterBarComponent,
  OrgIconButtonComponent,
  OrgInsightCardComponent,
  OrgPageHeaderComponent,
  OrgPageLayoutComponent,
  OrgProgressComponent,
  OrgSkeletonComponent,
  type OrgFilterOption,
  type OrgInsightTone,
} from '../../../shared/ui';
import {
  EventSummaryCardComponent,
  type EventSummaryStatus,
} from '../../../shared/components/event-summary-card/event-summary-card.component';
import { NextEventBannerComponent } from '../../../shared/components/next-event-banner/next-event-banner.component';

export type EventStatusFilter = 'all' | 'soon' | 'scheduled' | 'past' | 'cancelled';

/** "Em breve" means really close: at most this many days away. Further ahead is "Agendado". */
export const SOON_DAYS = 5;

/** The tag on an organizer's event card. */
export function summaryStatus(event: PartyEvent, days = daysUntil(event.date)): EventSummaryStatus {
  if (event.status === 'cancelled') return { label: 'Cancelado', variant: 'danger' };
  if (days < 0 || hasStarted(event.date)) return { label: 'Realizado', variant: 'default' };
  return days <= SOON_DAYS
    ? { label: 'Em breve', variant: 'success' }
    : { label: 'Agendado', variant: 'primary' };
}

/** Numbers behind the "Progresso" panel and the AI tip of one event. */
export interface EventStats {
  readonly guests: number;
  readonly items: number;
  readonly completeItems: number;
}

interface DashboardCard {
  readonly event: PartyEvent;
  readonly status: EventSummaryStatus;
  readonly stats: EventStats | null;
  readonly insight: {
    readonly tone: OrgInsightTone;
    readonly lead: string;
    readonly rest: string;
    readonly strong: string;
  } | null;
}

@Component({
  selector: 'app-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    OrgButtonComponent,
    OrgEmptyStateComponent,
    OrgExpansionPanelComponent,
    OrgFilterBarComponent,
    OrgIconButtonComponent,
    OrgInsightCardComponent,
    OrgPageHeaderComponent,
    OrgPageLayoutComponent,
    OrgProgressComponent,
    OrgSkeletonComponent,
    EventSummaryCardComponent,
    NextEventBannerComponent,
  ],
  templateUrl: './dashboard.container.html',
  styleUrl: './dashboard.container.scss',
})
export class DashboardContainer {
  private readonly eventService = inject(EventService);
  private readonly guestService = inject(GuestService);
  private readonly itemService = inject(ItemService);
  private readonly claimService = inject(ClaimService);
  private readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);
  private readonly router = inject(Router);
  private readonly feedback = inject(FeedbackService);
  private readonly clipboard = inject(Clipboard);
  private readonly notificationService = inject(NotificationService);
  private readonly eventNotificationService = inject(EventNotificationService);

  /** Events the person created or helps organise (super admins see every event). */
  protected readonly events = toSignal(
    toObservable(this.authService.currentUser).pipe(
      switchMap((user) => {
        if (!user) return of([] as PartyEvent[]);
        return this.authService.isSuperAdmin()
          ? this.eventService.listEvents()
          : this.eventService.getUserEvents(user.uid);
      }),
    ),
  );

  /** The filter chips on; `['all']` shows every event. */
  readonly activeFilters = signal<readonly EventStatusFilter[]>(['all']);
  private readonly stats = signal<Readonly<Record<string, EventStats>>>({});

  protected readonly filters: readonly OrgFilterOption<EventStatusFilter>[] = [
    { id: 'all', label: 'Todos', testId: 'status-filter-all-chip' },
    { id: 'soon', label: 'Em breve', testId: 'status-filter-soon-chip' },
    { id: 'scheduled', label: 'Agendados', testId: 'status-filter-scheduled-chip' },
    { id: 'past', label: 'Realizados', testId: 'status-filter-past-chip' },
    { id: 'cancelled', label: 'Cancelados', testId: 'status-filter-cancelled-chip' },
  ];

  protected readonly subtitle = computed(() => {
    const count = this.events()?.length ?? 0;
    return count === 1 ? '1 evento que você organiza' : `${count} eventos que você organiza`;
  });

  readonly filteredEvents = computed(() => {
    const all = this.events() ?? [];
    const picked = this.activeFilters();
    if (picked.includes('all')) return this.allSorted(all);
    // Several chips on: every event any of them matches, once, in the same order as "Todos".
    const matches = (e: PartyEvent, id: EventStatusFilter): boolean => {
      switch (id) {
        case 'soon':
          return e.status !== 'cancelled' && !hasStarted(e.date) && daysUntil(e.date) <= SOON_DAYS;
        case 'scheduled':
          return e.status !== 'cancelled' && daysUntil(e.date) > SOON_DAYS;
        case 'past':
          return e.status !== 'cancelled' && hasStarted(e.date);
        case 'cancelled':
          return e.status === 'cancelled';
        default:
          return true;
      }
    };
    return this.allSorted(all).filter((e) => picked.some((id) => matches(e, id)));
  });

  /** Upcoming first (soonest on top), then history (latest first), then cancelled. */
  private allSorted(all: readonly PartyEvent[]): PartyEvent[] {
    const rank = (e: PartyEvent) => (e.status === 'cancelled' ? 2 : hasStarted(e.date) ? 1 : 0);
    return [...all].sort((a, b) => {
      const byRank = rank(a) - rank(b);
      if (byRank !== 0) return byRank;
      const diff = new Date(a.date).getTime() - new Date(b.date).getTime();
      return rank(a) === 0 ? diff : -diff;
    });
  }

  protected readonly cards = computed<DashboardCard[]>(() =>
    this.filteredEvents().map((event) => {
      const days = daysUntil(event.date);
      const stats = this.stats()[event.id] ?? null;
      const status = summaryStatus(event, days);
      const live = event.status !== 'cancelled' && !hasStarted(event.date);
      return {
        event,
        status,
        stats,
        insight: live && stats ? this.buildInsight(days, stats) : null,
      };
    }),
  );

  protected readonly nextEvent = computed(
    () =>
      (this.events() ?? []).find((e) => e.status !== 'cancelled' && !hasStarted(e.date)) ?? null,
  );

  protected readonly nextEventDays = computed(() => {
    const event = this.nextEvent();
    return event ? daysUntil(event.date) : null;
  });

  /** Events saved before "Organizado por" used the profile name get it once, here. */
  private creatorNamesChecked = false;

  constructor() {
    effect(() => {
      const user = this.authService.currentUser();
      const all = this.events();
      if (!user || !all?.length || this.creatorNamesChecked) return;
      this.creatorNamesChecked = true;
      untracked(async () => {
        const name = (await this.userService.getProfile(user.uid))?.name?.trim();
        if (
          name &&
          all.some((event) => event.createdBy === user.uid && event.creatorName !== name)
        ) {
          await this.eventService.renameCreator(user.uid, name);
        }
      });
    });

    effect(() => {
      const all = this.events();
      if (all && all.length > 0) {
        this.eventNotificationService.evaluateCountdownReminders(all);
        untracked(() => void this.loadStats(all));
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

  /** Guests and item progress of upcoming events, for the tip and the "Progresso" panel. */
  private async loadStats(events: readonly PartyEvent[]): Promise<void> {
    const live = events.filter((e) => e.status !== 'cancelled' && !hasStarted(e.date));
    try {
      const entries = await Promise.all(
        live.map(async (event) => {
          const [guests, items, claims] = await Promise.all([
            firstValueFrom(this.guestService.listGuests(event.id)),
            this.itemService.getItems(event.id),
            firstValueFrom(this.claimService.listClaims(event.id)),
          ]);
          const progress = buildItemProgress(items, claims);
          const people = guests.reduce(
            (sum, guest) => sum + 1 + (guest.companions?.length ?? guest.companionsCount ?? 0),
            0,
          );
          const stats: EventStats = {
            guests: people,
            items: progress.length,
            completeItems: progress.filter((p) => p.complete).length,
          };
          return [event.id, stats] as const;
        }),
      );
      this.stats.set(Object.fromEntries(entries));
    } catch (err) {
      console.error('Error loading event progress:', err);
    }
  }

  private buildInsight(days: number, stats: EventStats): DashboardCard['insight'] {
    const missing = stats.items - stats.completeItems;
    const lead = days === 0 ? 'É hoje!' : days === 1 ? 'Falta 1 dia!' : `Faltam ${days} dias!`;
    if (missing > 0) {
      return {
        tone: days <= 7 ? 'warning' : 'info',
        lead,
        strong: missing === 1 ? '1 item' : `${missing} itens`,
        rest: missing === 1 ? ' ainda está sem responsável.' : ' ainda estão sem responsável.',
      };
    }
    return {
      tone: 'info',
      lead,
      strong: stats.guests === 1 ? '1 pessoa confirmada' : `${stats.guests} pessoas confirmadas`,
      rest: ' até agora. Que tal lembrar quem ainda não respondeu?',
    };
  }

  protected setFilters(ids: string[]): void {
    this.activeFilters.set(ids as EventStatusFilter[]);
  }

  protected createEvent(): void {
    void this.router.navigate(['/meus-eventos/evento/novo']);
  }

  protected editEvent(event: PartyEvent): void {
    void this.router.navigate(['/meus-eventos/evento', event.id]);
  }

  protected shareWhatsApp(event: PartyEvent): void {
    const url = `${location.origin}/evento/${event.id}`;
    shareWhatsApp({ title: event.title, date: event.date, location: event.location, url });
  }

  protected copyLink(event: PartyEvent): void {
    const url = `${location.origin}/evento/${event.id}`;
    this.clipboard.copy(url);
    this.feedback.success('Link copiado!', { duration: 2000 });
  }
}
