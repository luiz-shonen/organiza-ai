import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Subject } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HomeContainer } from './home.container';
import { EventService } from '../../core/services';
import { PartyEvent } from '../../core/models';

describe('HomeContainer', () => {
  let component: HomeContainer;
  let fixture: ComponentFixture<HomeContainer>;
  let router: Router;
  let eventsSubject: Subject<PartyEvent[]>;
  let mockEventService: {
    listEvents: ReturnType<typeof vi.fn>;
  };

  const mockEvents: PartyEvent[] = [
    {
      id: 'evt-1',
      title: 'Aniversário de 30 Anos',
      description: 'Venha comemorar comigo!',
      date: '2026-10-15T18:00:00.000Z',
      location: 'Rua das Flores, 123',
      pixKey: null,
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-08-01T00:00:00.000Z',
    },
    {
      id: 'evt-2',
      title: 'Churrasco da Firma',
      description: 'Churrasco de confraternização anual.',
      date: '2026-11-20T12:00:00.000Z',
      location: 'Parque Ibirapuera',
      pixKey: null,
      createdAt: '2026-08-05T00:00:00.000Z',
      updatedAt: '2026-08-05T00:00:00.000Z',
    },
  ];

  beforeEach(async () => {
    eventsSubject = new Subject<PartyEvent[]>();
    mockEventService = {
      listEvents: vi.fn().mockReturnValue(eventsSubject.asObservable()),
    };

    await TestBed.configureTestingModule({
      imports: [HomeContainer],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        { provide: EventService, useValue: mockEventService },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture = TestBed.createComponent(HomeContainer);
    component = fixture.componentInstance;
  });

  it('should create the component', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should show loading indicator while events are loading (undefined)', () => {
    fixture.detectChanges();

    const loadingEl = fixture.nativeElement.querySelector('.home__loading');
    expect(loadingEl).toBeTruthy();
    expect(loadingEl.textContent).toContain('Carregando eventos...');
  });

  it('should show empty state when events array is empty', () => {
    fixture.detectChanges();
    eventsSubject.next([]);
    fixture.detectChanges();

    const emptyEl = fixture.nativeElement.querySelector('.home__empty');
    expect(emptyEl).toBeTruthy();
    expect(emptyEl.textContent).toContain('Nenhum evento disponível no momento.');
  });

  it('should render event cards when events list is populated', () => {
    fixture.detectChanges();
    eventsSubject.next(mockEvents);
    fixture.detectChanges();

    const cards = fixture.nativeElement.querySelectorAll('.home__card');
    expect(cards.length).toBe(2);

    const titles = Array.from(cards).map(
      (c) => (c as HTMLElement).querySelector('.home__card-title')?.textContent?.trim(),
    );
    expect(titles).toEqual(['Aniversário de 30 Anos', 'Churrasco da Firma']);

    const descriptions = Array.from(cards).map(
      (c) => (c as HTMLElement).querySelector('.home__card-description')?.textContent?.trim(),
    );
    expect(descriptions).toEqual(['Venha comemorar comigo!', 'Churrasco de confraternização anual.']);
  });

  it('should compose event cards with shared surfaces, semantic icons, and an accessible action', () => {
    fixture.detectChanges();
    eventsSubject.next(mockEvents);
    fixture.detectChanges();

    const surfaces = fixture.nativeElement.querySelectorAll('org-surface');
    expect(surfaces).toHaveLength(2);
    expect(fixture.nativeElement.querySelectorAll('mat-card')).toHaveLength(0);
    expect(fixture.nativeElement.querySelectorAll('org-icon')).not.toHaveLength(0);

    eventsSubject.next([]);
    fixture.detectChanges();

    const emptyStateAction = fixture.nativeElement.querySelector('.home__empty-btn') as HTMLElement;
    expect(emptyStateAction).toBeTruthy();
    expect(emptyStateAction.classList).toContain('org-button');
    expect(emptyStateAction.style.minHeight).toBe('48px');
  });

  it('should navigate to event detail on Enter key press', () => {
    fixture.detectChanges();
    eventsSubject.next(mockEvents);
    fixture.detectChanges();

    const card = fixture.nativeElement.querySelector('.home__card-link') as HTMLElement;
    const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
    card.dispatchEvent(enterEvent);

    expect(router.navigate).toHaveBeenCalledWith(['/evento', 'evt-1']);
  });

  it('should navigate to event detail on Space key press and prevent default scroll', () => {
    fixture.detectChanges();
    eventsSubject.next(mockEvents);
    fixture.detectChanges();

    const card = fixture.nativeElement.querySelector('.home__card-link') as HTMLElement;
    const spaceEvent = new KeyboardEvent('keydown', { key: ' ', cancelable: true });
    const preventDefaultSpy = vi.spyOn(spaceEvent, 'preventDefault');
    card.dispatchEvent(spaceEvent);

    expect(preventDefaultSpy).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/evento', 'evt-1']);
  });

  it('should format date string correctly with pt-BR locale', () => {
    const formatted = (component as any).formatDate('2026-10-15T18:00:00.000Z');
    expect(formatted).toBeTruthy();
    expect(formatted).toContain('2026');

    const emptyFormatted = (component as any).formatDate('');
    expect(emptyFormatted).toBe('');
  });
});
