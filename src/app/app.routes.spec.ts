import { Route } from '@angular/router';
import { routes } from './app.routes';
import { authGuard } from './core/guards/auth.guard';
import { superAdminGuard } from './core/guards/super-admin.guard';
import { HomeContainer } from './features/home/home.container';
import { EventDetailContainer } from './features/event-detail/event-detail.container';
import { LoginContainer } from './features/auth/login/login.container';
import { ADMIN_ROUTES } from './features/admin/admin.routes';
import { ORGANIZER_ROUTES } from './features/organizer/organizer.routes';
import { ProfileContainer } from './features/profile/profile.container';
import { DesignSystemShowcaseContainer } from './features/design-system/design-system-showcase.container';

describe('App Routes', () => {
  it('should define the root route with HomeContainer lazy loading', async () => {
    const route = routes.find((r: Route) => r.path === '');
    expect(route).toBeDefined();
    expect(route?.loadComponent).toBeDefined();
    const component = await (route?.loadComponent as () => Promise<unknown>)();
    expect(component).toBe(HomeContainer);
  });

  it('should define the evento/:id route with EventDetailContainer lazy loading', async () => {
    const route = routes.find((r: Route) => r.path === 'evento/:id');
    expect(route).toBeDefined();
    expect(route?.loadComponent).toBeDefined();
    const component = await (route?.loadComponent as () => Promise<unknown>)();
    expect(component).toBe(EventDetailContainer);
  });

  it('should define the /perfil route protected by authGuard and lazy-loading ProfileContainer', async () => {
    const route = routes.find((r: Route) => r.path === 'perfil');
    expect(route).toBeDefined();
    expect(route?.canActivate).toBeDefined();
    expect(route?.canActivate).toContain(authGuard);
    expect(route?.loadComponent).toBeDefined();
    const component = await (route?.loadComponent as () => Promise<unknown>)();
    expect(component).toBe(ProfileContainer);
  });

  it('should define the login route and lazy-load LoginContainer', async () => {
    const route = routes.find((r: Route) => r.path === 'login');
    expect(route).toBeDefined();
    expect(route?.loadComponent).toBeDefined();
    const component = await (route?.loadComponent as () => Promise<unknown>)();
    expect(component).toBe(LoginContainer);
  });

  it('should define /meus-eventos route protected by authGuard and lazy-loading ORGANIZER_ROUTES', async () => {
    const route = routes.find((r: Route) => r.path === 'meus-eventos');
    expect(route).toBeDefined();
    expect(route?.canActivate).toBeDefined();
    expect(route?.canActivate).toContain(authGuard);
    expect(route?.loadChildren).toBeDefined();
    const children = await (route?.loadChildren as () => Promise<unknown>)();
    expect(children).toBe(ORGANIZER_ROUTES);
  });

  it('should define /admin route protected by superAdminGuard and lazy-loading ADMIN_ROUTES', async () => {
    const route = routes.find((r: Route) => r.path === 'admin');
    expect(route).toBeDefined();
    expect(route?.canActivate).toBeDefined();
    expect(route?.canActivate).toContain(superAdminGuard);
    expect(route?.loadChildren).toBeDefined();
    const children = await (route?.loadChildren as () => Promise<unknown>)();
    expect(children).toBe(ADMIN_ROUTES);
  });

  it('should define /design-system route protected by superAdminGuard and lazy-loading DesignSystemShowcaseContainer', async () => {
    const route = routes.find((r: Route) => r.path === 'design-system');
    expect(route).toBeDefined();
    expect(route?.canActivate).toBeDefined();
    expect(route?.canActivate).toContain(superAdminGuard);
    expect(route?.loadComponent).toBeDefined();
    const component = await (route?.loadComponent as () => Promise<unknown>)();
    expect(component).toBe(DesignSystemShowcaseContainer);
  });

  it('should define wildcard ** route redirecting to root', () => {
    const route = routes.find((r: Route) => r.path === '**');
    expect(route).toBeDefined();
    expect(route?.redirectTo).toBe('');
  });
});
