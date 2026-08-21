import { test, expect } from '../fixtures/test.fixture';
import { setupMockAuthSession } from '../helpers/auth-mock.helper';
import {
  assertGlassmorphism,
  assertMinTouchTarget,
  assertFontFamily,
  assertFocusPrimaryColor,
} from '../helpers/design-tokens.helper';

const mockHappyPathEvent = {
  id: 'happy-event-1',
  title: 'Aniversário dos Sonhos 2026',
  category: 'Aniversário',
  description: 'Uma comemoração inesquecível com amigos e família.',
  date: new Date(Date.now() + 86400000 * 10).toISOString(),
  location: 'Av. Paulista, 1000 - Bela Vista - São Paulo/SP - CEP: 01310-100',
  pixKey: 'pix-organiza@teste.com',
  estimatedBudget: 1500,
  status: 'active',
  createdBy: 'test-user-uid',
  creatorEmail: 'luiz.gmr.dev@gmail.com',
  collaborators: [],
  items: [
    { id: 'item-1', name: 'Bolo de Chocolate', category: 'Comida', quantity: 1, claimedBy: [] },
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

test.describe('Feature 10: E2E Happy-Path Atomic Tests & Visual Baselines', () => {
  // Phase 2 - Task T2: Organizer Dashboard [E2E-01, E2E-02]
  test.describe('Organizer Dashboard Flow', () => {
    test.beforeEach(async ({ page }) => {
      await setupMockAuthSession(page, {
        uid: 'test-user-uid',
        email: 'luiz.gmr.dev@gmail.com',
        displayName: 'Luiz Organizer',
        events: [mockHappyPathEvent],
      });
    });

    test('[E2E-01] should render dashboard with filter chips, event cards, and >= 48px Novo Evento button', async ({
      page,
      dashboardPage,
    }) => {
      await page.goto('/meus-eventos');
      await dashboardPage.assertLoaded();

      // Filter chips rendered
      await expect(dashboardPage.filterChips.first()).toBeVisible();

      // At least one event card rendered
      await expect(dashboardPage.eventCards.first()).toBeVisible();
      await expect(dashboardPage.eventCards.first()).toContainText('Aniversário dos Sonhos 2026');

      // Enabled "Novo Evento" button with height >= 48px
      await expect(dashboardPage.createEventBtn).toBeVisible();
      await expect(dashboardPage.createEventBtn).toBeEnabled();
      await assertMinTouchTarget(dashboardPage.createEventBtn, 48);

      // Screenshot baseline
      await dashboardPage.captureScreenshot('13-01-dashboard');
    });

    test('[E2E-02] should verify event cards have glassmorphic backdrop-filter blur', async ({
      page,
      dashboardPage,
    }) => {
      await page.goto('/meus-eventos');
      await dashboardPage.assertLoaded();

      // Event card or glass surface has backdrop-filter blur
      const cardSurface = page.locator('.glass-card, .dashboard__table-wrapper, .dashboard__mobile-card').first();
      await assertGlassmorphism(cardSurface);
    });
  });
});
