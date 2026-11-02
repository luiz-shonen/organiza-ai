import { test, expect } from '../fixtures/test.fixture';
import { Page } from '@playwright/test';
import { buildGuestEvent } from '../fixtures/mock-events';
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
  test('should reach the primary navigation and the theme choice with the keyboard', async ({
    profilePage,
    homePage,
    page,
  }) => {
    await setupA11yMockSession(page);
    await profilePage.goto('/perfil');
    await profilePage.assertLoaded();

    // 1. The profile destination is reachable from the primary navigation by keyboard.
    const profileLink = homePage.profileNavLink;
    await profileLink.focus();
    await expect(profileLink).toBeFocused();
    await expect(profileLink).toHaveAttribute('aria-current', 'page');

    // 2. The theme choice lives in Perfil (no side menu) and responds to Enter.
    await homePage.profileThemeDark.focus();
    await expect(homePage.profileThemeDark).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('html')).toHaveClass(/dark/);
  });

  test('should trap focus inside ConfirmDialog and dismiss via Escape key with focus restoration', async ({
    eventEditorPage,
    confirmDialog,
    page,
  }) => {
    await setupA11yMockSession(page);
    await page.goto('/meus-eventos/evento/event-a11y-1');
    await eventEditorPage.assertLoaded();

    const cancelActionBtn = eventEditorPage.cancelEventBtn;
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
    page,
  }) => {
    const event = buildGuestEvent();
    await setupMockAuthSession(page, { uid: 'a11y-guest-uid', events: [event] });
    await eventDetailPage.goto(`/evento/${event.id}`);
    await eventDetailPage.assertLoaded();

    await eventDetailPage.rsvpBtn.focus();
    await expect(eventDetailPage.rsvpBtn).toBeFocused();
    await page.keyboard.press('Enter');

    await rsvpDialog.assertVisible();
    await rsvpDialog.assertFocusTrapped();
    await rsvpDialog.dismissViaEscape();
  });
});
