import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './base.page';

export class DesignSystemShowcasePage extends BasePage {
  readonly sidebar: Locator;
  readonly searchInput: Locator;
  readonly navLinks: Locator;
  readonly topbar: Locator;
  readonly topbarTitle: Locator;
  readonly themeToggleBtn: Locator;
  readonly seasonalSelect: Locator;
  readonly specimenCards: Locator;
  readonly codeBoxes: Locator;
  readonly iconCards: Locator;

  constructor(page: Page) {
    super(page);
    this.sidebar = page.locator('aside.org-ds-sidebar');
    this.searchInput = page.locator('.org-ds-sidebar__search-field input');
    this.navLinks = page.locator('.org-ds-sidebar__nav-link');
    this.topbar = page.locator('header.org-ds-topbar');
    this.topbarTitle = page.locator('.org-ds-topbar__title');
    this.themeToggleBtn = page.locator('.org-ds-topbar__theme-toggle');
    this.seasonalSelect = page.locator('.org-ds-topbar__seasonal-select mat-select');
    this.specimenCards = page.locator('.org-ds-specimen-card');
    this.codeBoxes = page.locator('.org-ds-specimen-card__code-box');
    this.iconCards = page.locator('.org-ds-icon-card');
  }

  async assertLoaded(): Promise<void> {
    await expect(this.topbarTitle).toBeVisible();
    await expect(this.topbarTitle).toContainText('Convites que dão vontade de confirmar.');
  }

  async filterNav(query: string): Promise<void> {
    await this.searchInput.fill(query);
  }

  async selectSection(sectionId: string): Promise<void> {
    const link = this.page.locator(`.org-ds-sidebar__nav-link`).filter({
      has: this.page.locator(`text=${sectionId}`),
    });
    if ((await link.count()) > 0) {
      await link.first().click();
    } else {
      const btn = this.page.locator(`button[aria-label*="${sectionId}"]`);
      if ((await btn.count()) > 0) {
        await btn.first().click();
      }
    }
  }

  async toggleTheme(): Promise<void> {
    await this.themeToggleBtn.click();
  }

  async chooseSeasonalTheme(themeLabel: string): Promise<void> {
    await this.seasonalSelect.scrollIntoViewIfNeeded();
    await this.seasonalSelect.click();
    const option = this.page
      .locator('.cdk-overlay-pane mat-option')
      .filter({ hasText: themeLabel })
      .first();
    await expect(option).toBeVisible();
    await option.click();
    await expect(this.page.locator('.cdk-overlay-pane mat-option')).toHaveCount(0);
  }
}
