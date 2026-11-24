import { test, expect } from '../../fixtures/test.fixture';
import { setupMockAuthSession, type MockDocument } from '../../helpers/auth-mock.helper';

/**
 * Amigo oculto sign-ups from the invite: a guest puts themself (and who goes with them) in the
 * draw when confirming, or without going; the organizer never sees the same person twice.
 */
const EVENT_ID = 'natal-2026';
const PARTICIPANTS = `events/${EVENT_ID}/secretSantaParticipants`;

function christmasEvent(secretSanta: Record<string, unknown>, guests: MockDocument[] = []) {
  return {
    id: EVENT_ID,
    title: 'Natal 2026 da família',
    category: 'Natal',
    description: 'Ceia e amigo oculto na casa da vó.',
    date: new Date(Date.now() + 86400000 * 30).toISOString(),
    location: 'Rua das Palmeiras, 100 - Centro - São Paulo/SP - CEP: 01310-100',
    pixKey: null,
    status: 'active',
    createdBy: 'organizer-uid',
    creatorEmail: 'organizer@organizaai.test',
    collaborators: [],
    secretSanta,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    guests,
  };
}

type MockStore = Record<string, MockDocument[]>;

function readStore(page: import('@playwright/test').Page) {
  return page.evaluate(
    () =>
      (window as unknown as { __MOCK_DOCUMENTS__: Record<string, unknown[]> }).__MOCK_DOCUMENTS__,
  ) as Promise<MockStore>;
}

test.describe('Amigo oculto pelo convite', () => {
  test('a guest confirms and joins the draw with gift options', async ({ page }) => {
    await setupMockAuthSession(page, {
      uid: 'maria-uid',
      email: 'maria@organizaai.test',
      displayName: 'Maria Souza',
      events: [christmasEvent({ enabled: true, giftOptions: true, maxGiftOptions: 2 })],
    });
    await page.goto(`/evento/${EVENT_ID}`);

    await page.getByTestId('rsvp-action-btn').locator('button').click();
    const drawer = page.getByTestId('rsvp-drawer');
    const santa = drawer.getByTestId('rsvp-santa');
    await expect(santa).toContainText('Quem vai participar do sorteio?');
    await santa.getByTestId('rsvp-santa-person-0').locator('input').check();
    // One idea at a time: "+" adds it and the field is ready for the next.
    await santa.getByTestId('rsvp-santa-0-gift-input').fill('Livro');
    await santa.getByTestId('rsvp-santa-0-add-gift-btn').click();
    await expect(santa.getByTestId('rsvp-santa-0-gift-item')).toHaveCount(1);
    await santa.screenshot({ path: 'e2e/screenshots/santa-rsvp-gift-field.png' });
    await santa.getByTestId('rsvp-santa-0-gift-input').fill('Meia de lã');
    await santa.getByTestId('rsvp-santa-0-gift-input').press('Enter');
    await expect(santa.getByTestId('rsvp-santa-0-gift-item')).toHaveCount(2);
    await santa.screenshot({ path: 'e2e/screenshots/santa-rsvp-question.png' });
    await drawer.getByTestId('rsvp-confirm-btn').locator('button').click();

    await expect(page.getByTestId('rsvp-santa-status')).toHaveText('Você está no amigo oculto.');
    const entry = (await readStore(page))[PARTICIPANTS].find((p) => p.id === 'rsvp_maria-uid');
    expect(entry).toMatchObject({
      name: 'Maria Souza',
      phone: '(11) 99999-9999',
      giftOptions: ['Livro', 'Meia de lã'],
      guestId: 'maria-uid',
      joinedBy: 'maria-uid',
    });

    // "Editar presença" no longer asks the amigo oculto (its card does), and keeps her in it once.
    await page.getByTestId('rsvp-edit-btn').locator('button').click();
    await expect(page.getByTestId('rsvp-drawer')).toBeVisible();
    await expect(page.getByTestId('rsvp-santa')).toHaveCount(0);
    await page.getByTestId('rsvp-confirm-btn').locator('button').click();
    await expect(page.getByTestId('rsvp-drawer')).toHaveCount(0);
    const entries = (await readStore(page))[PARTICIPANTS].filter((p) =>
      String(p.id).startsWith('rsvp_maria-uid'),
    );
    expect(entries).toHaveLength(1);
  });

  test('someone not going can still take part', async ({ page }) => {
    await setupMockAuthSession(page, {
      uid: 'tia-uid',
      email: 'tia@organizaai.test',
      displayName: 'Tia Lurdes',
      events: [christmasEvent({ enabled: true, giftOptions: false })],
    });
    await page.goto(`/evento/${EVENT_ID}`);

    await page.getByTestId('rsvp-decline-btn').locator('button').click();
    await page.getByTestId('rsvp-decline-santa').locator('input').check();
    await expect(page.locator('input[data-testid="rsvp-santa-phone"]')).toHaveValue(
      '(11) 99999-9999',
    );
    await page.getByTestId('rsvp-decline-form').screenshot({
      path: 'e2e/screenshots/santa-decline-but-join.png',
    });
    await page.getByTestId('rsvp-decline-send-btn').locator('button').click();

    await expect(page.getByTestId('rsvp-santa-status')).toHaveText(
      'Você está no amigo oculto, mesmo sem ir.',
    );
    await expect
      .poll(async () => (await readStore(page))[PARTICIPANTS]?.map((p) => p.id))
      .toEqual(['rsvp_tia-uid']);

    await page.getByTestId('rsvp-santa-leave-btn').click();
    await expect.poll(async () => (await readStore(page))[PARTICIPANTS]).toEqual([]);
    await expect(page.getByTestId('rsvp-santa-join-btn')).toBeVisible();
  });

  test('the organizer sees each person once, joins doubtful pairs and closes sign-ups', async ({
    page,
  }) => {
    const participants: MockDocument[] = [
      // Typed by hand from the paper list.
      {
        id: 'm1',
        name: 'Jessica',
        phone: '(11) 98888-1111',
        giftOptions: ['Livro'],
        createdAt: '1',
      },
      { id: 'm2', name: 'Ana Souza', phone: '', giftOptions: [], createdAt: '2' },
      // Same phone as Maria, other name: the grandmother who gets her link on Maria's phone.
      { id: 'm3', name: 'Dona Ana', phone: '(11) 97777-2222', giftOptions: [], createdAt: '3' },
      // Joined from the invite.
      {
        id: 'rsvp_jess',
        name: 'Jéssica Melo',
        phone: '(11) 98888-1111',
        giftOptions: [],
        guestId: 'jess',
        joinedBy: 'jess',
        createdAt: '4',
      },
      {
        id: 'rsvp_ana',
        name: 'Ana Souza',
        phone: '(11) 96666-3333',
        giftOptions: [],
        guestId: 'ana',
        joinedBy: 'ana',
        createdAt: '5',
      },
      {
        id: 'rsvp_maria',
        name: 'Maria',
        phone: '(11) 97777-2222',
        giftOptions: [],
        guestId: 'maria',
        joinedBy: 'maria',
        createdAt: '6',
      },
    ];
    await setupMockAuthSession(page, {
      uid: 'organizer-uid',
      email: 'organizer@organizaai.test',
      displayName: 'Luiz Organizer',
      events: [christmasEvent({ enabled: true, giftOptions: true, maxGiftOptions: 3 })],
      collections: { [PARTICIPANTS]: participants },
    });
    await page.goto(`/evento/${EVENT_ID}`);
    const card = page.getByTestId('secret-santa-card');

    // Same phone and first name: joined at once; the gift ideas stay the guest's own.
    await expect
      .poll(async () => (await readStore(page))[PARTICIPANTS].map((p) => p.id))
      .toEqual(['m2', 'm3', 'rsvp_jess', 'rsvp_ana', 'rsvp_maria']);
    const jess = (await readStore(page))[PARTICIPANTS].find((p) => p.id === 'rsvp_jess');
    expect(jess?.['giftOptions']).toEqual([]);

    // Same full name, other phone: only pointed out.
    const doubtful = card.getByTestId('secret-santa-duplicate');
    await expect(doubtful).toHaveCount(1);
    await expect(doubtful).toContainText('Ana Souza (adicionado à mão) e Ana Souza');
    await card.screenshot({ path: 'e2e/screenshots/santa-possible-duplicate.png' });
    await doubtful.getByTestId('secret-santa-merge-btn').click();
    await expect(doubtful).toHaveCount(0);
    await expect
      .poll(async () => (await readStore(page))[PARTICIPANTS].map((p) => p.id))
      .toEqual(['m3', 'rsvp_jess', 'rsvp_ana', 'rsvp_maria']);
    await expect(card).toContainText('4 pessoas no sorteio');
    await expect(card.getByTestId('secret-santa-joined-tag')).toHaveText('3 pelo convite');

    // The owner closes the sign-ups, keeping the other settings.
    await card.getByTestId('secret-santa-self-join').locator('button').click();
    await expect(card).toContainText('Fechado: ninguém novo entra pelo convite');
    await expect
      .poll(async () => (await readStore(page))['events'][0]['secretSanta'])
      .toEqual({ enabled: true, giftOptions: true, maxGiftOptions: 3, selfJoin: false });
  });

  test('Juntar with two phones asks which stays; either answer clears the notice', async ({
    page,
  }) => {
    const bia = (id: string, phone: string, extra: Record<string, unknown> = {}) => ({
      id,
      name: 'Bia Lima',
      phone,
      giftOptions: [],
      createdAt: id,
      ...extra,
    });
    await setupMockAuthSession(page, {
      uid: 'organizer-uid',
      email: 'organizer@organizaai.test',
      displayName: 'Luiz Organizer',
      events: [christmasEvent({ enabled: true, giftOptions: false })],
      collections: {
        [PARTICIPANTS]: [
          bia('m1', '(11) 95555-1111'),
          bia('rsvp_bia', '(11) 94444-2222', { guestId: 'bia', joinedBy: 'bia' }),
          { id: 'm2', name: 'Caio', phone: '', giftOptions: [], createdAt: 'm2' },
          {
            id: 'rsvp_caio',
            name: 'Caio',
            phone: '',
            giftOptions: [],
            createdAt: 'x',
            guestId: 'caio',
            joinedBy: 'caio',
          },
        ],
      },
    });
    await page.goto(`/evento/${EVENT_ID}`);
    const card = page.getByTestId('secret-santa-card');
    const doubtful = card.getByTestId('secret-santa-duplicate');
    await expect(doubtful).toHaveCount(2);
    // Both phones are shown, so the organizer sees what differs.
    await expect(doubtful.first()).toContainText('(11) 95555-1111');
    await expect(doubtful.first()).toContainText('(11) 94444-2222');

    // "Juntar": which phone stays? The one typed by hand.
    await doubtful.first().getByTestId('secret-santa-merge-btn').click();
    const dialog = page.getByTestId('org-confirm-dialog');
    await expect(dialog).toContainText('Qual telefone fica?');
    await dialog.screenshot({ path: 'e2e/screenshots/santa-merge-which-phone.png' });
    await dialog.getByTestId('org-confirm-extra').click();
    await expect(doubtful).toHaveCount(1);
    const store = async () => (await readStore(page))[PARTICIPANTS];
    await expect.poll(async () => (await store()).map((p) => p.id)).not.toContain('m1');
    const kept = (await store()).find((p) => p.id === 'rsvp_bia');
    expect(kept?.['phone']).toBe('(11) 95555-1111');
    expect(kept?.['name']).toBe('Bia Lima');

    // "São pessoas diferentes": the notice goes away and both stay.
    await doubtful.getByTestId('secret-santa-distinct-btn').click();
    await expect(doubtful).toHaveCount(0);
    expect((await store()).map((p) => p.id)).toEqual(expect.arrayContaining(['m2', 'rsvp_caio']));
  });

  test('with sign-ups closed, the invite only says so', async ({ page }) => {
    await setupMockAuthSession(page, {
      uid: 'maria-uid',
      email: 'maria@organizaai.test',
      displayName: 'Maria Souza',
      events: [christmasEvent({ enabled: true, giftOptions: false, selfJoin: false })],
    });
    await page.goto(`/evento/${EVENT_ID}`);

    await page.getByTestId('rsvp-action-btn').locator('button').click();
    await expect(page.getByTestId('rsvp-santa-closed')).toContainText(
      'As inscrições do amigo oculto foram encerradas.',
    );
    await expect(page.getByTestId('rsvp-santa-person-0')).toHaveCount(0);
  });

  test('a relative without a phone joins with the guest phone; companions too', async ({
    page,
  }) => {
    await setupMockAuthSession(page, {
      uid: 'maria-uid',
      email: 'maria@organizaai.test',
      displayName: 'Maria Souza',
      events: [christmasEvent({ enabled: true, giftOptions: false })],
      familyMembers: [{ id: 'vo', name: 'Vó Ana', relationship: 'parent', createdAt: '' }],
    });
    await page.goto(`/evento/${EVENT_ID}`);

    await page.getByTestId('rsvp-action-btn').locator('button').click();
    const drawer = page.getByTestId('rsvp-drawer');
    const family = drawer.getByTestId('family-selector');
    await family.locator('mat-expansion-panel-header').click();
    await family.getByRole('checkbox', { name: /Vó Ana/ }).check();
    const companions = drawer.getByTestId('companion-selector');
    await companions.getByText('Levar acompanhantes?').click();
    await companions.getByRole('button', { name: 'Novo acompanhante' }).click();
    await companions.getByLabel('Nome do acompanhante').fill('Bia');
    await companions.getByRole('button', { name: 'Adicionar' }).click();

    // Only who goes is asked about: Maria, then the relative, then the companion.
    const santa = drawer.getByTestId('rsvp-santa');
    await expect(santa.getByTestId('rsvp-santa-person-1')).toContainText('Vó Ana');
    await expect(santa.getByTestId('rsvp-santa-person-2')).toContainText('Bia (acompanhante)');
    await santa.getByTestId('rsvp-santa-person-1').locator('input').check();
    await santa.getByTestId('rsvp-santa-person-2').locator('input').check();
    await drawer.getByTestId('rsvp-confirm-btn').locator('button').click();
    await expect(page.getByTestId('rsvp-drawer')).toHaveCount(0);

    await expect
      .poll(async () => ((await readStore(page))[PARTICIPANTS] ?? []).map((p) => p.id).sort())
      .toEqual(['rsvp_maria-uid_c_bia', 'rsvp_maria-uid_f_vo']);
    const store = (await readStore(page))[PARTICIPANTS];
    expect(store.find((p) => p.id === 'rsvp_maria-uid_f_vo')).toMatchObject({
      name: 'Vó Ana',
      phone: '(11) 99999-9999',
      guestId: 'maria-uid_vo',
      joinedBy: 'maria-uid',
    });
    expect(store.find((p) => p.id === 'rsvp_maria-uid_c_bia')).toMatchObject({
      name: 'Bia',
      phone: '(11) 99999-9999',
      joinedBy: 'maria-uid',
    });
  });

  test('someone who declined joins only the amigo oculto later', async ({ page }) => {
    await setupMockAuthSession(page, {
      uid: 'tia-uid',
      email: 'tia@organizaai.test',
      displayName: 'Tia Lurdes',
      events: [christmasEvent({ enabled: true, giftOptions: false })],
    });
    await page.goto(`/evento/${EVENT_ID}`);

    await page.getByTestId('rsvp-decline-btn').locator('button').click();
    await page.getByTestId('rsvp-decline-send-btn').locator('button').click();
    await expect(page.getByTestId('rsvp-card')).toContainText('Você recusou este convite');
    expect((await readStore(page))[PARTICIPANTS] ?? []).toEqual([]);

    await page.getByTestId('rsvp-santa-join-btn').click();
    const form = page.getByTestId('rsvp-santa-join-form');
    await expect(form.locator('input[data-testid="rsvp-santa-phone"]')).toHaveValue(
      '(11) 99999-9999',
    );
    await page.getByTestId('rsvp-santa-join-send-btn').click();

    await expect(page.getByTestId('rsvp-santa-status')).toHaveText(
      'Você está no amigo oculto, mesmo sem ir.',
    );
    await expect
      .poll(async () => (await readStore(page))[PARTICIPANTS]?.map((p) => p.id))
      .toEqual(['rsvp_tia-uid']);
  });

  test('two people with the same name stay apart when the organizer says so', async ({ page }) => {
    await setupMockAuthSession(page, {
      uid: 'organizer-uid',
      email: 'organizer@organizaai.test',
      displayName: 'Luiz Organizer',
      events: [christmasEvent({ enabled: true, giftOptions: false })],
      collections: {
        [PARTICIPANTS]: [
          { id: 'm1', name: 'Ana Souza', phone: '', giftOptions: [], createdAt: '1' },
          {
            id: 'rsvp_ana',
            name: 'Ana Souza',
            phone: '(11) 96666-3333',
            giftOptions: [],
            guestId: 'ana',
            joinedBy: 'ana',
            createdAt: '2',
          },
        ],
      },
    });
    await page.goto(`/evento/${EVENT_ID}`);
    const card = page.getByTestId('secret-santa-card');

    const doubtful = card.getByTestId('secret-santa-duplicate');
    await expect(doubtful).toHaveCount(1);
    await doubtful.getByTestId('secret-santa-distinct-btn').click();
    await expect(doubtful).toHaveCount(0);
    // Both stay, and the pair is not pointed out again.
    await expect
      .poll(async () => {
        const list = (await readStore(page))[PARTICIPANTS];
        return {
          ids: list.map((p) => p.id),
          marked: list.flatMap((p) => (p['distinctFrom'] as string[] | undefined) ?? []),
        };
      })
      .toEqual({ ids: ['m1', 'rsvp_ana'], marked: [expect.any(String)] });
    await expect(card).toContainText('2 pessoas no sorteio');
    await expect(card.getByTestId('secret-santa-joined-tag')).toHaveText('1 pelo convite');
  });

  test('a guest waiting for approval joins the draw only after being approved', async ({
    page,
  }) => {
    await setupMockAuthSession(page, {
      uid: 'primo-uid',
      email: 'primo@organizaai.test',
      displayName: 'Primo Carlos',
      events: [
        {
          ...christmasEvent({ enabled: true, giftOptions: false }),
          requireApproval: true,
        },
      ],
      userProfile: { id: 'primo-uid', name: 'Primo Carlos', phone: '(11) 97777-0000' },
    });
    await page.goto(`/evento/${EVENT_ID}`);

    await page.getByTestId('rsvp-action-btn').locator('button').click();
    const drawer = page.getByTestId('rsvp-drawer');
    await expect(drawer).toBeVisible();
    // The first confirmation asks the amigo oculto, approval or not.
    const santa = drawer.getByTestId('rsvp-santa');
    await expect(santa).toContainText('Quem vai participar do sorteio?');
    await santa.getByTestId('rsvp-santa-person-0').locator('input').check();
    await drawer.getByTestId('rsvp-confirm-btn').locator('button').click();

    // Saved, and it counts once the presence is approved: the card says so.
    await expect
      .poll(async () => (await readStore(page))[PARTICIPANTS]?.map((p) => p.id) ?? [])
      .toContain('rsvp_primo-uid');
    const roster = page.getByTestId('secret-santa-roster');
    await expect(roster.getByTestId('secret-santa-roster-notice')).toContainText(
      'passa a valer assim que ela for aprovada',
    );
    await expect(roster).toContainText('Primo Carlos');

    // "Editar presença" no longer asks it: the card is where it changes.
    await page.getByRole('button', { name: 'Editar presença' }).first().click();
    await expect(page.getByTestId('rsvp-drawer').getByTestId('rsvp-santa')).toHaveCount(0);
  });

  test('an approved guest joins from the card, named as on their profile', async ({ page }) => {
    await setupMockAuthSession(page, {
      uid: 'primo-uid',
      email: 'primo@organizaai.test',
      displayName: 'Primo Carlos',
      events: [
        christmasEvent({ enabled: true, giftOptions: true, maxGiftOptions: 2 }, [
          {
            id: 'primo-uid',
            uid: 'primo-uid',
            name: 'Carlos',
            phone: '(11) 97777-0000',
            isConfirmed: true,
            confirmedAt: new Date().toISOString(),
            companionsCount: 0,
          },
        ]),
      ],
      // Renamed on the profile after answering as "Carlos".
      userProfile: { id: 'primo-uid', name: 'Carlos Eduardo Primo', phone: '(11) 97777-0000' },
      collections: {
        publicProfiles: [{ id: 'primo-uid', name: 'Carlos Eduardo Primo' }],
      },
    });
    await page.goto(`/evento/${EVENT_ID}`);

    // "Quem vai" follows the profile, not the name typed when answering.
    await expect(page.getByText('Carlos Eduardo Primo').first()).toBeVisible();
    const roster = page.getByTestId('secret-santa-roster');
    await roster.getByTestId('secret-santa-roster-join-btn').click();
    const sheet = page.getByTestId('edit-own-santa-sheet');
    // The name comes from the profile: shown, not typed.
    await expect(sheet.getByTestId('own-santa-name')).toContainText('Carlos Eduardo Primo');
    await expect(sheet.getByTestId('own-santa-name-input')).toHaveCount(0);
    await sheet.getByTestId('own-santa-gift-input').fill('Vinho tinto');
    await sheet.getByTestId('own-santa-submit-btn').click();

    await expect(roster).toContainText('Carlos Eduardo Primo');
    // The gift ideas fold under each name: open them all.
    for (const toggle of await roster.getByTestId('gift-options-list-toggle').all()) {
      await toggle.click();
    }
    await expect(roster).toContainText('Vinho tinto');
    await expect(roster.getByTestId('secret-santa-roster-join-btn')).toHaveCount(0);
    await expect(roster.getByTestId('secret-santa-roster-edit-btn')).toHaveCount(1);
    const entry = (await readStore(page))[PARTICIPANTS].find((p) => p.id === 'rsvp_primo-uid');
    expect(entry).toMatchObject({ joinedBy: 'primo-uid', giftOptions: ['Vinho tinto'] });
    await roster.screenshot({ path: 'e2e/screenshots/santa-join-from-card.png' });
  });
});
