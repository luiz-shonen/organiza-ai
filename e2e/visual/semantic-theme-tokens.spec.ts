import { expect, test } from '@playwright/test';

test('maps semantic and seasonal tokens while preserving error semantics', async ({ page }) => {
  await page.goto('/');
  const root = page.locator('html');

  await expect(root).toHaveCSS('--org-primary', '#630ed4');
  await expect(root).toHaveCSS('--org-glass-blur', 'blur(24px)');
  await expect(root).toHaveCSS('--org-error', '#ba1a1a');

  await root.evaluate((element) => element.classList.add('theme-junina'));
  await expect(root).toHaveCSS('--org-primary', '#c62828');
  await expect(root).toHaveCSS('--org-error', '#ba1a1a');
});
