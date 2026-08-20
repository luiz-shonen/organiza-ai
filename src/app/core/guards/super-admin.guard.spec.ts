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
import { superAdminGuard } from './super-admin.guard';
import { User } from 'firebase/auth';

describe('superAdminGuard', () => {
  let loadingSignal: WritableSignal<boolean>;
  let isSuperAdminSignal: WritableSignal<boolean>;
  let currentUserSignal: WritableSignal<User | null>;
  let router: Router;

  const mockRoute = {} as ActivatedRouteSnapshot;
  const mockState = {} as RouterStateSnapshot;

  beforeEach(() => {
    loadingSignal = signal(false);
    isSuperAdminSignal = signal(false);
    currentUserSignal = signal<User | null>(null);

    const authServiceMock = {
      loading: loadingSignal.asReadonly(),
      isSuperAdmin: isSuperAdminSignal.asReadonly(),
      currentUser: currentUserSignal.asReadonly(),
    };

    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthService, useValue: authServiceMock }],
    });

    router = TestBed.inject(Router);
  });

  it('allows access (returns true) when isSuperAdmin() is true', async () => {
    loadingSignal.set(false);
    isSuperAdminSignal.set(true);
    currentUserSignal.set({ uid: 'superadmin-123', email: 'luiz.gmr.dev@gmail.com' } as User);

    const result = await TestBed.runInInjectionContext(() => superAdminGuard(mockRoute, mockState));

    expect(result).toBe(true);
  });

  it('redirects to /meus-eventos when authenticated but not superadmin (isSuperAdmin() is false)', async () => {
    loadingSignal.set(false);
    isSuperAdminSignal.set(false);
    currentUserSignal.set({ uid: 'regular-user-456', email: 'organizer@test.com' } as User);

    const result = await TestBed.runInInjectionContext(() => superAdminGuard(mockRoute, mockState));

    expect(result instanceof UrlTree).toBe(true);
    expect((result as UrlTree).toString()).toBe('/meus-eventos');
  });

  it('redirects to /meus-eventos when unauthenticated (currentUser() is null and isSuperAdmin() is false)', async () => {
    loadingSignal.set(false);
    isSuperAdminSignal.set(false);
    currentUserSignal.set(null);

    const result = await TestBed.runInInjectionContext(() => superAdminGuard(mockRoute, mockState));

    expect(result instanceof UrlTree).toBe(true);
    expect((result as UrlTree).toString()).toBe('/meus-eventos');
  });

  it('handles loading state waiting before evaluating isSuperAdmin()', async () => {
    loadingSignal.set(true);
    isSuperAdminSignal.set(false);
    currentUserSignal.set(null);

    let guardResolved = false;
    const guardPromise = Promise.resolve(
      TestBed.runInInjectionContext(() => superAdminGuard(mockRoute, mockState)),
    ).then((res) => {
      guardResolved = true;
      return res;
    });

    // Verify the guard has not resolved yet while loading is true
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(guardResolved).toBe(false);

    // Update state to superadmin and finish loading
    isSuperAdminSignal.set(true);
    currentUserSignal.set({ uid: 'superadmin-123', email: 'luiz.gmr.dev@gmail.com' } as User);
    loadingSignal.set(false);
    TestBed.flushEffects();

    const result = await guardPromise;
    expect(guardResolved).toBe(true);
    expect(result).toBe(true);
  });
});
