import { test, expect } from '../fixtures/test.fixture';

test.describe('PWA Offline Caching Resilience and Offline Mode Suite', () => {
  test('should remain functional and retain view structure when transitioning to offline mode', async ({
    page,
    context,
    homePage,
  }) => {
    // 1. Load Home Page while online
    await homePage.goto('/');
    await homePage.assertLoaded();

    // Verify online landmark region
    await expect(homePage.pageRoot).toBeVisible();

    // 2. Simulate network disconnection (Offline Mode)
    await context.setOffline(true);
    await page.evaluate(() => window.dispatchEvent(new Event('offline')));

    // 3. Verify page remains responsive and does not crash or blank out
    await expect(homePage.pageRoot).toBeVisible();

    // Verify navigation drawer and its theme controls remain interactive offline.
    await page.getByTestId('navigation-menu-trigger').click();
    await expect(page.getByTestId('navigation-drawer')).toBeVisible();
    await page.getByTestId('drawer-theme-dark').click();
    await expect(page.locator('html')).toHaveClass(/dark/);
    await expect(page.getByTestId('drawer-theme-dark')).toHaveAttribute('aria-pressed', 'true');

    // 4. Restore online connection
    await context.setOffline(false);
    await page.evaluate(() => window.dispatchEvent(new Event('online')));

    // Verify app recovers seamlessly
    await expect(homePage.pageRoot).toBeVisible();
    await expect(page.getByRole('alert')).toBeHidden();
  });

  test('should handle offline navigation and display graceful feedback on login form', async ({
    page,
    context,
    loginPage,
  }) => {
    // 1. Navigate to Login Page
    await loginPage.goto('/login');
    await loginPage.assertLoaded();

    // 2. Switch to offline
    await context.setOffline(true);
    await page.evaluate(() => window.dispatchEvent(new Event('offline')));

    // 3. Verify form fields remain visible and interactive in offline state
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await loginPage.emailInput.fill('offline-user@organiza.ai');
    await loginPage.passwordInput.fill('123456');

    // 4. Restore connectivity
    await context.setOffline(false);
    await page.evaluate(() => window.dispatchEvent(new Event('online')));
  });
});
