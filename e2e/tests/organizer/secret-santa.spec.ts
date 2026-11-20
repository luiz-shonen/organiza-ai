import { test, expect } from '../../fixtures/test.fixture';
import {
  mockFirestoreDocuments,
  setupMockAuthSession,
  type MockDocument,
} from '../../helpers/auth-mock.helper';

const EVENT_ID = 'natal-2026';

function christmasEvent(secretSanta?: { enabled: boolean; giftOptions: boolean }) {
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
  // Added from "Confirmados no evento": Jéssica has an account, so she is also told in the app.
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
  test('typing a name offers people from my other events, with their phone', async ({
    page,
    eventEditorPage,
  }) => {
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
      events: [christmasEvent(), lastYear],
    });
    await page.goto(`/meus-eventos/evento/${EVENT_ID}`);
    await eventEditorPage.openStep('Amigo oculto');
    const step = page.getByTestId('event-editor-step-secret-santa');
    await step.getByTestId('secret-santa-toggle').locator('button').click();

    await step.getByTestId('santa-name-input').fill('gus');
    const option = page.getByTestId('org-text-field-suggestion').filter({ hasText: 'Gustavo' });
    await expect(option).toContainText('(31) 99999-0000');
    await page.screenshot({ path: 'e2e/screenshots/secret-santa-known-people.png' });
    await option.click();
    await expect(step.getByTestId('santa-name-input')).toHaveValue('Gustavo Pereira');
    await expect(step.getByTestId('santa-phone-input')).toHaveValue('(31) 99999-0000');
  });

  test('the organizer turns it on in the editor and adds who takes part', async ({
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
    await step.getByTestId('secret-santa-gifts-toggle').locator('button').click();
    // The organizer chooses how many options each person may list (3 unless changed).
    const giftLimit = step.getByTestId('secret-santa-gift-limit');
    await expect(giftLimit.getByTestId('quantity-value')).toHaveText('3');
    await giftLimit.getByRole('button', { name: 'Aumentar' }).click();
    await expect(giftLimit.getByTestId('quantity-value')).toHaveText('4');
    await step.locator('.event-step__card').first().screenshot({
      path: 'e2e/screenshots/secret-santa-gift-limit.png',
    });

    // Confirmed guests are one tap away; confirming presence alone puts nobody in the draw.
    await expect(step.getByTestId('secret-santa-suggestions')).toContainText('Jéssica Melo');
    await step
      .getByTestId('secret-santa-suggestions')
      .getByRole('button', { name: 'Jéssica Melo' })
      .click();

    await step.getByTestId('santa-name-input').fill('Vó Maria');
    await step.getByTestId('santa-phone-input').fill('11977772222');
    // Gift ideas: each one typed and added with Enter (or +) joins the list above the field.
    const gift = step.getByTestId('santa-gift-input');
    await gift.fill('Chinelo, cor verde, tamanho 36');
    await gift.press('Enter');
    await expect(step.getByTestId('santa-gift-item')).toHaveCount(1);
    await expect(gift).toHaveValue('');
    await expect(step.getByTestId('santa-gift-list')).toContainText('1 de 4');
    // An idea added can be changed in place: the pencil opens it, Enter keeps it.
    await step.getByTestId('santa-gift-edit-btn').click();
    const editing = step.getByTestId('santa-gift-edit-input');
    await editing.fill('Chinelo, cor verde, tamanho 37');
    await editing.press('Enter');
    await expect(step.getByTestId('santa-gift-item')).toContainText('tamanho 37');
    // One still typed goes with the participant.
    await gift.fill('Livro de receitas');
    await step
      .getByTestId('santa-gift-list')
      .screenshot({ path: 'e2e/screenshots/secret-santa-gift-options.png' });
    await step
      .locator('app-secret-santa-participant-form')
      .first()
      .screenshot({ path: 'e2e/screenshots/secret-santa-participant-form.png' });
    await step.getByTestId('santa-submit-btn').click();

    const list = step.getByTestId('secret-santa-participants');
    await expect(list).toContainText('Jéssica Melo');
    await expect(list).toContainText('Vó Maria');
    await expect(list).toContainText('2 opções');
    await expect(step.getByTestId('secret-santa-missing')).toContainText('Falta 1');
    await page.screenshot({ path: 'e2e/screenshots/secret-santa-editor.png' });

    await eventEditorPage.saveEvent();
    await expect(page).toHaveURL(/\/meus-eventos$/);

    const store = await readStore(page);
    const saved = store['events'].find((e) => e.id === EVENT_ID);
    expect(saved?.['secretSanta']).toEqual({
      enabled: true,
      giftOptions: true,
      maxGiftOptions: 4,
    });
    const people = store[`events/${EVENT_ID}/secretSantaParticipants`];
    expect(people.map((p) => p['name'])).toEqual(['Jéssica Melo', 'Vó Maria']);
    expect(people[1]['giftOptions']).toEqual([
      'Chinelo, cor verde, tamanho 37',
      'Livro de receitas',
    ]);
    expect(people[1]['phone']).toBe('(11) 97777-2222');
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
    await expect(card).toContainText('3 participantes');
    await card.getByTestId('secret-santa-draw-btn').click();

    const links = card.getByTestId('secret-santa-links');
    await expect(links.locator('li')).toHaveCount(3);
    // What to do when a link shows as opened but the person says it was not them.
    await expect(card.getByTestId('secret-santa-leak-hint')).toContainText(
      'Então alguém viu o resultado: sorteie de novo. Quem tem conta só abre o link entrando nela.',
    );
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
    await expect(page.getByRole('dialog')).toContainText('O link atual de Luiz deixa de funcionar');
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
    await expect(card).toContainText('Só quem criou o evento faz o sorteio');
    await expect(card.getByTestId('secret-santa-draw-btn')).toHaveCount(0);
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
    await expect(confirm).toContainText('Este link é de Jéssica Melo');
    await expect(page.getByTestId('secret-santa-receiver')).toHaveCount(0);
    await page.screenshot({ path: 'e2e/screenshots/secret-santa-confirm.png' });
    await page.getByTestId('secret-santa-confirm-btn').click();

    // Then the reveal: the party, the name in large type, gift options below.
    await expect(page.getByTestId('secret-santa-greeting')).toHaveText('Olá, Jéssica!');
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
    await page.screenshot({ path: 'e2e/screenshots/secret-santa-reveal.png' });

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
    await expect(expired).toContainText('peça um novo link para quem organiza o evento');
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
    await notice.getByTestId('notification-action-btn').click();

    await expect(page).toHaveURL(/\/amigo-oculto\/0b6f2a52/);
    await expect(page.getByTestId('secret-santa-receiver')).toHaveText('Luiz');
    // Seen: the notice leaves Início, and the link is spent.
    const store = await readStore(page);
    expect(store['users/guest-jessica/notifications'][0]['readAt']).toEqual(expect.any(String));
    expect(store['secretSantaReveals'][0]['openedAt']).toEqual(expect.any(String));
  });
});
