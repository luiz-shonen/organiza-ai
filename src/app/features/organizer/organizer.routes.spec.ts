import { Route } from '@angular/router';
import { describe, it, expect } from 'vitest';
import { ORGANIZER_ROUTES } from './organizer.routes';
import { DashboardContainer } from './dashboard/dashboard.container';
import { EventEditorContainer } from './event-editor/event-editor.container';

describe('ORGANIZER_ROUTES', () => {
  it('should define root route lazy-loading DashboardContainer', async () => {
    const route = ORGANIZER_ROUTES.find((r: Route) => r.path === '');
    expect(route).toBeDefined();
    expect(route?.loadComponent).toBeDefined();
    const component = await (route?.loadComponent as () => Promise<unknown>)();
    expect(component).toBe(DashboardContainer);
  });

  it('should define evento/novo route lazy-loading EventEditorContainer', async () => {
    const route = ORGANIZER_ROUTES.find((r: Route) => r.path === 'evento/novo');
    expect(route).toBeDefined();
    expect(route?.loadComponent).toBeDefined();
    const component = await (route?.loadComponent as () => Promise<unknown>)();
    expect(component).toBe(EventEditorContainer);
  });

  it('should define evento/:id route lazy-loading EventEditorContainer', async () => {
    const route = ORGANIZER_ROUTES.find((r: Route) => r.path === 'evento/:id');
    expect(route).toBeDefined();
    expect(route?.loadComponent).toBeDefined();
    const component = await (route?.loadComponent as () => Promise<unknown>)();
    expect(component).toBe(EventEditorContainer);
  });
});
