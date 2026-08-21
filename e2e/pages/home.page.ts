import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './base.page';

export class HomePage extends BasePage {
  readonly pageRoot: Locator;
  readonly eventCards: Locator;
  readonly emptyState: Locator;
  readonly navigationMenuTrigger: Locator;
  readonly themeToggleBtn: Locator;
  readonly navigationDrawer: Locator;
  readonly drawerThemeLight: Locator;
  readonly drawerThemeDark: Locator;
  readonly seasonalOverlay: Locator;

  constructor(page: Page) {
    super(page);
    this.pageRoot = page.getByTestId('home-page').or(page.locator('section.home'));
    this.eventCards = page.getByTestId('event-card').or(page.locator('a.home__card-link'));
    this.emptyState = page.getByTestId('home-empty-state').or(page.locator('.home__empty'));
    this.navigationMenuTrigger = page.getByTestId('navigation-menu-trigger');
    // Kept as a compatibility alias for legacy callers that only exercise an
    // offline-safe toolbar interaction. Theme choices themselves are in the drawer.
    this.themeToggleBtn = this.navigationMenuTrigger;
    this.navigationDrawer = page.getByTestId('navigation-drawer');
    this.drawerThemeLight = page.getByTestId('drawer-theme-light');
    this.drawerThemeDark = page.getByTestId('drawer-theme-dark');
    this.seasonalOverlay = page.getByTestId('seasonal-overlay').or(page.locator('.seasonal-overlay')).first();
  }

  async assertLoaded(): Promise<void> {
    await expect(this.pageRoot).toBeVisible();
  }

  async openNavigationDrawer(): Promise<void> {
    await this.navigationMenuTrigger.click();
    await expect(this.navigationDrawer).toBeVisible();
  }

  async clickEventCard(index: number = 0): Promise<void> {
    await this.eventCards.nth(index).click();
  }
}
