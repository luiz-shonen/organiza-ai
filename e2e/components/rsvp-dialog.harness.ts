import { expect, Locator, Page } from '@playwright/test';

export interface RsvpGuestDetails {
  name?: string;
  phone?: string;
  companionsCount?: number;
}

export class RsvpDialogHarness {
  readonly dialogRoot: Locator;
  readonly confirmBtn: Locator;
  readonly cancelBtn: Locator;
  readonly phoneInput: Locator;
  readonly familySelector: Locator;
  readonly nameInput: Locator;
  readonly companionsInput: Locator;

  constructor(private readonly page: Page) {
    this.dialogRoot = page.getByTestId('rsvp-drawer');

    this.confirmBtn = this.dialogRoot
      .getByTestId('rsvp-confirm-btn')
      .or(this.dialogRoot.getByRole('button', { name: /confirmar/i }))
      .first();

    this.cancelBtn = this.dialogRoot
      .getByTestId('rsvp-cancel-btn')
      .or(this.dialogRoot.getByRole('button', { name: /cancelar/i }))
      .first();

    this.nameInput = this.dialogRoot
      .getByTestId('rsvp-name-input')
      .locator('input')
      .or(this.dialogRoot.getByTestId('rsvp-name-input'))
      .or(this.dialogRoot.getByLabel(/nome/i))
      .first();

    this.phoneInput = this.dialogRoot
      .getByTestId('rsvp-phone-input')
      .locator('input')
      .or(this.dialogRoot.getByTestId('rsvp-phone-input'))
      .or(this.dialogRoot.getByLabel(/telefone|whatsapp/i))
      .first();

    this.companionsInput = this.dialogRoot
      .getByTestId('rsvp-companions-input')
      .locator('input')
      .or(this.dialogRoot.getByTestId('rsvp-companions-input'))
      .or(this.dialogRoot.getByLabel(/acompanhantes/i))
      .first();

    this.familySelector = this.dialogRoot.getByTestId('family-selector');
  }

  async assertVisible(): Promise<void> {
    await expect(this.dialogRoot.first()).toBeVisible();
  }

  async assertHidden(): Promise<void> {
    await expect(this.dialogRoot.first()).toBeHidden();
  }

  async confirmRsvp(details?: RsvpGuestDetails): Promise<void> {
    if (details?.name && (await this.nameInput.isVisible())) {
      await this.nameInput.fill(details.name);
    }
    if (details?.phone && (await this.phoneInput.isVisible())) {
      await this.phoneInput.fill(details.phone);
    }
    if (details?.companionsCount !== undefined && (await this.companionsInput.isVisible())) {
      await this.companionsInput.fill(details.companionsCount.toString());
    }
    await this.confirmBtn.click();
  }

  async cancel(): Promise<void> {
    await this.cancelBtn.click();
  }

  async dismissViaEscape(): Promise<void> {
    await this.page.keyboard.press('Escape');
    await expect(this.dialogRoot.first()).toBeHidden();
  }

  async assertFocusTrapped(): Promise<void> {
    await expect(this.dialogRoot.first()).toBeVisible();

    const isInitialFocusInside = await this.page.evaluate(() => {
      const dialog = document.querySelector('[data-testid="rsvp-drawer"]');
      return dialog ? dialog.contains(document.activeElement) : false;
    });
    expect(isInitialFocusInside).toBe(true);

    for (let i = 0; i < 5; i++) {
      await this.page.keyboard.press('Tab');
      const isFocusInside = await this.page.evaluate(() => {
        const dialog = document.querySelector('[data-testid="rsvp-drawer"]');
        return dialog ? dialog.contains(document.activeElement) : false;
      });
      expect(isFocusInside).toBe(true);
    }
  }
}
