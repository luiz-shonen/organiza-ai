import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import {
  AuthService,
  ClaimService,
  EventService,
  ItemService,
  UserService,
} from '../../core/services';
import type { EventClaims, FamilyChecklistRow, PartyEvent, PartyItem } from '../../core/models';
import { buildFamilyChecklist, daysUntil, toggleBought } from '../../core/utils';
import {
  FeedbackService,
  OrgButtonComponent,
  OrgEmptyStateComponent,
  OrgExpansionPanelComponent,
  OrgFilterBarComponent,
  OrgLoadingStateComponent,
  OrgPageHeaderComponent,
  OrgPageLayoutComponent,
  type OrgFilterOption,
} from '../../shared/ui';
import {
  EventSummaryCardComponent,
  type EventSummaryStatus,
} from '../../shared/components/event-summary-card/event-summary-card.component';
import { FamilyChecklistComponent } from '../../shared/components/family-checklist/family-checklist.component';

export type HomeFilter = 'all' | 'pending' | 'confirmed' | 'past';

interface Household {
  readonly items: PartyItem[];
  readonly claims: EventClaims | null;
}

interface HomeCard {
  readonly event: PartyEvent;
  readonly status: EventSummaryStatus | null;
  readonly pending: boolean;
  /** The member created the event or helps organize it: no invite to answer. */
  readonly organizer: boolean;
  readonly bring: FamilyChecklistRow[];
  readonly bought: number;
}

@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    OrgButtonComponent,
    OrgEmptyStateComponent,
    OrgExpansionPanelComponent,
    OrgFilterBarComponent,
    OrgLoadingStateComponent,
    OrgPageHeaderComponent,
    OrgPageLayoutComponent,
    EventSummaryCardComponent,
    FamilyChecklistComponent,
  ],
  templateUrl: './home.container.html',
  styleUrl: './home.container.scss',
})
export class HomeContainer {
  private readonly eventService = inject(EventService);
  private readonly itemService = inject(ItemService);
  private readonly claimService = inject(ClaimService);
  private readonly userService = inject(UserService);
  private readonly authService = inject(AuthService);
  private readonly feedback = inject(FeedbackService);
  private readonly router = inject(Router);

  protected readonly events = toSignal(this.eventService.listEvents());
  protected readonly filter = signal<HomeFilter>('all');

  /** Only signed-in members have invitations to answer and a family list. */
  protected readonly member = computed(() => {
    const user = this.authService.currentUser();
    return user && !user.isAnonymous ? user : null;
  });

  private readonly confirmedIds = signal<ReadonlySet<string>>(new Set());
  private readonly households = signal<Readonly<Record<string, Household>>>({});

  protected readonly firstName = computed(() => {
    const name = this.member()?.displayName ?? this.member()?.email?.split('@')[0] ?? '';
    return name.split(' ')[0];
  });

  private readonly active = computed(() =>
    (this.events() ?? []).filter((event) => event.status !== 'cancelled'),
  );
  private readonly upcoming = computed(() =>
    this.active().filter((event) => daysUntil(event.date) >= 0),
  );
  private readonly past = computed(() =>
    this.active()
      .filter((event) => daysUntil(event.date) < 0)
      .reverse(),
  );

  /** Events the member organizes (owner or collaborator); they never wait for an answer. */
  private readonly organizedIds = computed<ReadonlySet<string>>(() => {
    const uid = this.member()?.uid;
    if (!uid) return new Set();
    return new Set(
      this.active()
        .filter((event) => event.createdBy === uid || (event.collaborators ?? []).includes(uid))
        .map((event) => event.id),
    );
  });
  private readonly awaitingAnswer = computed(() =>
    this.upcoming().filter(
      (event) => !this.confirmedIds().has(event.id) && !this.organizedIds().has(event.id),
    ),
  );

  protected readonly confirmedCount = computed(
    () => this.upcoming().filter((event) => this.confirmedIds().has(event.id)).length,
  );
  protected readonly pendingCount = computed(() =>
    this.member() ? this.awaitingAnswer().length : 0,
  );

  protected readonly filters = computed<OrgFilterOption<HomeFilter>[]>(() => [
    { id: 'all', label: 'Todos', testId: 'home-filter-all' },
    {
      id: 'pending',
      label: 'Pendentes',
      count: this.pendingCount(),
      attention: true,
      testId: 'home-filter-pending',
    },
    { id: 'confirmed', label: 'Confirmados', testId: 'home-filter-confirmed' },
    { id: 'past', label: 'Anteriores', testId: 'home-filter-past' },
  ]);

  protected readonly subtitle = computed(() => {
    if (!this.member()) {
      return 'Encontre encontros, festas e momentos especiais. Confirme sua presença e combine itens com facilidade.';
    }
    const confirmed = this.confirmedCount();
    const pending = this.pendingCount();
    const plural = (count: number, one: string, many: string) =>
      `${count} ${count === 1 ? one : many}`;
    return `Você tem ${plural(confirmed, 'evento confirmado', 'eventos confirmados')} e ${plural(
      pending,
      'convite esperando resposta',
      'convites esperando resposta',
    )}.`;
  });

  protected readonly cards = computed<HomeCard[]>(() => {
    const confirmed = this.confirmedIds();
    const source = {
      all: this.upcoming(),
      pending: this.awaitingAnswer(),
      confirmed: this.upcoming().filter((event) => confirmed.has(event.id)),
      past: this.past(),
    }[this.filter()];

    return source.map((event) => {
      const isPast = daysUntil(event.date) < 0;
      const isConfirmed = confirmed.has(event.id);
      const organizer = this.organizedIds().has(event.id);
      const household = this.households()[event.id];
      const bring = household ? buildFamilyChecklist(household.items, household.claims) : [];
      let status: EventSummaryStatus | null = null;
      if (isPast) status = { label: 'Realizado', variant: 'default' };
      else if (organizer) status = { label: 'Organizador', variant: 'primary' };
      else if (isConfirmed) status = { label: 'Confirmado', variant: 'success' };
      else if (this.member()) status = { label: 'Pendente', variant: 'warning' };
      return {
        event,
        status,
        pending: !isPast && !isConfirmed && !organizer && !!this.member(),
        organizer,
        bring,
        bought: bring.filter((row) => row.bought).length,
      };
    });
  });

  protected readonly listTitle = computed(() =>
    this.filter() === 'past' ? 'Eventos anteriores' : 'Próximos eventos',
  );

  constructor() {
    effect(() => {
      const user = this.member();
      untracked(() => {
        if (user) {
          void this.loadMemberData(user.uid);
        } else {
          this.confirmedIds.set(new Set());
          this.households.set({});
        }
      });
    });
  }

  private async loadMemberData(uid: string): Promise<void> {
    try {
      const attended = await this.userService.getAttendedEvents(uid);
      this.confirmedIds.set(new Set(attended.map((event) => event.id)));
      const entries = await Promise.all(
        attended.map(async (event) => {
          const [items, claims] = await Promise.all([
            this.itemService.getItems(event.id),
            this.claimService.getClaims(event.id, uid),
          ]);
          return [event.id, { items, claims }] as const;
        }),
      );
      this.households.set(Object.fromEntries(entries));
    } catch (err) {
      console.error('Error loading the family list:', err);
    }
  }

  protected async toggleBought(eventId: string, row: FamilyChecklistRow): Promise<void> {
    const user = this.member();
    const household = this.households()[eventId];
    if (!user || !household?.claims) return;

    const claims: EventClaims = {
      ...household.claims,
      entries: toggleBought(household.claims.entries, row.itemId, row.memberId),
    };
    this.households.update((all) => ({ ...all, [eventId]: { ...household, claims } }));
    try {
      await this.claimService.saveClaims(eventId, user.uid, claims.name, claims.entries);
    } catch {
      this.households.update((all) => ({ ...all, [eventId]: household }));
      this.feedback.error('Não foi possível salvar. Tente novamente.');
    }
  }

  protected manageEvent(eventId: string): void {
    void this.router.navigate(['/meus-eventos/evento', eventId]);
  }

  protected openEvent(eventId: string): void {
    void this.router.navigate(['/evento', eventId]);
  }

  protected createEvent(): void {
    void this.router.navigate(['/meus-eventos/evento/novo']);
  }

  protected setFilter(id: string): void {
    this.filter.set(id as HomeFilter);
  }
}
