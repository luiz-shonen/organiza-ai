import { test, expect } from '../fixtures/test.fixture';
import { buildGuestEvent } from '../fixtures/mock-events';
import { mockFirestoreDocuments, setupMockAuthSession } from '../helpers/auth-mock.helper';
import {
  assertNoHorizontalOverflow,
  assertSingleSurfaceRing,
} from '../helpers/design-tokens.helper';

test.describe('Home Theming, Feed and Accessibility', () => {
  test('should render home landmark region and navigable event cards', async ({
    homePage,
    page,
  }) => {
    await mockFirestoreDocuments(page, { events: [buildGuestEvent()] });
    await homePage.goto('/');
    await homePage.assertLoaded();

    await expect(homePage.pageRoot).toBeVisible();
    await expect(homePage.pageRoot).toHaveAttribute('aria-label', 'Eventos disponíveis');
    await expect(page.getByRole('heading', { level: 1, name: /eventos/i })).toBeVisible();

    // The card title is the link to the event; "Ver detalhes" repeats it in the footer.
    const firstCard = homePage.eventCards.first();
    await expect(firstCard).toBeVisible();
    await expect(firstCard.getByTestId('event-card-link')).toHaveAttribute('href', /\/evento\//);
    await expect(firstCard.getByTestId('event-details-link')).toBeVisible();
    await assertSingleSurfaceRing(firstCard);
    await assertNoHorizontalOverflow(page);

    await homePage.clickEventCard(0);
    await expect(page).toHaveURL(/\/evento\/.+/);
  });

  test('should render the empty state when there are no events', async ({ homePage, page }) => {
    await mockFirestoreDocuments(page, { events: [] });
    await homePage.goto('/');
    await homePage.assertLoaded();

    await expect(homePage.emptyState).toBeVisible();
    await assertSingleSurfaceRing(homePage.emptyState.locator('.org-surface'));
    await assertNoHorizontalOverflow(page);
  });

  test('should offer visitors an Entrar button instead of a hamburger menu', async ({
    homePage,
    page,
  }) => {
    await homePage.goto('/');
    await homePage.assertLoaded();

    await expect(homePage.headerLoginBtn).toBeVisible();
    await expect(homePage.headerLoginBtn).toHaveAccessibleName(/Entrar/);
    await expect(page.getByRole('button', { name: 'Abrir menu de navegação' })).toHaveCount(0);
    await expect(homePage.bottomNav).toHaveCount(0);
  });

  test('should toggle dark and light themes and persist in localStorage', async ({
    homePage,
    profilePage,
    page,
  }) => {
    await setupMockAuthSession(page);
    await profilePage.goto('/perfil');
    await profilePage.assertLoaded();

    // Theme choices live in Perfil → Preferências; there is no side menu anymore.
    // 1. Switch to Dark theme
    await expect(homePage.profileThemeDark).toBeVisible();
    await homePage.profileThemeDark.click();

    // Assert DOM class and localStorage persistence
    await expect(page.locator('html')).toHaveClass(/dark/);
    const darkStorageValue = await page.evaluate(() => localStorage.getItem('theme_mode'));
    expect(darkStorageValue).toBe('dark');

    // 2. Switch to Light theme
    await expect(homePage.profileThemeLight).toBeVisible();
    await homePage.profileThemeLight.click();

    // Assert DOM class removed and localStorage updated
    await expect(page.locator('html')).not.toHaveClass(/dark/);
    const lightStorageValue = await page.evaluate(() => localStorage.getItem('theme_mode'));
    expect(lightStorageValue).toBe('light');

    // 3. Verify persistence across page reload
    await page.reload();
    await profilePage.assertLoaded();
    await expect(page.locator('html')).not.toHaveClass(/dark/);
    const persistedValue = await page.evaluate(() => localStorage.getItem('theme_mode'));
    expect(persistedValue).toBe('light');
  });

  test('should render seasonal overlay or themed decorations when enabled', async ({
    homePage,
    page,
  }) => {
    // Mock system date to Christmas season BEFORE navigation
    await page.clock.setFixedTime(new Date('2026-12-25T12:00:00.000Z'));

    await homePage.goto('/');
    await homePage.assertLoaded();

    // Verify seasonal overlay container is rendered with natal theme
    await expect(homePage.seasonalOverlay).toBeVisible();
    await expect(homePage.seasonalOverlay).toHaveAttribute('data-theme', 'natal');

    // Verify Christmas decorative elements
    await expect(page.locator('.seasonal-overlay__natal')).toBeVisible();

    // Mock system date to Festa Junina season
    await page.clock.setFixedTime(new Date('2026-06-15T12:00:00.000Z'));
    await page.reload();
    await homePage.assertLoaded();

    // Verify seasonal overlay switches to junina theme
    await expect(homePage.seasonalOverlay).toBeVisible();
    await expect(homePage.seasonalOverlay).toHaveAttribute('data-theme', 'junina');
    await expect(page.locator('.seasonal-overlay__junina')).toBeVisible();
  });

  test('should have zero axe-core WCAG 2.1 AA accessibility violations on home view', async ({
    homePage,
    makeAxeBuilder,
  }) => {
    await homePage.goto('/');
    await homePage.assertLoaded();

    const accessibilityScanResults = await makeAxeBuilder().analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
