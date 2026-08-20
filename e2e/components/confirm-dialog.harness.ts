import { expect, Locator, Page } from '@playwright/test';

export class ConfirmDialogHarness {
  readonly dialogRoot: Locator;
  readonly confirmBtn: Locator;
  readonly cancelBtn: Locator;
  readonly messageText: Locator;

  constructor(protected readonly page: Page) {
    this.dialogRoot = page
      .getByTestId('confirm-dialog')
      .or(page.getByRole('dialog'))
      .or(page.locator('mat-dialog-container:has(app-confirm-dialog), app-confirm-dialog'));

    this.confirmBtn = this.dialogRoot
      .getByTestId('confirm-dialog-confirm-btn')
      .or(this.dialogRoot.locator('.confirm-dialog__confirm-btn'))
      .or(this.dialogRoot.getByRole('button', { name: /confirmar|sim|excluir|cancelar evento|apagar/i }));

    this.cancelBtn = this.dialogRoot
      .getByTestId('confirm-dialog-cancel-btn')
      .or(this.dialogRoot.locator('.confirm-dialog__cancel-btn'))
      .or(this.dialogRoot.getByRole('button', { name: /cancelar|voltar|não/i }));

    this.messageText = this.dialogRoot
      .getByTestId('confirm-dialog-message')
      .or(this.dialogRoot.locator('.confirm-dialog__message, mat-dialog-content p'));
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
