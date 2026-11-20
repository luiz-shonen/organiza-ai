import { test, expect } from '../../fixtures/test.fixture';
import { setupMockAuthSession } from '../../helpers/auth-mock.helper';

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
    await expect(dashboardPage.filterChips).toHaveCount(5);

    // Test filtering by Cancelados status
    await dashboardPage.filterByStatus('Cancelados');
    const cancelledCard = dashboardPage.eventCards
      .filter({ hasText: 'Churrasco dos Amigos' })
      .filter({ visible: true });
    await expect(cancelledCard.first()).toBeVisible();

    // Five days away: "Em breve"
    await dashboardPage.filterByStatus('Em breve');
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
      '25/12/2026',
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

  test('a rural CEP opens the street to type, with "Sem número", complement and directions', async ({
    page,
    eventEditorPage,
  }) => {
    // A rural CEP: ViaCEP knows only the city.
    await page.route('https://viacep.com.br/ws/**/json/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          cep: '35830-000',
          logradouro: '',
          complemento: '',
          bairro: '',
          localidade: 'Jaboticatubas',
          uf: 'MG',
        }),
      });
    });
    await page.goto('/meus-eventos/evento/novo');
    await eventEditorPage.assertLoaded();
    await eventEditorPage.fillBasicInfo(
      'Churrasco no sítio',
      '25/12/2026',
      'Churrasco de fim de ano na roça.',
      '12:00',
    );

    const city = page.getByTestId('event-city-input');
    const street = page.getByTestId('event-street-input');
    // Before the CEP, nothing can be typed in the address.
    await expect(street).not.toBeEditable();
    await eventEditorPage.cepInput.fill('35830000');
    await expect(city).toHaveValue('Jaboticatubas/MG');
    await expect(city).not.toBeEditable();
    await expect(city).toHaveCSS('cursor', 'not-allowed');
    await expect(street).toBeEditable();
    await expect(page.getByTestId('event-address-partial')).toContainText(
      'O CEP não trouxe o endereço completo',
    );

    await street.fill('Estrada da Serra do Cipó');
    await page.getByTestId('event-neighborhood-input').fill('Zona rural');
    await page.getByTestId('event-no-number').locator('input').check();
    await expect(eventEditorPage.numberInput).toHaveValue('S/N');
    await expect(eventEditorPage.numberInput).toBeDisabled();
    await page.getByTestId('event-complement-input').fill('Km 12, sítio Boa Vista');
    await page
      .getByTestId('event-directions-input')
      .fill('Depois da ponte, entre na estrada de terra à direita. Portão azul.');
    await page
      .getByTestId('event-editor-step-2')
      .screenshot({ path: 'e2e/screenshots/address-rural.png' });
    // Endereço, Itens and Amigo oculto, then save on Pix.
    await eventEditorPage.advanceStep();
    await eventEditorPage.advanceStep();
    await eventEditorPage.advanceStep();
    await eventEditorPage.saveEvent();
    // A new event opens its share screen.
    await expect(page).toHaveURL(/\/meus-eventos\/evento\/[^/]+$/);
    const saved = await page.evaluate(() =>
      (
        window as unknown as {
          __MOCK_DOCUMENTS__: Record<string, { id: string; title?: string }[]>;
        }
      ).__MOCK_DOCUMENTS__['events'].find((event) => event.title === 'Churrasco no sítio'),
    );
    expect(saved).toMatchObject({
      location: 'Estrada da Serra do Cipó, S/N - Zona rural - Jaboticatubas/MG - CEP: 35830-000',
      addressDetails: {
        cep: '35830-000',
        address: 'Estrada da Serra do Cipó',
        number: 'S/N',
        neighborhood: 'Zona rural',
        city: 'Jaboticatubas/MG',
        complement: 'Km 12, sítio Boa Vista',
        directions: 'Depois da ponte, entre na estrada de terra à direita. Portão azul.',
      },
    });
  });

  test('the invite shows a rural address with its complement, and how to get there', async ({
    page,
  }) => {
    const rural = {
      ...mockSampleEvents[0],
      id: 'event-rural',
      title: 'Churrasco no sítio',
      location: 'Estrada da Serra do Cipó, S/N - Jaboticatubas/MG - CEP: 35830-000',
      addressDetails: {
        cep: '35830-000',
        address: 'Estrada da Serra do Cipó',
        number: 'S/N',
        neighborhood: '',
        city: 'Jaboticatubas/MG',
        complement: 'Km 12, sítio Boa Vista',
        directions: 'Depois da ponte, entre na estrada de terra à direita.\nPortão azul.',
      },
    };
    await setupMockAuthSession(page, {
      uid: 'test-organizer-uid',
      email: 'organizer@organizaai.test',
      displayName: 'Luiz Organizer',
      events: [rural],
    });
    await page.goto('/evento/event-rural');

    const location = page.getByTestId('event-location');
    await expect(location).toContainText('Estrada da Serra do Cipó, S/N, Km 12, sítio Boa Vista');
    await expect(location).toContainText('Jaboticatubas/MG · 35830-000');
    const directions = page.getByTestId('event-directions');
    await expect(directions).toContainText('Como chegar');
    await expect(directions).toContainText('Portão azul.');
    await page
      .locator('app-event-card org-surface')
      .filter({ has: location })
      .screenshot({ path: 'e2e/screenshots/address-rural-invite.png' });
  });

  test('an event over several days: an optional end date, never before the start', async ({
    page,
    eventEditorPage,
  }) => {
    await page.route('https://viacep.com.br/ws/**/json/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          cep: '30514-160',
          logradouro: 'Rua Dom Lara',
          bairro: 'Vista Alegre',
          localidade: 'Belo Horizonte',
          uf: 'MG',
        }),
      });
    });
    await page.goto('/meus-eventos/evento/novo');
    await eventEditorPage.assertLoaded();

    await eventEditorPage.titleInput.fill('Retiro de fim de ano');
    await page.locator('[data-testid="category-options"] org-chip').first().click();
    await eventEditorPage.dateInput.fill('23/12/2026');
    await eventEditorPage.timeInput.fill('17:00');
    const endDate = page.getByTestId('event-end-date-input');
    await endDate.fill('20/12/2026');
    await endDate.blur();
    await expect(page.getByText('O término não pode ser antes do início')).toBeVisible();
    await eventEditorPage.advanceStep();
    await expect(eventEditorPage.missingFieldsBanner).toContainText(
      'escolha um término no dia do início ou depois',
    );

    await endDate.fill('25/12/2026');
    await expect(page.getByText('O término não pode ser antes do início')).toBeHidden();
    await page
      .getByTestId('event-editor-step-1')
      .locator('.event-step__row--dates')
      .screenshot({ path: 'e2e/screenshots/event-end-date.png' });
    await eventEditorPage.advanceStep();

    await eventEditorPage.cepInput.fill('30514160');
    await expect(eventEditorPage.streetInput).toHaveValue('Rua Dom Lara');
    await eventEditorPage.numberInput.fill('135');
    await eventEditorPage.advanceStep();
    await eventEditorPage.advanceStep();
    await eventEditorPage.advanceStep();
    await eventEditorPage.saveEvent();
    await expect(page).toHaveURL(/\/meus-eventos\/evento\/[^/]+$/);
    const saved = await page.evaluate(() =>
      (
        window as unknown as {
          __MOCK_DOCUMENTS__: Record<string, { id: string; title?: string }[]>;
        }
      ).__MOCK_DOCUMENTS__['events'].find((event) => event.title === 'Retiro de fim de ano'),
    );
    expect(saved).toMatchObject({ endDate: '2026-12-25' });
  });

  test('the invite and Meus eventos show the days of an event over several days', async ({
    page,
  }) => {
    const retreat = {
      ...mockSampleEvents[0],
      id: 'event-retreat',
      title: 'Retiro de fim de ano',
      date: new Date(2026, 11, 23, 17, 0).toISOString(),
      endDate: '2026-12-25',
    };
    await setupMockAuthSession(page, {
      uid: 'test-organizer-uid',
      email: 'organizer@organizaai.test',
      displayName: 'Luiz Organizer',
      events: [retreat],
    });
    await page.goto('/evento/event-retreat');
    const box = page.locator('.event-card__date-box');
    await expect(box).toContainText('23–25');
    await expect(box).toContainText('Quarta a sexta');
    await expect(page.getByTestId('countdown-timer')).toContainText(
      'De 23 a 25 de dezembro · 17:00',
    );
    await page
      .locator('app-event-card header')
      .first()
      .screenshot({ path: 'e2e/screenshots/event-end-date-invite.png' });

    await page.goto('/meus-eventos');
    await expect(page.locator('org-date-badge').first()).toContainText('23–25');
  });

  test('a reload keeps what was being typed, until it is saved or discarded', async ({
    page,
    eventEditorPage,
  }) => {
    await page.goto('/meus-eventos/evento/novo');
    await eventEditorPage.assertLoaded();
    await eventEditorPage.titleInput.fill('Natal da família');
    await eventEditorPage.descriptionInput.fill('Amigo oculto e ceia');
    await eventEditorPage.dateInput.fill('24/12/2026');

    await page.reload();
    await eventEditorPage.assertLoaded();
    const banner = page.getByTestId('editor-draft-restored');
    await expect(banner).toContainText('Recuperamos o que você estava preenchendo');
    await expect(eventEditorPage.titleInput).toHaveValue('Natal da família');
    await expect(eventEditorPage.descriptionInput).toHaveValue('Amigo oculto e ceia');
    await expect(eventEditorPage.dateInput).toHaveValue('24/12/2026');
    await page.getByTestId('editor-draft-restored').screenshot({
      path: 'e2e/screenshots/editor-draft-restored.png',
    });

    await expect(banner).toContainText('Salve para não perder.');
    // "Desfazer" (an icon alone on a phone) goes back to the empty form.
    await banner
      .locator('[data-testid="org-banner-action"], [data-testid="org-banner-action-phone"]')
      .filter({ visible: true })
      .click();
    await expect(banner).toBeHidden();
    await expect(eventEditorPage.titleInput).toHaveValue('');
    await page.reload();
    await eventEditorPage.assertLoaded();
    await expect(eventEditorPage.titleInput).toHaveValue('');
    await expect(page.getByTestId('editor-draft-restored')).toBeHidden();
  });

  test('a reload opens the step the organizer was on', async ({ page, eventEditorPage }) => {
    await page.goto('/meus-eventos/evento/event-1');
    await eventEditorPage.openStep('Amigo oculto');
    await page.reload();
    // The phone header names the step; wider screens the selected numbered header.
    await expect(
      page
        .locator('.org-stepper__name, .mat-step-header[aria-selected="true"]')
        .filter({ visible: true }),
    ).toContainText('Amigo oculto');
    await expect(page.getByTestId('event-editor-step-secret-santa')).toBeVisible();
  });

  test('editing an event, a reload keeps the change until it is saved', async ({
    page,
    eventEditorPage,
  }) => {
    await page.goto('/meus-eventos/evento/event-1');
    await expect(eventEditorPage.titleInput).toHaveValue('Festa Junina da Comunidade');
    await expect(page.getByTestId('editor-draft-restored')).toBeHidden();
    await eventEditorPage.titleInput.fill('Festa Junina 2026');

    await page.reload();
    await expect(eventEditorPage.titleInput).toHaveValue('Festa Junina 2026');
    await expect(page.getByTestId('editor-draft-restored')).toBeVisible();
    // The ✕ only hides the notice: what was brought back stays.
    await page.getByTestId('editor-draft-restored').getByTestId('org-banner-dismiss').click();
    await expect(page.getByTestId('editor-draft-restored')).toBeHidden();
    await expect(eventEditorPage.titleInput).toHaveValue('Festa Junina 2026');

    await eventEditorPage.saveEvent();
    await expect(page).toHaveURL(/\/meus-eventos$/);
    await page.goto('/meus-eventos/evento/event-1');
    // The mock store starts over on navigation; what matters is that no draft is offered.
    await expect(eventEditorPage.titleInput).toHaveValue('Festa Junina da Comunidade');
    await expect(page.getByTestId('editor-draft-restored')).toBeHidden();
  });

  test.describe('below 600px', () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test('the stepper says "Etapa 1 de 5", the whole step name, and a bar per step', async ({
      page,
      eventEditorPage,
    }) => {
      await page.goto('/meus-eventos/evento/novo');
      await eventEditorPage.assertLoaded();

      const header = page.getByTestId('stepper-phone');
      await expect(header).toContainText('Etapa 1 de 5');
      await expect(header).toContainText('Informações');
      await expect(header.locator('.org-stepper__bar')).toHaveCount(5);
      await expect(page.locator('.mat-horizontal-stepper-header-container')).toBeHidden();
      // A step not reached yet stays shut in a new event.
      await header.getByRole('button', { name: 'Etapa 5: Pix' }).click();
      await expect(header).toContainText('Etapa 1 de 5');
      await header.screenshot({ path: 'e2e/screenshots/stepper-phone.png' });
    });

    test('editing, a bar opens its step', async ({ page }) => {
      await page.goto('/meus-eventos/evento/event-1');
      const header = page.getByTestId('stepper-phone');
      await header.getByRole('button', { name: 'Etapa 4: Amigo oculto' }).click();
      await expect(header).toContainText('Etapa 4 de 5');
      await expect(header).toContainText('Amigo oculto');
    });
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
    ).toContainText(['Informações', 'Endereço', 'Itens', 'Amigo oculto', 'Pix']);

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

    // Próximo does not move on while the form is invalid: it lists what is missing
    await eventEditorPage.nextStepBtns.filter({ visible: true }).first().click();
    await expect(eventEditorPage.missingFieldsBanner).toContainText('Para continuar, preencha');
    await expect(eventEditorPage.missingFieldsBanner).toContainText('a data');
    await expect(eventEditorPage.titleInput).toBeFocused();

    // Fill required fields and verify errors clear
    await eventEditorPage.titleInput.fill('Formatura Universitária');
    await eventEditorPage.dateInput.fill('20/11/2026');

    await expect(titleError).toBeHidden();
    await expect(dateError).toBeHidden();
  });

  test('should show confirmation dialog before cancelling an event', async ({
    page,
    eventEditorPage,
    confirmDialog,
  }) => {
    // Cancelling lives in the editor; the event cards only share and open the event.
    await page.goto('/meus-eventos/evento/event-1');
    await eventEditorPage.assertLoaded();

    const cancelActionBtn = eventEditorPage.cancelEventBtn;
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

  test('should render every category chip and keep a single selection in editor', async ({
    page,
    eventEditorPage,
  }) => {
    await page.goto('/meus-eventos/evento/novo');
    await eventEditorPage.assertLoaded();

    // 14 ready-made categories, plus Personalizar typed in place
    await expect(eventEditorPage.categoryChips).toHaveCount(14);
    await expect(page.getByTestId('custom-category-chip')).toContainText('Personalizar');

    const categoryLabels = [
      'Aniversário',
      'Casamento',
      'Natal',
      'Ano Novo',
      'Páscoa',
      'Festa Junina',
      'Churrasco',
      'Happy Hour',
      'Confraternização',
      'Formatura',
      'Chá de bebê',
      'Chá de panela',
      'Batizado',
      'Reunião de família',
    ];
    for (const label of categoryLabels) {
      await expect(eventEditorPage.categoryChips.filter({ hasText: label })).toBeVisible();
    }

    // Select Churrasco chip
    const churrascoChip = eventEditorPage.categoryChips.filter({ hasText: 'Churrasco' });
    await churrascoChip.click();
    await expect(churrascoChip.locator('mat-chip-option')).toHaveClass(/mat-mdc-chip-selected/);

    // Select Festa Junina chip
    const festaChip = eventEditorPage.categoryChips.filter({ hasText: 'Festa Junina' });
    await festaChip.click();
    await expect(festaChip.locator('mat-chip-option')).toHaveClass(/mat-mdc-chip-selected/);
    await expect(churrascoChip.locator('mat-chip-option')).not.toHaveClass(/mat-mdc-chip-selected/);

    // Personalizar is typed in place: Enter commits, Escape keeps the previous text
    const customChip = page.getByTestId('custom-category-chip');
    // Material opens the edit input on the next frame; type once it has the focus.
    const editInput = customChip.locator('[contenteditable]');
    await customChip.click();
    await expect(editInput).toBeFocused();
    await page.keyboard.type('Chá revelação');
    await page.keyboard.press('Enter');
    await expect(customChip).toContainText('Chá revelação');
    await expect(festaChip.locator('mat-chip-option')).not.toHaveClass(/mat-mdc-chip-selected/);

    await customChip.dblclick();
    await expect(editInput).toBeFocused();
    await page.keyboard.press('Control+A');
    await page.keyboard.type('Outra coisa');
    await page.keyboard.press('Escape');
    await expect(customChip).toContainText('Chá revelação');

    await customChip.dblclick();
    await expect(editInput).toBeFocused();
    await page.keyboard.press('Control+A');
    await page.keyboard.type('<b>');
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('event-editor-step-1')).toContainText('Não use os caracteres');

    // A preset again puts the chip back to Personalizar
    await festaChip.click();
    await expect(customChip).toContainText('Personalizar');
  });
});
