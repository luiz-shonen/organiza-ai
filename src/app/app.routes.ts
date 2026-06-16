import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/home/home.container').then((m) => m.HomeContainer),
  },
  {
    path: 'evento/:id',
    loadComponent: () =>
      import('./features/event-detail/event-detail.container').then(
        (m) => m.EventDetailContainer
      ),
  },
  {
    path: 'admin/login',
    loadComponent: () =>
      import('./features/admin/login/login.container').then((m) => m.LoginContainer),
  },
  {
    path: 'admin',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/admin/admin.routes').then((m) => m.ADMIN_ROUTES),
  },
  { path: '**', redirectTo: '' },
];
