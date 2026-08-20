import { test as base, expect } from '@playwright/test';
import { HomePage } from '../pages/home.page';
import { LoginPage } from '../pages/login.page';
import { OrganizerDashboardPage } from '../pages/organizer-dashboard.page';
import { EventEditorPage } from '../pages/event-editor.page';
import { EventDetailPage } from '../pages/event-detail.page';
import { ProfilePage } from '../pages/profile.page';
import AxeBuilder from '@axe-core/playwright';

export type AppFixtures = {
  homePage: HomePage;
  loginPage: LoginPage;
  dashboardPage: OrganizerDashboardPage;
  eventEditorPage: EventEditorPage;
  eventDetailPage: EventDetailPage;
  profilePage: ProfilePage;
  makeAxeBuilder: () => AxeBuilder;
};

export const test = base.extend<AppFixtures>({
  homePage: async ({ page }, use) => {
    await use(new HomePage(page));
  },
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  dashboardPage: async ({ page }, use) => {
    await use(new OrganizerDashboardPage(page));
  },
  eventEditorPage: async ({ page }, use) => {
    await use(new EventEditorPage(page));
  },
  eventDetailPage: async ({ page }, use) => {
    await use(new EventDetailPage(page));
  },
  profilePage: async ({ page }, use) => {
    await use(new ProfilePage(page));
  },
  makeAxeBuilder: async ({ page }, use) => {
    const makeBuilder = () =>
      new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']);
    await use(makeBuilder);
  },
});

export { expect };
