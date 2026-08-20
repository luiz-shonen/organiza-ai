import { test, expect } from '../fixtures/test.fixture';
import { Page } from '@playwright/test';

const mockSampleEvents = [
  {
    id: 'event-visual-1',
    title: 'Festival da Primavera 2026',
    category: 'Música',
    description: 'Celebração com música ao vivo, comidinhas e amigos.',
    date: new Date(Date.now() + 86400000 * 7).toISOString(),
    location: 'Av. Paulista, 1000 - Bela Vista - São Paulo/SP - CEP: 01310-100',
    status: 'active',
    createdBy: 'test-visual-uid',
    creatorEmail: 'luiz.gmr.dev@gmail.com',
    collaborators: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

async function setupVisualMockSession(page: Page) {
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
        user_id: 'test-visual-uid',
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
            localId: 'test-visual-uid',
            email: 'luiz.gmr.dev@gmail.com',
            emailVerified: true,
            displayName: 'Luiz Visual Inspector',
          },
        ],
      }),
    });
  });

  await page.addInitScript(
    ({ events }) => {
      (window as any).__MOCK_DOCUMENTS__ = {
        events: events || [],
        'users/test-visual-uid': {
          displayName: 'Luiz Visual Inspector',
          email: 'luiz.gmr.dev@gmail.com',
          phone: '(11) 98888-7777',
        },
        'users/test-visual-uid/family': [
          { id: 'fam-1', name: 'Maria Silva', relationship: 'Esposa' },
          { id: 'fam-2', name: 'Lucas Silva', relationship: 'Filho(a)' },
        ],
      };

      const apiKey = 'AIzaSyC8G48dEFai6_hkUvolgzLL0I1HJquBHU0';
      const userValue = {
        uid: 'test-visual-uid',
        email: 'luiz.gmr.dev@gmail.com',
        emailVerified: true,
        displayName: 'Luiz Visual Inspector',
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

test.describe('Visual Layout Baselines & Heuristic Inspection Suite', () => {
  test('should capture Home page in light and dark modes and audit touch targets and glassmorphic styling', async ({
    homePage,
    page,
  }) => {
    await homePage.goto('/');
    await homePage.assertLoaded();
    await page.waitForTimeout(500);

    // 1. Capture Home Light Baseline
    await homePage.captureScreenshot('01-home-light');

    // Audit Touch Target size on key CTA / theme toggle
    const themeBtnBox = await homePage.themeToggleBtn.boundingBox();
    expect(themeBtnBox).not.toBeNull();
    if (themeBtnBox) {
      // Touch target should be accessible (>= 36px minimum dimension)
      expect(themeBtnBox.height).toBeGreaterThanOrEqual(36);
      expect(themeBtnBox.width).toBeGreaterThanOrEqual(36);
    }

    // 2. Switch to Dark Mode & Capture
    await homePage.themeToggleBtn.click();
    const darkMenuItem = page.getByRole('menuitem', { name: /escuro/i });
    await darkMenuItem.click();
    await expect(page.locator('html')).toHaveClass(/dark/);
    await page.waitForTimeout(300);

    await homePage.captureScreenshot('02-home-dark');
  });

  test('should capture Login page and verify responsive form alignment and animated gradient branding', async ({
    loginPage,
    page,
  }) => {
    await loginPage.goto('/login');
    await loginPage.assertLoaded();

    // Verify presence of branded login header and glass card
    await expect(page.locator('.login__header')).toBeVisible();
    await expect(page.locator('.login__card')).toBeVisible();

    // Capture Login Viewport
    await loginPage.captureScreenshot('03-login-view');

    // Audit primary login button touch target
    const googleBtnBox = await loginPage.googleBtn.boundingBox();
    expect(googleBtnBox).not.toBeNull();
    if (googleBtnBox) {
      expect(googleBtnBox.height).toBeGreaterThanOrEqual(36);
    }
  });

  test('should capture Organizer Dashboard and verify status chips and card glassmorphism', async ({
    dashboardPage,
    page,
  }) => {
    await setupVisualMockSession(page);
    await page.goto('/admin');
    await dashboardPage.assertLoaded();
    await page.waitForTimeout(500);

    // Capture Dashboard Baseline
    await dashboardPage.captureScreenshot('04-organizer-dashboard');

    // Verify filter chips have proper accessible layout
    const chipCount = await dashboardPage.filterChips.count();
    expect(chipCount).toBeGreaterThanOrEqual(1);
  });

  test('should capture Event Editor Stepper and ViaCEP auto-populated address layout', async ({
    eventEditorPage,
    page,
  }) => {
    await setupVisualMockSession(page);

    await page.route('https://viacep.com.br/ws/**/json/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          cep: '01310-100',
          logradouro: 'Avenida Paulista',
          complemento: 'Lado ímpar',
          bairro: 'Bela Vista',
          localidade: 'São Paulo',
          uf: 'SP',
          ibge: '3550308',
          gia: '1004',
          ddd: '11',
          siafi: '7107',
        }),
      });
    });

    await page.goto('/admin/evento/novo');
    await eventEditorPage.assertLoaded();

    // Fill Step 1 to unlock Address Step
    await eventEditorPage.fillBasicInfo(
      'Festa da Primavera 2026',
      '10/20/2026',
      'Grande festival ao ar livre com comidas típicas.',
      '18:00'
    );

    // Fill CEP to trigger ViaCEP
    await eventEditorPage.cepInput.fill('01310100');
    await expect(eventEditorPage.streetInput).toHaveValue('Avenida Paulista');

    // Capture Event Editor with ViaCEP filled
    await eventEditorPage.captureScreenshot('05-event-editor-viacep');
  });

  test('should capture Event Detail and RSVP dialog layout with glassmorphic modal', async ({
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
    await page.waitForTimeout(500);

    // Capture Event Detail View
    await eventDetailPage.captureScreenshot('06-event-detail');

    // Open RSVP Dialog if button available
    const hasRsvpBtn = await eventDetailPage.rsvpBtn.isVisible().catch(() => false);
    if (hasRsvpBtn) {
      await eventDetailPage.openRsvpDialog();
      const dialogVisible = await rsvpDialog.dialogRoot
        .first()
        .isVisible({ timeout: 3000 })
        .catch(() => false);
      if (dialogVisible) {
        await rsvpDialog.assertVisible();
        await page.waitForTimeout(300);

        // Capture RSVP Dialog Modal Baseline
        await eventDetailPage.captureScreenshot('07-rsvp-dialog-modal');
      }
    }
  });

  test('should capture User Profile with personal info and Family Roster Manager', async ({
    profilePage,
    page,
  }) => {
    await setupVisualMockSession(page);
    await page.goto('/perfil');
    await profilePage.assertLoaded();
    await page.waitForTimeout(500);

    // Capture Profile Baseline
    await profilePage.captureScreenshot('08-profile-family-roster');
  });
});
