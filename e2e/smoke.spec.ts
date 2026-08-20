import { test, expect } from '@playwright/test';

test.describe('Smoke Journey', () => {
  test('should render the home page with proper titles and landmark regions', async ({ page }) => {
    await page.goto('/');

    // Verify main section and title
    const headerTitle = page.locator('.home__title');
    await expect(headerTitle).toBeVisible();
    await expect(headerTitle).toContainText('Eventos');

    // Verify accessibility landmark
    const section = page.locator('section.home');
    await expect(section).toHaveAttribute('aria-label', 'Eventos disponíveis');
  });

  test('should navigate to login page and display authentication forms', async ({ page }) => {
    await page.goto('/login');

    // Verify login landmark and inputs
    const loginMain = page.locator('main.login');
    await expect(loginMain).toBeVisible();

    const emailInput = page.locator('input[formcontrolname="email"]');
    await expect(emailInput).toBeVisible();

    const passwordInput = page.locator('input[formcontrolname="password"]');
    await expect(passwordInput).toBeVisible();

    const googleBtn = page.locator('.login__google-btn');
    await expect(googleBtn).toBeVisible();
    await expect(googleBtn).toContainText('Entrar com Google');
  });

  test('should render public event route structure', async ({ page }) => {
    await page.goto('/evento/test-event-placeholder');

    // Page should render either the event detail or the not-found alert gracefully
    const mainOrAlert = page.locator('main.event-detail, .event-detail__not-found, .event-detail__loading');
    await expect(mainOrAlert.first()).toBeVisible();
  });
});
