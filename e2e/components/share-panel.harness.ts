import { Locator, Page } from '@playwright/test';

/**
 * Component harness for interacting with the Share Panel and Collaborator Invitations in E2E tests.
 */
export class SharePanelHarness {
  readonly page: Page;
  readonly panelRoot: Locator;
  readonly qrCanvas: Locator;
  readonly whatsappBtn: Locator;
  readonly copyLinkBtn: Locator;
  readonly inviteEmailInput: Locator;
  readonly sendInviteBtn: Locator;

  constructor(page: Page, rootLocator?: Locator) {
    this.page = page;
    this.panelRoot = rootLocator ?? page.getByTestId('share-panel').or(page.locator('app-share-panel, .share-panel, mat-card.share-panel'));

    this.qrCanvas = page.getByTestId('qr-canvas')
      .or(this.panelRoot.locator('canvas'))
      .or(page.locator('canvas.share-panel__qr, canvas[aria-label*="QR Code"], canvas'));

    this.whatsappBtn = page.getByTestId('whatsapp-share-btn')
      .or(this.panelRoot.getByRole('button', { name: /WhatsApp/i }))
      .or(page.locator('button.share-panel__whatsapp-btn, button[aria-label*="WhatsApp"], a[href*="whatsapp"], a[href*="wa.me"], button:has-text("WhatsApp")'));

    this.copyLinkBtn = page.getByTestId('copy-link-btn')
      .or(this.panelRoot.getByRole('button', { name: /Copiar Link/i }))
      .or(page.locator('button[aria-label*="Copiar link"], button:has-text("Copiar Link")'));

    this.inviteEmailInput = page.getByTestId('invite-email-input')
      .or(page.getByTestId('collaborator-email-input'))
      .or(page.getByLabel(/Email do colaborador/i))
      .or(page.locator('.collaborator-dialog input[type="email"], input[placeholder*="amigo@exemplo.com"], input[type="email"]'));

    this.sendInviteBtn = page.getByTestId('send-invite-btn')
      .or(page.getByTestId('collaborator-submit-btn'))
      .or(page.getByRole('button', { name: /Convidar/i }))
      .or(page.locator('.collaborator-dialog__submit-btn, button[aria-label*="Enviar convite"], button:has-text("Convidar")'));
  }

  /**
   * Asserts that the share panel root element is visible.
   */
  async assertLoaded(): Promise<void> {
    await this.panelRoot.first().waitFor({ state: 'visible' });
  }

  /**
   * Gets the href or target URL of the WhatsApp share button.
   */
  async getWhatsAppHref(): Promise<string | null> {
    const href = await this.whatsappBtn.getAttribute('href');
    if (href) {
      return href;
    }
    const dataHref = await this.whatsappBtn.getAttribute('data-href');
    if (dataHref) {
      return dataHref;
    }
    return null;
  }

  /**
   * Triggers the copy link action.
   */
  async copyLink(): Promise<void> {
    await this.copyLinkBtn.click();
  }

  /**
   * Invites a collaborator by entering their email and submitting the invite form.
   * If the collaborator dialog is not yet open, attempts to trigger it via the collaborator button.
   */
  async inviteCollaborator(email: string): Promise<void> {
    if (!(await this.inviteEmailInput.isVisible())) {
      const triggerBtn = this.page.getByTestId('open-collaborators-btn')
        .or(this.page.locator('.editor__collab-btn, button:has-text("Colaboradores")'));
      if (await triggerBtn.isVisible()) {
        await triggerBtn.click();
      }
    }
    await this.inviteEmailInput.fill(email);
    await this.sendInviteBtn.click();
  }
}
