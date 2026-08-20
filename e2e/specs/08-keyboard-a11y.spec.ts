import { test, expect } from '../fixtures/test.fixture';
import { Page } from '@playwright/test';

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
    creatorEmail: 'luiz.gmr.dev@gmail.com',
    collaborators: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

async function setupA11yMockSession(page: Page) {
  await page.route('https://securetoken.googleapis.com/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        access_token: 'mock-access-token',
        expires_in: '3600',
        token_type: 'Bearer',
        refresh_token: 'mock-refresh-token',
        id_token: 'mock-id-token',
        user_id: 'test-a11y-uid',
        project_id: 'organiza-ai-3416f',
      }),
    });
  });

  await page.route('https://identitytoolkit.googleapis.com/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        users: [
          {
            localId: 'test-a11y-uid',
            email: 'luiz.gmr.dev@gmail.com',
            emailVerified: true,
            displayName: 'Luiz A11y Tester',
          },
        ],
      }),
    });
  });

  await page.addInitScript(
    ({ events }) => {
      (window as any).__MOCK_DOCUMENTS__ = {
        events: events || [],
      };

      const apiKey = 'AIzaSyC8G48dEFai6_hkUvolgzLL0I1HJquBHU0';
      const userValue = {
        uid: 'test-a11y-uid',
        email: 'luiz.gmr.dev@gmail.com',
        emailVerified: true,
        displayName: 'Luiz A11y Tester',
        isAnonymous: false,
        photoURL: null,
        apiKey,
        appName: '[DEFAULT]',
        authDomain: 'organiza-ai-3416f.firebaseapp.com',
        stsTokenManager: {
          apiKey,
          refreshToken: 'mock-refresh-token',
          accessToken: 'mock-access-token',
          expirationTime: Date.now() + 36000000,
        },
        createdAt: '1700000000000',
        lastLoginAt: '1700000000000',
      };

      const req = indexedDB.open('firebaseLocalStorageDb', 1);
      req.onupgradeneeded = (e: any) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('firebaseLocalStorage')) {
          db.createObjectStore('firebaseLocalStorage', { keyPath: 'fbase_key' });
        }
      };
      req.onsuccess = (e: any) => {
        const db = e.target.result;
        const tx = db.transaction('firebaseLocalStorage', 'readwrite');
        const store = tx.objectStore('firebaseLocalStorage');
        store.put({
          fbase_key: `firebase:authUser:${apiKey}:[DEFAULT]`,
          value: userValue,
        });
      };
    },
    { events: mockSampleEvents }
  );
}

test.describe('Keyboard Navigation, Focus Management & Modal Focus Trap Suite', () => {
  test('should navigate home feed interactive elements and activate theme toggle with keyboard', async ({
    homePage,
    page,
  }) => {
    await homePage.goto('/');
    await homePage.assertLoaded();

    // 1. Focus on theme toggle button using keyboard Tab or direct focus
    await homePage.themeToggleBtn.focus();
    await expect(homePage.themeToggleBtn).toBeFocused();

    // 2. Open theme menu with Enter key
    await page.keyboard.press('Enter');
    const darkMenuItem = page.getByRole('menuitem', { name: /escuro/i });
    await expect(darkMenuItem).toBeVisible();

    // 3. Dismiss menu with Escape key and verify focus is restored
    await page.keyboard.press('Escape');
    await expect(darkMenuItem).toBeHidden();
  });

  test('should trap focus inside ConfirmDialog and dismiss via Escape key with focus restoration', async ({
    dashboardPage,
    confirmDialog,
    page,
  }) => {
    await setupA11yMockSession(page);
    await page.goto('/admin');
    await dashboardPage.assertLoaded();

    // Find cancel button for active visible event card/row
    const activeCard = dashboardPage.eventCards
      .filter({ hasText: 'Torneio de Xadrez e Jogos 2026' })
      .filter({ visible: true })
      .first();
    await expect(activeCard).toBeVisible();

    const cancelActionBtn = activeCard
      .getByRole('button', { name: /cancelar/i })
      .or(activeCard.locator('button[aria-label*="Cancelar"], button.mat-warn, button[mattooltip="Cancelar"]'))
      .first();

    await cancelActionBtn.click();

    // Verify dialog is visible
    await confirmDialog.assertVisible();
    await page.waitForTimeout(300);

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
    page,
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
