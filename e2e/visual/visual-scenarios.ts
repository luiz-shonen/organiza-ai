export type VisualVariant = 'light-desktop' | 'dark-desktop' | 'light-mobile' | 'dark-mobile';

export interface VisualScenario {
  readonly id: string;
  readonly path: string;
  readonly anchors: readonly string[];
  readonly variants: readonly VisualVariant[];
}

const REQUIRED_VARIANTS = ['light-desktop', 'dark-desktop', 'light-mobile', 'dark-mobile'] as const;

export const VISUAL_SCENARIOS: readonly VisualScenario[] = [
  { id: 'home', path: '/', anchors: ['main.app-content', '[data-testid="home-hero"]'], variants: REQUIRED_VARIANTS },
  { id: 'login', path: '/login', anchors: ['main.app-content', '.login__card'], variants: REQUIRED_VARIANTS },
  { id: 'organizer-dashboard', path: '/meus-eventos', anchors: ['main.app-content', '[data-testid="dashboard-content"]'], variants: REQUIRED_VARIANTS },
  { id: 'event-editor-step-1', path: '/meus-eventos/evento/novo', anchors: ['main.app-content', '[data-testid="event-editor-step-1"]'], variants: REQUIRED_VARIANTS },
  { id: 'event-editor-step-2', path: '/meus-eventos/evento/novo', anchors: ['main.app-content', '[data-testid="event-editor-step-2"]'], variants: REQUIRED_VARIANTS },
  { id: 'event-editor-step-3', path: '/meus-eventos/evento/novo', anchors: ['main.app-content', '[data-testid="event-editor-step-3"]'], variants: REQUIRED_VARIANTS },
  { id: 'event-detail', path: '/evento/:id', anchors: ['main.app-content', '[data-testid="event-detail"]'], variants: REQUIRED_VARIANTS },
  { id: 'profile', path: '/perfil', anchors: ['main.app-content', '[data-testid="profile-content"]'], variants: REQUIRED_VARIANTS },
  { id: 'navigation-drawer', path: '/', anchors: ['main.app-content', '[data-testid="navigation-drawer"]'], variants: REQUIRED_VARIANTS },
  { id: 'rsvp-drawer', path: '/evento/:id', anchors: ['main.app-content', '[data-testid="rsvp-drawer"]'], variants: REQUIRED_VARIANTS },
  { id: 'collaborator-drawer', path: '/meus-eventos/evento/:id', anchors: ['main.app-content', '[data-testid="collaborator-drawer"]'], variants: REQUIRED_VARIANTS },
];
