import { expect, Locator, Page } from '@playwright/test';

/**
 * Component harness for the Event Detail Item List (Wishlist) component.
 * Encapsulates wishlist item claim toggling, unclaiming, and remaining counter assertions.
 */
export class ItemListHarness {
  readonly listRoot: Locator;
  readonly itemCards: Locator;
  readonly claimBtns: Locator;
  readonly unclaimBtns: Locator;
  readonly remainingCount: Locator;

  constructor(private readonly pageOrLocator: Page | Locator) {
    this.listRoot = this.pageOrLocator
      .getByTestId('item-list-card')
      .or(this.pageOrLocator.locator('app-item-list-card, section.item-list-card, [aria-label="Lista de itens do evento"], [aria-label*="itens" i]'));

    this.itemCards = this.listRoot
      .getByTestId('item-card')
      .or(this.listRoot.locator('.item-list-card__item, .glass-card.item-list-card__item'));

    this.claimBtns = this.listRoot
      .getByTestId('claim-item-btn')
      .or(this.listRoot.getByRole('button', { name: /levar item|eu levo/i }))
      .or(this.listRoot.locator('.item-list-card__claim-btn, button:has-text("Eu Levo")'));

    this.unclaimBtns = this.listRoot
      .getByTestId('unclaim-item-btn')
      .or(this.listRoot.getByRole('button', { name: /desistir de levar|desistir/i }))
      .or(this.listRoot.locator('.item-list-card__unclaim-btn, button:has-text("Desistir")'));

    this.remainingCount = this.listRoot
      .getByTestId('item-remaining-count')
      .or(this.listRoot.locator('.item-list-card__remaining, .item-list-card__status--available, .item-list-card__status:has-text("Disponível")'));
  }

  /**
   * Clicks the claim button for the item at the specified index.
   */
  async claimItem(index: number = 0): Promise<void> {
    await this.claimBtns.nth(index).click();
  }

  /**
   * Clicks the unclaim button for the item at the specified index.
   */
  async unclaimItem(index: number = 0): Promise<void> {
    await this.unclaimBtns.nth(index).click();
  }

  /**
   * Asserts the remaining available items either via explicit counter badge or count of claimable items.
   */
  async assertRemaining(count: number): Promise<void> {
    const singleCounter = this.listRoot.getByTestId('item-remaining-count');
    if (await singleCounter.isVisible().catch(() => false)) {
      await expect(singleCounter).toContainText(count.toString());
    } else {
      await expect(this.claimBtns).toHaveCount(count);
    }
  }
}
