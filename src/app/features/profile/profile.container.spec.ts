import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter, Router } from '@angular/router';
import { signal, WritableSignal } from '@angular/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProfileContainer } from './profile.container';
import { AuthService, UserService, FamilyService } from '../../core/services';
import { FeedbackService } from '../../shared/ui';
import type { UserProfile, PartyEvent, FamilyMember } from '../../core/models';
import type { User } from 'firebase/auth';

describe('ProfileContainer', () => {
  let component: ProfileContainer;
  let fixture: ComponentFixture<ProfileContainer>;
  let router: Router;
  let mockCurrentUser: WritableSignal<User | null>;

  const defaultUser = {
    uid: 'user-789',
    email: 'carlos@example.com',
    displayName: 'Carlos Eduardo',
    photoURL: 'https://example.com/carlos.jpg',
  } as unknown as User;

  const mockUserProfile: UserProfile = {
    uid: 'user-789',
    email: 'carlos@example.com',
    displayName: 'Carlos Eduardo',
    photoURL: 'https://example.com/carlos.jpg',
    phone: '11999991111',
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
  };

  const mockEvents: PartyEvent[] = [
    {
      id: 'event-101',
      title: 'Festa Julina dos Amigos',
      category: 'Festa Junina',
      description: 'Quadrilha e quentão',
      date: '2026-07-20T19:00:00.000Z',
      location: 'São Paulo - SP',
      pixKey: null,
      status: 'active',
      createdAt: '2026-06-01T00:00:00.000Z',
      updatedAt: '2026-06-01T00:00:00.000Z',
    },
  ];

  const mockFamily: FamilyMember[] = [
    {
      id: 'fam-1',
      name: 'Lucas Silva',
      relationship: 'child',
      createdAt: '2026-08-10T10:00:00.000Z',
    },
  ];

  let mockUserService: {
    getProfile: ReturnType<typeof vi.fn>;
    getAttendedEvents: ReturnType<typeof vi.fn>;
    updateProfile: ReturnType<typeof vi.fn>;
  };

  let mockFamilyService: {
    getFamilyMembers: ReturnType<typeof vi.fn>;
    addFamilyMember: ReturnType<typeof vi.fn>;
    deleteFamilyMember: ReturnType<typeof vi.fn>;
  };

  let mockFeedback: {
    success: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    mockCurrentUser = signal<User | null>(defaultUser);

    mockUserService = {
      getProfile: vi.fn().mockResolvedValue(mockUserProfile),
      getAttendedEvents: vi.fn().mockResolvedValue(mockEvents),
      updateProfile: vi.fn().mockResolvedValue(undefined),
    };

    mockFamilyService = {
      getFamilyMembers: vi.fn().mockResolvedValue(mockFamily),
      addFamilyMember: vi.fn().mockResolvedValue({
        id: 'fam-2',
        name: 'Mariana Silva',
        relationship: 'spouse',
        createdAt: '2026-08-11T10:00:00.000Z',
      }),
      deleteFamilyMember: vi.fn().mockResolvedValue(undefined),
    };

    mockFeedback = {
      success: vi.fn(),
      error: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [ProfileContainer],
      providers: [
        provideNoopAnimations(),
        provideRouter([]),
        {
          provide: AuthService,
          useValue: { currentUser: mockCurrentUser },
        },
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: FamilyService,
          useValue: mockFamilyService,
        },
        { provide: FeedbackService, useValue: mockFeedback },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture = TestBed.createComponent(ProfileContainer);
    component = fixture.componentInstance;
  });

  it('should initialize and load user profile, attended events, and family roster', async () => {
    await component.loadProfileData();
    fixture.detectChanges();

    expect(mockUserService.getProfile).toHaveBeenCalledWith('user-789');
    expect(mockUserService.getAttendedEvents).toHaveBeenCalledWith('user-789');
    expect(mockFamilyService.getFamilyMembers).toHaveBeenCalledWith('user-789');
    expect(component.userProfile()).toEqual(mockUserProfile);
    expect(component.attendedEvents()).toEqual(mockEvents);
    expect(component.familyMembers()).toEqual(mockFamily);
    expect(component.loading()).toBe(false);

    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Meu Perfil');
    expect(el.textContent).toContain('Minha Família');
    expect(el.textContent).toContain('Lucas Silva');
    expect(el.textContent).toContain('Festa Julina dos Amigos');
  });

  it('should redirect to /login if current user is not logged in', async () => {
    mockCurrentUser.set(null);
    await component.loadProfileData();

    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should fallback to auth user data if firestore profile is null', async () => {
    mockUserService.getProfile.mockResolvedValue(null);
    mockUserService.getAttendedEvents.mockResolvedValue([]);
    mockFamilyService.getFamilyMembers.mockResolvedValue([]);

    await component.loadProfileData();
    fixture.detectChanges();

    expect(component.userProfile()).toEqual({
      uid: 'user-789',
      email: 'carlos@example.com',
      displayName: 'Carlos Eduardo',
      photoURL: 'https://example.com/carlos.jpg',
      name: 'Carlos Eduardo',
      createdAt: '',
      updatedAt: '',
    });
    expect(component.attendedEvents()).toEqual([]);
    expect(component.familyMembers()).toEqual([]);
  });

  it('should update name, update signal, and show success snackbar on onUpdateName', async () => {
    await component.loadProfileData();
    fixture.detectChanges();

    await component.onUpdateName('Carlos Silva');

    expect(mockUserService.updateProfile).toHaveBeenCalledWith('user-789', {
      displayName: 'Carlos Silva',
    });
    expect(component.userProfile()?.displayName).toBe('Carlos Silva');
    expect(mockFeedback.success).toHaveBeenCalledWith('Nome atualizado com sucesso!');
  });

  it('should show error snackbar when updateProfile fails', async () => {
    await component.loadProfileData();
    fixture.detectChanges();

    mockUserService.updateProfile.mockRejectedValue(new Error('Update failed'));

    await component.onUpdateName('Novo Nome');

    expect(mockFeedback.error).toHaveBeenCalledWith('Não foi possível atualizar o nome. Tente novamente.');
  });

  it('should add a family member and update list with success snackbar', async () => {
    await component.loadProfileData();
    fixture.detectChanges();

    await component.onAddFamilyMember({
      name: 'Mariana Silva',
      relationship: 'spouse',
    });

    expect(mockFamilyService.addFamilyMember).toHaveBeenCalledWith('user-789', {
      name: 'Mariana Silva',
      relationship: 'spouse',
    });
    expect(component.familyMembers()).toHaveLength(2);
    expect(component.familyMembers()[1].name).toBe('Mariana Silva');
    expect(mockFeedback.success).toHaveBeenCalledWith('Familiar adicionado com sucesso!');
  });

  it('should remove a family member and update list with success snackbar', async () => {
    await component.loadProfileData();
    fixture.detectChanges();

    await component.onRemoveFamilyMember('fam-1');

    expect(mockFamilyService.deleteFamilyMember).toHaveBeenCalledWith('user-789', 'fam-1');
    expect(component.familyMembers()).toHaveLength(0);
    expect(mockFeedback.success).toHaveBeenCalledWith('Familiar removido com sucesso!');
  });

  it('should publish a shared error when adding a family member fails', async () => {
    mockFamilyService.addFamilyMember.mockRejectedValue(new Error('Add failed'));

    await component.onAddFamilyMember({ name: 'Mariana Silva', relationship: 'spouse' });

    expect(mockFeedback.error).toHaveBeenCalledWith(
      'Não foi possível adicionar o familiar. Tente novamente.',
    );
  });

  it('should publish a shared error when removing a family member fails', async () => {
    mockFamilyService.deleteFamilyMember.mockRejectedValue(new Error('Remove failed'));

    await component.onRemoveFamilyMember('fam-1');

    expect(mockFeedback.error).toHaveBeenCalledWith(
      'Não foi possível remover o familiar. Tente novamente.',
    );
  });

  it('should display empty state when user has no attended events', async () => {
    mockUserService.getAttendedEvents.mockResolvedValue([]);

    await component.loadProfileData();
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Nenhum evento no histórico');
    expect(el.textContent).toContain('Explorar Eventos');
  });

  it('should compose attended-event surfaces and navigation actions through closed Org components', async () => {
    await component.loadProfileData();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('org-surface .profile-event-card')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('org-button.profile-event-card__btn')).toBeTruthy();
  });
});
