import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { signal } from '@angular/core';
import { Subject } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HomeContainer } from './home.container';
import {
  AuthService,
  ClaimService,
  EventService,
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
  const userService = { getAttendedEvents: vi.fn() };

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
    claimService.getClaims.mockResolvedValue(household);

    await TestBed.configureTestingModule({
      imports: [HomeContainer],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        { provide: EventService, useValue: { listEvents: () => eventsSubject.asObservable() } },
        { provide: AuthService, useValue: { currentUser } },
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

  it('greets visitors with the discovery title and lists upcoming events only', () => {
    fixture.detectChanges();
    eventsSubject.next([confirmed, pending, past]);
    fixture.detectChanges();

    expect(element().querySelector('h1')?.textContent).toContain('Descubra');
    expect(element().querySelector('org-filter-bar')).toBeNull();
    expect(element().querySelectorAll('app-event-summary-card')).toHaveLength(2);
  });

  describe('signed in', () => {
    beforeEach(async () => {
      currentUser.set({ uid: 'u1', displayName: 'Jéssica Souza', isAnonymous: false });
      fixture.detectChanges();
      eventsSubject.next([confirmed, pending, past]);
      await fixture.whenStable();
      fixture.detectChanges();
    });

    it('greets by first name and summarises the invitations', () => {
      expect(element().querySelector('h1')?.textContent).toContain('Jéssica');
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

      select('home-filter-pending');
      expect(titles()).toEqual(['Aniversário']);
      select('home-filter-confirmed');
      expect(titles()).toEqual(['Festa Junina']);
      select('home-filter-past');
      expect(titles()).toEqual(['Churrasco']);
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

    it('opens the event from "Responder convite"', () => {
      (
        element().querySelector('button[data-testid="answer-invite-btn"]') as HTMLButtonElement
      ).click();
      expect(router.navigate).toHaveBeenCalledWith(['/evento', 'evt-2']);
    });
  });
});
