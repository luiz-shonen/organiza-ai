import { test, expect } from '../../fixtures/test.fixture';
import { setupMockAuthSession, type MockDocument } from '../../helpers/auth-mock.helper';

/**
 * "Aprovar quem confirma pelo link": off by default; when the owner turns it on, each new
 * confirmation waits ("Aguardando aprovação") until approved or refused.
 */
const EVENT_ID = 'aniversario-vo';

function party(extra: Record<string, unknown> = {}, guests: MockDocument[] = []) {
  return {
    id: EVENT_ID,
    title: 'Aniversário da vó',
    category: 'Aniversário',
    description: 'Almoço na casa da vó.',
    date: new Date(Date.now() + 86400000 * 30).toISOString(),
    location: 'Rua das Palmeiras, 100 - Centro - São Paulo/SP - CEP: 01310-100',
    addressDetails: {
      cep: '01310-100',
      address: 'Rua das Palmeiras',
      number: '100',
      neighborhood: 'Centro',
      city: 'São Paulo/SP',
    },
    pixKey: null,
    status: 'active',
    createdBy: 'owner-uid',
    creatorEmail: 'owner@organizaai.test',
    collaborators: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    guests,
    ...extra,
  };
}

type MockStore = Record<string, MockDocument[]>;

function readStore(page: import('@playwright/test').Page) {
  return page.evaluate(
    () =>
      (window as unknown as { __MOCK_DOCUMENTS__: Record<string, unknown[]> }).__MOCK_DOCUMENTS__,
  ) as Promise<MockStore>;
}

const waiting: MockDocument = {
  id: 'primo-uid',
  uid: 'primo-uid',
  name: 'Primo Carlos',
  phone: '(11) 97777-0000',
  isConfirmed: true,
  confirmedAt: new Date().toISOString(),
  companionsCount: 1,
  companions: [{ name: 'Bia' }],
  approved: false,
};
const approved: MockDocument = {
  id: 'tia-uid',
  uid: 'tia-uid',
  name: 'Tia Lurdes',
  phone: '(11) 96666-1111',
  isConfirmed: true,
  confirmedAt: new Date().toISOString(),
  companionsCount: 0,
};

test.describe('Aprovar quem confirma pelo link', () => {
  test('is off by default, and the owner turns it on in the editor', async ({
    page,
    eventEditorPage,
  }) => {
    await setupMockAuthSession(page, {
      uid: 'owner-uid',
      email: 'owner@organizaai.test',
      displayName: 'Dona da festa',
      events: [party()],
    });
    await page.goto(`/meus-eventos/evento/${EVENT_ID}`);
    await eventEditorPage.assertLoaded();

    const approval = page.getByTestId('event-approval');
    await expect(approval).toContainText('Qualquer pessoa com o link confirma presença na hora.');
    await approval.getByTestId('event-approval-toggle').locator('button').click();
    await expect(approval).toContainText('Cada confirmação fica esperando você aprovar');
    await approval.screenshot({ path: 'e2e/screenshots/approval-toggle.png' });

    await eventEditorPage.saveEvent();
    await expect(page).toHaveURL(/\/meus-eventos$/);
    const saved = (await readStore(page))['events'].find((e) => e.id === EVENT_ID);
    expect(saved?.['requireApproval']).toBe(true);
  });

  test('a new confirmation waits, and does not count yet', async ({ page }) => {
    await setupMockAuthSession(page, {
      uid: 'primo-uid',
      email: 'primo@organizaai.test',
      displayName: 'Primo Carlos',
      events: [party({ requireApproval: true }, [approved])],
    });
    await page.goto(`/evento/${EVENT_ID}`);

    await page.getByTestId('rsvp-action-btn').locator('button').click();
    await page.getByTestId('rsvp-confirm-btn').locator('button').click();

    await expect(page.getByTestId('rsvp-card')).toContainText('Aguardando aprovação');
    await expect(page.getByTestId('rsvp-pending-approval')).toContainText(
      'Quem organiza este evento aprova cada presença',
    );
    await page
      .getByTestId('rsvp-card')
      .screenshot({ path: 'e2e/screenshots/approval-waiting.png' });
    // Only Tia Lurdes counts on "Quem vai".
    await expect(page.getByTestId('guest-list-card')).toContainText('1 confirmado');
    const mine = (await readStore(page))[`events/${EVENT_ID}/guests`].find(
      (g) => g.id === 'primo-uid',
    );
    expect(mine?.['approved']).toBe(false);
  });

  test('the organizer approves or refuses each waiting confirmation', async ({ page }) => {
    const another: MockDocument = {
      ...waiting,
      id: 'estranho-uid',
      uid: 'estranho-uid',
      name: 'Fulano',
      companions: [],
      companionsCount: 0,
    };
    await setupMockAuthSession(page, {
      uid: 'owner-uid',
      email: 'owner@organizaai.test',
      displayName: 'Dona da festa',
      events: [party({ requireApproval: true }, [approved, waiting, another])],
    });
    await page.goto(`/evento/${EVENT_ID}`);

    const card = page.getByTestId('guest-list-card');
    const pending = card.getByTestId('guest-pending');
    await expect(pending).toContainText('Aguardando aprovação (2)');
    await expect(card).toContainText('1 confirmado');
    await pending.screenshot({ path: 'e2e/screenshots/approval-pending-list.png' });

    const primo = pending.getByTestId('guest-pending-row').filter({ hasText: 'Primo Carlos' });
    await expect(primo).toContainText('2 pessoas');
    await primo.getByTestId('guest-approve-btn').click();
    await expect(card).toContainText('3 confirmados');

    const fulano = pending.getByTestId('guest-pending-row').filter({ hasText: 'Fulano' });
    await fulano.getByTestId('guest-refuse-btn').click();
    await page.getByRole('button', { name: 'Recusar' }).last().click();
    await expect(card.getByTestId('guest-pending')).toHaveCount(0);

    const guests = (await readStore(page))[`events/${EVENT_ID}/guests`];
    expect(guests.map((g) => g.id).sort()).toEqual(['primo-uid', 'tia-uid']);
    expect(guests.find((g) => g.id === 'primo-uid')?.['approved']).toBe(true);
  });
});
