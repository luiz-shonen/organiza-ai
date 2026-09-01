import { expect, Locator, Page } from '@playwright/test';

export class ConfirmDialogHarness {
  readonly dialogRoot: Locator;
  readonly confirmBtn: Locator;
  readonly cancelBtn: Locator;
  readonly messageText: Locator;

  constructor(protected readonly page: Page) {
    this.dialogRoot = page.getByTestId('org-confirm-dialog');

    this.confirmBtn = this.dialogRoot
      .getByTestId('org-confirm-submit')
      .or(this.dialogRoot.getByRole('button', { name: /confirmar|sim|excluir|cancelar evento|apagar/i }))
      .first();

    this.cancelBtn = this.dialogRoot
      .getByTestId('org-confirm-cancel')
      .or(this.dialogRoot.getByRole('button', { name: /^cancelar$|^voltar$|^não$/i }))
      .first();

    this.messageText = this.dialogRoot.locator('.org-confirm-dialog__message');
  }

  async assertVisible(): Promise<void> {
    await expect(this.dialogRoot).toBeVisible();
  }

  async confirm(): Promise<void> {
    await this.confirmBtn.click();
  }

  async cancel(): Promise<void> {
    await this.cancelBtn.click();
  }
}
