import { test, expect } from '../../fixtures/test.fixture';
import { setupMockAuthSession, type MockDocument } from '../../helpers/auth-mock.helper';

/**
 * An invite to help organise reaches the person in the notifications bell; only "Aceitar" on the
 * event's page makes them a collaborator, "Recusar" drops it.
 */
const event = {
  id: 'e1',
  title: 'Natal da família',
  category: 'Natal',
  date: new Date(Date.now() + 86400000 * 30).toISOString(),
  location: 'Rua A, 1',
  status: 'active',
  createdBy: 'owner-uid',
  creatorName: 'Jéssica',
  collaborators: [],
  guests: [],
  createdAt: '',
  updatedAt: '',
};
const invite: MockDocument = {
  id: 'ana@exemplo.com',
  eventId: 'e1',
  eventTitle: 'Natal da família',
  invitedEmail: 'ana@exemplo.com',
  invitedBy: 'jessica@exemplo.com',
  invitedByName: 'Jéssica Melo',
  createdAt: '1',
};

async function asInvited(page: import('@playwright/test').Page) {
  await setupMockAuthSession(page, {
    uid: 'ana-uid',
    email: 'ana@exemplo.com',
    displayName: 'Ana',
    events: [event],
    collections: { invitations: [invite], 'events/e1/invitations': [invite] },
  });
}

test.describe('Convite para colaborar', () => {
  test('arrives in the bell; Aceitar on the event page makes them a collaborator', async ({
    page,
  }) => {
    await asInvited(page);
    await page.goto('/');
    await expect(page.getByTestId('notifications-count')).toHaveText('1');
    await page.getByTestId('notifications-btn').click();
    const item = page.getByTestId('notification-item');
    await expect(item).toContainText('Natal da família · por Jéssica Melo');
    await item.click();
    // Opened: it no longer counts as new, though it stays listed until answered.
    await expect(page.getByTestId('notifications-count')).toHaveCount(0);

    await expect(page).toHaveURL(/\/evento\/e1/);
    await expect(page.getByTestId('collaborator-invite')).toContainText('Jéssica Melo chamou você');
    await page.getByTestId('collaborator-invite-accept').click();
    await expect(page.getByTestId('collaborator-invite')).toHaveCount(0);
    await expect(page.getByText('Compartilhe o QR Code')).toBeVisible();

    // The bell keeps it as history, under "Anteriores", not counted as new.
    await page.getByTestId('notifications-btn').click();
    await expect(page.getByText('Anteriores')).toBeVisible();
    await expect(
      page.getByTestId('notification-item').filter({ hasText: 'Você aceitou colaborar' }),
    ).toContainText('Natal da família · por Jéssica Melo');
  });

  test('Recusar drops the invite without joining', async ({ page }) => {
    await asInvited(page);
    await page.goto('/evento/e1');
    await page.getByTestId('collaborator-invite-decline').click();
    await expect(page.getByTestId('collaborator-invite')).toHaveCount(0);
    await expect(page.getByText('Compartilhe o QR Code')).toHaveCount(0);
  });

  test('someone already listed as a collaborator is a guest until they accept', async ({
    page,
  }) => {
    await setupMockAuthSession(page, {
      uid: 'ana-uid',
      email: 'ana@exemplo.com',
      displayName: 'Ana',
      events: [{ ...event, collaborators: ['ana-uid'] }],
      collections: { invitations: [invite], 'events/e1/invitations': [invite] },
    });
    await page.goto('/evento/e1');
    await expect(page.getByTestId('collaborator-invite')).toBeVisible();
    await expect(page.getByText('Compartilhe o QR Code')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Editar evento', exact: true })).toHaveCount(0);
    await page.getByTestId('collaborator-invite-accept').click();
    await expect(page.getByText('Compartilhe o QR Code')).toBeVisible();
  });

  test('a seen invite stays on top waiting; a new invite to the same event counts again', async ({
    page,
  }) => {
    // The previous invite to this event was opened on this device.
    await page.addInitScript(() =>
      localStorage.setItem('organiza:seen-invites:ana-uid', JSON.stringify(['e1@0'])),
    );
    await asInvited(page);
    await page.goto('/');
    await expect(page.getByTestId('notifications-count')).toHaveText('1');
    await page.getByTestId('notifications-btn').click();
    await expect(page.getByText('Aguardando resposta')).toBeVisible();
    await page.getByTestId('notification-item').first().click();
    await expect(page).toHaveURL(/\/evento\/e1/);
    await expect(page.getByTestId('notifications-count')).toHaveCount(0);
    await page.getByTestId('notifications-btn').click();
    await expect(page.getByText('Aguardando resposta')).toBeVisible();
  });

  test('a collaborator moves through the editor steps, the locked ones included', async ({
    page,
  }) => {
    await setupMockAuthSession(page, {
      uid: 'ana-uid',
      email: 'ana@exemplo.com',
      displayName: 'Ana',
      events: [
        {
          ...event,
          collaborators: ['ana-uid'],
          addressDetails: {
            cep: '01310-100',
            address: 'Rua A',
            number: '1',
            neighborhood: 'Centro',
            city: 'São Paulo/SP',
          },
        },
      ],
    });
    await page.goto('/meus-eventos/evento/e1');
    await expect(page.getByTestId('event-editor-step-1')).toBeVisible();
    // The main information is the owner's: locked for her, and still no reason to stop.
    await page.getByTestId('event-editor-step-1').getByTestId('stepper-next-btn').click();
    await expect(page.getByTestId('step-missing-fields')).toHaveCount(0);
    await expect(page.getByTestId('event-editor-step-2')).toBeInViewport();
    await page.getByTestId('event-editor-step-2').getByTestId('stepper-next-btn').click();
    await expect(page.getByTestId('event-editor-step-3')).toBeInViewport();
  });

  test('a collaborator can step back with Sair da colaboração', async ({ page }) => {
    await setupMockAuthSession(page, {
      uid: 'ana-uid',
      email: 'ana@exemplo.com',
      displayName: 'Ana',
      events: [{ ...event, collaborators: ['ana-uid'] }],
    });
    await page.goto('/evento/e1');
    await expect(page.getByText('Compartilhe o QR Code')).toBeVisible();
    await page.getByRole('button', { name: 'Sair da colaboração', exact: true }).click();
    await page.getByRole('button', { name: 'Sair', exact: true }).click();
    await expect(page.getByText('Compartilhe o QR Code')).toHaveCount(0);
    await expect(
      page.getByRole('button', { name: 'Sair da colaboração', exact: true }),
    ).toHaveCount(0);
  });
});
