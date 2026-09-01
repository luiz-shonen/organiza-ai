import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../organizer/dashboard/dashboard.container').then((m) => m.DashboardContainer),
  },
  {
    path: 'evento/novo',
    loadComponent: () =>
      import('../organizer/event-editor/event-editor.container').then((m) => m.EventEditorContainer),
  },
  {
    path: 'evento/:id',
    loadComponent: () =>
      import('../organizer/event-editor/event-editor.container').then((m) => m.EventEditorContainer),
  },
];
