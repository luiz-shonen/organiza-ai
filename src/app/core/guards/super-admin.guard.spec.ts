import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
  UrlTree,
  provideRouter,
} from '@angular/router';
import { signal, WritableSignal } from '@angular/core';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { AuthService } from '../services';
import { superAdminGuard } from './super-admin.guard';

describe('superAdminGuard', () => {
  let isSuperAdminSignal: WritableSignal<boolean>;
  let waitForAuthReadyMock: ReturnType<typeof vi.fn>;

  const mockRoute = {} as ActivatedRouteSnapshot;
  const mockState = {} as RouterStateSnapshot;

  beforeEach(() => {
    isSuperAdminSignal = signal(false);
    waitForAuthReadyMock = vi.fn().mockResolvedValue(undefined);

    const authServiceMock = {
      isSuperAdmin: isSuperAdminSignal.asReadonly(),
      waitForAuthReady: waitForAuthReadyMock,
    };

    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthService, useValue: authServiceMock }],
    });
  });

  it('allows access (returns true) when isSuperAdmin() is true', async () => {
    isSuperAdminSignal.set(true);

    const result = await TestBed.runInInjectionContext(() => superAdminGuard(mockRoute, mockState));

    expect(waitForAuthReadyMock).toHaveBeenCalled();
    expect(result).toBe(true);
  });

  it('redirects to /meus-eventos when authenticated but not superadmin (isSuperAdmin() is false)', async () => {
    isSuperAdminSignal.set(false);

    const result = await TestBed.runInInjectionContext(() => superAdminGuard(mockRoute, mockState));

    expect(waitForAuthReadyMock).toHaveBeenCalled();
    expect(result instanceof UrlTree).toBe(true);
    expect((result as UrlTree).toString()).toBe('/meus-eventos');
  });

  it('redirects to /meus-eventos when unauthenticated (isSuperAdmin() is false)', async () => {
    isSuperAdminSignal.set(false);

    const result = await TestBed.runInInjectionContext(() => superAdminGuard(mockRoute, mockState));

    expect(waitForAuthReadyMock).toHaveBeenCalled();
    expect(result instanceof UrlTree).toBe(true);
    expect((result as UrlTree).toString()).toBe('/meus-eventos');
  });

  it('awaits waitForAuthReady before checking isSuperAdmin', async () => {
    let authReadyResolved = false;
    let resolveAuthReady: () => void = () => {};
    waitForAuthReadyMock.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveAuthReady = () => {
            authReadyResolved = true;
            resolve();
          };
        }),
    );

    isSuperAdminSignal.set(true);

    const guardPromise = TestBed.runInInjectionContext(() => superAdminGuard(mockRoute, mockState));

    expect(authReadyResolved).toBe(false);
    resolveAuthReady();

    const result = await guardPromise;
    expect(authReadyResolved).toBe(true);
    expect(result).toBe(true);
  });
});
