import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './base.page';

export class HomePage extends BasePage {
  readonly pageRoot: Locator;
  readonly eventCards: Locator;
  readonly emptyState: Locator;
  readonly themeToggleBtn: Locator;
  readonly seasonalOverlay: Locator;

  constructor(page: Page) {
    super(page);
    this.pageRoot = page.getByTestId('home-page').or(page.locator('section.home'));
    this.eventCards = page.getByTestId('event-card').or(page.locator('a.home__card-link'));
    this.emptyState = page.getByTestId('home-empty-state').or(page.locator('.home__empty'));
    this.themeToggleBtn = page.getByTestId('theme-toggle-btn').or(page.locator('.theme-toggle, [aria-label*="tema" i], [aria-label*="theme" i]'));
    this.seasonalOverlay = page.getByTestId('seasonal-overlay').or(page.locator('.seasonal-overlay')).first();
  }

  async assertLoaded(): Promise<void> {
    await expect(this.pageRoot).toBeVisible();
  }

  async toggleTheme(): Promise<void> {
    if (await this.themeToggleBtn.isVisible()) {
      await this.themeToggleBtn.click();
    }
  }

  async clickEventCard(index: number = 0): Promise<void> {
    await this.eventCards.nth(index).click();
  }
}
