import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ComponentRef, signal } from '@angular/core';
import { of } from 'rxjs';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { EventDetailContainer } from './event-detail.container';
import {
  EventService,
  ItemService,
  GuestService,
  GuestSessionService,
  AuthService,
  UserService,
  ConfettiService,
  SeasonalThemeService,
} from '../../core/services';
import { PartyEvent, PartyItem, Guest } from '../../core/models';

describe('EventDetailContainer', () => {
  let component: EventDetailContainer;
  let componentRef: ComponentRef<EventDetailContainer>;
  let fixture: ComponentFixture<EventDetailContainer>;

  let mockEventService: {
    getEvent: ReturnType<typeof vi.fn>;
  };
  let mockItemService: {
    listItems: ReturnType<typeof vi.fn>;
    claimItem: ReturnType<typeof vi.fn>;
    unclaimItem: ReturnType<typeof vi.fn>;
  };
  let mockGuestService: {
    listGuests: ReturnType<typeof vi.fn>;
    saveVerifiedRsvp: ReturnType<typeof vi.fn>;
    cancelRsvp: ReturnType<typeof vi.fn>;
    getGuestByPhone: ReturnType<typeof vi.fn>;
  };
  let currentUserSignal: ReturnType<typeof signal<any>>;
  let mockAuthService: {
    currentUser: any;
    loginAnonymously: ReturnType<typeof vi.fn>;
    loginWithGoogle: ReturnType<typeof vi.fn>;
  };
  let mockGuestSessionService: {
    session: any;
    saveSession: ReturnType<typeof vi.fn>;
    clearSession: ReturnType<typeof vi.fn>;
  };
  let mockUserService: {
    upsertProfile: ReturnType<typeof vi.fn>;
  };
  let mockConfettiService: {
    fireSuccessConfetti: ReturnType<typeof vi.fn>;
  };
  let mockSeasonalThemeService: {
    evaluateEventTheme: ReturnType<typeof vi.fn>;
    resetToAuto: ReturnType<typeof vi.fn>;
  };
  let mockSnackBar: {
    open: ReturnType<typeof vi.fn>;
  };
  let mockDialog: {
    open: ReturnType<typeof vi.fn>;
  };

  const mockEvent: PartyEvent = {
    id: 'evt-123',
    title: 'Churrasco da Firma',
    description: 'Comemoração de fim de ano',
    date: '2026-12-15T18:00:00.000Z',
    location: 'Espaço Gourmet',
    pixKey: 'churras@firma.com',
    pixType: 'Email',
    estimatedBudget: 800,
    status: 'active',
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
  };

  const mockGuests: Guest[] = [
    {
      id: 'usr-1',
      uid: 'usr-1',
      name: 'Lucas Dev',
      email: 'lucas@gmail.com',
      isConfirmed: true,
      confirmedAt: '2026-08-19T00:00:00.000Z',
      companionsCount: 1,
    },
  ];

  const mockItems: PartyItem[] = [
    {
      id: 'item-1',
      name: 'Picanha',
      quantity: 2,
      claimedBy: null,
    },
  ];

  beforeEach(async () => {
    currentUserSignal = signal(null);

    mockEventService = {
      getEvent: vi.fn().mockReturnValue(of(mockEvent)),
    };
    mockItemService = {
      listItems: vi.fn().mockReturnValue(of(mockItems)),
      claimItem: vi.fn().mockResolvedValue(undefined),
      unclaimItem: vi.fn().mockResolvedValue(undefined),
    };
    mockGuestService = {
      listGuests: vi.fn().mockReturnValue(of(mockGuests)),
      saveVerifiedRsvp: vi.fn().mockResolvedValue(undefined),
      cancelRsvp: vi.fn().mockResolvedValue(undefined),
      getGuestByPhone: vi.fn().mockResolvedValue(null),
    };
    mockAuthService = {
      currentUser: currentUserSignal,
      loginAnonymously: vi.fn().mockResolvedValue(undefined),
      loginWithGoogle: vi.fn().mockImplementation(async () => {
        currentUserSignal.set({
          uid: 'usr-1',
          displayName: 'Lucas Dev',
          email: 'lucas@gmail.com',
          photoURL: 'https://photo.jpg',
          isAnonymous: false,
        });
      }),
    };
    mockGuestSessionService = {
      session: signal(null),
      saveSession: vi.fn(),
      clearSession: vi.fn(),
    };
    mockUserService = {
      upsertProfile: vi.fn().mockResolvedValue(undefined),
    };
    mockConfettiService = {
      fireSuccessConfetti: vi.fn(),
    };
    mockSeasonalThemeService = {
      evaluateEventTheme: vi.fn(),
      resetToAuto: vi.fn(),
    };
    mockSnackBar = {
      open: vi.fn(),
    };
    mockDialog = {
      open: vi.fn().mockReturnValue({
        afterClosed: () => of(true),
      }),
    };

    await TestBed.configureTestingModule({
      imports: [EventDetailContainer],
      providers: [
        { provide: EventService, useValue: mockEventService },
        { provide: ItemService, useValue: mockItemService },
        { provide: GuestService, useValue: mockGuestService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: GuestSessionService, useValue: mockGuestSessionService },
        { provide: UserService, useValue: mockUserService },
        { provide: ConfettiService, useValue: mockConfettiService },
        { provide: SeasonalThemeService, useValue: mockSeasonalThemeService },
        { provide: MatSnackBar, useValue: mockSnackBar },
        { provide: MatDialog, useValue: mockDialog },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EventDetailContainer);
    component = fixture.componentInstance;
    componentRef = fixture.componentRef;
    componentRef.setInput('id', 'evt-123');
  });

  it('should be created and load event, items, and guests on init', () => {
    fixture.detectChanges();

    expect(component).toBeTruthy();
    expect(mockEventService.getEvent).toHaveBeenCalledWith('evt-123');
    expect(mockItemService.listItems).toHaveBeenCalledWith('evt-123');
    expect(mockGuestService.listGuests).toHaveBeenCalledWith('evt-123');
    expect(mockSeasonalThemeService.evaluateEventTheme).toHaveBeenCalledWith(
      mockEvent.date,
      mockEvent.title,
    );
  });

  describe('RSVP 1-Touch flow', () => {
    it('authenticates with Google when unauthenticated and triggers confetti on confirmed RSVP', async () => {
      fixture.detectChanges();

      await (component as any).onConfirmRsvp();

      expect(mockAuthService.loginWithGoogle).toHaveBeenCalledTimes(1);
      expect(mockGuestService.saveVerifiedRsvp).toHaveBeenCalledWith(
        'evt-123',
        expect.objectContaining({
          uid: 'usr-1',
          name: 'Lucas Dev',
          email: 'lucas@gmail.com',
        }),
      );
      expect(mockConfettiService.fireSuccessConfetti).toHaveBeenCalled();
      expect(mockSnackBar.open).toHaveBeenCalledWith('Presença confirmada!', '🎉', {
        duration: 3000,
      });
    });

    it('saves verified RSVP directly when user is already logged in with Google', async () => {
      currentUserSignal.set({
        uid: 'usr-google-99',
        displayName: 'Mariana',
        email: 'mariana@gmail.com',
        photoURL: '',
        isAnonymous: false,
      });
      fixture.detectChanges();

      await (component as any).onConfirmRsvp();

      expect(mockAuthService.loginWithGoogle).not.toHaveBeenCalled();
      expect(mockGuestService.saveVerifiedRsvp).toHaveBeenCalledWith(
        'evt-123',
        expect.objectContaining({
          uid: 'usr-google-99',
          name: 'Mariana',
          email: 'mariana@gmail.com',
        }),
      );
      expect(mockConfettiService.fireSuccessConfetti).toHaveBeenCalled();
    });
  });

  describe('Cancellation flow', () => {
    it('opens confirm dialog and invokes GuestService.cancelRsvp atomically when confirmed', async () => {
      currentUserSignal.set({
        uid: 'usr-1',
        isAnonymous: false,
      });
      fixture.detectChanges();

      await (component as any).onCancelRsvp();

      expect(mockDialog.open).toHaveBeenCalled();
      expect(mockGuestService.cancelRsvp).toHaveBeenCalledWith('evt-123', 'usr-1', 'usr-1');
      expect(mockGuestSessionService.clearSession).toHaveBeenCalled();
      expect(mockSnackBar.open).toHaveBeenCalledWith('Sua presença foi cancelada.', 'OK', {
        duration: 3000,
      });
    });
  });

  describe('Item claiming and unclaiming', () => {
    it('claims item with authenticated user credentials when presence is confirmed', async () => {
      currentUserSignal.set({
        uid: 'usr-1',
        displayName: 'Lucas Dev',
        isAnonymous: false,
      });
      fixture.detectChanges();

      await (component as any).onClaimItemById('item-1');

      expect(mockItemService.claimItem).toHaveBeenCalledWith(
        'evt-123',
        'item-1',
        expect.objectContaining({
          name: 'Lucas Dev',
        }),
      );
      expect(mockConfettiService.fireSuccessConfetti).toHaveBeenCalled();
    });

    it('prompts to confirm presence first when user is not confirmed', async () => {
      currentUserSignal.set(null);
      fixture.detectChanges();

      await (component as any).onClaimItemById('item-1');

      expect(mockItemService.claimItem).not.toHaveBeenCalled();
      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Por favor, confirme sua presença primeiro.',
        'OK',
        { duration: 3000 },
      );
    });

    it('unclaims item successfully', async () => {
      fixture.detectChanges();

      await (component as any).onUnclaimItemById('item-1');

      expect(mockItemService.unclaimItem).toHaveBeenCalledWith('evt-123', 'item-1');
      expect(mockSnackBar.open).toHaveBeenCalledWith('Item liberado.', 'OK', { duration: 3000 });
    });
  });
});
