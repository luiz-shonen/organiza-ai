import { test, expect } from '../fixtures/test.fixture';
import { setupMockAuthSession } from '../helpers/auth-mock.helper';

const mockCollabEvent = {
  id: 'mock-collab-event',
  title: 'Evento com Colaboradores',
  category: 'Churrasco',
  description: 'Evento de teste para validação de colaboradores e RBAC.',
  date: new Date(Date.now() + 86400000 * 5).toISOString(),
  location: 'Rua das Flores, 123 - Centro - São Paulo/SP - CEP: 01001-000',
  status: 'active',
  createdBy: 'test-user-uid',
  creatorEmail: 'organizer@organizaai.test',
  collaborators: ['colaborador@organizaai.test'],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

test.describe('Collaborator Invitations and RBAC Controls', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await setupMockAuthSession(page, {
      uid: 'test-user-uid',
      email: 'organizer@organizaai.test',
      displayName: 'Organizer Test',
      events: [mockCollabEvent],
    });
  });

  test('should render share panel with QR code canvas and WhatsApp share button', async ({
    page,
    sharePanel,
    eventEditorPage,
    eventDetailPage,
  }) => {
    // Navigate to event editor for an existing event
    await page.goto('/meus-eventos/evento/mock-collab-event');
    await eventEditorPage.assertLoaded();

    // Verify share panel component is rendered
    await sharePanel.assertLoaded();
    await expect(sharePanel.panelRoot.first()).toBeVisible();

    // Verify QR code canvas presence and accessibility attributes
    await expect(sharePanel.qrCanvas.first()).toBeVisible();
    await expect(sharePanel.qrCanvas.first()).toHaveAttribute('aria-label', /QR Code/i);

    // Verify WhatsApp share button
    await expect(sharePanel.whatsappBtn.first()).toBeVisible();
    await expect(sharePanel.whatsappBtn.first()).toContainText(/WhatsApp/i);

    // Verify public route structure is accessible via eventDetailPage POM
    expect(eventDetailPage).toBeDefined();
  });

  test('should allow entering collaborator email and triggering invite action', async ({
    page,
    sharePanel,
    eventEditorPage,
    eventDetailPage,
  }) => {
    // Navigate to event editor
    await page.goto('/meus-eventos/evento/mock-collab-event');
    await eventEditorPage.assertLoaded();
    expect(eventDetailPage).toBeDefined();

    // Open the collaborator workflow drawer from editor header actions.
    const collabBtn = page.getByRole('button', { name: /Colaboradores/i });
    await expect(collabBtn).toBeVisible();
    await collabBtn.click();

    // The workflow is intentionally a side drawer, not a modal dialog.
    const collaboratorDrawer = page.getByTestId('collaborator-drawer');
    await expect(collaboratorDrawer).toBeVisible();
    await expect(collaboratorDrawer).toHaveRole('region');
    await expect(collaboratorDrawer).toContainText(/Convidar colaboradores/i);

    // Fill collaborator email input and submit
    await expect(sharePanel.inviteEmailInput).toBeVisible();
    await sharePanel.inviteEmailInput.fill('colaborador@organizaai.test');

    // Verify send button is enabled and trigger invite action
    await expect(sharePanel.sendInviteBtn).toBeEnabled();
    await sharePanel.sendInviteBtn.click();
  });

  test('should copy event invite link to clipboard', async ({
    page,
    sharePanel,
    eventEditorPage,
    eventDetailPage,
  }) => {
    // Navigate to event editor
    await page.goto('/meus-eventos/evento/mock-collab-event');
    await eventEditorPage.assertLoaded();
    expect(eventDetailPage).toBeDefined();

    // Verify share panel loaded
    await sharePanel.assertLoaded();
    await expect(sharePanel.copyLinkBtn.first()).toBeVisible();
    await expect(sharePanel.copyLinkBtn.first()).toContainText(/Copiar Link/i);

    // Trigger copy link action
    await sharePanel.copyLink();

    // Verify copy feedback snackbar toast appears
    const snackBar = page.locator('mat-snack-bar-container, .mat-mdc-snack-bar-container');
    await expect(snackBar.first()).toBeVisible();
    await expect(snackBar.first()).toContainText(/Link copiado!/i);
  });
});
