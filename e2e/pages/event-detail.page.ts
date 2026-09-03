import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './base.page';

export class EventDetailPage extends BasePage {
  readonly pageRoot: Locator;
  readonly countdownTimer: Locator;
  readonly rsvpBtn: Locator;
  readonly pixCard: Locator;
  readonly copyPixBtn: Locator;
  readonly confettiCanvas: Locator;
  readonly titleHeading: Locator;
  readonly countdownSection: Locator;
  readonly locationSection: Locator;
  readonly rsvpStatusCard: Locator;
  readonly categoryBadge: Locator;

  constructor(page: Page) {
    super(page);
    this.categoryBadge = page.locator('.event-card__category-badge');
    this.pageRoot = page
      .getByTestId('event-detail-page')
      .or(page.locator('main.event-detail, app-event-detail, .event-hero, org-empty-state'));
    this.countdownTimer = page
      .getByTestId('countdown-timer')
      .or(page.locator('.countdown, .event-card__countdown, .event-card__date, app-event-hero'));
    this.rsvpBtn = page
      .getByTestId('rsvp-action-btn')
      .locator('button')
      .or(page.getByRole('button', { name: /confirmar|presença|rsvp/i }))
      .or(
        page.locator(
          '.rsvp-card button, org-button[label*="Confirmar"] button, button:has-text("Confirmar"), button:has-text("Presença")',
        ),
      );
    this.pixCard = page
      .getByTestId('pix-card')
      .or(page.locator('app-pix-card, app-pix-payment-card, .pix-card'));
    this.copyPixBtn = page
      .getByTestId('copy-pix-btn')
      .locator('button')
      .or(
        page.locator(
          'app-pix-card button, app-pix-payment-card button, button:has-text("Copiar"), [aria-label*="Copiar"]',
        ),
      );
    this.confettiCanvas = page.getByTestId('confetti-canvas').or(page.locator('canvas'));
    this.titleHeading = page
      .getByRole('heading', { level: 1 })
      .or(page.locator('h1, .event-hero__title'))
      .first();
    this.countdownSection = page
      .locator(
        'app-event-hero, .event-hero, .event-card__countdown, [data-testid="countdown-timer"]',
      )
      .first();
    this.locationSection = page
      .locator(
        '.event-detail__location, .event-hero__location, [data-testid="event-location"], p:has-text("Paulista")',
      )
      .first();
    this.rsvpStatusCard = page
      .locator(
        'app-event-hero, .event-hero, .rsvp-card, [data-testid="rsvp-status-card"], [data-testid="rsvp-card"]',
      )
      .first();
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
