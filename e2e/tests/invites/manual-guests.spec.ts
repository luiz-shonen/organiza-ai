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

function party(guests: MockDocument[] = [tia], extra: Record<string, unknown> = {}) {
  return {
    ...extra,
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

function readDocs(page: import('@playwright/test').Page, collection: string) {
  return page.evaluate(
    (path) =>
      (window as unknown as { __MOCK_DOCUMENTS__: Record<string, MockDocument[]> })
        .__MOCK_DOCUMENTS__[path] ?? [],
    `events/${EVENT_ID}/${collection}`,
  );
}

function readGuests(page: import('@playwright/test').Page) {
  return readDocs(page, 'guests');
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
    await expect(card.getByTestId('card-header-count')).toHaveText('1');

    await card.getByTestId('guest-manual-add-btn').click();
    const sheet = page.getByTestId('manual-guest-sheet');
    await sheet.getByTestId('manual-guest-name-input').fill('Vó Cida');

    // "Levar familiares?": a relative typed right here, kept only on this event.
    await sheet.getByText('Levar familiares?').click();
    await sheet.getByRole('button', { name: 'Novo membro' }).click();
    await sheet.getByTestId('inline-family-member-name-input').fill('Lia');
    await sheet.getByTestId('inline-family-member-relationship-input').click();
    await page.getByRole('option', { name: 'Filho(a)' }).click();
    await sheet.getByTestId('inline-family-member-save-btn').click();
    await expect(sheet.getByTestId('family-selector-member')).toContainText('Lia');

    // "Levar acompanhantes?", the same panel as "Editar presença".
    await sheet.getByText('Levar acompanhantes?').click();
    await sheet.getByTestId('companion-new-btn').click();
    await sheet.getByTestId('companion-name-input').fill('Seu Zé');
    await sheet.getByTestId('companion-add-btn').click();
    await sheet.screenshot({
      path: 'e2e/screenshots/manual-guest-sheet.png',
      animations: 'disabled',
    });
    await sheet.getByTestId('manual-guest-submit-btn').click();

    // Vó Cida, Lia and Seu Zé join Tia Lurdes: 4 people, shown like anyone else.
    await expect(card.getByTestId('card-header-count')).toHaveText('4');
    const cida = card.getByTestId('guest-household').filter({ hasText: 'Vó Cida' });
    await expect(cida).toBeVisible();
    await expect(cida.getByTestId('guest-manual-tag')).toHaveCount(0);
    const guests = await readGuests(page);
    const added = guests.find((g) => g['name'] === 'Vó Cida');
    expect(added?.['addedBy']).toBe('owner-uid');
    expect(added?.['uid']).toBeUndefined();
    const lia = guests.find((g) => g['name'] === 'Lia');
    expect(lia?.['primaryGuestId']).toBe(added?.id);
    expect(lia?.['relationship']).toBe('child');

    // Edit: Seu Zé and Lia no longer go.
    await card.getByTestId('guest-list-fold-all').click();
    await cida.getByTestId('guest-manual-edit-btn').click();
    await expect(sheet.getByTestId('manual-guest-name-input')).toHaveValue('Vó Cida');
    await sheet.getByText('Levar acompanhantes?').click();
    await sheet.getByRole('checkbox', { name: 'Seu Zé' }).uncheck();
    await sheet.getByText('Levar familiares?').click();
    await sheet.getByRole('checkbox', { name: 'Lia' }).uncheck();
    await sheet.getByTestId('manual-guest-submit-btn').click();
    await expect(card.getByTestId('card-header-count')).toHaveText('2');
    expect((await readGuests(page)).some((g) => g['name'] === 'Lia')).toBe(false);

    // Remove, after confirming.
    await cida.getByTestId('guest-manual-remove-btn').click();
    const dialog = page.getByTestId('org-confirm-dialog');
    await expect(dialog).toContainText('Remover Vó Cida?');
    await dialog.getByRole('button', { name: 'Remover' }).click();
    await expect(card.getByTestId('guest-household')).toHaveCount(1);
    expect((await readGuests(page)).map((g) => g.id)).toEqual(['tia-uid']);
  });

  test('adding by hand also puts them in the amigo oculto, as at the first confirmation', async ({
    page,
  }) => {
    await setupMockAuthSession(page, {
      uid: 'owner-uid',
      email: 'owner@organizaai.test',
      displayName: 'Dona da festa',
      events: [
        party([tia], { secretSanta: { enabled: true, giftOptions: true, maxGiftOptions: 2 } }),
      ],
    });
    await page.goto(`/evento/${EVENT_ID}`);

    const card = page.getByTestId('guest-list-card');
    await card.getByTestId('guest-manual-add-btn').click();
    const sheet = page.getByTestId('manual-guest-sheet');
    await sheet.getByTestId('manual-guest-name-input').fill('Vó Cida');
    await sheet.getByTestId('manual-guest-phone-input').fill('11977771111');
    const santa = sheet.getByTestId('manual-guest-santa');
    await expect(santa).toContainText('Quem vai participar do sorteio?');
    await santa.getByRole('checkbox', { name: 'Vó Cida' }).check();
    await santa.getByTestId('manual-guest-santa-0-gift-input').fill('Chinelo 36');
    await sheet.screenshot({
      path: 'e2e/screenshots/manual-guest-santa.png',
      animations: 'disabled',
    });
    await sheet.getByTestId('manual-guest-submit-btn').click();

    await expect(card.getByTestId('card-header-count')).toHaveText('2');
    await expect
      .poll(async () => (await readDocs(page, 'secretSantaParticipants')).map((p) => p['name']))
      .toEqual(['Vó Cida']);
    const [entry] = await readDocs(page, 'secretSantaParticipants');
    expect(entry['phone']).toBe('(11) 97777-1111');
    expect(entry['giftOptions']).toEqual(['Chinelo 36']);
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
    await expect(card.getByTestId('card-header-count')).toHaveText('2');
    await expect(card.getByTestId('guest-manual-add-btn')).toHaveCount(0);
    await expect(card.getByTestId('guest-manual-tag')).toHaveCount(0);
    await expect(card.getByTestId('guest-manual-edit-btn')).toHaveCount(0);
  });
});
