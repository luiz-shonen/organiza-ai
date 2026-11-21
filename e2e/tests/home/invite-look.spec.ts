import { test, expect } from '../../fixtures/test.fixture';
import { GUEST_UID, buildGuestEvent } from '../../fixtures/mock-events';
import { setupMockAuthSession } from '../../helpers/auth-mock.helper';
import { assertNoHorizontalOverflow } from '../../helpers/design-tokens.helper';

/**
 * Invites look like invites: a sealed envelope on Início, in the colours of the category, that
 * opens the event page as a paper invitation signed by whoever organizes it.
 */
const inDays = (days: number): string => new Date(Date.now() + 86400000 * days).toISOString();

const invites = [
  buildGuestEvent({
    id: 'evt-natal',
    title: 'Natal da família',
    category: 'Natal',
    description: 'Ceia, música e amigo oculto na casa da vó.',
    date: inDays(20),
    creatorName: 'Luiz Rodrigues',
    guests: [],
  }),
  buildGuestEvent({
    id: 'evt-aniversario',
    title: 'Aniversário da vó Ana',
    category: 'Aniversário',
    description: 'Almoço, bolo e parabéns: 80 anos da vó.',
    date: inDays(40),
    creatorName: 'Família Souza',
    guests: [],
  }),
  buildGuestEvent({
    id: 'evt-casamento',
    title: 'Maria e João',
    category: 'Casamento',
    description: 'Cerimônia e festa no Espaço Jardim.',
    date: inDays(60),
    creatorName: 'Maria',
    guests: [],
  }),
];

test.describe('Convites com cara de convite', () => {
  test('Início shows each invite as a sealed envelope, in the colours of the category', async ({
    page,
  }) => {
    await setupMockAuthSession(page, {
      uid: GUEST_UID,
      email: 'convidada@exemplo.com',
      displayName: 'Jéssica Melo',
      events: invites,
      userProfile: {
        id: GUEST_UID,
        name: 'Jéssica Melo',
        phone: '(11) 93333-3333',
        invitedEvents: invites.map((event) => event.id),
      },
    });
    await page.goto('/');

    const envelopes = page.locator('app-invite-envelope');
    await expect(envelopes).toHaveCount(3);
    const natal = envelopes.filter({ hasText: 'Natal da família' });
    await expect(natal).toContainText('Para Jéssica');
    await expect(natal.locator('article')).toHaveClass(/org-invite--natal/);
    await expect(envelopes.filter({ hasText: 'Maria e João' }).locator('article')).toHaveClass(
      /org-invite--casamento/,
    );
    await expect(natal.getByTestId('event-status')).toHaveText('Pendente');
    await assertNoHorizontalOverflow(page);
    await page.locator('.home__grid').screenshot({ path: 'e2e/screenshots/invite-envelopes.png' });

    // Opening the envelope is opening the invitation.
    await natal.getByTestId('event-card-link').click();
    await expect(page).toHaveURL(/\/evento\/evt-natal$/);
    const invitation = page.getByTestId('event-invitation');
    await expect(invitation).toContainText('Boas Festas!');
    await expect(invitation.locator('h1')).toHaveText('Natal da família');
    await expect(invitation.getByTestId('event-invitation-signature')).toHaveText(
      'Cordialmente, Luiz Rodrigues',
    );
    await assertNoHorizontalOverflow(page);
    await invitation.screenshot({ path: 'e2e/screenshots/invite-paper-natal.png' });

    for (const id of ['evt-aniversario', 'evt-casamento']) {
      await page.goto(`/evento/${id}`);
      await expect(page.getByTestId('event-invitation')).toBeVisible();
      await page
        .getByTestId('event-invitation')
        .screenshot({ path: `e2e/screenshots/invite-paper-${id.slice(4)}.png` });
    }
  });

  test('the invitation follows the theme, says the party once, and draws itself in', async ({
    page,
  }) => {
    const churrasco = buildGuestEvent({
      id: 'evt-churrasco',
      title: 'Churrasco do Pedro',
      category: 'Churrasco',
      description: 'Traga sua bebida preferida.',
      date: inDays(30),
      creatorName: 'Pedro',
      guests: [],
    });
    const events = [...invites, churrasco];
    await setupMockAuthSession(page, {
      uid: GUEST_UID,
      email: 'convidada@exemplo.com',
      displayName: 'Jéssica Melo',
      events,
      userProfile: {
        id: GUEST_UID,
        name: 'Jéssica Melo',
        phone: '(11) 93333-3333',
        invitedEvents: events.map((event) => event.id),
      },
    });

    for (const mode of ['light', 'dark'] as const) {
      await page.addInitScript((value) => localStorage.setItem('theme_mode', value), mode);
      for (const id of ['evt-natal', 'evt-aniversario', 'evt-casamento', 'evt-churrasco']) {
        await page.goto(`/evento/${id}`);
        const invitation = page.getByTestId('event-invitation');
        await expect(invitation).toBeVisible();
        // "Boas Festas!" already says it: no "Natal" tag. "Prezadíssimo convidado" does not.
        await expect(invitation.locator('.event-card__category')).toHaveCount(
          id === 'evt-churrasco' ? 1 : 0,
        );
        // The signature is the last line written in: once it is all there, the paper is done.
        await invitation.evaluate((el) =>
          Promise.all(el.getAnimations({ subtree: true }).map((animation) => animation.finished)),
        );
        const paper = await invitation.evaluate((el) => getComputedStyle(el).backgroundColor);
        const [r, g, b] = paper.match(/\d+/g)!.map(Number);
        const light = (r + g + b) / 3 > 128;
        expect(light, `${id} paper in the ${mode} theme`).toBe(mode === 'light');
        await invitation.screenshot({
          path: `e2e/screenshots/invite-paper-${id.slice(4)}-${mode}.png`,
        });
      }
      // The envelopes on Início take the same light or dark paper.
      await page.goto('/');
      await expect(page.locator('app-invite-envelope')).toHaveCount(events.length);
      await page
        .locator('.home__grid')
        .screenshot({ path: `e2e/screenshots/invite-envelopes-${mode}.png` });
    }
  });
});
