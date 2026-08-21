import { expect, test } from '@playwright/test';
import { buildVisualScreenshotPath, resetVisualScrollOwners } from '../pages/base.page';

test('resets every scroll owner without producing a public visual baseline', async ({ page }) => {
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

  await resetVisualScrollOwners(page);

  await expect
    .poll(() =>
      page.evaluate(() => document.querySelector<HTMLElement>('main.app-content')?.scrollTop),
    )
    .toBe(0);
});

test('names product screenshots by explicit theme and viewport', () => {
  expect(buildVisualScreenshotPath('13-10-event-detail', 'light', 'mobile')).toBe(
    'e2e/screenshots/13-10-event-detail-light-mobile.png',
  );
  expect(buildVisualScreenshotPath('01-home-dark', 'dark', 'desktop')).toBe(
    'e2e/screenshots/01-home-dark-desktop.png',
  );
});
