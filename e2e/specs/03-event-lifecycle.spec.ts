import { test, expect } from '../fixtures/test.fixture';
import { setupMockAuthSession } from '../helpers/auth-mock.helper';

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

test.describe('Organizer Event Lifecycle and ViaCEP Integration', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockAuthSession(page, {
      uid: 'test-organizer-uid',
      email: 'organizer@organizaai.test',
      displayName: 'Luiz Organizer',
      events: mockSampleEvents,
    });
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

    // Test filtering by Ativos status
    await dashboardPage.filterByStatus('Ativos');
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

    // Fill Step 1 (Basic Info) to unlock Step 2 (Address)
    await eventEditorPage.fillBasicInfo(
      'Festa de Integração 2026',
      '12/25/2026',
      'Comemoração de final de ano da equipe.',
      '19:00',
    );

    // Fill 8-digit CEP
    await eventEditorPage.cepInput.fill('01310100');

    // Assert auto-populated address fields
    await expect(eventEditorPage.streetInput).toHaveValue(/Avenida Paulista/i, {
      timeout: 5000,
    });

    // Fill number to complete address form
    await eventEditorPage.numberInput.fill('1000');
    await expect(eventEditorPage.nextStepBtns.filter({ visible: true }).first()).toBeEnabled();
  });

  test('should render event editor steps and validate required title and date', async ({
    page,
    eventEditorPage,
  }) => {
    await page.goto('/meus-eventos/evento/novo');
    await eventEditorPage.assertLoaded();

    // Verify stepper step labels are rendered
    await expect(
      page.locator('.mat-step-header, .mat-step-label, .editor__step-progress-title, org-step'),
    ).toContainText(['Informações', 'Endereço', 'Pix']);

    if ((page.viewportSize()?.width ?? 0) < 600) {
      const stepProgress = page.getByTestId('event-step-progress');
      if (await stepProgress.isVisible()) {
        await expect(stepProgress).toContainText('Etapa 1 de 3');
      }
    }

    // Touch and blur title input without value to trigger validation
    await eventEditorPage.titleInput.focus();
    await eventEditorPage.titleInput.blur();
    const titleError = page
      .locator('mat-error, .org-text-field__error')
      .filter({ hasText: /Título é obrigatório/i })
      .first();
    await expect(titleError).toBeVisible();

    // Touch and blur date input without value to trigger validation
    await eventEditorPage.dateInput.focus();
    await eventEditorPage.dateInput.blur();
    const dateError = page
      .locator('mat-error, .org-date-field__error, .org-text-field__error, [role="alert"]')
      .filter({ hasText: /Data é obrigatória/i })
      .first();
    await expect(dateError).toBeVisible();

    // Next step button should remain disabled when form is invalid
    await expect(eventEditorPage.nextStepBtns.filter({ visible: true }).first()).toBeDisabled();

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
          'org-icon-button[icon="block"] button, button[aria-label*="Cancelar"], button.mat-warn, button[mattooltip="Cancelar"]',
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
    const snackBar = page
      .locator(
        '[data-testid="feedback-snackbar"], .mdc-snackbar, .mat-mdc-snack-bar-container, [role="status"]',
      )
      .first();
    await expect(snackBar).toContainText(/Evento cancelado com sucesso/i);
  });
});
