import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { signal } from '@angular/core';
import { Subject, of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HomeContainer } from './home.container';
import {
  AuthService,
  ClaimService,
  GuestService,
  InboxService,
  ItemService,
  UserService,
} from '../../core/services';
import type { EventClaims, PartyEvent } from '../../core/models';

const inDays = (days: number): string => new Date(Date.now() + 86_400_000 * days).toISOString();

describe('HomeContainer', () => {
  let fixture: ComponentFixture<HomeContainer>;
  let router: Router;
  let eventsSubject: Subject<PartyEvent[]>;
  const currentUser = signal<{ uid: string; displayName: string; isAnonymous: boolean } | null>(
    null,
  );
  const claimService = {
    getClaims: vi.fn(),
    saveClaims: vi.fn().mockResolvedValue(undefined),
  };
  const userService = {
    getAttendedEvents: vi.fn(),
    getVisibleEvents: vi.fn(),
    getDeclinedEvents: vi.fn(),
    getProfile: vi.fn(),
  };

  const base = {
    description: 'Descrição',
    location: 'Rua das Flores, 123',
    pixKey: null,
    createdAt: inDays(-10),
    updatedAt: inDays(-10),
  };
  const confirmed: PartyEvent = { ...base, id: 'evt-1', title: 'Festa Junina', date: inDays(3) };
  const pending: PartyEvent = { ...base, id: 'evt-2', title: 'Aniversário', date: inDays(10) };
  const past: PartyEvent = { ...base, id: 'evt-3', title: 'Churrasco', date: inDays(-5) };

  const household: EventClaims = {
    id: 'u1',
    name: 'Jéssica',
    updatedAt: '',
    entries: [{ itemId: 'i1', memberId: 'f1', who: 'Pedro', quantity: 2, bought: false }],
  };

  const guestService = { getGuest: vi.fn().mockResolvedValue(null) };
  const inbox = { watchUnread: vi.fn(), markRead: vi.fn().mockResolvedValue(undefined) };

  const element = () => fixture.nativeElement as HTMLElement;

  beforeEach(async () => {
    eventsSubject = new Subject<PartyEvent[]>();
    currentUser.set(null);
    userService.getAttendedEvents.mockResolvedValue([confirmed]);
    userService.getDeclinedEvents.mockResolvedValue([]);
    userService.getProfile.mockResolvedValue({ name: 'Jéssica Mello' });
    userService.getVisibleEvents.mockReset();
    userService.getVisibleEvents.mockImplementation(() => eventsSubject.asObservable());
    claimService.getClaims.mockResolvedValue(household);
    inbox.watchUnread.mockReset();
    inbox.watchUnread.mockReturnValue(of([]));
    guestService.getGuest.mockReset().mockResolvedValue(null);

    await TestBed.configureTestingModule({
      imports: [HomeContainer],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        { provide: AuthService, useValue: { currentUser, loading: signal(false) } },
        { provide: UserService, useValue: userService },
        {
          provide: ItemService,
          useValue: {
            getItems: vi
              .fn()
              .mockResolvedValue([
                { id: 'i1', name: 'Quentão', quantity: 6, unit: 'L', claimedBy: null },
              ]),
          },
        },
        { provide: ClaimService, useValue: claimService },
        { provide: InboxService, useValue: inbox },
        { provide: GuestService, useValue: guestService },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture = TestBed.createComponent(HomeContainer);
  });

  it('shows the loading state, then the empty state', () => {
    currentUser.set({ uid: 'u1', displayName: 'Jéssica Souza', isAnonymous: false });
    fixture.detectChanges();
    expect(element().querySelector('org-loading-state')?.textContent).toContain(
      'Carregando eventos...',
    );

    eventsSubject.next([]);
    fixture.detectChanges();
    expect(element().querySelector('[data-testid="home-empty-state"]')?.textContent).toContain(
      'Nenhum evento por aqui ainda',
    );
  });

  it('still lists the events when the notices cannot be read', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    inbox.watchUnread.mockReturnValue(
      throwError(() => new Error('Missing or insufficient permissions.')),
    );
    currentUser.set({ uid: 'u1', displayName: 'Jéssica Souza', isAnonymous: false });
    fixture.detectChanges();
    eventsSubject.next([pending]);
    fixture.detectChanges();

    expect(element().querySelector('org-loading-state')).toBeNull();
    expect(element().querySelectorAll('app-invite-envelope')).toHaveLength(1);
  });

  it('greets visitors with the discovery title and lists no events, since events are private', () => {
    fixture.detectChanges();

    expect(element().querySelector('h1')?.textContent).toContain('Descubra');
    expect(element().querySelector('org-filter-bar')).toBeNull();
    expect(element().querySelectorAll('app-invite-envelope')).toHaveLength(0);
    expect(element().querySelector('[data-testid="home-empty-state"]')).not.toBeNull();
    expect(userService.getVisibleEvents).not.toHaveBeenCalled();
  });

  it('asks only for the events the member can see', () => {
    currentUser.set({ uid: 'u1', displayName: 'Jéssica Souza', isAnonymous: false });
    fixture.detectChanges();

    expect(userService.getVisibleEvents).toHaveBeenCalledWith('u1');
  });

  describe('signed in', () => {
    beforeEach(async () => {
      currentUser.set({ uid: 'u1', displayName: 'Jéssica Souza', isAnonymous: false });
      fixture.detectChanges();
      eventsSubject.next([confirmed, pending, past]);
      await fixture.whenStable();
      fixture.detectChanges();
    });

    it('shows the nearest confirmed event at the top', () => {
      const banner = element().querySelector('[data-testid="next-event-banner"]');
      expect(banner?.textContent).toContain('Evento próximo:');
      expect(banner?.textContent).toContain('Festa Junina, em 3 dias');
    });

    it('greets with the profile name and summarises the invitations', () => {
      expect(element().querySelector('h1')?.textContent).toContain('Jéssica Mello');
      expect(element().querySelector('.org-page-header__subtitle')?.textContent).toContain(
        '1 evento confirmado e 1 convite esperando resposta',
      );
    });

    it('marks pending invitations; the envelope itself opens the invite', () => {
      const statuses = Array.from(element().querySelectorAll('[data-testid="event-status"]')).map(
        (badge) => badge.textContent?.trim(),
      );
      expect(statuses).toEqual(['Confirmado', 'Pendente']);
      expect(element().querySelectorAll('[data-testid="answer-invite-btn"]')).toHaveLength(0);
    });

    it('combines the filter chips, and "Todos" clears them', () => {
      const titles = () =>
        Array.from(element().querySelectorAll('.invite-envelope__title')).map((title) =>
          title.textContent?.trim(),
        );
      // A chip toggles: Material's primary action is the button inside the chip.
      const toggle = (testId: string) => {
        (element().querySelector(`[data-testid="${testId}"] button`) as HTMLButtonElement).click();
        fixture.detectChanges();
      };
      const heading = () => element().querySelector('#home-list-title')?.textContent?.trim();
      const checked = () =>
        Array.from(element().querySelectorAll('mat-chip-option.mat-mdc-chip-selected'), (chip) =>
          chip.getAttribute('data-testid'),
        );

      expect(heading()).toContain('Próximos eventos');
      expect(checked()).toEqual(['home-filter-all']);

      toggle('home-filter-pending');
      expect(titles()).toEqual(['Aniversário']);
      expect(heading()).toContain('Eventos pendentes');
      expect(checked()).toEqual(['home-filter-pending']);

      toggle('home-filter-past');
      expect(titles()).toEqual(['Aniversário', 'Churrasco']);
      expect(heading()).toContain('Eventos filtrados');

      toggle('home-filter-pending');
      expect(titles()).toEqual(['Churrasco']);
      expect(heading()).toContain('Eventos realizados');

      toggle('home-filter-all');
      expect(checked()).toEqual(['home-filter-all']);
      expect(heading()).toContain('Próximos eventos');
    });

    it('shows what the family brings and saves the "comprado" check', async () => {
      const panel = element().querySelector('[data-testid="family-bring-panel"]');
      expect(panel?.textContent).toContain('Família leva 1 item');
      expect(panel?.textContent).toContain('0/1 comprados');

      (element().querySelector('[data-testid="bought-i1"] input') as HTMLInputElement).click();
      await fixture.whenStable();

      expect(claimService.saveClaims).toHaveBeenCalledWith('evt-1', 'u1', [
        { ...household.entries[0], bought: true },
      ]);
    });

    it('shows each invite as an envelope for the member, in the colours of its category', () => {
      const envelope = element().querySelector('app-invite-envelope');
      expect(envelope?.textContent).toContain('Para Jéssica');
      expect(envelope?.querySelector('article')?.className).toContain('org-invite--');
      expect(envelope?.querySelector('a[data-testid="event-card-link"]')).not.toBeNull();
    });

    it('leaves the events the member organizes to "Meus eventos"', () => {
      eventsSubject.next([confirmed, { ...pending, createdBy: 'u1' }, past]);
      fixture.detectChanges();

      const titles = Array.from(element().querySelectorAll('.invite-envelope__title')).map(
        (title) => title.textContent?.trim(),
      );
      expect(titles).toEqual(['Festa Junina']);
      expect(element().querySelector('.org-page-header__subtitle')?.textContent).toContain(
        '0 convites esperando resposta',
      );
    });
  });

  it('keeps a declined invite out of "Todos" and the pending count, under "Recusados"', async () => {
    userService.getDeclinedEvents.mockResolvedValue(['evt-2']);
    currentUser.set({ uid: 'u1', displayName: 'Jéssica Souza', isAnonymous: false });
    fixture.detectChanges();
    eventsSubject.next([confirmed, pending]);
    await fixture.whenStable();
    fixture.detectChanges();

    const statuses = Array.from(element().querySelectorAll('[data-testid="event-status"]')).map(
      (badge) => badge.textContent?.trim(),
    );
    expect(statuses).toEqual(['Confirmado']);
    expect(element().querySelector('[data-testid="answer-invite-btn"]')).toBeNull();
    fixture.componentInstance['activeFilters'].set(['declined']);
    fixture.detectChanges();
    const declined = Array.from(element().querySelectorAll('[data-testid="event-status"]')).map(
      (badge) => badge.textContent?.trim(),
    );
    expect(declined).toEqual(['Recusado']);
    expect(element().querySelector('.org-page-header__subtitle')?.textContent).toContain(
      '0 convites esperando resposta',
    );
  });

  it('says a confirmation is waiting for approval, and does not count it as confirmed yet', async () => {
    const waiting = { ...confirmed, requireApproval: true };
    userService.getAttendedEvents.mockResolvedValue([waiting]);
    guestService.getGuest.mockResolvedValue({ id: 'u1', approved: false });
    currentUser.set({ uid: 'u1', displayName: 'Jéssica Souza', isAnonymous: false });
    fixture.detectChanges();
    eventsSubject.next([waiting]);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(guestService.getGuest).toHaveBeenCalledWith('evt-1', 'u1');
    expect(element().querySelector('[data-testid="event-status"]')?.textContent?.trim()).toBe(
      'Aguardando aprovação',
    );
    expect(element().querySelector('.org-page-header__subtitle')?.textContent).toContain(
      '0 eventos confirmados',
    );
  });
});
