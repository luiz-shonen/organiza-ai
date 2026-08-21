import { expect, test } from '@playwright/test';
import { VISUAL_SCENARIOS } from './visual-scenarios';

test('registers every governed visual route with all theme and viewport variants', () => {
  expect(VISUAL_SCENARIOS.map((scenario) => scenario.id)).toEqual([
    'home',
    'login',
    'organizer-dashboard',
    'event-editor-step-1',
    'event-editor-step-2',
    'event-editor-step-3',
    'event-detail',
    'profile',
    'navigation-drawer',
    'rsvp-drawer',
    'collaborator-drawer',
  ]);

  for (const scenario of VISUAL_SCENARIOS) {
    expect(scenario.anchors.length, `${scenario.id} needs a semantic anchor`).toBeGreaterThan(0);
    expect(scenario.variants).toEqual([
      'light-desktop',
      'dark-desktop',
      'light-mobile',
      'dark-mobile',
    ]);
  }
});
