import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './base.page';

export class LoginPage extends BasePage {
  readonly pageRoot: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitBtn: Locator;
  readonly googleBtn: Locator;
  readonly errorAlert: Locator;
  readonly verificationBanner: Locator;

  constructor(page: Page) {
    super(page);
    this.pageRoot = page.getByTestId('login-page').or(page.locator('main.login'));
    this.emailInput = page.getByTestId('login-email-input').or(page.getByLabel('E-mail')).or(page.locator('input[formcontrolname="email"]'));
    this.passwordInput = page.getByTestId('login-password-input').or(page.locator('input[type="password"], input[formcontrolname="password"]'));
    this.submitBtn = page.getByTestId('login-submit-btn').getByRole('button', { name: 'Entrar' });
    this.googleBtn = page.getByTestId('google-login-btn').getByRole('button', { name: 'Entrar com Google' });
    this.errorAlert = page.getByTestId('login-error-alert').or(page.locator('.login__error'));
    this.verificationBanner = page.getByTestId('email-verification-banner').or(page.locator('.verification-banner, app-verification-banner'));
  }

  async assertLoaded(): Promise<void> {
    await expect(this.pageRoot).toBeVisible();
  }

  async login(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitBtn.click();
  }

  async loginWithGoogle(): Promise<void> {
    await this.googleBtn.click();
  }
}
