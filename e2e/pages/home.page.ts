import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './base.page';

export class HomePage extends BasePage {
  readonly pageRoot: Locator;
  readonly eventCards: Locator;
  readonly emptyState: Locator;
  readonly headerLoginBtn: Locator;
  readonly bottomNav: Locator;
  readonly profileNavLink: Locator;
  readonly profileThemeLight: Locator;
  readonly profileThemeDark: Locator;
  readonly seasonalOverlay: Locator;

  constructor(page: Page) {
    super(page);
    this.pageRoot = page.getByTestId('home-page').or(page.locator('section.home'));
    this.eventCards = page.getByTestId('event-card').or(page.locator('a.home__card-link'));
    this.emptyState = page.getByTestId('home-empty-state').or(page.locator('.home__empty'));
    // No hamburger: visitors get an "Entrar" button, members the bottom bar (phone) or
    // the header navigation (desktop). Both expose the same nav-* test ids.
    this.headerLoginBtn = page.getByTestId('header-login-btn');
    this.bottomNav = page.locator('.app-bottom-nav');
    this.profileNavLink = page
      .getByTestId('nav-profile')
      .or(page.getByTestId('header-profile-link'))
      .filter({ visible: true })
      .first();
    // Theme choices live in Perfil → Preferências.
    this.profileThemeLight = page.getByTestId('profile-theme-light').getByRole('radio');
    this.profileThemeDark = page.getByTestId('profile-theme-dark').getByRole('radio');
    this.seasonalOverlay = page
      .getByTestId('seasonal-overlay')
      .or(page.locator('.seasonal-overlay'))
      .first();
  }

  async assertLoaded(): Promise<void> {
    await expect(this.pageRoot).toBeVisible();
  }

  async clickEventCard(index: number = 0): Promise<void> {
    await this.eventCards.nth(index).click();
  }
}
