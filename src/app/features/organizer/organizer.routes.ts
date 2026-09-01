import { Routes } from '@angular/router';

export const ORGANIZER_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./dashboard/dashboard.container').then((m) => m.DashboardContainer),
  },
  {
    path: 'evento/novo',
    loadComponent: () =>
      import('./event-editor/event-editor.container').then((m) => m.EventEditorContainer),
  },
  {
    path: 'evento/:id',
    loadComponent: () =>
      import('./event-editor/event-editor.container').then((m) => m.EventEditorContainer),
  },
];
