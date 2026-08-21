import { expect, Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

export type VisualTheme = 'light' | 'dark';
export type VisualViewport = 'desktop' | 'mobile';

export function buildVisualScreenshotPath(
  name: string,
  theme: VisualTheme,
  viewport: VisualViewport,
  anchorSuffix = '',
): string {
  const normalizedName = name.replace(/-(?:light|dark)$/, '');
  return `e2e/screenshots/${normalizedName}${anchorSuffix}-${theme}-${viewport}.png`;
}

export async function resetVisualScrollOwners(page: Page): Promise<void> {
  await page.evaluate(() => {
    window.scrollTo(0, 0);
    document.querySelector<HTMLElement>('main.app-content')?.scrollTo(0, 0);
  });
}

export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  async goto(path: string = '/'): Promise<void> {
    await this.page.goto(path);
  }

  abstract assertLoaded(): Promise<void>;

  async assertUrl(pattern: string | RegExp): Promise<void> {
    if (typeof pattern === 'string') {
      await expect(this.page).toHaveURL(new RegExp(pattern));
    } else {
      await expect(this.page).toHaveURL(pattern);
    }
  }

  async assertNoA11yViolations(options?: {
    includeRules?: string[];
    excludeRules?: string[];
  }): Promise<void> {
    let builder = new AxeBuilder({ page: this.page }).withTags([
      'wcag2a',
      'wcag2aa',
      'wcag21a',
      'wcag21aa',
    ]);
    if (options?.includeRules && options.includeRules.length > 0) {
      builder = builder.withRules(options.includeRules);
    }
    if (options?.excludeRules && options.excludeRules.length > 0) {
      builder = builder.disableRules(options.excludeRules);
    }
    const results = await builder.analyze();
    expect(results.violations).toEqual([]);
  }

  async captureScreenshot(name: string): Promise<void> {
    await this.captureAnchorScreenshot(name, 'main.app-content', false);
  }

  async captureAnchorScreenshot(
    name: string,
    anchorSelector: string,
    includeAnchorInFilename = true,
  ): Promise<void> {
    const main = this.page.locator('main.app-content');
    const anchor = this.page.locator(anchorSelector).first();

    await expect(main).toBeVisible();
    await resetVisualScrollOwners(this.page);
    await this.page.evaluate(async () => {
      await document.fonts?.ready;
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      );
    });
    await anchor.scrollIntoViewIfNeeded();
    await expect(anchor).toBeInViewport();

    const viewport = this.page.viewportSize();
    const isMobile = viewport ? viewport.width < 768 : false;
    const deviceSuffix: VisualViewport = isMobile ? 'mobile' : 'desktop';
    const theme: VisualTheme = await this.page
      .locator('html')
      .evaluate((root) => (root.classList.contains('dark') ? 'dark' : 'light'));
    const anchorSuffix = includeAnchorInFilename
      ? `-${anchorSelector.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '')}`
      : '';
    await anchor.screenshot({
      path: buildVisualScreenshotPath(name, theme, deviceSuffix, anchorSuffix),
    });

    await resetVisualScrollOwners(this.page);
  }
}
