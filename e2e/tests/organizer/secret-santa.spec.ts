import { test, expect } from '../../fixtures/test.fixture';
import {
  mockFirestoreDocuments,
  setupMockAuthSession,
  type MockDocument,
} from '../../helpers/auth-mock.helper';

const EVENT_ID = 'natal-2026';

function christmasEvent(secretSanta?: {
  enabled: boolean;
  giftOptions: boolean;
  maxGiftOptions?: number;
  drawDate?: string;
}) {
  return {
    id: EVENT_ID,
    title: 'Natal 2026 da família',
    category: 'Natal',
    description: 'Ceia e amigo oculto na casa da vó.',
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
    createdBy: 'test-user-uid',
    creatorEmail: 'organizer@organizaai.test',
    collaborators: ['collab-uid'],
    ...(secretSanta ? { secretSanta } : {}),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    guests: [
      {
        id: 'guest-jessica',
        uid: 'guest-jessica',
        name: 'Jéssica Melo',
        phone: '(11) 98888-1111',
        isConfirmed: true,
        confirmedAt: new Date().toISOString(),
        companionsCount: 0,
      },
    ],
  };
}

const participants: MockDocument[] = [
  // Jéssica's entry tied to her account (`guestId`), so she is also told in the app.
  {
    id: 'p1',
    name: 'Jéssica Melo',
    phone: '(11) 98888-1111',
    giftOptions: [],
    guestId: 'guest-jessica',
    createdAt: '1',
  },
  { id: 'p2', name: 'Luiz', phone: '(11) 97777-2222', giftOptions: ['Livro'], createdAt: '2' },
  { id: 'p3', name: 'Vó Maria', phone: '', giftOptions: [], createdAt: '3' },
];

type MockStore = Record<string, MockDocument[]>;

function readStore(page: import('@playwright/test').Page) {
  return page.evaluate(
    () =>
      (window as unknown as { __MOCK_DOCUMENTS__: Record<string, unknown[]> }).__MOCK_DOCUMENTS__,
  ) as Promise<MockStore>;
}

test.describe('Amigo oculto', () => {
  test('typing a name offers people from my other events, with their phone', async ({ page }) => {
    const lastYear = {
      ...christmasEvent(),
      id: 'natal-2025',
      title: 'Natal 2025',
      date: new Date(Date.now() - 86400000 * 330).toISOString(),
      guests: [
        {
          id: 'guest-gustavo',
          name: 'Gustavo Pereira',
          phone: '(31) 99999-0000',
          isConfirmed: true,
          companions: [{ name: 'Bia' }],
        },
      ],
    };
    await setupMockAuthSession(page, {
      uid: 'test-user-uid',
      email: 'organizer@organizaai.test',
      displayName: 'Luiz Organizer',
      events: [christmasEvent({ enabled: true, giftOptions: false }), lastYear],
    });
    // Participants are handled on the event page, in the amigo oculto section.
    await page.goto(`/evento/${EVENT_ID}`);
    const people = page.getByTestId('secret-santa-people');

    // By hand is the exception, behind "Adicionar alguém à mão".
    await page.locator('[data-testid="secret-santa-manual-btn"]:visible').click();
    await page.getByTestId('santa-name-input').fill('gus');
    const option = page.getByTestId('org-text-field-suggestion').filter({ hasText: 'Gustavo' });
    await expect(option).toContainText('(31) 99999-0000');
    await page.screenshot({ path: 'e2e/screenshots/secret-santa-known-people.png' });
    await option.click();
    await expect(page.getByTestId('santa-name-input')).toHaveValue('Gustavo Pereira');
    await expect(page.getByTestId('santa-phone-input')).toHaveValue('(31) 99999-0000');
  });

  test('the organizer turns it on in the editor, with gift options and how many', async ({
    page,
    eventEditorPage,
  }) => {
    await setupMockAuthSession(page, {
      uid: 'test-user-uid',
      email: 'organizer@organizaai.test',
      displayName: 'Luiz Organizer',
      events: [christmasEvent()],
    });
    await page.goto(`/meus-eventos/evento/${EVENT_ID}`);
    await eventEditorPage.assertLoaded();

    // "Itens" opens with a question too; the event has no items, so it starts as "no".
    await eventEditorPage.openStep('Itens');
    const itemsStep = page.getByTestId('event-editor-step-3');
    await expect(itemsStep).toContainText('Os convidados vão levar alguma coisa?');
    await expect(itemsStep.getByTestId('item-name-input')).toHaveCount(0);
    await itemsStep.locator('.event-step__card').first().screenshot({
      path: 'e2e/screenshots/items-question.png',
    });
    await eventEditorPage.turnOnItems();

    await eventEditorPage.openStep('Amigo oculto');

    const step = page.getByTestId('event-editor-step-secret-santa');
    await step.getByTestId('secret-santa-toggle').locator('button').click();
    await step.getByTestId('secret-santa-gifts-toggle').click();
    // The organizer chooses how many options each person may list (3 unless changed).
    const giftLimit = step.getByTestId('secret-santa-gift-limit');
    await expect(giftLimit.getByTestId('quantity-value')).toHaveText('3');
    await giftLimit.getByRole('button', { name: 'Aumentar' }).click();
    await expect(giftLimit.getByTestId('quantity-value')).toHaveText('4');
    // Only the settings here: who takes part is on the event page.
    await expect(step).toContainText('você acompanha os participantes');
    await expect(step.getByTestId('secret-santa-manual')).toHaveCount(0);
    await step.locator('.event-step__card').first().screenshot({
      path: 'e2e/screenshots/secret-santa-gift-limit.png',
    });

    await eventEditorPage.saveEvent();
    await expect(page).toHaveURL(/\/meus-eventos$/);
    const store = await readStore(page);
    const saved = store['events'].find((e) => e.id === EVENT_ID);
    expect(saved?.['secretSanta']).toEqual({
      enabled: true,
      giftOptions: true,
      maxGiftOptions: 4,
    });
  });

  test('on the event page the organizer adds by hand only who will not join from the invite', async ({
    page,
  }) => {
    await setupMockAuthSession(page, {
      uid: 'test-user-uid',
      email: 'organizer@organizaai.test',
      displayName: 'Luiz Organizer',
      events: [christmasEvent({ enabled: true, giftOptions: true, maxGiftOptions: 4 })],
    });
    await page.goto(`/evento/${EVENT_ID}`);
    const people = page.getByTestId('secret-santa-people');

    // Confirmed guests join from the invite themselves (their entry and gift ideas are theirs):
    // the organizer is never offered to add them.
    await expect(people.getByTestId('secret-santa-suggestions')).toHaveCount(0);
    await expect(people).not.toContainText('Confirmados no evento');

    await page
      .locator('[data-testid="secret-santa-manual"]:visible')
      .screenshot({ path: 'e2e/screenshots/secret-santa-manual-closed.png' });
    await page.locator('[data-testid="secret-santa-manual-btn"]:visible').click();
    await page.getByTestId('santa-name-input').fill('Vó Maria');
    await page.getByTestId('santa-phone-input').fill('11977772222');
    // Gift ideas: each one typed and added with Enter (or +) joins the list above the field.
    const gift = page.getByTestId('santa-gift-input');
    await gift.fill('Chinelo, cor verde, tamanho 36');
    await gift.press('Enter');
    await expect(page.getByTestId('santa-gift-item')).toHaveCount(1);
    await expect(gift).toHaveValue('');
    await expect(page.getByTestId('santa-gift-list')).toContainText('1 de 4');
    // An idea added can be changed in place: the pencil opens it, Enter keeps it.
    await page.getByTestId('santa-gift-edit-btn').click();
    const editing = page.getByTestId('santa-gift-edit-input');
    await editing.fill('Chinelo, cor verde, tamanho 37');
    await editing.press('Enter');
    await expect(page.getByTestId('santa-gift-item')).toContainText('tamanho 37');
    // One still typed goes with the participant.
    await gift.fill('Livro de receitas');
    await page
      .getByTestId('santa-gift-list')
      .screenshot({ path: 'e2e/screenshots/secret-santa-gift-options.png' });
    await page
      .locator('app-secret-santa-participant-form')
      .first()
      .screenshot({ path: 'e2e/screenshots/secret-santa-participant-form.png' });
    await page.getByTestId('santa-submit-btn').click();

    const list = people.getByTestId('secret-santa-participants');
    await expect(list).toContainText('Vó Maria');
    // The ideas fold under the name: "Ver 2 ideias de presente" opens them.
    await list.getByTestId('gift-options-list-toggle').first().click();
    await expect(list.getByTestId('secret-santa-gifts')).toContainText(
      'Chinelo, cor verde, tamanho 37',
    );
    await expect(list.getByTestId('secret-santa-gifts')).toContainText('Livro de receitas');
    await expect(people.getByTestId('secret-santa-missing')).toContainText('Faltam 2');
    await page
      .getByTestId('secret-santa-card')
      .screenshot({ path: 'e2e/screenshots/secret-santa-event-people.png' });

    const store = await readStore(page);
    const saved = store[`events/${EVENT_ID}/secretSantaParticipants`];
    expect(saved.map((p) => p['name'])).toEqual(['Vó Maria']);
    expect(saved[0]['giftOptions']).toEqual([
      'Chinelo, cor verde, tamanho 37',
      'Livro de receitas',
    ]);
    expect(saved[0]['phone']).toBe('(11) 97777-2222');
  });

  test('adding someone already in the draw asks first: replace, another person, or not', async ({
    page,
  }) => {
    await setupMockAuthSession(page, {
      uid: 'test-user-uid',
      email: 'organizer@organizaai.test',
      displayName: 'Luiz Organizer',
      events: [christmasEvent({ enabled: true, giftOptions: false })],
      collections: { [`events/${EVENT_ID}/secretSantaParticipants`]: participants },
    });
    await page.goto(`/evento/${EVENT_ID}`);
    const people = page.getByTestId('secret-santa-people');
    const sheet = page.getByTestId('add-participant-sheet');
    const dialog = page.getByTestId('org-confirm-dialog');

    // Luiz's phone, typed by hand before: replace him with what is typed now.
    await page.locator('[data-testid="secret-santa-manual-btn"]:visible').click();
    await sheet.getByTestId('santa-name-input').fill('Luiz Rodrigues');
    await sheet.getByTestId('santa-phone-input').fill('11977772222');
    await sheet.getByTestId('santa-submit-btn').click();
    await expect(dialog).toContainText('Essa pessoa já está no amigo oculto');
    await expect(dialog).toContainText('Luiz já está no sorteio com o telefone (11) 97777-2222');
    await dialog.screenshot({ path: 'e2e/screenshots/secret-santa-same-person.png' });
    await dialog.getByTestId('org-confirm-submit').click();
    const store = async () => (await readStore(page))[`events/${EVENT_ID}/secretSantaParticipants`];
    await expect
      .poll(async () => (await store()).map((p) => p['name']))
      .toEqual(['Jéssica Melo', 'Luiz Rodrigues', 'Vó Maria']);

    // Jéssica is a confirmed guest: hers to change; adding means another person.
    await page.locator('[data-testid="secret-santa-manual-btn"]:visible').click();
    await sheet.getByTestId('santa-name-input').fill('Jéssica Melo');
    await sheet.getByTestId('santa-submit-btn').click();
    await expect(dialog).toContainText('entrou pelo convite');
    await expect(dialog.getByTestId('org-confirm-extra')).toHaveCount(0);
    await dialog.getByTestId('org-confirm-cancel').click();
    // Cancelled: nothing added, what was typed is still there.
    await expect(sheet.getByTestId('santa-name-input')).toHaveValue('Jéssica Melo');
    expect(await store()).toHaveLength(3);
  });

  test('the owner draws and sends each secret link by WhatsApp; drawing again asks first', async ({
    page,
  }) => {
    await setupMockAuthSession(page, {
      uid: 'test-user-uid',
      email: 'organizer@organizaai.test',
      displayName: 'Luiz Organizer',
      events: [christmasEvent({ enabled: true, giftOptions: true })],
      collections: { [`events/${EVENT_ID}/secretSantaParticipants`]: participants },
    });
    await page.goto(`/evento/${EVENT_ID}`);

    const card = page.getByTestId('secret-santa-card');
    await expect(card.getByTestId('secret-santa-count-tag')).toHaveText('3 no sorteio');
    await card.getByTestId('secret-santa-draw-btn').click();

    const links = card.getByTestId('secret-santa-links');
    await expect(links.locator('li')).toHaveCount(3);
    // What to do when a link shows as opened but the person says it was not them.
    await expect(card.getByTestId('secret-santa-leak-hint')).toContainText(
      'Um link aparece aberto e a pessoa diz que não abriu? Sorteie de novo.',
    );
    // Once drawn, the sign-ups and the list give way to the links; the card moves under
    // "Confirmados" (beside it on a wide screen), where the links have room.
    await expect(card.getByTestId('secret-santa-self-join')).toHaveCount(0);
    await expect(card.getByTestId('secret-santa-people')).toHaveCount(0);
    await expect(page.locator('.event-detail__lead app-secret-santa-card')).toHaveCount(1);
    // The owner sees whom to send each link to, never who drew whom: one name per row.
    const luizRow = links.locator('li').filter({ hasText: 'Luiz' });
    await expect(luizRow).not.toContainText('Jéssica');
    await expect(luizRow).not.toContainText('Vó Maria');

    // Jéssica has an account: she also got a notice in the app, with her own link.
    const jessicaRow = links.locator('li').filter({ hasText: 'Jéssica' });
    await expect(jessicaRow.getByTestId('secret-santa-in-app')).toHaveText('Avisado(a) no app');
    await expect(luizRow.getByTestId('secret-santa-in-app')).toHaveCount(0);
    const notices = (await readStore(page))['users/guest-jessica/notifications'];
    expect(notices).toHaveLength(1);
    expect(notices[0].id).toBe(`secret-santa_${EVENT_ID}`);
    expect(notices[0]['title']).toBe('Sorteio do amigo oculto feito!');
    expect(notices[0]['actionUrl']).toMatch(/^\/amigo-oculto\/[0-9a-f-]{36}$/);
    await page.screenshot({ path: 'e2e/screenshots/secret-santa-drawn.png' });

    const store = await readStore(page);
    const reveals = store['secretSantaReveals'];
    expect(reveals).toHaveLength(3);
    expect(reveals.every((r) => r['giverName'] !== r['receiverName'])).toBe(true);

    await page.evaluate(() => {
      const opened: string[] = [];
      Object.assign(window, { __openedUrls: opened });
      window.open = (url?: string | URL) => {
        opened.push(String(url));
        return null;
      };
    });
    await links
      .locator('li')
      .filter({ hasText: 'Luiz' })
      .getByRole('button', { name: 'Enviar no WhatsApp' })
      .click();
    const opened = await page.evaluate(
      () => (window as unknown as { __openedUrls: string[] }).__openedUrls[0] ?? '',
    );
    expect(opened).toContain('api.whatsapp.com/send?phone=5511977772222');
    const message = decodeURIComponent(opened);
    expect(message).toContain('Olá, *Luiz*!');
    expect(message).toContain('*Natal 2026 da família*');
    expect(message).toMatch(/\/amigo-oculto\/[\w-]+$/);
    expect(message).toContain('o link só abre uma vez');
    expect(message).toContain('Se precisar, peça um novo link');
    // The link is a random UUID, never a name.
    const luizToken = message.split('/amigo-oculto/')[1];
    expect(luizToken).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    await expect(links.getByTestId('secret-santa-link-status').first()).toHaveText(
      'Ainda não abriu',
    );

    // Luiz opened the link and did not write the name down: a new link, same person drawn.
    const luizReveal = reveals.find((r) => r.id === luizToken)!;
    await links
      .locator('li')
      .filter({ hasText: 'Luiz' })
      .getByRole('button', { name: 'Novo link' })
      .click();
    await expect(page.getByRole('dialog')).toContainText(
      'Com o novo link, Luiz pode ver de novo quem tirou (a mesma pessoa).',
    );
    await page.getByRole('dialog').getByRole('button', { name: 'Criar novo link' }).click();
    await expect
      .poll(async () => {
        const all = (await readStore(page))['secretSantaReveals'];
        const fresh = all.find((r) => r['giverName'] === 'Luiz');
        return (
          all.length === 3 &&
          !!fresh &&
          fresh.id !== luizToken &&
          fresh['receiverName'] === luizReveal['receiverName']
        );
      })
      .toBe(true);

    await card.getByTestId('secret-santa-redraw-btn').click();
    await expect(page.getByRole('dialog')).toContainText(
      'Os links enviados antes deixam de funcionar',
    );
    await page.getByRole('dialog').getByRole('button', { name: 'Sortear de novo' }).click();
    // The old links stop working: every token is new, and there are still three.
    const oldTokens = new Set(
      (await readStore(page))['secretSantaReveals'].map((r) => r.id).concat(luizToken),
    );
    await expect
      .poll(async () => {
        const tokens = (await readStore(page))['secretSantaReveals'].map((r) => r.id);
        return tokens.length === 3 && tokens.every((token) => !oldTokens.has(token));
      })
      .toBe(true);
  });

  test('the draw button waits for the draw day chosen for the event', async ({ page }) => {
    await setupMockAuthSession(page, {
      uid: 'test-user-uid',
      email: 'organizer@organizaai.test',
      displayName: 'Luiz Organizer',
      events: [christmasEvent({ enabled: true, giftOptions: false, drawDate: '2099-12-20' })],
      collections: { [`events/${EVENT_ID}/secretSantaParticipants`]: participants },
    });
    await page.goto(`/evento/${EVENT_ID}`);

    const card = page.getByTestId('secret-santa-card');
    await expect(card.getByTestId('secret-santa-draw-locked')).toContainText(
      'O sorteio fica liberado a partir de 20 de dezembro',
    );
    await expect(card.getByTestId('secret-santa-draw-btn')).toBeDisabled();
  });

  test('a renamed account shows its profile name in the draw links, the list and the declines', async ({
    page,
  }) => {
    await setupMockAuthSession(page, {
      uid: 'test-user-uid',
      email: 'organizer@organizaai.test',
      displayName: 'Luiz Organizer',
      events: [christmasEvent({ enabled: true, giftOptions: false })],
      collections: {
        [`events/${EVENT_ID}/secretSantaParticipants`]: participants,
        [`events/${EVENT_ID}/secretSanta`]: [
          {
            id: 'draw',
            drawnAt: new Date().toISOString(),
            participantIds: participants.map((p) => p.id),
            links: participants.map((p, i) => ({
              participantId: p.id,
              name: p['name'],
              phone: p['phone'],
              token: `tok-${i}`,
              receiverId: participants[(i + 1) % participants.length].id,
              ...(p.id === 'p1' ? { uid: 'guest-jessica' } : {}),
            })),
          },
        ],
        [`events/${EVENT_ID}/declines`]: [
          { id: 'fabio-uid', name: 'Fábio', message: '', declinedAt: new Date().toISOString() },
        ],
        // Both changed their name on the profile after answering.
        publicProfiles: [
          { id: 'guest-jessica', name: 'Jéssica Araújo' },
          { id: 'fabio-uid', name: 'Fábio Akita' },
        ],
      },
    });
    await page.goto(`/evento/${EVENT_ID}`);

    const links = page.getByTestId('secret-santa-links');
    await expect(links).toContainText('Jéssica Araújo');
    await expect(links).not.toContainText('Jéssica Melo');
    await expect(page.getByTestId('guests-declines')).toHaveText(/Fábio Akita/);
    await expect(page.getByTestId('guest-list-card')).toContainText('Jéssica Araújo');
  });

  test('a collaborator sees the participants but cannot draw', async ({ page }) => {
    await setupMockAuthSession(page, {
      uid: 'collab-uid',
      email: 'collab@organizaai.test',
      displayName: 'Ana Colaboradora',
      events: [christmasEvent({ enabled: true, giftOptions: false })],
      collections: { [`events/${EVENT_ID}/secretSantaParticipants`]: participants },
    });
    await page.goto(`/evento/${EVENT_ID}`);

    const card = page.getByTestId('secret-santa-card');
    await expect(card).toBeVisible();
    await expect(card.getByTestId('secret-santa-draw-btn')).toHaveCount(0);
  });

  test('a guest sees who is in the amigo oculto and their gift ideas, never the phones', async ({
    page,
  }) => {
    await setupMockAuthSession(page, {
      uid: 'guest-jessica',
      email: 'jessica@organizaai.test',
      displayName: 'Jéssica Melo',
      events: [christmasEvent({ enabled: true, giftOptions: true })],
      collections: {
        [`events/${EVENT_ID}/secretSantaRoster`]: [
          { id: 'p1', name: 'Jéssica Melo', giftOptions: [], createdAt: '1' },
          { id: 'p2', name: 'Luiz', giftOptions: ['Livro'], createdAt: '2' },
        ],
      },
    });
    await page.goto(`/evento/${EVENT_ID}`);

    const roster = page.getByTestId('secret-santa-roster');
    await expect(roster).toContainText('2 pessoas no sorteio');
    await expect(roster.getByTestId('secret-santa-roster-person')).toHaveCount(2);
    await roster.getByTestId('gift-options-list-toggle').first().click();
    await expect(roster).toContainText('Livro');
    await expect(roster).not.toContainText('(11)');
    // Managing the draw is the organizers' side: none of it here.
    await expect(page.getByTestId('secret-santa-card')).toHaveCount(0);
    await expect(page.getByTestId('secret-santa-people')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Editar evento', exact: true })).toHaveCount(0);
    await roster.screenshot({ path: 'e2e/screenshots/secret-santa-roster-guest.png' });
  });

  test('a guest edits their own gift ideas with the pencil in the amigo oculto card', async ({
    page,
  }) => {
    const own = {
      id: 'rsvp_guest-jessica',
      name: 'Jéssica Melo',
      phone: '(11) 98888-1111',
      giftOptions: ['Chinelo 39'],
      guestId: 'guest-jessica',
      joinedBy: 'guest-jessica',
      createdAt: '1',
    };
    await setupMockAuthSession(page, {
      uid: 'guest-jessica',
      email: 'jessica@organizaai.test',
      displayName: 'Jéssica Melo',
      events: [christmasEvent({ enabled: true, giftOptions: true, maxGiftOptions: 3 })],
      collections: {
        [`events/${EVENT_ID}/secretSantaParticipants`]: [own],
        [`events/${EVENT_ID}/secretSantaRoster`]: [
          { id: own.id, name: own.name, giftOptions: own.giftOptions, createdAt: '1' },
          { id: 'p2', name: 'Luiz', giftOptions: ['Livro'], createdAt: '2' },
        ],
      },
    });
    await page.goto(`/evento/${EVENT_ID}`);

    const roster = page.getByTestId('secret-santa-roster');
    // Only her own entry has the pencil.
    await expect(roster.getByTestId('secret-santa-roster-edit-btn')).toHaveCount(1);
    await roster.getByTestId('secret-santa-roster-edit-btn').click();

    const sheet = page.getByTestId('edit-own-santa-sheet');
    await expect(sheet.getByTestId('own-santa-gift-item')).toHaveCount(1);
    await sheet.getByTestId('own-santa-gift-input').fill('Bíblia');
    await sheet.getByTestId('own-santa-add-gift-btn').click();
    await expect(sheet.getByTestId('own-santa-gift-item')).toHaveCount(2);
    await sheet.screenshot({ path: 'e2e/screenshots/secret-santa-own-edit.png' });
    await sheet.getByTestId('own-santa-submit-btn').click();

    await expect(sheet).toBeHidden();
    // The gift ideas fold under each name: open them all.
    for (const toggle of await roster.getByTestId('gift-options-list-toggle').all()) {
      await toggle.click();
    }
    await expect(roster).toContainText('Bíblia');
    const store = await readStore(page);
    const saved = store[`events/${EVENT_ID}/secretSantaParticipants`].find((p) => p.id === own.id);
    expect(saved?.['giftOptions']).toEqual(['Chinelo 39', 'Bíblia']);
    expect(saved?.['joinedBy']).toBe('guest-jessica');
  });

  test('a participant opens the secret link without signing in and reveals whom they drew', async ({
    page,
  }) => {
    await mockFirestoreDocuments(page, {
      events: [christmasEvent({ enabled: true, giftOptions: true })],
      collections: {
        secretSantaReveals: [
          {
            id: 'token-jessica',
            eventId: EVENT_ID,
            eventTitle: 'Natal 2026 da família',
            eventDate: new Date().toISOString(),
            giverName: 'Jéssica Melo',
            receiverName: 'Luiz',
            receiverGiftOptions: ['Chinelo, cor verde, tamanho 36'],
            createdAt: new Date().toISOString(),
          },
        ],
      },
    });
    await page.goto('/amigo-oculto/token-jessica');

    // First, whose link it is: nothing is shown or spent before "Sou Jéssica, mostrar".
    const confirm = page.getByTestId('secret-santa-confirm');
    await expect(confirm).toContainText('Este link é de');
    await expect(page.getByTestId('secret-santa-owner')).toHaveText('Jéssica Melo');
    await expect(page.getByTestId('secret-santa-receiver')).toHaveCount(0);
    // The envelope unfolds and writes itself in: the picture waits for the paper to be done.
    await confirm.evaluate((el) =>
      Promise.all(el.getAnimations({ subtree: true }).map((animation) => animation.finished)),
    );
    await page.screenshot({ path: 'e2e/screenshots/secret-santa-confirm.png' });
    await page.getByTestId('secret-santa-confirm-btn').click();

    // Then the reveal: the party, the name in large type, gift options below.
    await expect(page.getByTestId('secret-santa-greeting')).toHaveText('Salve, Jéssica!');
    await expect(page.getByTestId('secret-santa-receiver')).toHaveText('Luiz');
    await expect(page.getByTestId('secret-santa-gifts')).toContainText(
      'Chinelo, cor verde, tamanho 36',
    );
    // Each idea can be searched on Mercado Livre and Amazon.
    const searches = page.getByTestId('secret-santa-gift-search');
    await expect(searches).toHaveCount(2);
    await expect(searches.first()).toHaveAttribute(
      'href',
      'https://lista.mercadolivre.com.br/Chinelo%2C-cor-verde%2C-tamanho-36',
    );
    await expect(searches.first().locator('img')).toHaveJSProperty('complete', true);
    await page
      .getByTestId('secret-santa-gifts')
      .screenshot({ path: 'e2e/screenshots/secret-santa-gift-search.png' });
    await expect(page.locator('canvas').first()).toBeAttached(); // canvas-confetti
    // The name lands (the glow and the stars around it keep twinkling: those never end).
    await page.getByTestId('secret-santa-result').evaluate((el) =>
      Promise.all(
        el
          .getAnimations({ subtree: true })
          .filter((animation) => animation.effect?.getComputedTiming().iterations !== Infinity)
          .map((animation) => animation.finished),
      ),
    );
    await page
      .getByTestId('secret-santa-result')
      .screenshot({ path: 'e2e/screenshots/secret-santa-reveal.png' });

    // "Esconder" covers the name when someone is looking; "Mostrar de novo" brings it back.
    await page.getByTestId('secret-santa-hide-btn').click();
    await expect(page.getByTestId('secret-santa-receiver')).toHaveCount(0);
    await page.getByTestId('secret-santa-reveal-btn').click();
    await expect(page.getByTestId('secret-santa-receiver')).toHaveText('Luiz');

    // The link opens once: it warns to write the name down, and the name is gone from the base.
    await expect(page.getByTestId('secret-santa-once-warning')).toContainText(
      'Este link só abre uma vez.',
    );
    const store = await readStore(page);
    const spent = store['secretSantaReveals'].find((r) => r.id === 'token-jessica')!;
    expect(spent['openedAt']).toEqual(expect.any(String));
    expect(spent['receiverName']).toBe('');
    expect(spent['receiverGiftOptions']).toEqual([]);
  });

  test('opening a link a second time says it expired and to ask for a new one', async ({
    page,
  }) => {
    await mockFirestoreDocuments(page, {
      collections: {
        secretSantaReveals: [
          {
            id: 'token-jessica',
            eventId: EVENT_ID,
            eventTitle: 'Natal 2026 da família',
            eventDate: new Date().toISOString(),
            giverName: 'Jéssica Melo',
            receiverName: '',
            receiverGiftOptions: [],
            createdAt: new Date().toISOString(),
            openedAt: new Date().toISOString(),
          },
        ],
      },
    });
    await page.goto('/amigo-oculto/token-jessica');

    const expired = page.getByTestId('secret-santa-expired');
    await expect(expired).toContainText('Este link já foi aberto');
    await expect(expired).toContainText('Ele só podia ser aberto uma vez');
    // Someone without an account makes a new link with the same person right here.
    await expect(expired).toContainText('Gere um novo link');
    await expect(page.getByTestId('secret-santa-renew-btn')).toBeVisible();
    await expect(page.getByTestId('secret-santa-receiver')).toHaveCount(0);
    // A forwarded link someone else opened first: the giver learns to ask for a new draw.
    await expect(page.getByTestId('secret-santa-not-me')).toContainText(
      'Não foi você que abriu? Então alguém viu o seu resultado',
    );
    await page.screenshot({ path: 'e2e/screenshots/secret-santa-expired.png' });
  });

  test('a link from a draw that was redone explains what to do', async ({ page }) => {
    await mockFirestoreDocuments(page, { collections: { secretSantaReveals: [] } });
    await page.goto('/amigo-oculto/old-token');
    await expect(page.getByText('Link não encontrado')).toBeVisible();
    await expect(page.getByText('peça um novo para quem organiza')).toBeVisible();
  });

  test('a participant with an account sees the notice on Início and opens the result there', async ({
    page,
  }) => {
    await setupMockAuthSession(page, {
      uid: 'guest-jessica',
      email: 'jessica@organizaai.test',
      displayName: 'Jéssica Melo',
      events: [christmasEvent({ enabled: true, giftOptions: true })],
      collections: {
        'users/guest-jessica/notifications': [
          {
            id: `secret-santa_${EVENT_ID}`,
            kind: 'secret-santa',
            eventId: EVENT_ID,
            eventTitle: 'Natal 2026 da família',
            title: 'Sorteio do amigo oculto feito!',
            body: 'O sorteio do amigo oculto de Natal 2026 da família foi feito. Confira quem você tirou: o resultado abre uma vez só, anote o nome.',
            actionLabel: 'Ver quem eu tirei',
            actionUrl: '/amigo-oculto/0b6f2a52-6b0f-4f39-9d0e-3c1b8f0a7e11',
            createdAt: new Date().toISOString(),
            readAt: null,
          },
        ],
        // Who organizes it, as their profile names them: beside the notice in the bell.
        publicProfiles: [{ id: 'test-user-uid', name: 'Luiz Rodrigues' }],
        secretSantaReveals: [
          {
            id: '0b6f2a52-6b0f-4f39-9d0e-3c1b8f0a7e11',
            eventId: EVENT_ID,
            eventTitle: 'Natal 2026 da família',
            eventDate: new Date().toISOString(),
            giverName: 'Jéssica Melo',
            // Her account: signed in to it, she is not asked who she is.
            giverUid: 'guest-jessica',
            receiverName: 'Luiz',
            receiverGiftOptions: ['Livro'],
            createdAt: new Date().toISOString(),
          },
        ],
      },
    });
    await page.goto('/');

    const notice = page.getByTestId('home-notifications').getByTestId('notification-card');
    await expect(notice).toContainText('Sorteio do amigo oculto feito!');
    await page.screenshot({ path: 'e2e/screenshots/secret-santa-home-notice.png' });
    // In the bell too, with the organizer's face and name, like an invite to help organise.
    await page.getByTestId('notifications-btn').click();
    const item = page.getByTestId('notification-item').first();
    await expect(item).toContainText('por Luiz Rodrigues');
    await expect(item.locator('org-avatar')).toHaveCount(1);
    await page.screenshot({ path: 'e2e/screenshots/secret-santa-bell-notice.png' });
    await page.keyboard.press('Escape');
    await notice.getByTestId('notification-action-btn').click();

    await expect(page).toHaveURL(/\/amigo-oculto\/0b6f2a52/);
    await expect(page.getByTestId('secret-santa-receiver')).toHaveText('Luiz');
    // Seen: the notice leaves Início, and the link is spent.
    const store = await readStore(page);
    expect(store['users/guest-jessica/notifications'][0]['readAt']).toEqual(expect.any(String));
    expect(store['secretSantaReveals'][0]['openedAt']).toEqual(expect.any(String));
  });
});
