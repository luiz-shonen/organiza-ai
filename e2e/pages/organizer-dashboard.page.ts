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
    this.filterChips = page.getByTestId(/status-filter-.*-chip/).or(page.locator('app-event-filters button, .event-filters__item, mat-chip-option, .filters__chip'));
    this.eventCards = page.locator('table.org-data-table tbody tr:visible, [data-testid="organizer-event-card"]:visible, .dashboard__row:visible, .dashboard__mobile-card:visible');
  }

  async assertLoaded(): Promise<void> {
    await expect(this.pageRoot).toBeVisible();
  }

  async filterByStatus(status: 'Todos' | 'Ativos' | 'Em breve' | 'Encerrados' | 'Histórico' | 'Cancelados' | string): Promise<void> {
    const pattern = status === 'Ativos' ? 'Ativos|Em breve|active|upcoming' : status;
    const chip = this.page.getByRole('button', { name: new RegExp(pattern, 'i') })
      .or(this.page.getByTestId(new RegExp(`status-filter-.*(${status.toLowerCase()}|active|upcoming).*`, 'i')))
      .or(this.filterChips.filter({ hasText: new RegExp(pattern, 'i') }));
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
