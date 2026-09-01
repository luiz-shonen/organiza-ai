import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
  UrlTree,
  provideRouter,
} from '@angular/router';
import { signal, WritableSignal, computed } from '@angular/core';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { AuthService } from '../services';
import { authGuard } from './auth.guard';
import { User } from 'firebase/auth';

describe('authGuard', () => {
  let currentUserSignal: WritableSignal<User | null>;
  let router: Router;
  let waitForAuthReadyMock: ReturnType<typeof vi.fn>;

  const mockRoute = {} as ActivatedRouteSnapshot;
  const mockState = {} as RouterStateSnapshot;

  beforeEach(() => {
    currentUserSignal = signal<User | null>(null);
    waitForAuthReadyMock = vi.fn().mockResolvedValue(undefined);

    const authServiceMock = {
      currentUser: currentUserSignal.asReadonly(),
      isAuthenticated: computed(() => {
        const u = currentUserSignal();
        return u !== null && !u.isAnonymous;
      }),
      waitForAuthReady: waitForAuthReadyMock,
    };

    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthService, useValue: authServiceMock }],
    });

    router = TestBed.inject(Router);
  });

  it('permits access (returns true) when user is authenticated', async () => {
    currentUserSignal.set({ uid: 'user-123', email: 'organizer@test.com', isAnonymous: false } as User);

    const result = await TestBed.runInInjectionContext(() => authGuard(mockRoute, mockState));

    expect(waitForAuthReadyMock).toHaveBeenCalled();
    expect(result).toBe(true);
  });

  it('redirects to /login when user is unauthenticated (null)', async () => {
    currentUserSignal.set(null);

    const result = await TestBed.runInInjectionContext(() => authGuard(mockRoute, mockState));

    expect(waitForAuthReadyMock).toHaveBeenCalled();
    expect(result instanceof UrlTree).toBe(true);
    expect((result as UrlTree).toString()).toBe('/login');
  });

  it('redirects to /login when user is an anonymous RSVP session', async () => {
    currentUserSignal.set({ uid: 'anonymous-rsvp-user', isAnonymous: true } as User);

    const result = await TestBed.runInInjectionContext(() => authGuard(mockRoute, mockState));

    expect(waitForAuthReadyMock).toHaveBeenCalled();
    expect(result instanceof UrlTree).toBe(true);
    expect((result as UrlTree).toString()).toBe('/login');
  });

  it('awaits waitForAuthReady before checking isAuthenticated', async () => {
    let authReadyResolved = false;
    let resolveAuthReady: () => void = () => {};
    waitForAuthReadyMock.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveAuthReady = () => {
            authReadyResolved = true;
            resolve();
          };
        })
    );

    currentUserSignal.set({ uid: 'user-123', isAnonymous: false } as User);

    const guardPromise = TestBed.runInInjectionContext(() => authGuard(mockRoute, mockState));

    expect(authReadyResolved).toBe(false);
    resolveAuthReady();

    const result = await guardPromise;
    expect(authReadyResolved).toBe(true);
    expect(result).toBe(true);
  });
});
