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
    this.pageRoot = page.getByTestId('profile-page').or(page.locator('.profile-container'));
    this.nameInput = page.getByTestId('profile-name-input').or(page.getByLabel('Nome')).or(page.locator('app-profile-info-card input[formcontrolname="displayName"], app-profile-info-card input'));
    this.phoneInput = page.getByTestId('profile-phone-input').or(page.getByLabel('Telefone')).or(page.locator('input[type="tel"], app-profile-info-card input[formcontrolname="phone"]'));
    this.saveProfileBtn = page.getByTestId('save-profile-btn').or(page.locator('app-profile-info-card button[type="submit"], app-profile-info-card button:has-text("Salvar"), app-profile-info-card button:has-text("Atualizar")'));
    this.familyRoster = new FamilyRosterHarness(page);
  }

  async assertLoaded(): Promise<void> {
    await expect(this.pageRoot).toBeVisible();
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
