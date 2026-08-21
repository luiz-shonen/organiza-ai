import { expect, test } from '@playwright/test';
import { BasePage } from '../pages/base.page';

class TestPage extends BasePage {
  async assertLoaded(): Promise<void> {}
}

test('captures a visible semantic anchor after resetting every scroll owner', async ({ page }) => {
  await page.setContent(`
    <main class="app-content" style="height: 100px; overflow: auto">
      <div style="height: 300px"></div>
      <section data-testid="visual-anchor" style="height: 60px">Anchor</section>
    </main>
  `);
  await page.evaluate(() => {
    window.scrollTo(0, 100);
    document.querySelector<HTMLElement>('main.app-content')?.scrollTo(0, 180);
  });

  await new TestPage(page).captureAnchorScreenshot('visual-contract', '[data-testid="visual-anchor"]');

  await expect
    .poll(() => page.evaluate(() => document.querySelector<HTMLElement>('main.app-content')?.scrollTop))
    .toBe(0);
});
