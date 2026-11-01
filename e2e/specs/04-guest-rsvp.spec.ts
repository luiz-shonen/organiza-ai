import { test, expect } from '../fixtures/test.fixture';
import { buildGuestEvent, GUEST_UID } from '../fixtures/mock-events';
import { mockFirestoreDocuments, setupMockAuthSession } from '../helpers/auth-mock.helper';
import {
  assertNoHorizontalOverflow,
  assertSingleSurfaceRing,
} from '../helpers/design-tokens.helper';

const guestEvent = buildGuestEvent();

test.describe('Guest Experience, RSVP Modal, Pix Split, and Wishlist Claims', () => {
  test('should render event detail route structure, banner, and countdown timer', async ({
    eventDetailPage,
    page,
  }) => {
    await mockFirestoreDocuments(page, { events: [guestEvent] });
    await eventDetailPage.goto(`/evento/${guestEvent.id}`);
    await eventDetailPage.assertLoaded();

    const bannerHero = page.locator('.event-card__hero');
    await expect(bannerHero).toBeVisible();
    await assertSingleSurfaceRing(bannerHero.locator('.org-surface'));
    await assertSingleSurfaceRing(page.locator('.event-card__details-card .org-surface'));

    await expect(page.locator('h1.event-card__title')).toHaveText(String(guestEvent['title']));
    await expect(eventDetailPage.countdownTimer).toBeVisible();
    await expect(page.locator('.event-card__date-badge')).toBeVisible();

    const calendarLink = page.locator('.event-card__date-sub');
    await expect(calendarLink).toBeVisible();
    await expect(calendarLink).toHaveAttribute('href', /calendar\.google\.com/);

    await expect(page.locator('.event-card__location-text')).toBeVisible();
  });

  test('should render the not-found state for an unknown event id', async ({
    eventDetailPage,
    page,
  }) => {
    await mockFirestoreDocuments(page, { events: [] });
    await eventDetailPage.goto('/evento/evento-inexistente');

    const notFound = page.locator('org-empty-state, .event-detail__not-found').first();
    await expect(notFound).toBeVisible();
    await expect(notFound).toContainText('Evento não encontrado');
    await assertNoHorizontalOverflow(page);
  });

  test('should open RSVP dialog when clicking RSVP button and support Escape dismissal', async ({
    eventDetailPage,
    rsvpDialog,
    page,
  }) => {
    await setupMockAuthSession(page, {
      uid: 'e2e-new-guest-uid',
      displayName: 'Novo Convidado',
      events: [guestEvent],
    });
    await eventDetailPage.goto(`/evento/${guestEvent.id}`);
    await eventDetailPage.assertLoaded();

    await expect(eventDetailPage.rsvpBtn).toBeVisible();
    await expect(eventDetailPage.rsvpBtn).toHaveAccessibleName(/confirmar|presença|ir/i);

    await eventDetailPage.openRsvpDialog();
    await rsvpDialog.assertVisible();
    await expect(rsvpDialog.cancelBtn).toBeVisible();
    await expect(rsvpDialog.confirmBtn).toBeVisible();

    await rsvpDialog.dismissViaEscape();
    await rsvpDialog.assertHidden();
  });

  test('should render Pix card with dynamic split estimation and copy button', async ({
    eventDetailPage,
    page,
  }) => {
    await mockFirestoreDocuments(page, { events: [guestEvent] });
    await eventDetailPage.goto(`/evento/${guestEvent.id}`);
    await eventDetailPage.assertLoaded();

    await expect(eventDetailPage.pixCard).toBeVisible();
    await expect(eventDetailPage.pixCard.getByRole('heading', { level: 2 })).toContainText(/pix/i);

    // 600 / 2 confirmed guests = R$ 300,00 per person.
    const splitContainer = eventDetailPage.pixCard.locator('.pix-card__split-container');
    await expect(splitContainer).toHaveAttribute('role', 'status');
    await expect(splitContainer).toHaveAttribute(
      'aria-label',
      'Sugestão de contribuição por pessoa',
    );
    await expect(eventDetailPage.pixCard.locator('.pix-card__split-amount')).toContainText(
      /R\$\s?300,00 por pessoa/,
    );

    await expect(eventDetailPage.pixCard.locator('.pix-card__key')).toHaveAttribute(
      'aria-label',
      'Chave Pix',
    );
    await expect(eventDetailPage.copyPixBtn).toBeVisible();
    await expect(eventDetailPage.copyPixBtn).toHaveAccessibleName('Copiar chave Pix');
  });

  test('should toggle item claim and unclaim states on wishlist card', async ({
    eventDetailPage,
    itemList,
    page,
  }) => {
    await setupMockAuthSession(page, {
      uid: GUEST_UID,
      displayName: 'Convidada E2E',
      events: [guestEvent],
    });
    await eventDetailPage.goto(`/evento/${guestEvent.id}`);
    await eventDetailPage.assertLoaded();

    await expect(itemList.listRoot).toBeVisible();
    await expect(itemList.listRoot).toHaveAttribute('aria-label', 'Lista de itens do evento');
    await expect(itemList.itemCards).toHaveCount(2);

    const firstItem = itemList.itemCards.first();
    await expect(firstItem.locator('.item-list-card__name')).toBeVisible();
    await expect(firstItem.locator('.item-list-card__status')).toBeVisible();

    // "Pamonha" is free to claim; "Quentão" is already claimed by this guest.
    await expect(itemList.claimBtns.first()).toHaveAccessibleName(/eu levo|levar/i);
    await expect(itemList.unclaimBtns.first()).toHaveAccessibleName(/desistir/i);
  });

  test('should show the empty wishlist state when the event has no items', async ({
    eventDetailPage,
    itemList,
    page,
  }) => {
    await mockFirestoreDocuments(page, { events: [buildGuestEvent({ items: [] })] });
    await eventDetailPage.goto(`/evento/${guestEvent.id}`);
    await eventDetailPage.assertLoaded();

    const emptyState = itemList.listRoot.locator('.item-list-card__empty');
    await expect(emptyState).toBeVisible();
    await expect(emptyState).toContainText('Nenhum item adicionado a este evento ainda.');
  });

  test('should render dynamic category badge matching event category tokens and activate seasonal theme overlay', async ({
    page,
    eventDetailPage,
  }) => {
    await setupMockAuthSession(page, {
      uid: 'guest-viewer-uid',
      displayName: 'Guest Viewer',
      events: [
        {
          id: 'event-junina-e2e',
          title: 'Grande Arraiá da Família',
          category: 'Festa Junina',
          description: 'Muita comida típica e alegria junina.',
          date: '2026-10-15T19:00:00.000Z',
          location: 'Praça Central, 100',
          status: 'active',
          createdBy: 'organizer-uid',
          collaborators: [],
          createdAt: '2026-08-01T00:00:00.000Z',
          updatedAt: '2026-08-01T00:00:00.000Z',
        },
      ],
    });

    await page.goto('/evento/event-junina-e2e');
    await eventDetailPage.assertLoaded();

    await expect(eventDetailPage.categoryBadge).toBeVisible();
    await expect(eventDetailPage.categoryBadge).toHaveText('Festa Junina');
    await expect(eventDetailPage.categoryBadge).toHaveClass(/cat-festa/);

    await expect(page.locator('.seasonal-overlay__junina')).toBeVisible();
    await expect(page.locator('html')).toHaveClass(/theme-junina/);
  });
});
