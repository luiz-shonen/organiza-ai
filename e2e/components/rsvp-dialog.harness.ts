import { expect, Locator, Page } from '@playwright/test';

export interface RsvpGuestDetails {
  name?: string;
  phone?: string;
}

export class RsvpDialogHarness {
  readonly dialogRoot: Locator;
  readonly confirmBtn: Locator;
  readonly cancelBtn: Locator;
  readonly phoneInput: Locator;
  readonly familySelector: Locator;
  /** The guest's name, from their profile: shown, not typed. */
  readonly guestName: Locator;

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

    this.guestName = this.dialogRoot.getByTestId('rsvp-guest-name').first();

    this.phoneInput = this.dialogRoot
      .getByTestId('rsvp-phone-input')
      .locator('input')
      .or(this.dialogRoot.getByTestId('rsvp-phone-input'))
      .or(this.dialogRoot.getByLabel(/telefone|whatsapp/i))
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
    if (details?.phone && (await this.phoneInput.isVisible())) {
      await this.phoneInput.fill(details.phone);
    }
    await this.confirmBtn.click();
  }

  async cancel(): Promise<void> {
    await this.cancelBtn.click();
  }

  /** Waits for the drawer to take focus (it does after its open animation), then presses Escape. */
  async dismissViaEscape(): Promise<void> {
    await this.assertFocusInside();
    await this.page.keyboard.press('Escape');
    await expect(this.dialogRoot.first()).toBeHidden();
  }

  async assertFocusInside(): Promise<void> {
    await expect
      .poll(() =>
        this.page.evaluate(() =>
          Boolean(
            document.querySelector('[data-testid="rsvp-drawer"]')?.contains(document.activeElement),
          ),
        ),
      )
      .toBe(true);
  }

  async assertFocusTrapped(): Promise<void> {
    await expect(this.dialogRoot.first()).toBeVisible();
    await this.assertFocusInside();

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
