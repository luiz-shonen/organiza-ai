import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services';

export const superAdminGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  await authService.waitForAuthReady();

  if (authService.isSuperAdmin()) {
    return true;
  }

  return router.createUrlTree(['/meus-eventos']);
};
