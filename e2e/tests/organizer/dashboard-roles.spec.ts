import { test, expect } from '../../fixtures/test.fixture';
import { setupMockAuthSession } from '../../helpers/auth-mock.helper';

/** Meus eventos: what the person organizes and what they help with, in date order. */
const event = (id: string, title: string, days: number, owner = 'test-user-uid') => ({
  id,
  title,
  category: 'Natal',
  date: new Date(Date.now() + 86400000 * days).toISOString(),
  location: 'Rua A, 1',
  status: 'active',
  createdBy: owner,
  collaborators: owner === 'test-user-uid' ? [] : ['test-user-uid'],
  guests: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

test.describe('Meus eventos', () => {
  test('tags the events the person helps with, filters by role and orders by date', async ({
    page,
  }) => {
    await setupMockAuthSession(page, {
      uid: 'test-user-uid',
      email: 'organizer@organizaai.test',
      displayName: 'Luiz',
      events: [
        event('a', 'Primeiro', 3),
        event('b', 'Casamento da Ana', 20, 'ana-uid'),
        event('c', 'Terceiro', 60),
      ],
    });
    await page.goto('/meus-eventos');

    const cards = page.getByTestId('organizer-event-card');
    await expect(cards).toHaveCount(3);
    await expect(page.getByTestId('dashboard-page')).toContainText(
      '2 eventos que você organiza · 1 em que você colabora',
    );
    await expect(
      cards.filter({ hasText: 'Casamento da Ana' }).getByTestId('event-role'),
    ).toHaveText(/Colaborador\(a\)/);
    await expect(cards.filter({ hasText: 'Primeiro' }).getByTestId('event-role')).toHaveCount(0);

    // "Colaboro" alone, then "Organizo" alone; neither on shows them all.
    await page.getByTestId('role-filter-collaborator').click();
    await expect(cards).toHaveCount(1);
    await page.getByTestId('role-filter-collaborator').click();
    await page.getByTestId('role-filter-owner').click();
    await expect(cards).toHaveCount(2);
    await page.getByTestId('role-filter-owner').click();
    await expect(cards).toHaveCount(3);

    // Oldest first by default; the arrow turns the order around.
    await expect(cards.first()).toContainText('Primeiro');
    await page.getByTestId('date-order-btn').click();
    await expect(cards.first()).toContainText('Terceiro');
  });

  test('an event without items shows one plain line of guests, nothing to open', async ({
    page,
  }) => {
    await setupMockAuthSession(page, {
      uid: 'test-user-uid',
      email: 'organizer@organizaai.test',
      displayName: 'Luiz',
      events: [event('a', 'Sem itens', 5)],
    });
    await page.goto('/meus-eventos');

    const card = page.getByTestId('organizer-event-card').first();
    const line = card.getByTestId('dashboard-progress-line');
    await expect(line).toBeVisible();
    await expect(line).toContainText('Convidados confirmados');
    await expect(card.getByText('Progresso')).toHaveCount(0);
    await expect(card.getByText('Itens completos')).toHaveCount(0);
    await card.screenshot({ path: 'e2e/screenshots/dashboard-progress-line.png' });
  });
});
