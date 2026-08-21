import { test, expect } from '../fixtures/test.fixture';
import { assertNoHorizontalOverflow, assertSingleSurfaceRing } from '../helpers/design-tokens.helper';

test.describe('Home Theming, Feed and Accessibility', () => {
  test('should render home landmark region and available event cards or empty state', async ({
    homePage,
    page,
  }) => {
    await homePage.goto('/');
    await homePage.assertLoaded();

    // Semantic landmark assertion
    await expect(homePage.pageRoot).toBeVisible();
    await expect(homePage.pageRoot).toHaveAttribute('aria-label', 'Eventos disponíveis');

    // Page header title
    const headerTitle = page.getByRole('heading', { level: 1, name: /eventos/i });
    await expect(headerTitle).toBeVisible();

    // Wait for either event cards or empty state to appear
    await expect(homePage.eventCards.first().or(homePage.emptyState)).toBeVisible({ timeout: 10000 });
    const hasEvents = await homePage.eventCards.first().isVisible().catch(() => false);
    if (hasEvents) {
      const firstCard = homePage.eventCards.first();
      await expect(firstCard).toBeVisible();
      await expect(firstCard).toHaveAttribute('role', 'link');
      await expect(firstCard).toHaveAttribute('tabindex', '0');
      await assertSingleSurfaceRing(firstCard.locator('section.org-surface'));

      // Verify card click navigation
      await homePage.clickEventCard(0);
      await page.waitForURL(/\/evento\/.+/);
      await expect(page).toHaveURL(/\/evento\/.+/);
    } else {
      await expect(homePage.emptyState).toBeVisible();
      await expect(homePage.emptyState).toHaveAttribute('aria-label', 'Nenhum evento encontrado');
      await assertSingleSurfaceRing(homePage.emptyState.locator('section.org-surface'));
    }
    await assertNoHorizontalOverflow(page);
  });

  test('should toggle dark and light themes and persist in localStorage', async ({
    homePage,
    page,
  }) => {
    await homePage.goto('/');
    await homePage.assertLoaded();

    // Verify theme toggle button is present
    await expect(homePage.themeToggleBtn).toBeVisible();

    // 1. Switch to Dark theme
    await homePage.themeToggleBtn.click();
    const darkMenuItem = page.getByRole('menuitem', { name: /escuro/i });
    await expect(darkMenuItem).toBeVisible();
    await darkMenuItem.click();

    // Assert DOM class and localStorage persistence
    await expect(page.locator('html')).toHaveClass(/dark/);
    const darkStorageValue = await page.evaluate(() => localStorage.getItem('theme_mode'));
    expect(darkStorageValue).toBe('dark');

    // 2. Switch to Light theme
    await homePage.themeToggleBtn.click();
    const lightMenuItem = page.getByRole('menuitem', { name: /claro/i });
    await expect(lightMenuItem).toBeVisible();
    await lightMenuItem.click();

    // Assert DOM class removed and localStorage updated
    await expect(page.locator('html')).not.toHaveClass(/dark/);
    const lightStorageValue = await page.evaluate(() => localStorage.getItem('theme_mode'));
    expect(lightStorageValue).toBe('light');

    // 3. Verify persistence across page reload
    await page.reload();
    await homePage.assertLoaded();
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

    // Wait for content to settle
    await homePage.page.waitForTimeout(500);

    const accessibilityScanResults = await makeAxeBuilder().analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
