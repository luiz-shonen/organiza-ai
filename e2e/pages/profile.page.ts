import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './base.page';
import { FamilyRosterHarness } from '../components/family-roster.harness';

export class ProfilePage extends BasePage {
  readonly pageRoot: Locator;
  readonly nameInput: Locator;
  readonly phoneInput: Locator;
  readonly saveProfileBtn: Locator;
  readonly familyRoster: FamilyRosterHarness;

  constructor(page: Page) {
    super(page);
    this.pageRoot = page.getByTestId('profile-page').or(page.locator('.profile-container')).first();
    this.nameInput = page
      .getByTestId('profile-name-input')
      .or(page.locator('app-profile-info-card input'))
      .first();
    this.phoneInput = page
      .getByTestId('profile-phone-input')
      .or(page.locator('input[type="tel"]'))
      .first();
    this.saveProfileBtn = page
      .getByTestId('save-profile-btn')
      .or(page.locator('app-profile-info-card button[type="submit"]'))
      .first();
    this.familyRoster = new FamilyRosterHarness(page);
  }

  async assertLoaded(): Promise<void> {
    await expect(
      this.page.locator('.profile-info-card, .profile-container__content').first(),
    ).toBeVisible({ timeout: 15000 });
  }

  async updateProfile(name: string, phone?: string): Promise<void> {
    if (await this.nameInput.isVisible()) {
      await this.nameInput.fill(name);
    }
    if (phone && (await this.phoneInput.isVisible())) {
      await this.phoneInput.fill(phone);
    }
    if (await this.saveProfileBtn.isVisible()) {
      await this.saveProfileBtn.click();
    }
  }
}
