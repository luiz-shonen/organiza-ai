import { expect, test, type Page } from '@playwright/test';
import { setupMockAuthSession } from '../helpers/auth-mock.helper';
import { assertMinTouchTarget, assertNoHorizontalOverflow } from '../helpers/design-tokens.helper';

const superAdmin = {
  uid: 'superadmin-uid',
  email: 'luiz.gmr.dev@gmail.com',
  displayName: 'Super Admin',
  isSuperAdmin: true,
};

async function openShowcase(page: Page): Promise<void> {
  await setupMockAuthSession(page, superAdmin);
  await page.goto('/design-system');
  await expect(page.locator('.org-ds-topbar__title')).toBeVisible();
}

test.describe('Design System Showcase', () => {
  test('redirects an unauthenticated visitor from the showcase', async ({ page }) => {
    await page.goto('/design-system');
    await expect(page).toHaveURL(/\/login/);
  });

  test('redirects an authenticated non-superadmin visitor from the showcase', async ({ page }) => {
    await setupMockAuthSession(page, {
      uid: 'regular-user-uid',
      email: 'regular@organizaai.test',
      displayName: 'Regular User',
      isSuperAdmin: false,
    });

    await page.goto('/design-system');
    await expect(page).not.toHaveURL(/\/design-system$/);
  });

  test('renders every Material component family as an anchored showcase section', async ({ page }) => {
    await openShowcase(page);

    const sectionIds = [
      'overview',
      'foundations',
      'buttons',
      'inputs',
      'selection',
      'navigation',
      'data-display',
      'feedback',
      'seasonal-themes',
    ];

    for (const id of sectionIds) {
      await expect(page.locator(`section#${id}`)).toBeAttached();
      await expect(page.locator(`.org-ds-sidebar__nav-link[href="#${id}"]`)).toBeAttached();
    }
  });

  test('keeps the anchored catalog within the mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await openShowcase(page);
    await assertNoHorizontalOverflow(page);
  });

  test('keeps a component-anchor target at 48px or larger', async ({ page }) => {
    await openShowcase(page);
    await assertMinTouchTarget(page.locator('.org-ds-sidebar__nav-link').first());
  });

  test('switches the showcase to the Festa Junina token class', async ({ page }) => {
    await openShowcase(page);

    await page.locator('.org-ds-topbar__seasonal-select').click();
    await page.getByRole('option', { name: 'Festa Junina' }).click();

    await expect(page.locator('html')).toHaveClass(/theme-junina/);
  });

  test('toggles the showcase color mode without leaving the route', async ({ page }) => {
    await openShowcase(page);
    const html = page.locator('html');
    const wasDark = await html.evaluate((element) => element.classList.contains('dark'));

    await page.locator('.org-ds-topbar__theme-toggle').click();

    if (wasDark) {
      await expect(html).not.toHaveClass(/dark/);
    } else {
      await expect(html).toHaveClass(/dark/);
    }
  });
});
