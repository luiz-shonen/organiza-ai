import { test as base, expect } from '@playwright/test';
import { HomePage } from '../pages/home.page';
import { LoginPage } from '../pages/login.page';
import { OrganizerDashboardPage } from '../pages/organizer-dashboard.page';
import { EventEditorPage } from '../pages/event-editor.page';
import { EventDetailPage } from '../pages/event-detail.page';
import { ProfilePage } from '../pages/profile.page';
import { DesignSystemShowcasePage } from '../pages/design-system-showcase.page';
import { RsvpDialogHarness } from '../components/rsvp-dialog.harness';
import { ItemListHarness } from '../components/item-list.harness';
import { SharePanelHarness } from '../components/share-panel.harness';
import { FamilyRosterHarness } from '../components/family-roster.harness';
import { ConfirmDialogHarness } from '../components/confirm-dialog.harness';
import AxeBuilder from '@axe-core/playwright';

export type AppFixtures = {
  homePage: HomePage;
  loginPage: LoginPage;
  dashboardPage: OrganizerDashboardPage;
  eventEditorPage: EventEditorPage;
  eventDetailPage: EventDetailPage;
  profilePage: ProfilePage;
  showcasePage: DesignSystemShowcasePage;
  rsvpDialog: RsvpDialogHarness;
  itemList: ItemListHarness;
  sharePanel: SharePanelHarness;
  familyRoster: FamilyRosterHarness;
  confirmDialog: ConfirmDialogHarness;
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
  showcasePage: async ({ page }, use) => {
    await use(new DesignSystemShowcasePage(page));
  },
  rsvpDialog: async ({ page }, use) => {
    await use(new RsvpDialogHarness(page));
  },
  itemList: async ({ page }, use) => {
    await use(new ItemListHarness(page));
  },
  sharePanel: async ({ page }, use) => {
    await use(new SharePanelHarness(page));
  },
  familyRoster: async ({ page }, use) => {
    await use(new FamilyRosterHarness(page));
  },
  confirmDialog: async ({ page }, use) => {
    await use(new ConfirmDialogHarness(page));
  },
  makeAxeBuilder: async ({ page }, use) => {
    const makeBuilder = () =>
      new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']);
    await use(makeBuilder);
  },
});

export { expect };
