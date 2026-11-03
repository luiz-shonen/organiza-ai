import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { of, switchMap } from 'rxjs';
import { AuthService, ClaimService, ItemService, UserService } from '../../core/services';
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

export type HomeFilter = 'all' | 'pending' | 'confirmed' | 'declined' | 'past';

interface Household {
  readonly items: PartyItem[];
  readonly claims: EventClaims | null;
}

interface HomeCard {
  readonly event: PartyEvent;
  readonly status: EventSummaryStatus | null;
  readonly pending: boolean;
  /** Answered (confirmed or declined) and not organized by the member: "Ver convite". */
  readonly answered: boolean;
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
  private readonly itemService = inject(ItemService);
  private readonly claimService = inject(ClaimService);
  private readonly userService = inject(UserService);
  private readonly authService = inject(AuthService);
  private readonly feedback = inject(FeedbackService);
  private readonly router = inject(Router);

  protected readonly filter = signal<HomeFilter>('all');

  /** Only signed-in members have invitations to answer and a family list. */
  protected readonly member = computed(() => {
    const user = this.authService.currentUser();
    return user && !user.isAnonymous ? user : null;
  });

  /** undefined while the session loads; null for visitors, who see no events. */
  private readonly memberUid = computed(() =>
    this.authService.loading() ? undefined : (this.member()?.uid ?? null),
  );

  /** Events are private: only the ones the member was invited to or answered (organized ones are left out below). */
  protected readonly events = toSignal(
    toObservable(this.memberUid).pipe(
      switchMap((uid) => {
        if (uid === undefined) return of(undefined);
        return uid ? this.userService.getVisibleEvents(uid) : of([]);
      }),
    ),
  );

  private readonly confirmedIds = signal<ReadonlySet<string>>(new Set());
  /** Invites the member said they cannot attend: answered, so not pending. */
  private readonly declinedIds = signal<ReadonlySet<string>>(new Set());
  private readonly households = signal<Readonly<Record<string, Household>>>({});

  protected readonly firstName = computed(() => {
    const name = this.member()?.displayName ?? this.member()?.email?.split('@')[0] ?? '';
    return name.split(' ')[0];
  });

  /** Início is for invites only: events the member organizes (owner or collaborator) live in "Meus eventos". */
  private readonly active = computed(() => {
    const uid = this.member()?.uid;
    return (this.events() ?? []).filter(
      (event) =>
        event.status !== 'cancelled' &&
        event.createdBy !== uid &&
        !(uid && (event.collaborators ?? []).includes(uid)),
    );
  });
  private readonly upcoming = computed(() =>
    this.active().filter((event) => daysUntil(event.date) >= 0),
  );
  private readonly past = computed(() =>
    this.active()
      .filter((event) => daysUntil(event.date) < 0)
      .reverse(),
  );

  private readonly awaitingAnswer = computed(() =>
    this.upcoming().filter(
      (event) => !this.confirmedIds().has(event.id) && !this.declinedIds().has(event.id),
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
    { id: 'declined', label: 'Recusados', testId: 'home-filter-declined' },
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
      declined: this.upcoming().filter(
        (event) => !confirmed.has(event.id) && this.declinedIds().has(event.id),
      ),
      past: this.past(),
    }[this.filter()];

    return source.map((event) => {
      const isPast = daysUntil(event.date) < 0;
      const isConfirmed = confirmed.has(event.id);
      const isDeclined = !isConfirmed && this.declinedIds().has(event.id);
      const household = this.households()[event.id];
      const bring = household ? buildFamilyChecklist(household.items, household.claims) : [];
      let status: EventSummaryStatus | null = null;
      if (isPast) status = { label: 'Realizado', variant: 'default' };
      else if (isConfirmed) status = { label: 'Confirmado', variant: 'success' };
      else if (isDeclined) status = { label: 'Recusado', variant: 'default' };
      else if (this.member()) status = { label: 'Pendente', variant: 'warning' };
      return {
        event,
        status,
        pending: !isPast && !isConfirmed && !isDeclined && !!this.member(),
        answered: !isPast && (isConfirmed || isDeclined),
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
          this.declinedIds.set(new Set());
          this.households.set({});
        }
      });
    });
  }

  private async loadMemberData(uid: string): Promise<void> {
    try {
      const attended = await this.userService.getAttendedEvents(uid);
      this.confirmedIds.set(new Set(attended.map((event) => event.id)));
      this.declinedIds.set(new Set(await this.userService.getDeclinedEvents(uid)));
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
