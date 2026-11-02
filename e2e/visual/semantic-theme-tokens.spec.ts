import { expect, test } from '@playwright/test';

// Branco Essencial + Usabilidade: lilac actions, leaf-green success, flat surfaces, and
// seasonal themes that tint only the canvas while the palette stays the same.
test('maps semantic and seasonal tokens while preserving error semantics', async ({ page }) => {
  await page.goto('/');
  const root = page.locator('html');

  await expect(root).toHaveCSS('--org-primary', '#7950f2');
  await expect(root).toHaveCSS('--org-glass-blur', 'none');
  await expect(root).toHaveCSS('--org-error', '#c92a2a');
  await expect(root).toHaveCSS('--org-success', '#2f9e44');

  await root.evaluate((element) => element.classList.add('dark'));
  await expect(root).toHaveCSS('--org-primary', '#b197fc');
  await expect(root).toHaveCSS('--org-error', '#ff8787');
  await expect(root).toHaveCSS('--org-success', '#69db7c');
  await root.evaluate((element) => element.classList.remove('dark'));

  await root.evaluate((element) => element.classList.add('theme-junina'));
  await expect(root).toHaveCSS('--org-primary', '#7950f2');
  await expect(root).toHaveCSS('--org-error', '#c92a2a');
  await expect(root).toHaveCSS('--org-success', '#2f9e44');
});
