import { expect, Locator, Page } from '@playwright/test';

export class ConfirmDialogHarness {
  readonly dialogRoot: Locator;
  readonly confirmBtn: Locator;
  readonly cancelBtn: Locator;
  readonly messageText: Locator;

  constructor(protected readonly page: Page) {
    this.dialogRoot = page
      .getByTestId('org-confirm-dialog')
      .or(page.getByTestId('confirm-dialog'))
      .or(page.locator('mat-dialog-container:has(app-confirm-dialog, org-confirm-dialog), mat-dialog-container'))
      .or(page.getByRole('alertdialog'))
      .or(page.getByRole('dialog'))
      .first();

    this.confirmBtn = this.dialogRoot
      .getByTestId('org-confirm-submit')
      .locator('button')
      .or(this.dialogRoot.getByTestId('confirm-dialog-confirm-btn'))
      .or(this.dialogRoot.locator('.org-confirm-dialog__actions org-button button').last())
      .or(this.dialogRoot.locator('.confirm-dialog__confirm-btn'))
      .or(this.dialogRoot.getByRole('button', { name: /confirmar|sim|excluir|cancelar evento|apagar/i }))
      .first();

    this.cancelBtn = this.dialogRoot
      .getByTestId('org-confirm-cancel')
      .locator('button')
      .or(this.dialogRoot.getByTestId('confirm-dialog-cancel-btn'))
      .or(this.dialogRoot.locator('.org-confirm-dialog__actions org-button button').first())
      .or(this.dialogRoot.locator('.confirm-dialog__cancel-btn'))
      .or(this.dialogRoot.getByRole('button', { name: /^cancelar$|^voltar$|^não$/i }))
      .first();

    this.messageText = this.dialogRoot
      .getByTestId('confirm-dialog-message')
      .or(this.dialogRoot.locator('.org-confirm-dialog__message, .confirm-dialog__message, mat-dialog-content p, p'))
      .first();
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
