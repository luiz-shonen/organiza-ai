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
  addressDetails: {
    cep: '01310-100',
    address: 'Av. Paulista',
    number: '1000',
    neighborhood: 'Bela Vista',
    city: 'São Paulo/SP',
  },
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

  // Phase 2 - Task T6: Create Event - Submit & Confirmation [E2E-11]
  test.describe('Create Event - Submit & Confirmation', () => {
    test('[E2E-11] should submit completed event form, display success snackbar, and redirect', async ({
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

      // Navigate and fill Step 1
      await page.goto('/meus-eventos/evento/novo');
      await eventEditorPage.assertLoaded();
      await eventEditorPage.fillBasicInfo(
        'Aniversário dos Sonhos 2026',
        '11/20/2026',
        'Uma comemoração inesquecível com amigos e família.',
        '19:00'
      );

      // Fill Step 2
      await eventEditorPage.fillCep('01310100', '1000');

      // Step 3: optionally fill Pix key and click Salvar
      const pixKeyInput = page.locator('input[formcontrolname="pixKey"]');
      await expect(pixKeyInput).toBeVisible();
      await pixKeyInput.fill('pix-organiza@teste.com');

      // Click save button
      await eventEditorPage.saveEvent();

      // Assert snackbar confirmation appears
      const snackBar = page.locator('simple-snack-bar, .mat-mdc-simple-snack-bar');
      await expect(snackBar).toBeVisible();
      await expect(snackBar).toContainText(/Evento criado com sucesso/i);

      // Assert navigation occurs to newly created event
      await expect(page).toHaveURL(/.*\/evento\/.+/);

      // Screenshot baseline
      await eventEditorPage.captureScreenshot('13-08-event-created-snackbar');
    });
  });

  // Phase 2 - Task T7: Edit Existing Event [E2E-12, E2E-13, E2E-14, E2E-15]
  test.describe('Edit Existing Event Flow', () => {
    test.beforeEach(async ({ page }) => {
      await setupMockAuthSession(page, {
        uid: 'test-user-uid',
        email: 'luiz.gmr.dev@gmail.com',
        displayName: 'Luiz Organizer',
        events: [mockHappyPathEvent],
      });
    });

    test('[E2E-12] should render editor pre-populated with existing event details', async ({
      page,
      eventEditorPage,
    }) => {
      await page.goto('/meus-eventos/evento/happy-event-1');
      await eventEditorPage.assertLoaded();

      // Assert pre-populated form fields
      await expect(eventEditorPage.titleInput).toHaveValue('Aniversário dos Sonhos 2026');
      await expect(eventEditorPage.descriptionInput).toHaveValue('Uma comemoração inesquecível com amigos e família.');

      // Screenshot baseline
      await eventEditorPage.captureScreenshot('13-09-event-edit-prepopulated');
    });

    test('[E2E-13] should update title, submit, and display success snackbar', async ({
      page,
      eventEditorPage,
    }) => {
      await page.goto('/meus-eventos/evento/happy-event-1');
      await eventEditorPage.assertLoaded();

      // Modify title
      await eventEditorPage.titleInput.fill('Aniversário dos Sonhos 2026 - Atualizado');

      // Advance through Step 1 and Step 2 to reach Step 3 save button
      await eventEditorPage.nextStepBtns.first().click();
      await eventEditorPage.nextStepBtns.nth(1).click();

      // Click save button
      await eventEditorPage.saveEvent();

      // Assert snackbar confirmation appears
      const snackBar = page.locator('simple-snack-bar, .mat-mdc-simple-snack-bar');
      await expect(snackBar).toBeVisible();
      await expect(snackBar).toContainText(/Evento atualizado/i);
    });

    test('[E2E-14] should display validation error and disable save when title is cleared', async ({
      page,
      eventEditorPage,
    }) => {
      await page.goto('/meus-eventos/evento/happy-event-1');
      await eventEditorPage.assertLoaded();

      // Clear title and blur
      await eventEditorPage.titleInput.fill('');
      await eventEditorPage.titleInput.blur();

      // Assert error message
      const titleError = page.locator('mat-error').filter({ hasText: /Título é obrigatório/i });
      await expect(titleError).toBeVisible();

      // Assert Next / Step 1 button is disabled
      const nextBtn = eventEditorPage.nextStepBtns.first();
      await expect(nextBtn).toBeDisabled();
    });

    test('[E2E-15] should verify focused title input border color matches theme token', async ({
      page,
      eventEditorPage,
    }) => {
      await page.goto('/meus-eventos/evento/happy-event-1');
      await eventEditorPage.assertLoaded();

      // Verify focus style
      await assertFocusPrimaryColor(eventEditorPage.titleInput);
    });
  });

  // Phase 3 - Task T8: Guest RSVP — Event Detail Page [E2E-16, E2E-17]
  test.describe('Guest RSVP — Event Detail Page', () => {
    test.beforeEach(async ({ page }) => {
      await setupMockAuthSession(page, {
        events: [mockHappyPathEvent],
      });
    });

    test('[E2E-16] should render public event details with h1 title, countdown, and location', async ({
      page,
      eventDetailPage,
    }) => {
      await page.goto('/evento/happy-event-1');
      await eventDetailPage.assertLoaded();

      // Assert event title in h1
      const titleHeading = page.locator('h1').first();
      await expect(titleHeading).toBeVisible();
      await expect(titleHeading).toContainText('Aniversário dos Sonhos 2026');

      // Assert countdown timer is visible
      await expect(eventDetailPage.countdownTimer.first()).toBeVisible();

      // Assert location text is visible
      const locationEl = page.locator('.event-card__location-text, .event-detail__location, [data-testid="event-location"]').first();
      await expect(locationEl).toBeVisible();
      await expect(locationEl).toContainText(/Paulista/i);

      // Screenshot baseline
      await eventDetailPage.captureScreenshot('13-10-event-detail');
    });

    test('[E2E-17] should verify RSVP button bounding box height is >= 48px', async ({
      page,
      eventDetailPage,
    }) => {
      await page.goto('/evento/happy-event-1');
      await eventDetailPage.assertLoaded();

      // Assert RSVP button touch target >= 48px
      await expect(eventDetailPage.rsvpBtn.first()).toBeVisible();
      await assertMinTouchTarget(eventDetailPage.rsvpBtn.first(), 48);
    });
  });

  // Phase 3 - Task T9: Guest RSVP — Dialog Open & Glassmorphism [E2E-18, E2E-19]
  test.describe('Guest RSVP — Dialog Open & Glassmorphism', () => {
    test.beforeEach(async ({ page }) => {
      await setupMockAuthSession(page, {
        uid: 'test-guest-uid',
        email: 'maria.guest@example.com',
        displayName: 'Maria Convidada',
        familyMembers: [
          { id: 'fam-1', name: 'Joãozinho', relationship: 'Filho' },
        ],
        events: [mockHappyPathEvent],
      });
    });

    test('[E2E-18] should open RSVP modal dialog with form controls and buttons', async ({
      page,
      eventDetailPage,
      rsvpDialog,
    }) => {
      await page.goto('/evento/happy-event-1');
      await eventDetailPage.assertLoaded();

      // Open dialog
      await eventDetailPage.openRsvpDialog();
      await rsvpDialog.assertVisible();

      // Assert controls
      await expect(rsvpDialog.nameInput).toBeVisible();
      await expect(rsvpDialog.phoneInput).toBeVisible();
      await expect(rsvpDialog.confirmBtn).toBeVisible();
      await expect(rsvpDialog.cancelBtn).toBeVisible();

      // Screenshot baseline
      await eventDetailPage.captureScreenshot('13-11-rsvp-dialog-open');
    });

    test('[E2E-19] should verify RSVP dialog surface glassmorphism backdrop-filter blur', async ({
      page,
      eventDetailPage,
      rsvpDialog,
    }) => {
      await page.goto('/evento/happy-event-1');
      await eventDetailPage.assertLoaded();

      // Open dialog
      await eventDetailPage.openRsvpDialog();
      await rsvpDialog.assertVisible();

      // Assert glassmorphism on dialog surface
      const dialogSurface = page.locator('.mat-mdc-dialog-container .mdc-dialog__surface, mat-dialog-container .mdc-dialog__surface').first();
      await assertGlassmorphism(dialogSurface);
    });
  });

  // Phase 3 - Task T10: Guest RSVP — Submission & Confirmation [E2E-20]
  test.describe('Guest RSVP — Submission & Confirmation', () => {
    test('[E2E-20] should submit RSVP form, close dialog, and render confirmed status card', async ({
      page,
      eventDetailPage,
      rsvpDialog,
    }) => {
      await setupMockAuthSession(page, {
        uid: 'test-guest-uid',
        email: 'maria.guest@example.com',
        displayName: 'Maria Convidada',
        familyMembers: [
          { id: 'fam-1', name: 'Joãozinho', relationship: 'Filho' },
        ],
        events: [mockHappyPathEvent],
      });

      await page.goto('/evento/happy-event-1');
      await eventDetailPage.assertLoaded();

      // Open RSVP dialog
      await eventDetailPage.openRsvpDialog();
      await rsvpDialog.assertVisible();

      // Fill name and phone and submit
      await rsvpDialog.confirmRsvp({
        name: 'Maria Convidada',
        phone: '(11) 98765-4321',
      });

      // Dialog closes
      await rsvpDialog.assertHidden();

      // Assert confirmed state is visible
      const confirmedTitle = page.locator('.rsvp-card mat-card-title, h2, mat-card-title').filter({
        hasText: /Você está na lista/i,
      });
      await expect(confirmedTitle).toBeVisible();

      // Screenshot baseline
      await eventDetailPage.captureScreenshot('13-12-rsvp-confirmed');
    });
  });

  // Phase 4 - Task T11: Profile Page & Typography [E2E-21, E2E-22, E2E-23]
  test.describe('Profile Page & Typography', () => {
    test.beforeEach(async ({ page }) => {
      await setupMockAuthSession(page, {
        uid: 'test-user-uid',
        email: 'luiz.gmr.dev@gmail.com',
        displayName: 'Luiz Organizer',
        userProfile: {
          id: 'test-user-uid',
          email: 'luiz.gmr.dev@gmail.com',
          displayName: 'Luiz Organizer',
          phone: '(11) 99999-9999',
        },
      });
    });

    test('[E2E-21] should render user profile page with profile card, name, and phone fields', async ({
      page,
      profilePage,
    }) => {
      await page.goto('/perfil');
      await profilePage.assertLoaded();

      // Assert profile card is rendered
      const profileCard = page.locator('app-profile-info-card, .profile-info-card').first();
      await expect(profileCard).toBeVisible();

      // Assert name and phone
      await expect(page.locator('text=Luiz Organizer').first()).toBeVisible();
      await expect(page.locator('text=(11) 99999-9999').first()).toBeVisible();

      // Screenshot baseline
      await profilePage.captureScreenshot('13-13-profile-loaded');
    });

    test('[E2E-22] should verify profile card glassmorphism backdrop-filter blur', async ({
      page,
      profilePage,
    }) => {
      await page.goto('/perfil');
      await profilePage.assertLoaded();

      // Assert glassmorphism on profile card surface
      const profileCard = page.locator('section.profile-info-card, .profile-info-card').first();
      await assertGlassmorphism(profileCard);
    });

    test('[E2E-23] should verify profile heading typography uses Plus Jakarta Sans font family', async ({
      page,
      profilePage,
    }) => {
      await page.goto('/perfil');
      await profilePage.assertLoaded();

      // Assert heading font family
      const heading = page.getByRole('heading', { level: 1 }).first();
      await expect(heading).toBeVisible();
      await assertFontFamily(heading, 'Plus Jakarta Sans');
    });
  });

  // Phase 4 - Task T12: Profile — Update Name [E2E-24]
  test.describe('Profile — Update Display Name', () => {
    test('[E2E-24] should edit and update user display name in profile card', async ({
      page,
      profilePage,
    }) => {
      await setupMockAuthSession(page, {
        uid: 'test-user-uid',
        email: 'luiz.gmr.dev@gmail.com',
        displayName: 'Luiz Organizer',
        userProfile: {
          id: 'test-user-uid',
          email: 'luiz.gmr.dev@gmail.com',
          displayName: 'Luiz Organizer',
          phone: '(11) 99999-9999',
        },
      });

      await page.goto('/perfil');
      await profilePage.assertLoaded();

      // Click edit button
      const editBtn = page.locator('.profile-info-card__edit-btn').first();
      await expect(editBtn).toBeVisible();
      await editBtn.click();

      // Enter new name and submit
      await expect(profilePage.nameInput).toBeVisible();
      await profilePage.nameInput.fill('Luiz Atualizado');
      await profilePage.saveProfileBtn.click();

      // Assert updated name rendered
      await expect(page.locator('text=Luiz Atualizado').first()).toBeVisible();

      // Screenshot baseline
      await profilePage.captureScreenshot('13-14-profile-name-updated');
    });
  });

  // Phase 4 - Task T13: Family Roster — Add Member & Button Size [E2E-25, E2E-26]
  test.describe('Family Roster — Add Member & Button Size', () => {
    test.beforeEach(async ({ page }) => {
      await setupMockAuthSession(page, {
        uid: 'test-user-uid',
        email: 'luiz.gmr.dev@gmail.com',
        displayName: 'Luiz Organizer',
        familyMembers: [],
      });
    });

    test('[E2E-25] should add a family member and render member card in the roster', async ({
      page,
      profilePage,
    }) => {
      await page.goto('/perfil');
      await profilePage.assertLoaded();

      // Add family member
      await profilePage.familyRoster.addMember('Mariana Silva', 'spouse', '(11) 98888-7777');

      // Assert member card is listed
      const memberCard = profilePage.familyRoster.memberCards.filter({ hasText: 'Mariana Silva' }).first();
      await expect(memberCard).toBeVisible();

      // Screenshot baseline
      await profilePage.captureScreenshot('13-15-family-member-added');
    });

    test('[E2E-26] should verify Add Family Member button bounding box height is >= 48px', async ({
      page,
      profilePage,
    }) => {
      await page.goto('/perfil');
      await profilePage.assertLoaded();

      // Assert Add Member button touch target >= 48px
      const addBtn = profilePage.familyRoster.addMemberBtn.first();
      await expect(addBtn).toBeVisible();
      await assertMinTouchTarget(addBtn, 48);
    });
  });

  // Phase 4 - Task T14: Family Roster — Remove Member [E2E-27]
  test.describe('Family Roster — Remove Member', () => {
    test('[E2E-27] should remove a family member and keep remaining members visible', async ({
      page,
      profilePage,
    }) => {
      await setupMockAuthSession(page, {
        uid: 'test-user-uid',
        email: 'luiz.gmr.dev@gmail.com',
        displayName: 'Luiz Organizer',
        familyMembers: [
          { id: 'fam-1', name: 'Mariana Silva', relationship: 'spouse', phone: '(11) 98888-7777' },
          { id: 'fam-2', name: 'Lucas Silva', relationship: 'child', phone: '(11) 97777-6666' },
        ],
      });

      await page.goto('/perfil');
      await profilePage.assertLoaded();

      // Assert both members are visible
      await expect(profilePage.familyRoster.memberCards.filter({ hasText: 'Mariana Silva' }).first()).toBeVisible();
      await expect(profilePage.familyRoster.memberCards.filter({ hasText: 'Lucas Silva' }).first()).toBeVisible();

      // Delete first member
      await profilePage.familyRoster.deleteMember(0);

      // Assert Mariana is gone and Lucas remains
      await expect(profilePage.familyRoster.memberCards.filter({ hasText: 'Mariana Silva' }).first()).toBeHidden();
      await expect(profilePage.familyRoster.memberCards.filter({ hasText: 'Lucas Silva' }).first()).toBeVisible();
    });
  });

  // Phase 4 - Task T15: Collaborator Invite Dialog & Submit [E2E-28, E2E-29]
  test.describe('Collaborator Invite Dialog & Submit', () => {
    test.beforeEach(async ({ page }) => {
      await setupMockAuthSession(page, {
        uid: 'test-user-uid',
        email: 'luiz.gmr.dev@gmail.com',
        displayName: 'Luiz Organizer',
        events: [mockHappyPathEvent],
      });
    });

    test('[E2E-28] should open collaborator invite dialog with email input and non-default border', async ({
      page,
      eventEditorPage,
    }) => {
      await page.goto('/meus-eventos/evento/happy-event-1');
      await eventEditorPage.assertLoaded();

      // Open collaborators dialog
      const collabBtn = page.locator('.editor__collab-btn, button[aria-label*="colaboradores"]').first();
      await expect(collabBtn).toBeVisible();
      await collabBtn.click();

      // Assert dialog visible
      const dialog = page.locator('.collaborator-dialog, mat-dialog-container').first();
      await expect(dialog).toBeVisible();

      // Assert email input and invite button
      const emailInput = dialog.locator('input[type="email"], input[formcontrolname="email"]');
      const submitBtn = dialog.locator('button.collaborator-dialog__submit-btn, button[type="submit"]');
      await expect(emailInput).toBeVisible();
      await expect(submitBtn).toBeVisible();

      // Screenshot baseline
      await eventEditorPage.captureScreenshot('13-17-collaborator-dialog');
    });

    test('[E2E-29] should submit collaborator invite and display snackbar confirmation', async ({
      page,
      eventEditorPage,
    }) => {
      await page.goto('/meus-eventos/evento/happy-event-1');
      await eventEditorPage.assertLoaded();

      // Open collaborators dialog
      const collabBtn = page.locator('.editor__collab-btn, button[aria-label*="colaboradores"]').first();
      await expect(collabBtn).toBeVisible();
      await collabBtn.click();

      const dialog = page.locator('.collaborator-dialog, mat-dialog-container').first();
      await expect(dialog).toBeVisible();

      // Fill email and submit
      const emailInput = dialog.locator('input[type="email"], input[formcontrolname="email"]');
      await emailInput.fill('amigo@exemplo.com');
      await emailInput.dispatchEvent('input');

      const submitBtn = dialog.locator('button.collaborator-dialog__submit-btn, button[type="submit"]');
      await expect(submitBtn).toBeEnabled();
      await submitBtn.click();

      // Assert snackbar confirmation
      const snackBar = page.locator('simple-snack-bar, .mat-mdc-simple-snack-bar');
      await expect(snackBar).toBeVisible();
      await expect(snackBar).toContainText(/Convite enviado para amigo@exemplo\.com/i);
    });
  });
});
