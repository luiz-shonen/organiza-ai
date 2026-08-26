import { test, expect } from '../fixtures/test.fixture';
import { setupMockAuthSession } from '../helpers/auth-mock.helper';

test.describe('Authentication Guards and Form Validation', () => {
  test('should redirect unauthenticated access from protected routes to login', async ({ page, loginPage }) => {
    // Attempt to access /meus-eventos without authentication
    await page.goto('/meus-eventos');
    await expect(page).toHaveURL(/\/login/);
    await loginPage.assertLoaded();

    // Attempt to access /perfil without authentication
    await page.goto('/perfil');
    await expect(page).toHaveURL(/\/login/);
    await loginPage.assertLoaded();
  });

  test('should redirect an anonymous RSVP session away from organizer routes', async ({ page, loginPage }) => {
    await setupMockAuthSession(page, {
      uid: 'anonymous-rsvp-route-uid',
      isAnonymous: true,
    });

    await page.goto('/meus-eventos');

    await expect(page).toHaveURL(/\/login/);
    await loginPage.assertLoaded();
  });

  test('should display inline validation errors when submitting invalid email and password', async ({ page, loginPage }) => {
    await loginPage.goto('/login');
    await loginPage.assertLoaded();

    // Provide invalid credentials
    await loginPage.emailInput.fill('invalid-email');
    await loginPage.passwordInput.fill('123');
    await loginPage.passwordInput.blur();
    await loginPage.emailInput.focus();
    await loginPage.emailInput.blur();

    // Submit button should remain disabled
    await expect(loginPage.submitBtn).toBeDisabled();

    // Inline error messages should be displayed
    const emailError = page.getByRole('alert').filter({ hasText: /Digite um e-mail válido|E-mail é obrigatório/i });
    const passwordError = page.getByRole('alert').filter({ hasText: /Mínimo 6 caracteres|Senha é obrigatória/i });

    await expect(emailError).toBeVisible();
    await expect(emailError).toContainText('Digite um e-mail válido');

    await expect(passwordError).toBeVisible();
    await expect(passwordError).toContainText('Mínimo 6 caracteres');
  });

  test('should display Google sign-in option and submit button', async ({ loginPage }) => {
    await loginPage.goto('/login');
    await loginPage.assertLoaded();

    // Check Google sign-in button
    await expect(loginPage.googleBtn).toBeVisible();
    await expect(loginPage.googleBtn).toContainText(/Entrar com Google/i);

    // Check submit button
    await expect(loginPage.submitBtn).toBeVisible();
    await expect(loginPage.submitBtn).toContainText(/Entrar/i);

    // Check inputs presence
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
  });

  test('should block unauthorized access to /admin', async ({ page, loginPage }) => {
    // Attempt accessing /admin without superadmin rights
    await page.goto('/admin');

    // SuperAdmin guard redirects unauthorized users away from /admin to login
    await expect(page).not.toHaveURL(/\/admin$/);
    await expect(page).toHaveURL(/\/login/);
    await loginPage.assertLoaded();
  });

  test('should allow an authenticated organizer at /meus-eventos and redirect it away from /admin', async ({
    page,
    dashboardPage,
  }) => {
    await setupMockAuthSession(page, {
      uid: 'organizer-route-uid',
      email: 'organizer@organizaai.test',
      displayName: 'Organizer Route Test',
      events: [],
    });

    await page.goto('/meus-eventos');
    await dashboardPage.assertLoaded();
    await expect(page).toHaveURL(/\/meus-eventos$/);

    await page.goto('/admin');
    await expect(page).toHaveURL(/\/meus-eventos$/);
  });
});
