import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './base.page';

/** /design-system: the living catalog of Org* components and --org-* tokens. */
export class DesignSystemShowcasePage extends BasePage {
  readonly title: Locator;

  constructor(page: Page) {
    super(page);
    this.title = page
      .getByTestId('design-system-page')
      .getByRole('heading', { level: 1, name: 'Design system' });
  }

  async assertLoaded(): Promise<void> {
    await expect(this.title).toContainText('Design system');
  }

  section(id: string): Locator {
    return this.page.locator(`section#${id}`);
  }
}
