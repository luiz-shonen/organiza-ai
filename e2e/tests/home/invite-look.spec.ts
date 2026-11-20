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
    await expect(invitation).toContainText('Feliz Natal!');
    await expect(invitation.locator('h1')).toHaveText('Natal da família');
    await expect(invitation.getByTestId('event-invitation-signature')).toHaveText(
      'Com carinho, Luiz Rodrigues',
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
});
