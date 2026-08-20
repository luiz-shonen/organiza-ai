import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './base.page';

export class EventDetailPage extends BasePage {
  readonly pageRoot: Locator;
  readonly countdownTimer: Locator;
  readonly rsvpBtn: Locator;
  readonly pixCard: Locator;
  readonly copyPixBtn: Locator;
  readonly confettiCanvas: Locator;

  constructor(page: Page) {
    super(page);
    this.pageRoot = page.getByTestId('event-detail-page').or(page.locator('main.event-detail, .event-detail__not-found, .event-detail__loading'));
    this.countdownTimer = page.getByTestId('countdown-timer').or(page.locator('.countdown, .event-card__countdown, .event-card__date'));
    this.rsvpBtn = page.getByTestId('rsvp-action-btn').or(page.locator('.rsvp-card button, button:has-text("Confirmar"), button:has-text("Presença")'));
    this.pixCard = page.getByTestId('pix-card').or(page.locator('app-pix-card, .pix-card'));
    this.copyPixBtn = page.getByTestId('copy-pix-btn').or(page.locator('app-pix-card button, button:has-text("Copiar"), [aria-label*="Copiar"]'));
    this.confettiCanvas = page.getByTestId('confetti-canvas').or(page.locator('canvas'));
  }

  async assertLoaded(): Promise<void> {
    await expect(this.pageRoot.first()).toBeVisible();
  }

  async openRsvpDialog(): Promise<void> {
    await this.rsvpBtn.click();
  }

  async copyPixKey(): Promise<void> {
    if (await this.copyPixBtn.isVisible()) {
      await this.copyPixBtn.click();
    }
  }
}
