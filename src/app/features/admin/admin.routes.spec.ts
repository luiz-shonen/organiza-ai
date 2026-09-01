import { Route } from '@angular/router';
import { describe, it, expect } from 'vitest';
import { ADMIN_ROUTES } from './admin.routes';
import { AdminDashboardContainer } from './admin-dashboard.container';

describe('ADMIN_ROUTES', () => {
  it('should define root route lazy-loading AdminDashboardContainer', async () => {
    const route = ADMIN_ROUTES.find((r: Route) => r.path === '');
    expect(route).toBeDefined();
    expect(route?.loadComponent).toBeDefined();
    const component = await (route?.loadComponent as () => Promise<unknown>)();
    expect(component).toBe(AdminDashboardContainer);
  });

  it('should not expose organizer event routes directly in ADMIN_ROUTES', () => {
    const newEventRoute = ADMIN_ROUTES.find((r: Route) => r.path === 'evento/novo');
    const editEventRoute = ADMIN_ROUTES.find((r: Route) => r.path === 'evento/:id');
    expect(newEventRoute).toBeUndefined();
    expect(editEventRoute).toBeUndefined();
  });
});
