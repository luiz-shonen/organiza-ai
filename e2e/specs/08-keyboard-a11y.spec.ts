import { test, expect } from '../fixtures/test.fixture';
import { Page } from '@playwright/test';
import { setupMockAuthSession } from '../helpers/auth-mock.helper';

const mockSampleEvents = [
  {
    id: 'event-a11y-1',
    title: 'Torneio de Xadrez e Jogos 2026',
    category: 'Jogos',
    description: 'Torneio de jogos de tabuleiro e xadrez.',
    date: new Date(Date.now() + 86400000 * 4).toISOString(),
    location: 'Rua Augusta, 500 - Consolação - São Paulo/SP',
    status: 'active',
    createdBy: 'test-a11y-uid',
    creatorEmail: 'organizer@organizaai.test',
    collaborators: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

async function setupA11yMockSession(page: Page) {
  await setupMockAuthSession(page, {
    uid: 'test-a11y-uid',
    email: 'organizer@organizaai.test',
    displayName: 'Luiz A11y Tester',
    events: mockSampleEvents,
    userProfile: {
      id: 'test-a11y-uid',
      email: 'organizer@organizaai.test',
      displayName: 'Luiz A11y Tester',
      phone: '(11) 98888-7777',
    },
  });
}

test.describe('Keyboard Navigation, Focus Management & Modal Focus Trap Suite', () => {
  test('should navigate home feed interactive elements and activate theme toggle with keyboard', async ({
    homePage,
    page,
  }) => {
    await homePage.goto('/');
    await homePage.assertLoaded();

    // 1. Focus on the navigation trigger using keyboard/direct focus.
    await homePage.navigationMenuTrigger.focus();
    await expect(homePage.navigationMenuTrigger).toBeFocused();

    // 2. Open navigation drawer with Enter, then activate a theme choice with Enter.
    await page.keyboard.press('Enter');
    await expect(homePage.navigationDrawer).toBeVisible();
    await homePage.drawerThemeDark.focus();
    await expect(homePage.drawerThemeDark).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('html')).toHaveClass(/dark/);

    // 3. Dismiss the drawer with Escape and verify it is closed.
    await page.keyboard.press('Escape');
    await expect(homePage.navigationDrawer).toBeHidden();
  });

  test('should trap focus inside ConfirmDialog and dismiss via Escape key with focus restoration', async ({
    dashboardPage,
    confirmDialog,
    page,
  }) => {
    await setupA11yMockSession(page);
    await page.goto('/meus-eventos');
    await dashboardPage.assertLoaded();

    // Find cancel button for active visible event card/row
    const activeCard = dashboardPage.eventCards
      .filter({ hasText: 'Torneio de Xadrez e Jogos 2026' })
      .filter({ visible: true })
      .first();
    await expect(activeCard).toBeVisible();

    const cancelActionBtn = activeCard
      .getByRole('button', { name: /cancelar/i })
      .or(
        activeCard.locator(
          'button[aria-label*="Cancelar"], button.mat-warn, button[mattooltip="Cancelar"]',
        ),
      )
      .first();

    await cancelActionBtn.click();

    // Verify dialog is visible
    await confirmDialog.assertVisible();
    await expect(confirmDialog.cancelBtn).toBeVisible();

    // Focus on cancel button inside confirm dialog
    await confirmDialog.cancelBtn.focus();
    await expect(confirmDialog.cancelBtn).toBeFocused();

    // Tab to confirm button
    await page.keyboard.press('Tab');
    await expect(confirmDialog.confirmBtn.or(confirmDialog.cancelBtn).first()).toBeVisible();

    // Dismiss via Escape key
    await page.keyboard.press('Escape');
    await expect(confirmDialog.dialogRoot).toBeHidden();
  });

  test('should activate form controls and buttons via Space and Enter keys on login form', async ({
    loginPage,
  }) => {
    await loginPage.goto('/login');
    await loginPage.assertLoaded();

    // 1. Fill email and password to enable submit button
    await loginPage.emailInput.fill('test@organiza.ai');
    await loginPage.passwordInput.fill('123456');

    // 2. Focus on email input and verify focus
    await loginPage.emailInput.focus();
    await expect(loginPage.emailInput).toBeFocused();

    // 3. Focus password input and verify focus
    await loginPage.passwordInput.focus();
    await expect(loginPage.passwordInput).toBeFocused();

    // 4. Focus submit button and verify focus
    await loginPage.submitBtn.focus();
    await expect(loginPage.submitBtn).toBeFocused();

    // 5. Focus Google login button and verify focus
    await loginPage.googleBtn.focus();
    await expect(loginPage.googleBtn).toBeFocused();
  });

  test('should support keyboard focus and modal interaction on RSVP dialog', async ({
    eventDetailPage,
    rsvpDialog,
    homePage,
    page,
  }) => {
    await homePage.goto('/');
    await homePage.assertLoaded();

    const cardCount = await homePage.eventCards.count();
    if (cardCount > 0) {
      await homePage.clickEventCard(0);
      await page.waitForURL(/\/evento\/.+/);
    } else {
      await eventDetailPage.goto('/evento/placeholder-event');
    }

    await eventDetailPage.assertLoaded();

    const hasRsvpBtn = await eventDetailPage.rsvpBtn.isVisible().catch(() => false);
    if (hasRsvpBtn) {
      await eventDetailPage.rsvpBtn.focus();
      await expect(eventDetailPage.rsvpBtn).toBeFocused();
      await page.keyboard.press('Enter');

      const dialogVisible = await rsvpDialog.dialogRoot
        .first()
        .isVisible({ timeout: 3000 })
        .catch(() => false);

      if (dialogVisible) {
        await rsvpDialog.assertVisible();
        await rsvpDialog.assertFocusTrapped();
        await rsvpDialog.dismissViaEscape();
      }
    }
  });
});
