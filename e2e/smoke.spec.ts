import { test, expect } from './fixtures/test.fixture';

test.describe('Smoke Journey', () => {
  test('should render the home page with proper titles and landmark regions', async ({
    homePage,
  }) => {
    await homePage.goto('/');
    await homePage.assertLoaded();

    await expect(homePage.pageRoot).toBeVisible();
    await expect(homePage.pageRoot).toHaveAttribute('aria-label', 'Eventos disponíveis');
  });

  test('should navigate to login page and display authentication forms', async ({ loginPage }) => {
    await loginPage.goto('/login');
    await loginPage.assertLoaded();

    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.googleBtn).toBeVisible();
    await expect(loginPage.googleBtn).toContainText('Entrar com Google');
  });

  test('should render public event route structure', async ({ eventDetailPage }) => {
    await eventDetailPage.goto('/evento/test-event-placeholder');
    await eventDetailPage.assertLoaded();

    await expect(eventDetailPage.pageRoot.first()).toBeVisible();
  });
});
