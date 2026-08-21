import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Router, provideRouter } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { Clipboard } from '@angular/cdk/clipboard';
import { BehaviorSubject } from 'rxjs';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { DashboardContainer } from './dashboard.container';
import {
  EventService,
  AuthService,
  NotificationService,
  EventNotificationService,
} from '../../../core/services';
import { PartyEvent } from '../../../core/models';

describe('DashboardContainer', () => {
  let fixture: ComponentFixture<DashboardContainer>;
  let component: DashboardContainer;

  let eventsSubject: BehaviorSubject<PartyEvent[]>;
  let mockEventService: {
    listEvents: ReturnType<typeof vi.fn>;
    cancelEvent: ReturnType<typeof vi.fn>;
  };
  let mockAuthService: {
    isSuperAdmin: ReturnType<typeof signal>;
    currentUser: ReturnType<typeof signal>;
    logout: ReturnType<typeof vi.fn>;
  };
  let mockEventNotificationService: {
    evaluateCountdownReminders: ReturnType<typeof vi.fn>;
  };
  let mockNotificationService: {
    sendLocalNotification: ReturnType<typeof vi.fn>;
  };

  const sampleEvents: PartyEvent[] = [
    {
      id: 'evt-1',
      title: 'Churrasco Futuro',
      description: 'Churrasco daqui a 5 dias',
      date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      location: 'Parque Ibirapuera',
      pixKey: '12345678900',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'evt-2',
      title: 'Festa Antiga',
      description: 'Festa do mês passado',
      date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      location: 'Salão de Festas',
      pixKey: null,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'evt-3',
      title: 'Piquenique Cancelado',
      description: 'Piquenique cancelado pela chuva',
      date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
      location: 'Parque Villa-Lobos',
      pixKey: null,
      status: 'cancelled',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  beforeEach(async () => {
    eventsSubject = new BehaviorSubject<PartyEvent[]>(sampleEvents);

    mockEventService = {
      listEvents: vi.fn().mockReturnValue(eventsSubject.asObservable()),
      cancelEvent: vi.fn().mockResolvedValue(undefined),
    };

    mockAuthService = {
      isSuperAdmin: signal(false),
      currentUser: signal({ uid: 'user-1', email: 'test@example.com' } as any),
      logout: vi.fn().mockResolvedValue(undefined),
    };

    mockEventNotificationService = {
      evaluateCountdownReminders: vi.fn(),
    };

    mockNotificationService = {
      sendLocalNotification: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [DashboardContainer],
      providers: [
        provideRouter([]),
        { provide: EventService, useValue: mockEventService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: EventNotificationService, useValue: mockEventNotificationService },
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: MatSnackBar, useValue: { open: vi.fn() } },
        { provide: MatDialog, useValue: { open: vi.fn() } },
        { provide: Clipboard, useValue: { copy: vi.fn() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardContainer);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create dashboard container', () => {
    expect(component).toBeTruthy();
  });

  it('should never render Novo Admin button even if user is superadmin', () => {
    mockAuthService.isSuperAdmin.set(true);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).not.toContain('Novo Admin');
  });

  it('should compute accurate filter counts for all, upcoming, past, and cancelled', () => {
    const counts = component.filterCounts();
    expect(counts.all).toBe(3);
    expect(counts.upcoming).toBe(1);
    expect(counts.past).toBe(1);
    expect(counts.cancelled).toBe(1);
  });

  it('should filter events reactively when activeFilter is changed', () => {
    // Default 'all'
    expect(component.filteredEvents().length).toBe(3);

    // 'upcoming'
    component.activeFilter.set('upcoming');
    const upcoming = component.filteredEvents();
    expect(upcoming.length).toBe(1);
    expect(upcoming[0].id).toBe('evt-1');

    // 'past'
    component.activeFilter.set('past');
    const past = component.filteredEvents();
    expect(past.length).toBe(1);
    expect(past[0].id).toBe('evt-2');

    // 'cancelled'
    component.activeFilter.set('cancelled');
    const cancelled = component.filteredEvents();
    expect(cancelled.length).toBe(1);
    expect(cancelled[0].id).toBe('evt-3');
  });

  it('should invoke evaluateCountdownReminders with loaded events', () => {
    expect(mockEventNotificationService.evaluateCountdownReminders).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ id: 'evt-1' }),
        expect.objectContaining({ id: 'evt-2' }),
        expect.objectContaining({ id: 'evt-3' }),
      ])
    );
  });

  it('should render elements with standardized data-testid attributes', () => {
    const dashboardSection = fixture.nativeElement.querySelector('[data-testid="dashboard-page"]');
    const createBtn = fixture.nativeElement.querySelector('[data-testid="create-event-btn"]');
    const eventCards = fixture.nativeElement.querySelectorAll('[data-testid="organizer-event-card"]');

    expect(dashboardSection).toBeTruthy();
    expect(createBtn).toBeTruthy();
    expect(eventCards.length).toBeGreaterThan(0);
  });
});
