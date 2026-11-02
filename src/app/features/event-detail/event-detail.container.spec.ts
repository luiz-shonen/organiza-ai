import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ComponentRef, WritableSignal, signal } from '@angular/core';

type MockCurrentUser = Record<string, unknown> | null;
import { BehaviorSubject, of } from 'rxjs';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { EventDetailContainer } from './event-detail.container';
import { FeedbackService, OrgDialogService } from '../../shared/ui';
import {
  EventService,
  ItemService,
  GuestService,
  GuestSessionService,
  AuthService,
  UserService,
  FamilyService,
  ConfettiService,
  SeasonalThemeService,
  DrawerService,
  ClaimService,
} from '../../core/services';
import { PartyEvent, PartyItem, Guest, FamilyMember, EventClaims } from '../../core/models';

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
    batchConfirmRsvp: ReturnType<typeof vi.fn>;
    cancelRsvp: ReturnType<typeof vi.fn>;
    getGuestByPhone: ReturnType<typeof vi.fn>;
  };
  let mockFamilyService: {
    getFamilyMembers: ReturnType<typeof vi.fn>;
  };
  let currentUserSignal: WritableSignal<MockCurrentUser>;
  let mockAuthService: {
    currentUser: WritableSignal<MockCurrentUser>;
    isSuperAdmin: WritableSignal<boolean>;
    loginAnonymously: ReturnType<typeof vi.fn>;
    loginWithGoogle: ReturnType<typeof vi.fn>;
  };
  let mockGuestSessionService: {
    session: WritableSignal<unknown>;
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
  let mockFeedback: {
    success: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
    info: ReturnType<typeof vi.fn>;
  };
  let mockDialogs: {
    confirm: ReturnType<typeof vi.fn>;
  };
  let mockDrawerService: { open: ReturnType<typeof vi.fn>; close: ReturnType<typeof vi.fn> };
  let rsvpResult: {
    name: string;
    phone: string;
    companions: never[];
    selectedFamilyMembers: FamilyMember[];
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

  let mockClaimsSubject: BehaviorSubject<EventClaims[]>;
  let mockClaimService: {
    listClaims: ReturnType<typeof vi.fn>;
    saveClaims: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    currentUserSignal = signal(null);
    mockClaimsSubject = new BehaviorSubject<EventClaims[]>([]);
    mockClaimService = {
      listClaims: vi.fn().mockReturnValue(mockClaimsSubject.asObservable()),
      saveClaims: vi.fn().mockResolvedValue(undefined),
    };

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
      batchConfirmRsvp: vi.fn().mockResolvedValue(undefined),
      cancelRsvp: vi.fn().mockResolvedValue(undefined),
      getGuestByPhone: vi.fn().mockResolvedValue(null),
    };
    mockFamilyService = {
      getFamilyMembers: vi.fn().mockResolvedValue([]),
    };
    mockAuthService = {
      currentUser: currentUserSignal,
      isSuperAdmin: signal(false),
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
    mockFeedback = {
      success: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
    };
    rsvpResult = {
      name: 'Lucas Dev',
      phone: '11999998888',
      companions: [],
      selectedFamilyMembers: [],
    };
    mockDialogs = {
      confirm: vi.fn().mockReturnValue(of(true)),
    };
    mockDrawerService = {
      open: vi.fn((request: { onComplete?: (result: typeof rsvpResult) => void }) =>
        request.onComplete?.(rsvpResult),
      ),
      close: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [EventDetailContainer],
      providers: [
        { provide: EventService, useValue: mockEventService },
        { provide: ItemService, useValue: mockItemService },
        { provide: GuestService, useValue: mockGuestService },
        { provide: FamilyService, useValue: mockFamilyService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: GuestSessionService, useValue: mockGuestSessionService },
        { provide: UserService, useValue: mockUserService },
        { provide: ConfettiService, useValue: mockConfettiService },
        { provide: SeasonalThemeService, useValue: mockSeasonalThemeService },
        { provide: FeedbackService, useValue: mockFeedback },
        { provide: OrgDialogService, useValue: mockDialogs },
        { provide: DrawerService, useValue: mockDrawerService },
        { provide: ClaimService, useValue: mockClaimService },
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
      mockEvent.category,
    );
  });

  it('does not ask the organizer to confirm presence at their own event', () => {
    currentUserSignal.set({ uid: 'owner-1', displayName: 'Ana', isAnonymous: false });
    mockEventService.getEvent.mockReturnValue(of({ ...mockEvent, createdBy: 'owner-1' }));
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('app-rsvp-card')).toBeNull();

    currentUserSignal.set({ uid: 'guest-1', displayName: 'Bia', isAnonymous: false });
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('app-rsvp-card')).toBeTruthy();
  });

  it('uses named companion arrays first and retains legacy counts in the guest total', () => {
    fixture.detectChanges();
    component['guests'].set([
      {
        id: 'named-guest',
        name: 'Ana',
        isConfirmed: true,
        confirmedAt: '2026-08-21T00:00:00.000Z',
        companions: [{ name: 'Bia' }, { name: 'Caio' }],
        companionsCount: 99,
      },
      {
        id: 'legacy-guest',
        name: 'Davi',
        isConfirmed: true,
        confirmedAt: '2026-08-21T00:00:00.000Z',
        companionsCount: 2,
      },
    ]);

    expect(component['guestCount']()).toBe(6);
  });

  describe('RSVP 1-Touch flow', () => {
    it('authenticates with Google when unauthenticated and triggers confetti on confirmed RSVP', async () => {
      fixture.detectChanges();

      await component['onConfirmRsvp']();

      expect(mockAuthService.loginWithGoogle).toHaveBeenCalledTimes(1);
      expect(mockGuestService.batchConfirmRsvp).toHaveBeenCalledWith(
        'evt-123',
        expect.objectContaining({
          uid: 'usr-1',
          email: 'lucas@gmail.com',
          companions: [],
        }),
        [],
      );
      expect(mockConfettiService.fireSuccessConfetti).toHaveBeenCalled();
      expect(mockFeedback.success).toHaveBeenCalledWith('Presença confirmada!');
    });

    it('opens the RSVP drawer and persists the verified attendee through the batch contract', async () => {
      currentUserSignal.set({
        uid: 'usr-google-99',
        displayName: 'Mariana',
        email: 'mariana@gmail.com',
        photoURL: '',
        isAnonymous: false,
      });
      fixture.detectChanges();

      await component['onConfirmRsvp']();

      expect(mockAuthService.loginWithGoogle).not.toHaveBeenCalled();
      expect(mockDrawerService.open).toHaveBeenCalled();
      expect(mockGuestService.batchConfirmRsvp).toHaveBeenCalledWith(
        'evt-123',
        expect.objectContaining({
          uid: 'usr-google-99',
          name: 'Lucas Dev',
          email: 'mariana@gmail.com',
          companions: [],
        }),
        [],
      );
      expect(mockConfettiService.fireSuccessConfetti).toHaveBeenCalled();
    });

    it('opens the RSVP drawer and performs batchConfirmRsvp when family members are present', async () => {
      const mockFamily: FamilyMember[] = [
        { id: 'f-1', name: 'Carla', relationship: 'spouse', createdAt: '' },
      ];
      mockFamilyService.getFamilyMembers.mockResolvedValue(mockFamily);

      rsvpResult = {
        name: 'Lucas Dev',
        phone: '11999998888',
        companions: [],
        selectedFamilyMembers: mockFamily,
      };

      currentUserSignal.set({
        uid: 'usr-1',
        displayName: 'Lucas Dev',
        email: 'lucas@gmail.com',
        photoURL: '',
        isAnonymous: false,
      });
      fixture.detectChanges();

      await component['onConfirmRsvp']();

      expect(mockDrawerService.open).toHaveBeenCalled();
      expect(mockGuestService.batchConfirmRsvp).toHaveBeenCalledWith(
        'evt-123',
        expect.objectContaining({
          uid: 'usr-1',
          name: 'Lucas Dev',
        }),
        mockFamily,
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

      await component['onCancelRsvp']();

      expect(mockDialogs.confirm).toHaveBeenCalled();
      expect(mockGuestService.cancelRsvp).toHaveBeenCalledWith(
        'evt-123',
        'usr-1',
        'usr-1',
        'usr-1',
      );
      expect(mockGuestSessionService.clearSession).toHaveBeenCalled();
      expect(mockFeedback.success).toHaveBeenCalledWith('Sua presença foi cancelada.');
    });
  });

  describe('Item claiming with household claims', () => {
    const lucas = { uid: 'usr-1', displayName: 'Lucas Dev', isAnonymous: false };

    it('opens the "Eu levo" sheet for confirmed guests, with the family to choose from', async () => {
      currentUserSignal.set(lucas);
      mockFamilyService.getFamilyMembers.mockResolvedValue([
        { id: 'f1', name: 'Marta', relationship: 'child', createdAt: '' },
      ]);
      fixture.detectChanges();

      await component['onClaimItemById']('item-1');

      expect(component['claimingEntry']()?.item.id).toBe('item-1');
      expect(component['claimPeople']()).toEqual([
        { id: null, name: 'Você' },
        { id: 'f1', name: 'Marta' },
      ]);
    });

    it('reads the family list only once, even when it is empty', async () => {
      currentUserSignal.set(lucas);
      fixture.detectChanges();

      await component['onClaimItemById']('item-1');
      component['closeClaimSheet']();
      await component['onClaimItemById']('item-1');

      expect(mockFamilyService.getFamilyMembers).toHaveBeenCalledTimes(1);
    });

    it('prompts to confirm presence first when user is not confirmed', async () => {
      currentUserSignal.set(null);
      fixture.detectChanges();

      await component['onClaimItemById']('item-1');

      expect(component['claimingEntry']()).toBeNull();
      expect(mockFeedback.info).toHaveBeenCalledWith('Por favor, confirme sua presença primeiro.');
    });

    it('adds to what the same person already brings and saves the household document', async () => {
      currentUserSignal.set(lucas);
      fixture.detectChanges();
      mockClaimsSubject.next([
        {
          id: 'usr-1',
          name: 'Lucas Dev',
          updatedAt: '',
          entries: [{ itemId: 'item-1', memberId: 'f1', who: 'Marta', quantity: 1, bought: false }],
        },
      ]);

      await component['onConfirmClaim']({
        itemId: 'item-1',
        quantity: 1,
        memberId: 'f1',
        who: 'Marta',
      });

      expect(mockClaimService.saveClaims).toHaveBeenCalledWith('evt-123', 'usr-1', 'Lucas Dev', [
        { itemId: 'item-1', memberId: 'f1', who: 'Marta', quantity: 2, bought: false },
      ]);
      expect(mockConfettiService.fireSuccessConfetti).toHaveBeenCalled();
    });

    it('removes a line from the family checklist', async () => {
      currentUserSignal.set(lucas);
      fixture.detectChanges();
      mockClaimsSubject.next([
        {
          id: 'usr-1',
          name: 'Lucas Dev',
          updatedAt: '',
          entries: [
            { itemId: 'item-1', memberId: null, who: 'Lucas Dev', quantity: 2, bought: false },
          ],
        },
      ]);

      await component['onRemoveClaim']({
        itemId: 'item-1',
        memberId: null,
        name: 'Picanha',
        quantityLabel: '2',
        who: 'Você',
        bought: false,
      });

      expect(mockClaimService.saveClaims).toHaveBeenCalledWith('evt-123', 'usr-1', 'Lucas Dev', []);
      expect(mockFeedback.success).toHaveBeenCalledWith('Item liberado.');
    });

    it('publishes the shared error when saving a claim fails', async () => {
      currentUserSignal.set(lucas);
      mockClaimService.saveClaims.mockRejectedValue(new Error('Claim failed'));
      fixture.detectChanges();

      await component['onConfirmClaim']({ itemId: 'item-1', quantity: 1, memberId: null, who: '' });

      expect(mockFeedback.error).toHaveBeenCalledWith('Erro ao assumir item. Tente novamente.');
    });
  });
});
