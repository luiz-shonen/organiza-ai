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

  // Phase 2 - Task T3: Create Event - Step 1 (Informações) [E2E-03, E2E-04]
  test.describe('Create Event - Step 1 (Informações)', () => {
    test.beforeEach(async ({ page }) => {
      await setupMockAuthSession(page, {
        uid: 'test-user-uid',
        email: 'luiz.gmr.dev@gmail.com',
        displayName: 'Luiz Organizer',
        events: [],
      });
    });

    test('[E2E-03] should render Step 1 with empty inputs and disabled Próximo button', async ({
      page,
      eventEditorPage,
    }) => {
      await page.goto('/meus-eventos/evento/novo');
      await eventEditorPage.assertLoaded();

      // Step 1 fields are visible
      await expect(eventEditorPage.titleInput).toBeVisible();
      await expect(eventEditorPage.descriptionInput).toBeVisible();
      await expect(eventEditorPage.dateInput).toBeVisible();
      await expect(eventEditorPage.timeInput).toBeVisible();

      // Próximo button is disabled initially
      const nextBtn = eventEditorPage.nextStepBtns.first();
      await expect(nextBtn).toBeVisible();
      await expect(nextBtn).toBeDisabled();

      // Screenshot baseline
      await eventEditorPage.captureScreenshot('13-02-step1-empty');
    });

    test('[E2E-04] should fill Step 1 basic info, select category chip, and enable Próximo button', async ({
      page,
      eventEditorPage,
    }) => {
      await page.goto('/meus-eventos/evento/novo');
      await eventEditorPage.assertLoaded();

      // Fill basic info
      await eventEditorPage.titleInput.fill('Aniversário dos Sonhos 2026');
      const categoryChip = page.locator('mat-chip-option').first();
      await expect(categoryChip).toBeVisible();
      await categoryChip.click();
      await eventEditorPage.descriptionInput.fill('Uma comemoração inesquecível com amigos e família.');
      await eventEditorPage.dateInput.fill('11/20/2026');
      await eventEditorPage.timeInput.fill('19:00');

      // Próximo button becomes enabled
      const nextBtn = eventEditorPage.nextStepBtns.first();
      await expect(nextBtn).toBeEnabled();

      // Screenshot baseline
      await eventEditorPage.captureScreenshot('13-03-step1-filled');
    });
  });

  // Phase 2 - Task T4: Create Event - Step 2 (Endereço / ViaCEP) [E2E-05, E2E-06]
  test.describe('Create Event - Step 2 (Endereço)', () => {
    test.beforeEach(async ({ page, eventEditorPage }) => {
      await setupMockAuthSession(page, {
        uid: 'test-user-uid',
        email: 'luiz.gmr.dev@gmail.com',
        displayName: 'Luiz Organizer',
        events: [],
      });

      // Intercept ViaCEP endpoint
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

      // Navigate and complete Step 1 to reach Step 2
      await page.goto('/meus-eventos/evento/novo');
      await eventEditorPage.assertLoaded();
      await eventEditorPage.fillBasicInfo(
        'Aniversário dos Sonhos 2026',
        '11/20/2026',
        'Uma comemoração inesquecível com amigos e família.',
        '19:00'
      );
    });

    test('[E2E-05] should render Step 2 fields with disabled Próximo button before CEP entry', async ({
      page,
      eventEditorPage,
    }) => {
      // Assert address fields are rendered
      await expect(eventEditorPage.cepInput).toBeVisible();
      await expect(eventEditorPage.streetInput).toBeVisible();
      await expect(eventEditorPage.numberInput).toBeVisible();
      const neighborhoodInput = page.locator('input[formcontrolname="neighborhood"]');
      const cityInput = page.locator('input[formcontrolname="city"]');
      await expect(neighborhoodInput).toBeVisible();
      await expect(cityInput).toBeVisible();

      // Próximo button on Step 2 is disabled initially
      const step2NextBtn = eventEditorPage.nextStepBtns.nth(1);
      await expect(step2NextBtn).toBeVisible();
      await expect(step2NextBtn).toBeDisabled();

      // Screenshot baseline
      await eventEditorPage.captureScreenshot('13-04-step2-empty');
    });

    test('[E2E-06] should auto-populate address via ViaCEP mock when typing 8-digit CEP and enable Próximo', async ({
      page,
      eventEditorPage,
    }) => {
      // Type 8-digit CEP
      await eventEditorPage.cepInput.fill('01310100');

      // Auto-populated fields check
      await expect(eventEditorPage.streetInput).toHaveValue('Avenida Paulista');
      const neighborhoodInput = page.locator('input[formcontrolname="neighborhood"]');
      const cityInput = page.locator('input[formcontrolname="city"]');
      await expect(neighborhoodInput).toHaveValue('Bela Vista');
      await expect(cityInput).toHaveValue('São Paulo/SP');

      // Fill number to complete address form
      await eventEditorPage.numberInput.fill('1000');

      // Próximo button on Step 2 becomes enabled
      const step2NextBtn = eventEditorPage.nextStepBtns.nth(1);
      await expect(step2NextBtn).toBeEnabled();

      // Screenshot baseline
      await eventEditorPage.captureScreenshot('13-05-step2-viacep');
    });
  });

  // Phase 2 - Task T5: Create Event - Step 3 (Pix & Wishlist) [E2E-07, E2E-08, E2E-09, E2E-10]
  test.describe('Create Event - Step 3 (Pix & Wishlist)', () => {
    test('[E2E-07] should display Pix key and wishlist item inputs', async ({
      page,
      eventEditorPage,
    }) => {
      await setupMockAuthSession(page, {
        uid: 'test-user-uid',
        email: 'luiz.gmr.dev@gmail.com',
        displayName: 'Luiz Organizer',
        events: [],
      });

      // Intercept ViaCEP endpoint
      await page.route('https://viacep.com.br/ws/**/json/', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            cep: '01310-100',
            logradouro: 'Avenida Paulista',
            bairro: 'Bela Vista',
            localidade: 'São Paulo',
            uf: 'SP',
          }),
        });
      });

      // Advance through Step 1 and Step 2 to reach Step 3
      await page.goto('/meus-eventos/evento/novo');
      await eventEditorPage.assertLoaded();
      await eventEditorPage.fillBasicInfo(
        'Aniversário dos Sonhos 2026',
        '11/20/2026',
        'Uma comemoração inesquecível com amigos e família.',
        '19:00'
      );
      await eventEditorPage.fillCep('01310100', '1000');

      // Assert Pix key input is visible on Step 3
      const pixKeyInput = page.locator('input[formcontrolname="pixKey"]');
      await expect(pixKeyInput).toBeVisible();

      // Screenshot baseline
      await eventEditorPage.captureScreenshot('13-06-step3-pix-empty');
    });

    test('[E2E-08] should add a wishlist item and render it in the wishlist list', async ({
      page,
      eventEditorPage,
    }) => {
      await setupMockAuthSession(page, {
        uid: 'test-user-uid',
        email: 'luiz.gmr.dev@gmail.com',
        displayName: 'Luiz Organizer',
        events: [mockHappyPathEvent],
      });

      await page.goto('/meus-eventos/evento/happy-event-1');
      await eventEditorPage.assertLoaded();

      // Add item
      await eventEditorPage.addWishlistItem('Docinhos Gourmet', 'Comida', 20);

      // Verify item rendered in list
      const itemsList = page.locator('.editor__items, ul.editor__items');
      await expect(itemsList).toBeVisible();
      await expect(itemsList).toContainText('Docinhos Gourmet');
    });

    test('[E2E-09] should add a second wishlist item and display both simultaneously', async ({
      page,
      eventEditorPage,
    }) => {
      await setupMockAuthSession(page, {
        uid: 'test-user-uid',
        email: 'luiz.gmr.dev@gmail.com',
        displayName: 'Luiz Organizer',
        events: [mockHappyPathEvent],
      });

      await page.goto('/meus-eventos/evento/happy-event-1');
      await eventEditorPage.assertLoaded();

      // Existing item 'Bolo de Chocolate' is visible
      const itemsList = page.locator('.editor__items, ul.editor__items');
      await expect(itemsList).toContainText('Bolo de Chocolate');

      // Add second item
      await eventEditorPage.addWishlistItem('Refrigerante 2L', 'Bebida', 5);

      // Verify both items are visible simultaneously
      await expect(itemsList).toContainText('Bolo de Chocolate');
      await expect(itemsList).toContainText('Refrigerante 2L');

      // Screenshot baseline
      await eventEditorPage.captureScreenshot('13-07-step3-wishlist-items');
    });

    test('[E2E-10] should remove a wishlist item and keep remaining items visible', async ({
      page,
      eventEditorPage,
    }) => {
      const eventWithTwoItems = {
        ...mockHappyPathEvent,
        items: [
          { id: 'item-1', name: 'Bolo de Chocolate', category: 'Comida', quantity: 1, claimedBy: [] },
          { id: 'item-2', name: 'Refrigerante 2L', category: 'Bebida', quantity: 5, claimedBy: [] },
        ],
      };

      await setupMockAuthSession(page, {
        uid: 'test-user-uid',
        email: 'luiz.gmr.dev@gmail.com',
        displayName: 'Luiz Organizer',
        events: [eventWithTwoItems],
      });

      await page.goto('/meus-eventos/evento/happy-event-1');
      await eventEditorPage.assertLoaded();

      const itemsList = page.locator('.editor__items, ul.editor__items');
      await expect(itemsList).toContainText('Bolo de Chocolate');
      await expect(itemsList).toContainText('Refrigerante 2L');

      // Delete first item
      const removeBtn = page.locator('button[aria-label="Remover Bolo de Chocolate"]').or(
        page.locator('.editor__item button').first()
      );
      await removeBtn.click();

      // Verify removed item is gone, remaining item still present
      await expect(itemsList).not.toContainText('Bolo de Chocolate');
      await expect(itemsList).toContainText('Refrigerante 2L');
    });
  });
});
