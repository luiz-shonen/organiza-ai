import { expect, test } from '@playwright/test';
import {
  assertAnchorVisibleInScrollOwner,
  assertAppScrollOrigin,
  assertDrawerInset,
  assertFocusedFieldCoherence,
  assertSingleSurfaceRing,
} from '../helpers/design-tokens.helper';

test('proves the numerical visual contracts on representative geometry', async ({ page }) => {
  await page.setContent(`
    <main class="app-content" style="height: 150px; overflow:auto">
      <section data-testid="surface" style="border: 1.5px solid transparent; border-radius: 16px; background: linear-gradient(white, white) padding-box, linear-gradient(90deg, purple, orange) border-box; height: 60px">Surface</section>
      <input data-testid="field" style="border: 2px solid rgb(99, 14, 212); color: rgb(35, 16, 67); background: rgb(255, 255, 255)" />
      <div data-testid="anchor" style="height: 48px">Anchor</div>
    </main>
    <aside data-testid="drawer" style="position: fixed; inset: 0 0 0 auto; width: 280px; min-height: 48px">Drawer</aside>
  `);

  await assertAppScrollOrigin(page);
  await assertAnchorVisibleInScrollOwner(page.locator('[data-testid="anchor"]'), page.locator('main.app-content'));
  await assertSingleSurfaceRing(page.locator('[data-testid="surface"]'));
  await assertFocusedFieldCoherence(page.locator('[data-testid="field"]'));
  await assertDrawerInset(page.locator('[data-testid="drawer"]'));
});

test('rejects an undersized interactive target in either dimension', async ({ page }) => {
  await page.setContent('<button style="width: 40px; height: 48px">Too narrow</button>');
  await expect(import('../helpers/design-tokens.helper').then(({ assertMinTouchTarget }) => assertMinTouchTarget(page.getByRole('button')))).rejects.toThrow();
});
