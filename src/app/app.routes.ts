import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { superAdminGuard } from './core/guards/super-admin.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home.container').then((m) => m.HomeContainer),
  },
  {
    path: 'evento/:id',
    loadComponent: () =>
      import('./features/event-detail/event-detail.container').then((m) => m.EventDetailContainer),
  },
  {
    path: 'perfil',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/profile/profile.container').then((m) => m.ProfileContainer),
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.container').then((m) => m.LoginContainer),
  },
  {
    path: 'meus-eventos',
    canActivate: [authGuard],
    loadChildren: () => import('./features/admin/admin.routes').then((m) => m.ADMIN_ROUTES),
  },
  {
    path: 'admin',
    canActivate: [superAdminGuard],
    loadChildren: () => import('./features/admin/admin.routes').then((m) => m.ADMIN_ROUTES),
  },
  {
    path: 'design-system',
    canActivate: [superAdminGuard],
    loadComponent: () =>
      import('./features/design-system/design-system-showcase.container').then(
        (m) => m.DesignSystemShowcaseContainer,
      ),
  },
  { path: '**', redirectTo: '' },
];
