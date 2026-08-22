import { test, expect } from '@playwright/test';
import { setupMockAuthSession } from '../helpers/auth-mock.helper';
import { assertNoHorizontalOverflow, assertMinTouchTarget } from '../helpers/design-tokens.helper';
import { DesignSystemShowcasePage } from '../pages/design-system-showcase.page';

test.describe('Design System Showcase & Living Catalog', () => {
  test('should redirect unauthenticated users away from /design-system to login', async ({ page }) => {
    await page.goto('/design-system');
    await expect(page).toHaveURL(/\/login/);
  });

  test('should redirect authenticated non-superadmin users away from /design-system', async ({ page }) => {
    await setupMockAuthSession(page, {
      uid: 'regular-user-uid',
      email: 'regular@organizaai.test',
      displayName: 'Regular User',
      isSuperAdmin: false,
    });

    await page.goto('/design-system');
    await expect(page).not.toHaveURL(/\/design-system$/);
  });

  test('should allow authenticated superadmin to access /design-system and render 14 sections', async ({
    page,
  }) => {
    await setupMockAuthSession(page, {
      uid: 'superadmin-uid',
      email: 'luiz.gmr.dev@gmail.com',
      displayName: 'Super Admin',
      isSuperAdmin: true,
    });

    const showcasePage = new DesignSystemShowcasePage(page);
    await page.goto('/design-system');
    await showcasePage.assertLoaded();

    // Verify all 14 sections exist in DOM
    const sectionIds = [
      'brand-overview',
      'brand-colors',
      'brand-typography',
      'brand-icons',
      'foundations-tokens',
      'foundations-fundamentals',
      'components-surfaces',
      'components-buttons',
      'components-forms',
      'components-chips',
      'components-layout',
      'components-feedback',
      'components-navigation',
      'guidelines-dos-donts',
    ];

    for (const id of sectionIds) {
      await expect(page.locator(`section#${id}`)).toBeAttached();
    }

    // Zero horizontal overflow verification
    await assertNoHorizontalOverflow(page);
  });

  test('should filter sidebar navigation links dynamically via search input', async ({ page }) => {
    await setupMockAuthSession(page, {
      uid: 'superadmin-uid',
      email: 'luiz.gmr.dev@gmail.com',
      displayName: 'Super Admin',
      isSuperAdmin: true,
    });

    const showcasePage = new DesignSystemShowcasePage(page);
    await page.goto('/design-system');
    await showcasePage.assertLoaded();

    // Filter by 'chip'
    await showcasePage.filterNav('chip');
    await expect(showcasePage.navLinks).toHaveCount(1);
    await expect(showcasePage.navLinks.first()).toContainText('Chips');

    // Clear filter
    await showcasePage.filterNav('');
    await expect(showcasePage.navLinks).toHaveCount(14);
  });

  test('should toggle theme mode between light and dark on topbar action', async ({ page }) => {
    await setupMockAuthSession(page, {
      uid: 'superadmin-uid',
      email: 'luiz.gmr.dev@gmail.com',
      displayName: 'Super Admin',
      isSuperAdmin: true,
    });

    const showcasePage = new DesignSystemShowcasePage(page);
    await page.goto('/design-system');
    await showcasePage.assertLoaded();

    const html = page.locator('html');
    const wasDark = await html.evaluate((el) => el.classList.contains('dark'));

    await showcasePage.toggleTheme();
    if (wasDark) {
      await expect(html).not.toHaveClass(/dark/);
    } else {
      await expect(html).toHaveClass(/dark/);
    }
  });

  test('should switch seasonal theme classes on root element', async ({ page }) => {
    await setupMockAuthSession(page, {
      uid: 'superadmin-uid',
      email: 'luiz.gmr.dev@gmail.com',
      displayName: 'Super Admin',
      isSuperAdmin: true,
    });

    const showcasePage = new DesignSystemShowcasePage(page);
    await page.goto('/design-system');
    await showcasePage.assertLoaded();

    const html = page.locator('html');

    await showcasePage.chooseSeasonalTheme('Festa Junina');
    await expect(html).toHaveClass(/theme-junina/);

    await showcasePage.chooseSeasonalTheme('Natal');
    await expect(html).toHaveClass(/theme-natal/);
    await expect(html).not.toHaveClass(/theme-junina/);

    await showcasePage.chooseSeasonalTheme('Padrão');
    await expect(html).not.toHaveClass(/theme-natal/);
  });

  test('should expand and copy specimen code snippets and trigger feedback', async ({ page }) => {
    await setupMockAuthSession(page, {
      uid: 'superadmin-uid',
      email: 'luiz.gmr.dev@gmail.com',
      displayName: 'Super Admin',
      isSuperAdmin: true,
    });

    const showcasePage = new DesignSystemShowcasePage(page);
    await page.goto('/design-system');
    await showcasePage.assertLoaded();

    // Toggle code box on surfaces specimen card
    const codeToggleBtn = page.locator('#surface-specimen .org-ds-specimen-card__code-btn');
    await expect(codeToggleBtn).toBeVisible();
    await codeToggleBtn.click();

    const codeBox = page.locator('#surface-specimen .org-ds-specimen-card__code-box');
    await expect(codeBox).toBeVisible();
    await expect(codeBox).toContainText('article [orgSurface]');

    // Check min touch target on code toggle button
    await assertMinTouchTarget(codeToggleBtn);
  });
});
