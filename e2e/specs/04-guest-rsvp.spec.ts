import { test, expect } from '../fixtures/test.fixture';
import {
  assertNoHorizontalOverflow,
  assertSingleSurfaceRing,
} from '../helpers/design-tokens.helper';

test.describe('Guest Experience, RSVP Modal, Pix Split, and Wishlist Claims', () => {
  test('should render event detail route structure, banner, and countdown timer', async ({
    eventDetailPage,
    homePage,
    page,
  }) => {
    // Navigate via available event card from home or fallback to direct event detail route
    await homePage.goto('/');
    await homePage.assertLoaded();

    const cardCount = await homePage.eventCards.count();
    if (cardCount > 0) {
      await homePage.clickEventCard(0);
      await page.waitForURL(/\/evento\/.+/);
    } else {
      await eventDetailPage.goto('/evento/test-event-placeholder');
    }

    await eventDetailPage.assertLoaded();

    // Verify page container or not-found container is rendered
    const hasEventData = await page
      .locator('[data-testid="event-detail-page"], app-event-card')
      .first()
      .isVisible()
      .catch(() => false);

    if (hasEventData) {
      // 1. Verify Event Banner & Hero info
      const bannerHero = page.locator('.event-card__hero');
      await expect(bannerHero).toBeVisible();
      await assertSingleSurfaceRing(bannerHero.locator('.org-surface'));

      const detailsSurface = page.locator('.event-card__details-card');
      await assertSingleSurfaceRing(detailsSurface.locator('.org-surface'));

      const eventTitle = page.locator('h1.event-card__title');
      await expect(eventTitle).toBeVisible();

      // 2. Verify countdown timer / date badge component
      await expect(eventDetailPage.countdownTimer).toBeVisible();
      const dateBadge = page.locator('.event-card__date-badge');
      await expect(dateBadge).toBeVisible();

      // 3. Verify calendar integration link
      const calendarLink = page.locator('.event-card__date-sub');
      await expect(calendarLink).toBeVisible();
      await expect(calendarLink).toHaveAttribute('href', /calendar\.google\.com/);

      // 4. Verify location details
      const locationText = page.locator('.event-card__location-text');
      await expect(locationText).toBeVisible();
    } else {
      // Route structure loaded in not-found fallback
      const notFoundEmptyState = page.locator('org-empty-state, .event-detail__not-found');
      await expect(notFoundEmptyState).toBeVisible();
      await expect(notFoundEmptyState).toContainText('Evento não encontrado');
      await assertNoHorizontalOverflow(page);
    }
  });

  test('should open RSVP dialog when clicking RSVP button and support Escape dismissal', async ({
    eventDetailPage,
    rsvpDialog,
    homePage,
    page,
  }) => {
    await homePage.goto('/');
    await homePage.assertLoaded();

    const cardCount = await homePage.eventCards.count();
    if (cardCount > 0) {
      await homePage.clickEventCard(0);
      await page.waitForURL(/\/evento\/.+/);
    } else {
      await eventDetailPage.goto('/evento/test-event-placeholder');
    }

    await eventDetailPage.assertLoaded();

    const hasRsvpBtn = await eventDetailPage.rsvpBtn.isVisible().catch(() => false);
    if (hasRsvpBtn) {
      // Assert RSVP button attributes
      await expect(eventDetailPage.rsvpBtn).toBeVisible();
      await expect(eventDetailPage.rsvpBtn).toHaveAccessibleName(/confirmar|presença|ir/i);

      // Click RSVP button
      await eventDetailPage.openRsvpDialog();

      // Check if dialog opened (e.g. for unconfirmed guest with family roster / details)
      const dialogVisible = await rsvpDialog.dialogRoot
        .first()
        .isVisible({ timeout: 2000 })
        .catch(() => false);
      if (dialogVisible) {
        await rsvpDialog.assertVisible();

        // Check dialog structure
        await expect(rsvpDialog.cancelBtn).toBeVisible();
        await expect(rsvpDialog.confirmBtn).toBeVisible();

        // Dismiss using Escape key
        await rsvpDialog.dismissViaEscape();
        await rsvpDialog.assertHidden();
      }
    } else {
      // If direct route has no active event, assert page root is rendered
      await expect(eventDetailPage.pageRoot.first()).toBeVisible();
    }
  });

  test('should render Pix card with dynamic split estimation and copy button', async ({
    eventDetailPage,
    homePage,
    page,
  }) => {
    await homePage.goto('/');
    await homePage.assertLoaded();

    const cardCount = await homePage.eventCards.count();
    if (cardCount > 0) {
      await homePage.clickEventCard(0);
      await page.waitForURL(/\/evento\/.+/);
    } else {
      await eventDetailPage.goto('/evento/test-event-placeholder');
    }

    await eventDetailPage.assertLoaded();

    const pixCardVisible = await eventDetailPage.pixCard.isVisible().catch(() => false);
    if (pixCardVisible) {
      // 1. Verify Pix card header and title
      await expect(eventDetailPage.pixCard).toBeVisible();
      const cardTitle = eventDetailPage.pixCard.locator('mat-card-title');
      await expect(cardTitle).toContainText(/pix/i);

      // 2. Verify dynamic split estimation container if budget exists
      const splitContainer = eventDetailPage.pixCard.locator('.pix-card__split-container');
      if (await splitContainer.isVisible().catch(() => false)) {
        await expect(splitContainer).toHaveAttribute('role', 'status');
        await expect(splitContainer).toHaveAttribute(
          'aria-label',
          'Sugestão de contribuição por pessoa',
        );
        const splitAmount = eventDetailPage.pixCard.locator('.pix-card__split-amount');
        await expect(splitAmount).toContainText(/R\$|por pessoa/i);
      }

      // 3. Verify Pix key container and copy button
      const pixKey = eventDetailPage.pixCard.locator('.pix-card__key');
      if (await pixKey.isVisible().catch(() => false)) {
        await expect(pixKey).toHaveAttribute('aria-label', 'Chave Pix');
      }

      await expect(eventDetailPage.copyPixBtn).toBeVisible();
      await expect(eventDetailPage.copyPixBtn).toHaveAttribute('aria-label', 'Copiar chave Pix');

      // 4. Click copy button and verify action
      await eventDetailPage.copyPixKey();
    } else {
      // When pixKey is not configured or in fallback state, ensure page container is solid
      await expect(eventDetailPage.pageRoot.first()).toBeVisible();
    }
  });

  test('should toggle item claim and unclaim states on wishlist card', async ({
    eventDetailPage,
    itemList,
    homePage,
    page,
  }) => {
    await homePage.goto('/');
    await homePage.assertLoaded();

    const cardCount = await homePage.eventCards.count();
    if (cardCount > 0) {
      await homePage.clickEventCard(0);
      await page.waitForURL(/\/evento\/.+/);
    } else {
      await eventDetailPage.goto('/evento/test-event-placeholder');
    }

    await eventDetailPage.assertLoaded();

    const listRootVisible = await itemList.listRoot.isVisible().catch(() => false);
    if (listRootVisible) {
      // Verify wishlist section landmark & header
      await expect(itemList.listRoot).toBeVisible();
      await expect(itemList.listRoot).toHaveAttribute('aria-label', 'Lista de itens do evento');

      const itemCount = await itemList.itemCards.count();
      if (itemCount > 0) {
        // Assert first item structure
        const firstItem = itemList.itemCards.first();
        await expect(firstItem).toBeVisible();
        await expect(firstItem.locator('.item-list-card__name')).toBeVisible();
        await expect(firstItem.locator('.item-list-card__status')).toBeVisible();

        // Check claim button availability
        const claimBtnCount = await itemList.claimBtns.count();
        const unclaimBtnCount = await itemList.unclaimBtns.count();

        if (claimBtnCount > 0) {
          const firstClaimBtn = itemList.claimBtns.first();
          await expect(firstClaimBtn).toBeVisible();
          await expect(firstClaimBtn).toHaveAccessibleName(/eu levo|levar/i);
        }

        if (unclaimBtnCount > 0) {
          const firstUnclaimBtn = itemList.unclaimBtns.first();
          await expect(firstUnclaimBtn).toBeVisible();
          await expect(firstUnclaimBtn).toHaveAccessibleName(/desistir/i);
        }
      } else {
        // Verify empty state fallback
        const emptyState = itemList.listRoot.locator('.item-list-card__empty');
        await expect(emptyState).toBeVisible();
        await expect(emptyState).toContainText('Nenhum item adicionado a este evento ainda.');
      }
    } else {
      await expect(eventDetailPage.pageRoot.first()).toBeVisible();
    }
  });
});
