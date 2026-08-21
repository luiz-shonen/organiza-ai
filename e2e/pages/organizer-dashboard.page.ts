import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './base.page';

export class OrganizerDashboardPage extends BasePage {
  readonly pageRoot: Locator;
  readonly createEventBtn: Locator;
  readonly filterChips: Locator;
  readonly eventCards: Locator;

  constructor(page: Page) {
    super(page);
    this.pageRoot = page.getByTestId('dashboard-page').or(page.locator('section.dashboard'));
    this.createEventBtn = page.getByTestId('create-event-btn').or(page.getByRole('link', { name: /novo evento/i })).or(page.locator('a[href*="evento/novo"], a[routerlink*="evento/novo"]'));
    this.filterChips = page.getByTestId(/status-filter-.*-chip/).or(page.locator('app-event-filters button, mat-chip-option, .filters__chip'));
    this.eventCards = page.locator('[data-testid="organizer-event-card"]:visible, .dashboard__row:visible, .dashboard__mobile-card:visible');
  }

  async assertLoaded(): Promise<void> {
    await expect(this.pageRoot).toBeVisible();
  }

  async filterByStatus(status: 'Todos' | 'Ativos' | 'Encerrados' | 'Cancelados'): Promise<void> {
    const chip = this.page.getByRole('button', { name: new RegExp(status, 'i') })
      .or(this.page.getByTestId(new RegExp(`status-filter-.*${status.toLowerCase()}.*`, 'i')))
      .or(this.filterChips.filter({ hasText: new RegExp(status, 'i') }));
    await chip.first().click();
  }

  async openEventEditor(eventId?: string): Promise<void> {
    if (eventId) {
      await this.page.goto(`/meus-eventos/evento/${eventId}`);
    } else {
      await this.createEventBtn.click();
    }
  }
}
