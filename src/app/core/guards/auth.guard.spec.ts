import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
  UrlTree,
  provideRouter,
} from '@angular/router';
import { signal, WritableSignal } from '@angular/core';
import { AuthService } from '../services';
import { authGuard } from './auth.guard';
import { User } from 'firebase/auth';

describe('authGuard', () => {
  let loadingSignal: WritableSignal<boolean>;
  let currentUserSignal: WritableSignal<User | null>;
  let router: Router;

  const mockRoute = {} as ActivatedRouteSnapshot;
  const mockState = {} as RouterStateSnapshot;

  beforeEach(() => {
    loadingSignal = signal(false);
    currentUserSignal = signal<User | null>(null);

    const authServiceMock = {
      loading: loadingSignal.asReadonly(),
      currentUser: currentUserSignal.asReadonly(),
    };

    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthService, useValue: authServiceMock }],
    });

    router = TestBed.inject(Router);
  });

  it('permits access (returns true) when currentUser() is non-null (authenticated)', async () => {
    loadingSignal.set(false);
    currentUserSignal.set({ uid: 'user-123', email: 'organizer@test.com' } as User);

    const result = await TestBed.runInInjectionContext(() => authGuard(mockRoute, mockState));

    expect(result).toBe(true);
  });

  it('redirects to /login when currentUser() is null (unauthenticated)', async () => {
    loadingSignal.set(false);
    currentUserSignal.set(null);

    const result = await TestBed.runInInjectionContext(() => authGuard(mockRoute, mockState));

    expect(result instanceof UrlTree).toBe(true);
    expect((result as UrlTree).toString()).toBe('/login');
  });

  it('redirects to /login when currentUser() is an anonymous RSVP session', async () => {
    loadingSignal.set(false);
    currentUserSignal.set({ uid: 'anonymous-rsvp-user', isAnonymous: true } as User);

    const result = await TestBed.runInInjectionContext(() => authGuard(mockRoute, mockState));

    expect(result instanceof UrlTree).toBe(true);
    expect((result as UrlTree).toString()).toBe('/login');
  });

  it('handles loading state waiting before evaluating currentUser()', async () => {
    loadingSignal.set(true);
    currentUserSignal.set(null);

    let guardResolved = false;
    const guardPromise = Promise.resolve(
      TestBed.runInInjectionContext(() => authGuard(mockRoute, mockState)),
    ).then((res) => {
      guardResolved = true;
      return res;
    });

    // Verify the guard has not resolved yet while loading is true
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(guardResolved).toBe(false);

    // Update state to authenticated and finish loading
    currentUserSignal.set({ uid: 'user-123', email: 'organizer@test.com' } as User);
    loadingSignal.set(false);
    TestBed.flushEffects();

    const result = await guardPromise;
    expect(guardResolved).toBe(true);
    expect(result).toBe(true);
  });
});
