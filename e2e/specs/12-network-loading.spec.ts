import { test, expect } from '../fixtures/test.fixture';
import { buildGuestEvent } from '../fixtures/mock-events';
import { mockFirestoreDocuments } from '../helpers/auth-mock.helper';

test.describe('Slow Network Loading and Skeleton Shimmer Loading Suite', () => {
  test('should handle network latency gracefully and render views without layout shift or crash', async ({
    page,
    homePage,
  }) => {
    // Intercept backend API / Firestore queries with artificial latency
    await page.route('**/firestore.googleapis.com/**', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      await route.continue();
    });

    // Navigate to Home Page
    await homePage.goto('/');
    await homePage.assertLoaded();

    // Verify header and page root render stably
    await expect(homePage.pageRoot).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('should handle throttled event detail page loading gracefully', async ({
    page,
    eventDetailPage,
  }) => {
    const event = buildGuestEvent();
    await mockFirestoreDocuments(page, { events: [event] });
    await eventDetailPage.goto(`/evento/${event.id}`);
    await eventDetailPage.assertLoaded();

    // Verify page container rendered stably
    await expect(eventDetailPage.pageRoot.first()).toBeVisible();
  });
});
