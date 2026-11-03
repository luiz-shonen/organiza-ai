import { test, expect } from '../fixtures/test.fixture';
import { GUEST_UID, buildGuestEvent } from '../fixtures/mock-events';
import { mockFirestoreDocuments, setupMockAuthSession } from '../helpers/auth-mock.helper';
import type { MockEvent } from '../helpers/auth-mock.helper';
import { assertNoHorizontalOverflow } from '../helpers/design-tokens.helper';

/**
 * The invite and guest behaviour of the redesign: filter chips, event states by start time,
 * the RSVP drawer, declining with a message, "Quem vai", and the profile companion history.
 * Each test builds its own state; see docs/knowledge/decisions/events-and-invites.md.
 */
const inDays = (days: number): string => new Date(Date.now() + 86400000 * days).toISOString();
const hoursAgo = (hours: number): string => new Date(Date.now() - 3600000 * hours).toISOString();

const invite = (id: string, title: string, date: string, extra: Partial<MockEvent> = {}) =>
  buildGuestEvent({ id, title, date, guests: [], ...extra });

async function asGuest(
  page: Parameters<typeof setupMockAuthSession>[0],
  events: MockEvent[],
  profile: Record<string, unknown> = {},
): Promise<void> {
  await setupMockAuthSession(page, {
    uid: GUEST_UID,
    email: 'convidada@exemplo.com',
    displayName: 'Convidada E2E',
    events,
    userProfile: {
      id: GUEST_UID,
      name: 'Convidada E2E',
      phone: '(11) 93333-3333',
      invitedEvents: events.map((event) => event.id),
      ...profile,
    },
    familyMembers: [
      { id: 'fam-1', name: 'Marta', relationship: 'child', createdAt: '' },
      { id: 'fam-2', name: 'Pedro', relationship: 'spouse', createdAt: '' },
    ],
  });
}

test.describe('Invites, event states and guests', () => {
  test('Início filter chips start on "Todos" and combine', async ({ page }) => {
    const pending = invite('evt-pending', 'Aniversário pendente', inDays(10));
    const past = invite('evt-past', 'Churrasco passado', inDays(-5));
    await asGuest(page, [pending, past]);
    await page.goto('/');

    const chip = (id: string) => page.getByTestId(`home-filter-${id}`);
    const titles = page.locator('.event-summary-card__title');
    await expect(chip('all')).toHaveClass(/mat-mdc-chip-selected/);
    await expect(titles).toHaveText(['Aniversário pendente']);

    await chip('pending').locator('button').click();
    await chip('past').locator('button').click();
    await expect(chip('all')).not.toHaveClass(/mat-mdc-chip-selected/);
    await expect(titles).toHaveText(['Aniversário pendente', 'Churrasco passado']);
    await expect(page.locator('#home-list-title')).toContainText('Eventos filtrados');

    await chip('all').locator('button').click();
    await expect(chip('pending')).not.toHaveClass(/mat-mdc-chip-selected/);
    await expect(page.locator('#home-list-title')).toContainText('Próximos eventos');
    await assertNoHorizontalOverflow(page);
  });

  test('Meus eventos tags "Em breve", "Agendado" and "Realizado" by start time', async ({
    page,
  }) => {
    const owned = (id: string, title: string, date: string) =>
      buildGuestEvent({ id, title, date, createdBy: GUEST_UID, guests: [], items: [] });
    await asGuest(page, [
      owned('evt-soon', 'Em três dias', inDays(3)),
      owned('evt-far', 'Daqui a meses', inDays(168)),
      owned('evt-today', 'Hoje mais cedo', hoursAgo(1)),
    ]);
    await page.goto('/meus-eventos');

    const card = (title: string) =>
      page.locator('app-event-summary-card').filter({ hasText: title });
    await expect(card('Em três dias').getByTestId('event-status')).toHaveText('Em breve');
    await expect(card('Daqui a meses').getByTestId('event-status')).toHaveText('Agendado');
    await expect(card('Hoje mais cedo').getByTestId('event-status')).toHaveText('Realizado');
    // The banner skips the event that already started.
    await expect(page.getByTestId('next-event-banner')).toContainText('Em três dias');

    await page.getByTestId('status-filter-scheduled-chip').locator('button').click();
    await expect(page.locator('.event-summary-card__title')).toHaveText(['Daqui a meses']);
  });

  test('category tags have their own colour, status tags stay filled', async ({ page }) => {
    await asGuest(page, [invite('evt-natal', 'Ceia de Natal', inDays(10), { category: 'Natal' })]);
    await page.goto('/');

    const tags = page.locator('app-event-summary-card .org-badge');
    await expect(tags.first()).toHaveClass(/org-badge--category/);
    await expect(tags.nth(1)).toHaveClass(/org-badge--warning/);
  });

  test('a visitor is sent to sign in and back to the invite', async ({ page }) => {
    await mockFirestoreDocuments(page, { events: [buildGuestEvent()] });
    await page.goto('/evento/e2e-guest-event');

    await page.getByTestId('rsvp-action-btn').locator('button').click();
    await expect(page).toHaveURL(/\/login\?redirect=%2Fevento%2Fe2e-guest-event/);
  });

  test('the RSVP drawer shows the profile name, family before companions', async ({ page }) => {
    await asGuest(page, [invite('evt-rsvp', 'Festa da família', inDays(10))]);
    await page.goto('/evento/evt-rsvp');

    await page.getByTestId('rsvp-action-btn').locator('button').click();
    const drawer = page.getByTestId('rsvp-drawer');
    await expect(drawer.getByTestId('rsvp-guest-name')).toContainText('Convidada E2E');
    await expect(drawer.getByTestId('rsvp-name-input')).toHaveCount(0);
    await expect(drawer.getByLabel(/WhatsApp/)).toHaveValue('(11) 93333-3333');

    const family = drawer.getByTestId('family-selector');
    const companions = drawer.getByTestId('companion-selector');
    const familyBox = await family.boundingBox();
    const companionsBox = await companions.boundingBox();
    expect(familyBox!.y).toBeLessThan(companionsBox!.y);

    await companions.getByText('Levar acompanhantes?').click();
    await companions.getByRole('button', { name: 'Novo acompanhante' }).click();
    await companions.getByLabel('Nome do acompanhante').fill('Soraya');
    await companions.getByRole('button', { name: 'Adicionar' }).click();
    await expect(companions).toContainText('+1');
  });

  test('declining leaves a message and the invite shows as declined', async ({ page }) => {
    await asGuest(page, [invite('evt-decline', 'Casamento da prima', inDays(30))]);
    await page.goto('/evento/evt-decline');

    await page.getByTestId('rsvp-decline-btn').locator('button').click();
    await page
      .getByTestId('rsvp-decline-form')
      .locator('textarea')
      .fill('Agradeço o convite, mas vou estar viajando.');
    await page.getByTestId('rsvp-decline-send-btn').locator('button').click();

    await expect(page.getByTestId('rsvp-card')).toContainText('Você recusou este convite');
    const decline = await page.evaluate(
      (uid) =>
        (
          window as unknown as {
            __MOCK_DOCUMENTS__: Record<string, { id: string; message?: string }[]>;
          }
        ).__MOCK_DOCUMENTS__['events/evt-decline/declines']?.find((doc) => doc.id === uid),
      GUEST_UID,
    );
    expect(decline?.message).toBe('Agradeço o convite, mas vou estar viajando.');
  });

  test('"Quem vai" shows each household and hides phones from guests', async ({ page }) => {
    const event = buildGuestEvent({ id: 'evt-guests' });
    await asGuest(page, [event]);
    await page.goto('/evento/evt-guests');

    const card = page.getByTestId('guest-list-card');
    await expect(card).toContainText('Quem vai');
    await expect(card.getByTestId('guest-household').first()).toBeVisible();
    await expect(card).not.toContainText('91111');
    await expect(card.getByRole('button', { name: 'Baixar a lista em Excel' })).toHaveCount(0);
  });

  test('the organizer sees phones and the export in "Quem vai"', async ({ page }) => {
    const event = buildGuestEvent({ id: 'evt-mine', createdBy: GUEST_UID });
    await asGuest(page, [event]);
    await page.goto('/evento/evt-mine');

    const card = page.getByTestId('guest-list-card');
    await expect(card.getByRole('button', { name: 'Baixar a lista em Excel' })).toBeVisible();
    await expect(card).toContainText('(11) 91111-1111');
  });

  test('the header switches between light and dark', async ({ page }) => {
    await asGuest(page, []);
    await page.goto('/');

    await page.getByTestId('theme-dark-btn').click();
    await expect(page.locator('html')).toHaveClass(/dark/);
    await page.getByTestId('theme-light-btn').click();
    await expect(page.locator('html')).not.toHaveClass(/dark/);
  });

  test('the profile keeps the companion history in "Meus acompanhantes"', async ({ page }) => {
    await asGuest(page, [], { savedCompanions: ['Carlos'] });
    await page.goto('/perfil');

    const roster = page.getByTestId('companion-roster');
    await expect(roster.getByTestId('companion-roster-item')).toHaveCount(1);
    await expect(roster.getByTestId('companion-roster-item')).toContainText('Carlos');
    await roster.getByLabel('Nome do acompanhante').fill('Soraya');
    await roster.getByRole('button', { name: 'Adicionar acompanhante' }).click();
    await expect(roster.getByTestId('companion-roster-item')).toHaveCount(2);
    await expect(roster.getByTestId('companion-roster-item').nth(1)).toContainText('Soraya');
    await assertNoHorizontalOverflow(page);
  });
});
