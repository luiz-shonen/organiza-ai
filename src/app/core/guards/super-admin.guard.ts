import { inject, effect, Injector } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services';

export const superAdminGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const injector = inject(Injector);

  if (authService.loading()) {
    // Wait for the auth loading signal to turn false using native Angular Signal effect
    await new Promise<void>((resolve) => {
      const effectRef = effect(
        () => {
          if (!authService.loading()) {
            effectRef.destroy();
            resolve();
          }
        },
        { injector },
      );
    });
  }

  if (authService.isSuperAdmin()) {
    return true;
  }

  return router.createUrlTree(['/meus-eventos']);
};
