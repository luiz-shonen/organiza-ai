import { test, expect } from '../../fixtures/test.fixture';
import { setupMockAuthSession, type MockDocument } from '../../helpers/auth-mock.helper';

/**
 * "Adicionar alguém à mão" in "Confirmados": the organizers put someone on the list without them
 * answering the invite, then edit or remove them. Guests never see it.
 */
const EVENT_ID = 'natal-familia';

const tia: MockDocument = {
  id: 'tia-uid',
  uid: 'tia-uid',
  name: 'Tia Lurdes',
  phone: '(11) 96666-1111',
  isConfirmed: true,
  confirmedAt: new Date().toISOString(),
  companionsCount: 0,
};

function party(guests: MockDocument[] = [tia]) {
  return {
    id: EVENT_ID,
    title: 'Natal da família',
    category: 'Natal',
    description: 'Ceia na casa da vó.',
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
  };
}

function readGuests(page: import('@playwright/test').Page) {
  return page.evaluate(
    (path) =>
      (window as unknown as { __MOCK_DOCUMENTS__: Record<string, MockDocument[]> })
        .__MOCK_DOCUMENTS__[path] ?? [],
    `events/${EVENT_ID}/guests`,
  );
}

test.describe('Adicionar alguém à mão em Confirmados', () => {
  test('the organizer adds, edits and removes someone, and they count', async ({ page }) => {
    await setupMockAuthSession(page, {
      uid: 'owner-uid',
      email: 'owner@organizaai.test',
      displayName: 'Dona da festa',
      events: [party()],
    });
    await page.goto(`/evento/${EVENT_ID}`);

    const card = page.getByTestId('guest-list-card');
    // Tia Lurdes and the host, who always goes.
    await expect(card.getByTestId('card-header-count')).toHaveText('2');

    await card.getByTestId('guest-manual-add-btn').click();
    const sheet = page.getByTestId('manual-guest-sheet');
    await sheet.getByTestId('manual-guest-name-input').fill('Vó Cida');
    await sheet.getByTestId('manual-guest-companion-input').fill('Seu Zé');
    await sheet.getByTestId('manual-guest-companion-add').click();
    await expect(sheet.getByTestId('manual-guest-companions')).toContainText('Seu Zé');
    await sheet.screenshot({ path: 'e2e/screenshots/manual-guest-sheet.png' });
    await sheet.getByTestId('manual-guest-submit-btn').click();

    // Vó Cida and Seu Zé join Tia Lurdes and the host: 4 people, shown like anyone else.
    await expect(card.getByTestId('card-header-count')).toHaveText('4');
    const cida = card.getByTestId('guest-household').filter({ hasText: 'Vó Cida' });
    await expect(cida).toBeVisible();
    await expect(cida.getByTestId('guest-manual-tag')).toHaveCount(0);
    const added = (await readGuests(page)).find((g) => g['name'] === 'Vó Cida');
    expect(added?.['addedBy']).toBe('owner-uid');
    expect(added?.['uid']).toBeUndefined();

    // Edit: Seu Zé no longer goes.
    await card.getByTestId('guest-list-fold-all').click();
    await cida.getByTestId('guest-manual-edit-btn').click();
    await expect(sheet.getByTestId('manual-guest-name-input')).toHaveValue('Vó Cida');
    await sheet.getByRole('button', { name: 'Tirar Seu Zé' }).click();
    await sheet.getByTestId('manual-guest-submit-btn').click();
    await expect(card.getByTestId('card-header-count')).toHaveText('3');

    // Remove, after confirming.
    await cida.getByTestId('guest-manual-remove-btn').click();
    const dialog = page.getByTestId('org-confirm-dialog');
    await expect(dialog).toContainText('Remover Vó Cida?');
    await dialog.getByRole('button', { name: 'Remover' }).click();
    // Tia Lurdes and the host stay.
    await expect(card.getByTestId('guest-household')).toHaveCount(2);
    expect((await readGuests(page)).map((g) => g.id)).toEqual(['tia-uid']);
  });

  test('a guest sees who was added by hand, but cannot add, edit or remove', async ({ page }) => {
    const cida: MockDocument = {
      id: 'manual-1',
      name: 'Vó Cida',
      phone: '',
      companions: [],
      companionsCount: 0,
      isConfirmed: true,
      confirmedAt: new Date().toISOString(),
      addedBy: 'owner-uid',
    };
    await setupMockAuthSession(page, {
      uid: 'tia-uid',
      email: 'tia@organizaai.test',
      displayName: 'Tia Lurdes',
      events: [party([tia, cida])],
    });
    await page.goto(`/evento/${EVENT_ID}`);

    const card = page.getByTestId('guest-list-card');
    await expect(card).toContainText('Vó Cida');
    // Tia Lurdes, Vó Cida and the host.
    await expect(card.getByTestId('card-header-count')).toHaveText('3');
    await expect(card.getByTestId('guest-manual-add-btn')).toHaveCount(0);
    await expect(card.getByTestId('guest-manual-tag')).toHaveCount(0);
    await expect(card.getByTestId('guest-manual-edit-btn')).toHaveCount(0);
  });
});
