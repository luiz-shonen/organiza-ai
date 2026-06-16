import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAdmin()) {
    return true;
  }

  if (authService.loading()) {
    // Auth state still loading — wait for it
    return new Promise<boolean>((resolve) => {
      const checkInterval = setInterval(() => {
        if (!authService.loading()) {
          clearInterval(checkInterval);
          if (authService.isAdmin()) {
            resolve(true);
          } else {
            router.navigate(['/login']);
            resolve(false);
          }
        }
      }, 50);
    });
  }

  router.navigate(['/login']);
  return false;
};
