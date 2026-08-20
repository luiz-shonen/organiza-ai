import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { User } from 'firebase/auth';
import { ThemeService, ThemeMode } from './theme.service';
import { AuthService } from './auth.service';
import { UserService } from './user.service';
import { MockAuthService } from '../../testing/mocks';

describe('ThemeService', () => {
  let service: ThemeService;
  let mockAuth: MockAuthService;
  let mockUserService: {
    getProfile: ReturnType<typeof vi.fn>;
    updateThemePreference: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');

    mockAuth = new MockAuthService();
    mockUserService = {
      getProfile: vi.fn().mockResolvedValue(null),
      updateThemePreference: vi.fn().mockResolvedValue(undefined),
    };

    TestBed.configureTestingModule({
      providers: [
        ThemeService,
        { provide: AuthService, useValue: mockAuth },
        { provide: UserService, useValue: mockUserService },
      ],
    });

    service = TestBed.inject(ThemeService);
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  it('should initialize with default system mode when no storage exists', () => {
    expect(service.mode()).toBe('system');
  });

  it('should update mode, isDark, and document class when setMode("dark") is called', () => {
    service.setMode('dark');
    TestBed.flushEffects();

    expect(service.mode()).toBe('dark');
    expect(service.isDark()).toBe(true);
    expect(localStorage.getItem('theme_mode')).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('should update mode, isDark, and remove dark class when setMode("light") is called', () => {
    service.setMode('dark');
    TestBed.flushEffects();
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    service.setMode('light');
    TestBed.flushEffects();

    expect(service.mode()).toBe('light');
    expect(service.isDark()).toBe(false);
    expect(localStorage.getItem('theme_mode')).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('should sync theme preference to UserService when an authenticated user is logged in', () => {
    const mockUser = {
      uid: 'user-123',
      isAnonymous: false,
      email: 'test@example.com',
    } as unknown as User;

    mockAuth.currentUser.set(mockUser);

    service.setMode('dark');

    expect(mockUserService.updateThemePreference).toHaveBeenCalledWith('user-123', 'dark');
  });

  it('should load initial theme mode from localStorage if present', () => {
    localStorage.setItem('theme_mode', 'dark');

    const freshService = TestBed.runInInjectionContext(() => new ThemeService());
    TestBed.flushEffects();

    expect(freshService.mode()).toBe('dark');
    expect(freshService.isDark()).toBe(true);
  });
});
