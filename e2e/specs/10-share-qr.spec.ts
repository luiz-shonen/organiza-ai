import { test, expect } from '../fixtures/test.fixture';
import { setupMockAuthSession } from '../helpers/auth-mock.helper';
import { getBoundingBox } from '../helpers/layout.helper';

const mockShareEvent = {
  id: 'event-qr-share-123',
  title: 'Churrasco de Aniversário 2026',
  category: 'Churrasco',
  description: 'Comemoração de aniversário com amigos e familiares.',
  date: new Date(Date.now() + 86400000 * 5).toISOString(),
  location: 'Rua das Palmeiras, 100 - Cerqueira César - São Paulo/SP',
  status: 'active',
  createdBy: 'test-user-uid',
  creatorEmail: 'organizer@organizaai.test',
  collaborators: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

test.describe('QR Code & WhatsApp Share Deep Link Suite', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await setupMockAuthSession(page, {
      uid: 'test-user-uid',
      email: 'organizer@organizaai.test',
      displayName: 'Luiz Organizer',
      events: [mockShareEvent],
    });
  });

  test('should render QR Code canvas with accessible attributes and valid rendering dimensions', async ({
    page,
    sharePanel,
    eventEditorPage,
  }) => {
    await page.goto('/meus-eventos/evento/event-qr-share-123');
    await eventEditorPage.assertLoaded();

    await sharePanel.assertLoaded();
    await expect(sharePanel.panelRoot.first()).toBeVisible();

    // 1. Verify QR Code canvas presence and accessibility
    const qrCanvas = sharePanel.qrCanvas.first();
    await expect(qrCanvas).toBeVisible();
    await expect(qrCanvas).toHaveAttribute('aria-label', /QR Code/i);

    // 2. Verify canvas dimensions are rendered (> 50px width and height)
    const box = await getBoundingBox(qrCanvas);
    expect(box.width).toBeGreaterThanOrEqual(50);
    expect(box.height).toBeGreaterThanOrEqual(50);
  });

  test('should generate WhatsApp share URL schema with event metadata and deep link', async ({
    page,
    sharePanel,
    eventEditorPage,
  }) => {
    await page.goto('/meus-eventos/evento/event-qr-share-123');
    await eventEditorPage.assertLoaded();

    await sharePanel.assertLoaded();

    // Verify WhatsApp button is visible
    const whatsappBtn = sharePanel.whatsappBtn.first();
    await expect(whatsappBtn).toBeVisible();

    // Verify WhatsApp URI schema target or text encoding
    const shareUrl = await sharePanel.captureWhatsAppShareUrl();
    expect(shareUrl).toMatch(/api\.whatsapp\.com\/send|wa\.me/);
    expect(decodeURIComponent(shareUrl)).toContain('Churrasco de Aniversário 2026');
  });

  test('should copy event deep link to clipboard with user feedback confirmation', async ({
    page,
    sharePanel,
    eventEditorPage,
  }) => {
    await page.goto('/meus-eventos/evento/event-qr-share-123');
    await eventEditorPage.assertLoaded();

    await sharePanel.assertLoaded();

    // Click copy link button
    await sharePanel.copyLink();

    // Verify snackbar feedback toast
    await expect(page.locator('org-feedback-snackbar')).toContainText('Link copiado!');
  });
});
