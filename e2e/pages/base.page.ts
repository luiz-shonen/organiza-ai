import { expect, Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

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

  async assertNoA11yViolations(options?: { includeRules?: string[]; excludeRules?: string[] }): Promise<void> {
    let builder = new AxeBuilder({ page: this.page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']);
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

  async captureAnchorScreenshot(name: string, anchorSelector: string, includeAnchorInFilename = true): Promise<void> {
    const main = this.page.locator('main.app-content');
    const anchor = this.page.locator(anchorSelector).first();

    await expect(main).toBeVisible();
    await this.page.evaluate(() => {
      window.scrollTo(0, 0);
      document.querySelector<HTMLElement>('main.app-content')?.scrollTo(0, 0);
    });
    await this.page.evaluate(async () => {
      await document.fonts?.ready;
      await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    });
    await anchor.scrollIntoViewIfNeeded();
    await expect(anchor).toBeInViewport();

    const viewport = this.page.viewportSize();
    const isMobile = viewport ? viewport.width < 768 : false;
    const deviceSuffix = isMobile ? 'mobile' : 'desktop';
    const anchorSuffix = includeAnchorInFilename ? `-${anchorSelector.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '')}` : '';
    await anchor.screenshot({ path: `e2e/screenshots/${name}${anchorSuffix}-${deviceSuffix}.png` });

    await this.page.evaluate(() => {
      window.scrollTo(0, 0);
      document.querySelector<HTMLElement>('main.app-content')?.scrollTo(0, 0);
    });
  }
}
