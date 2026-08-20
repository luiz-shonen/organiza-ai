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
    const viewport = this.page.viewportSize();
    const isMobile = viewport ? viewport.width < 768 : false;
    const deviceSuffix = isMobile ? 'mobile' : 'desktop';
    await this.page.screenshot({
      path: `e2e/screenshots/${name}-${deviceSuffix}.png`,
      fullPage: true,
    });
  }
}
