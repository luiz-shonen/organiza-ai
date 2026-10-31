import { test, expect } from '../fixtures/test.fixture';
import { Page } from '@playwright/test';
import { assertNoHorizontalOverflow, assertMinTouchTarget } from '../helpers/design-tokens.helper';
import { buildGuestEvent } from '../fixtures/mock-events';
import { mockFirestoreDocuments, setupMockAuthSession } from '../helpers/auth-mock.helper';

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
  await setupMockAuthSession(page, {
    uid: 'test-visual-uid',
    email: 'luiz.gmr.dev@gmail.com',
    displayName: 'Luiz Visual Inspector',
    events: mockSampleEvents,
    userProfile: {
      id: 'test-visual-uid',
      displayName: 'Luiz Visual Inspector',
      email: 'luiz.gmr.dev@gmail.com',
      phone: '(11) 98888-7777',
    },
    familyMembers: [
      { id: 'fam-1', name: 'Maria Silva', relationship: 'Esposa' },
      { id: 'fam-2', name: 'Lucas Silva', relationship: 'Filho(a)' },
    ],
  });
}

const VISUAL_THEMES = ['light', 'dark'] as const;

/** Expected `<html>` class list per theme: dark mode adds `dark`, light mode must not. */
const THEME_ROOT_CLASS: Record<(typeof VISUAL_THEMES)[number], RegExp> = {
  light: /^(?!.*\bdark\b)/,
  dark: /\bdark\b/,
};

test.describe('Visual Layout Baselines & Heuristic Inspection Suite', () => {
  for (const visualTheme of VISUAL_THEMES) {
    test.describe(`${visualTheme} theme`, () => {
      test.beforeEach(async ({ page }) => {
        await page.addInitScript((theme) => localStorage.setItem('theme_mode', theme), visualTheme);
      });

      test('should capture Home page in the configured theme and audit glassmorphic styling', async ({
        homePage,
        page,
      }) => {
        await mockFirestoreDocuments(page, { events: mockSampleEvents });
        await homePage.goto('/');
        await homePage.assertLoaded();

        await assertNoHorizontalOverflow(page);
        await expect(page.locator('html')).toHaveClass(THEME_ROOT_CLASS[visualTheme]);

        await homePage.captureScreenshot('01-home');
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

        // Verify zero horizontal overflow on Login
        await assertNoHorizontalOverflow(page);

        // Audit primary login button touch target
        await assertMinTouchTarget(loginPage.googleBtn, 48);

        // Capture Login Viewport
        await loginPage.captureScreenshot('03-login-view');
      });

      test('should capture Organizer Dashboard and verify status chips and card glassmorphism', async ({
        dashboardPage,
        page,
      }) => {
        await setupVisualMockSession(page);
        await page.goto('/meus-eventos');
        await dashboardPage.assertLoaded();

        // Verify zero horizontal overflow on Dashboard
        await assertNoHorizontalOverflow(page);

        // Audit "Novo Evento" touch target
        await assertMinTouchTarget(dashboardPage.createEventBtn, 48);

        // Verify filter chips have proper accessible layout and touch target
        await expect(dashboardPage.filterChips.first()).toBeVisible();
        await assertMinTouchTarget(dashboardPage.filterChips.first(), 48);

        // Capture Dashboard Baseline
        await dashboardPage.captureScreenshot('04-organizer-dashboard');
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

        await page.goto('/meus-eventos/evento/novo');
        await eventEditorPage.assertLoaded();

        // Verify zero horizontal overflow on Step 1
        await assertNoHorizontalOverflow(page);

        // Fill Step 1 to unlock Address Step
        await eventEditorPage.fillBasicInfo(
          'Festa da Primavera 2026',
          '10/20/2026',
          'Grande festival ao ar livre com comidas típicas.',
          '18:00',
        );

        // Fill CEP to trigger ViaCEP
        await eventEditorPage.cepInput.fill('01310100');
        await expect(eventEditorPage.streetInput).toHaveValue('Avenida Paulista');

        // Verify zero horizontal overflow on Step 2
        await assertNoHorizontalOverflow(page);

        // Capture Event Editor with ViaCEP filled
        await eventEditorPage.captureScreenshot('05-event-editor-viacep');
      });

      test('should capture Event Detail and RSVP dialog layout with glassmorphic modal', async ({
        eventDetailPage,
        rsvpDialog,
        page,
      }) => {
        const event = buildGuestEvent();
        await setupMockAuthSession(page, { uid: 'visual-guest-uid', events: [event] });
        await eventDetailPage.goto(`/evento/${event.id}`);
        await eventDetailPage.assertLoaded();

        // Verify zero horizontal overflow on Event Detail
        await assertNoHorizontalOverflow(page);

        // Capture Event Detail View
        await eventDetailPage.captureScreenshot('06-event-detail');

        await eventDetailPage.openRsvpDialog();
        await rsvpDialog.assertVisible();
        await assertNoHorizontalOverflow(page);
        await eventDetailPage.captureScreenshot('07-rsvp-dialog-modal');
      });

      test('should capture User Profile with personal info and Family Roster Manager', async ({
        profilePage,
        page,
      }) => {
        await setupVisualMockSession(page);
        await page.goto('/perfil');
        await profilePage.assertLoaded();

        // Verify zero horizontal overflow on Profile
        await assertNoHorizontalOverflow(page);

        // Audit "Adicionar Familiar" touch target
        await assertMinTouchTarget(profilePage.familyRoster.addMemberBtn, 48);

        // Capture Profile Baseline
        await profilePage.captureScreenshot('08-profile-family-roster');
      });
    });
  }
});
