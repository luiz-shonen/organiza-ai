import { expect, test } from '@playwright/test';

test('maps semantic and seasonal tokens while preserving error semantics', async ({ page }) => {
  await page.goto('/');
  const root = page.locator('html');

  await expect(root).toHaveCSS('--org-primary', '#ff4d94');
  await expect(root).toHaveCSS('--org-glass-blur', 'blur(24px)');
  await expect(root).toHaveCSS('--org-error', '#ba1a1a');
  await expect(root).toHaveCSS('--org-success', '#176b35');

  await root.evaluate((element) => element.classList.add('dark'));
  await expect(root).toHaveCSS('--org-primary', '#ff4d94');
  await expect(root).toHaveCSS('--org-error', '#ba1a1a');
  await expect(root).toHaveCSS('--org-success', '#176b35');
  await root.evaluate((element) => element.classList.remove('dark'));

  await root.evaluate((element) => element.classList.add('theme-junina'));
  await expect(root).toHaveCSS('--org-primary', '#ff5722');
  await expect(root).toHaveCSS('--org-error', '#ba1a1a');
  await expect(root).toHaveCSS('--org-success', '#176b35');
});
