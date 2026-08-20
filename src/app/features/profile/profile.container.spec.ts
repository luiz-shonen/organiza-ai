import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter, Router } from '@angular/router';
import { signal, WritableSignal } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProfileContainer } from './profile.container';
import { AuthService, UserService } from '../../core/services';
import type { UserProfile, PartyEvent } from '../../core/models';
import type { User } from 'firebase/auth';

describe('ProfileContainer', () => {
  let component: ProfileContainer;
  let fixture: ComponentFixture<ProfileContainer>;
  let router: Router;
  let snackBar: MatSnackBar;
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

  let mockUserService: {
    getProfile: ReturnType<typeof vi.fn>;
    getAttendedEvents: ReturnType<typeof vi.fn>;
    updateProfile: ReturnType<typeof vi.fn>;
  };

  let mockSnackBar: {
    open: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    mockCurrentUser = signal<User | null>(defaultUser);

    mockUserService = {
      getProfile: vi.fn().mockResolvedValue(mockUserProfile),
      getAttendedEvents: vi.fn().mockResolvedValue(mockEvents),
      updateProfile: vi.fn().mockResolvedValue(undefined),
    };

    mockSnackBar = {
      open: vi.fn(),
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
          provide: MatSnackBar,
          useValue: mockSnackBar,
        },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    snackBar = TestBed.inject(MatSnackBar);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture = TestBed.createComponent(ProfileContainer);
    component = fixture.componentInstance;
  });

  it('should initialize and load user profile and attended events', async () => {
    await component.loadProfileData();
    fixture.detectChanges();

    expect(mockUserService.getProfile).toHaveBeenCalledWith('user-789');
    expect(mockUserService.getAttendedEvents).toHaveBeenCalledWith('user-789');
    expect(component.userProfile()).toEqual(mockUserProfile);
    expect(component.attendedEvents()).toEqual(mockEvents);
    expect(component.loading()).toBe(false);

    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Meu Perfil');
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
  });

  it('should update name, update signal, and show success snackbar on onUpdateName', async () => {
    await component.loadProfileData();
    fixture.detectChanges();

    await component.onUpdateName('Carlos Silva');

    expect(mockUserService.updateProfile).toHaveBeenCalledWith('user-789', {
      displayName: 'Carlos Silva',
    });
    expect(component.userProfile()?.displayName).toBe('Carlos Silva');
    expect(snackBar.open).toHaveBeenCalledWith(
      'Nome atualizado com sucesso!',
      'Fechar',
      { duration: 3000 },
    );
  });

  it('should show error snackbar when updateProfile fails', async () => {
    await component.loadProfileData();
    fixture.detectChanges();

    mockUserService.updateProfile.mockRejectedValue(new Error('Update failed'));

    await component.onUpdateName('Novo Nome');

    expect(snackBar.open).toHaveBeenCalledWith(
      'Não foi possível atualizar o nome. Tente novamente.',
      'Fechar',
      { duration: 3000 },
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
});
