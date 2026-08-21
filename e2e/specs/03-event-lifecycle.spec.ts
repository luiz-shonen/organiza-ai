import { test, expect } from '../fixtures/test.fixture';
import { Page } from '@playwright/test';

const mockSampleEvents = [
  {
    id: 'event-1',
    title: 'Festa Junina da Comunidade',
    category: 'Festa Junina',
    description: 'Grande celebração junina com comidas típicas e quadrilha.',
    date: new Date(Date.now() + 86400000 * 5).toISOString(),
    location: 'Rua das Flores, 123 - Centro - São Paulo/SP - CEP: 01001-000',
    status: 'active',
    createdBy: 'test-organizer-uid',
    creatorEmail: 'organizer@organizaai.test',
    collaborators: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'event-2',
    title: 'Churrasco dos Amigos',
    category: 'Churrasco',
    description: 'Churrasco no final de semana.',
    date: new Date(Date.now() - 86400000 * 2).toISOString(),
    location: 'Av. Brasil, 500 - Jardins - São Paulo/SP',
    status: 'cancelled',
    createdBy: 'test-organizer-uid',
    creatorEmail: 'organizer@organizaai.test',
    collaborators: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

async function setupMockSession(page: Page, mockEvents: any[] = mockSampleEvents) {
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
        user_id: 'test-organizer-uid',
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
            localId: 'test-organizer-uid',
            email: 'organizer@organizaai.test',
            emailVerified: true,
            displayName: 'Luiz Organizer',
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
        uid: 'test-organizer-uid',
        email: 'organizer@organizaai.test',
        emailVerified: true,
        displayName: 'Luiz Organizer',
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
    { events: mockEvents },
  );
}

test.describe('Organizer Event Lifecycle and ViaCEP Integration', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockSession(page);
  });

  test('should render dashboard filter chips and new event button', async ({
    page,
    dashboardPage,
  }) => {
    await page.goto('/meus-eventos');
    await dashboardPage.assertLoaded();

    // Verify new event button is visible and contains expected label
    await expect(dashboardPage.createEventBtn).toBeVisible();
    await expect(dashboardPage.createEventBtn).toContainText(/Novo Evento/i);

    // Verify status filter chips are visible
    await expect(dashboardPage.filterChips.first()).toBeVisible();
    await expect(dashboardPage.filterChips).toHaveCount(4);

    // Test filtering by Cancelados status
    await dashboardPage.filterByStatus('Cancelados');
    const cancelledCard = dashboardPage.eventCards
      .filter({ hasText: 'Churrasco dos Amigos' })
      .filter({ visible: true });
    await expect(cancelledCard.first()).toBeVisible();

    // Test filtering by Todos status
    await dashboardPage.filterByStatus('Todos');
    const activeCard = dashboardPage.eventCards
      .filter({ hasText: 'Festa Junina da Comunidade' })
      .filter({ visible: true });
    await expect(activeCard.first()).toBeVisible();
  });

  test('should auto-fill address fields via ViaCEP integration when typing valid 8-digit CEP', async ({
    page,
    eventEditorPage,
  }) => {
    // Intercept ViaCEP endpoint for deterministic test
    await page.route('https://viacep.com.br/ws/**/json/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          cep: '01310-100',
          logradouro: 'Avenida Paulista',
          complemento: 'de 611 a 1045 - lado ímpar',
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

    await page.goto('/meus-eventos/evento/novo');
    await eventEditorPage.assertLoaded();

    // Fill Step 1 (Basic Info) with MM/DD/YYYY format for NativeDateAdapter to unlock Step 2 (Address)
    await eventEditorPage.fillBasicInfo(
      'Festa de Integração 2026',
      '12/25/2026',
      'Comemoração de final de ano da equipe.',
      '19:00',
    );

    // Fill 8-digit CEP
    await eventEditorPage.cepInput.fill('01310100');

    // Verify ViaCEP auto-populated address, neighborhood and city
    await expect(eventEditorPage.streetInput).toHaveValue('Avenida Paulista');
    const neighborhoodInput = page.locator('input[formcontrolname="neighborhood"]');
    const cityInput = page.locator('input[formcontrolname="city"]');

    await expect(neighborhoodInput).toHaveValue('Bela Vista');
    await expect(cityInput).toHaveValue('São Paulo/SP');
  });

  test('should render event editor steps and validate required title and date', async ({
    page,
    eventEditorPage,
  }) => {
    await page.goto('/meus-eventos/evento/novo');
    await eventEditorPage.assertLoaded();

    // Verify stepper step labels are rendered
    await expect(page.locator('.mat-step-header, .mat-step-label')).toContainText([
      'Informações',
      'Endereço',
      'Pix',
    ]);

    if ((page.viewportSize()?.width ?? 0) < 600) {
      const stepProgress = page.getByTestId('event-step-progress');
      await expect(stepProgress).toBeVisible();
      await expect(stepProgress).toContainText('Etapa 1 de 3');
      await expect(stepProgress).toContainText('Informações do evento');
      await expect(stepProgress.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '1');
    }

    // Touch and blur title input without value to trigger validation
    await eventEditorPage.titleInput.focus();
    await eventEditorPage.titleInput.blur();
    const titleError = page.locator('mat-error').filter({ hasText: /Título é obrigatório/i });
    await expect(titleError).toBeVisible();

    // Touch and blur date input without value to trigger validation
    await eventEditorPage.dateInput.focus();
    await eventEditorPage.dateInput.blur();
    const dateError = page.locator('mat-error').filter({ hasText: /Data é obrigatória/i });
    await expect(dateError).toBeVisible();

    // Next step button should remain disabled when form is invalid
    const nextBtn = page.locator('button[matsteppernext]').first();
    await expect(nextBtn).toBeDisabled();

    // Fill required fields and verify errors clear
    await eventEditorPage.titleInput.fill('Formatura Universitária');
    await eventEditorPage.dateInput.fill('11/20/2026');

    await expect(titleError).toBeHidden();
    await expect(dateError).toBeHidden();
  });

  test('should show confirmation dialog before cancelling or deleting an event', async ({
    page,
    dashboardPage,
    confirmDialog,
  }) => {
    await page.goto('/meus-eventos');
    await dashboardPage.assertLoaded();

    // Locate the cancel button for the active event
    const activeRowOrCard = dashboardPage.eventCards
      .filter({ hasText: 'Festa Junina da Comunidade' })
      .filter({ visible: true })
      .first();
    await expect(activeRowOrCard).toBeVisible();

    const cancelActionBtn = activeRowOrCard
      .getByRole('button', { name: /cancelar/i })
      .or(
        activeRowOrCard.locator(
          'button[aria-label*="Cancelar"], button.mat-warn, button[mattooltip="Cancelar"]',
        ),
      )
      .first();

    await cancelActionBtn.click();

    // Verify confirmation dialog appears
    await confirmDialog.assertVisible();
    await expect(confirmDialog.messageText).toBeVisible();
    await expect(confirmDialog.messageText).toContainText(
      /Tem certeza que deseja cancelar o evento/i,
    );
    await expect(confirmDialog.confirmBtn).toBeVisible();
    await expect(confirmDialog.cancelBtn).toBeVisible();

    // Dismiss dialog using cancel button
    await confirmDialog.cancel();
    await expect(confirmDialog.dialogRoot).toBeHidden();

    // Re-open dialog and confirm cancellation
    await cancelActionBtn.click();
    await confirmDialog.assertVisible();
    await confirmDialog.confirm();
    await expect(confirmDialog.dialogRoot).toBeHidden();

    // Feedback snackbar confirmation
    const snackBar = page.locator('[data-testid="feedback-snackbar"]');
    await expect(snackBar).toContainText(/Evento cancelado com sucesso/i);
  });
});
