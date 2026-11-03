import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { signal } from '@angular/core';
import { Subject } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HomeContainer } from './home.container';
import { AuthService, ClaimService, ItemService, UserService } from '../../core/services';
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

  it('greets visitors with the discovery title and lists no events, since events are private', () => {
    fixture.detectChanges();

    expect(element().querySelector('h1')?.textContent).toContain('Descubra');
    expect(element().querySelector('org-filter-bar')).toBeNull();
    expect(element().querySelectorAll('app-event-summary-card')).toHaveLength(0);
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

    it('marks pending invitations and offers "Responder convite"', () => {
      const statuses = Array.from(element().querySelectorAll('[data-testid="event-status"]')).map(
        (badge) => badge.textContent?.trim(),
      );
      expect(statuses).toEqual(['Confirmado', 'Pendente']);
      expect(element().querySelectorAll('[data-testid="answer-invite-btn"]')).toHaveLength(1);
    });

    it('filters pending, confirmed and past events', () => {
      const titles = () =>
        Array.from(element().querySelectorAll('.event-summary-card__title')).map((title) =>
          title.textContent?.trim(),
        );
      const select = (testId: string) => {
        (element().querySelector(`[data-testid="${testId}"]`) as HTMLButtonElement).click();
        fixture.detectChanges();
      };

      const heading = () => element().querySelector('#home-list-title')?.textContent?.trim();
      expect(heading()).toContain('Próximos eventos');
      select('home-filter-pending');
      expect(titles()).toEqual(['Aniversário']);
      expect(heading()).toContain('Eventos pendentes');
      select('home-filter-confirmed');
      expect(titles()).toEqual(['Festa Junina']);
      expect(heading()).toContain('Eventos confirmados');
      select('home-filter-past');
      expect(titles()).toEqual(['Churrasco']);
      expect(heading()).toContain('Eventos realizados');
    });

    it('shows what the family brings and saves the "comprado" check', async () => {
      const panel = element().querySelector('[data-testid="family-bring-panel"]');
      expect(panel?.textContent).toContain('Família leva 1 item');
      expect(panel?.textContent).toContain('0/1 comprados');

      (element().querySelector('[data-testid="bought-i1"] input') as HTMLInputElement).click();
      await fixture.whenStable();

      expect(claimService.saveClaims).toHaveBeenCalledWith('evt-1', 'u1', 'Jéssica', [
        { ...household.entries[0], bought: true },
      ]);
    });

    it('offers "Ver convite" on an answered invite instead of "Responder convite"', () => {
      const confirmedCard = element().querySelectorAll('app-event-summary-card')[0];
      expect(confirmedCard.querySelector('[data-testid="view-invite-btn"]')).not.toBeNull();
      expect(confirmedCard.querySelector('[data-testid="answer-invite-btn"]')).toBeNull();
    });

    it('opens the event from "Responder convite"', () => {
      (
        element().querySelector('button[data-testid="answer-invite-btn"]') as HTMLButtonElement
      ).click();
      expect(router.navigate).toHaveBeenCalledWith(['/evento', 'evt-2']);
    });

    it('leaves the events the member organizes to "Meus eventos"', () => {
      eventsSubject.next([confirmed, { ...pending, createdBy: 'u1' }, past]);
      fixture.detectChanges();

      const titles = Array.from(element().querySelectorAll('.event-summary-card__title')).map(
        (title) => title.textContent?.trim(),
      );
      expect(titles).toEqual(['Festa Junina']);
      expect(element().querySelector('.org-page-header__subtitle')?.textContent).toContain(
        '0 convites esperando resposta',
      );
    });
  });

  it('shows a declined invite as "Recusado", out of the pending count', async () => {
    userService.getDeclinedEvents.mockResolvedValue(['evt-2']);
    currentUser.set({ uid: 'u1', displayName: 'Jéssica Souza', isAnonymous: false });
    fixture.detectChanges();
    eventsSubject.next([confirmed, pending]);
    await fixture.whenStable();
    fixture.detectChanges();

    const statuses = Array.from(element().querySelectorAll('[data-testid="event-status"]')).map(
      (badge) => badge.textContent?.trim(),
    );
    expect(statuses).toEqual(['Confirmado', 'Recusado']);
    expect(element().querySelector('[data-testid="answer-invite-btn"]')).toBeNull();
    expect(element().querySelector('.org-page-header__subtitle')?.textContent).toContain(
      '0 convites esperando resposta',
    );
  });
});
