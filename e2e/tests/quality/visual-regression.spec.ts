import { test, expect } from '../../fixtures/test.fixture';
import type { Page } from '@playwright/test';
import { setupMockAuthSession } from '../../helpers/auth-mock.helper';
import {
  assertNoHorizontalOverflow,
  assertMinTouchTarget,
  assertCardSurface,
  assertFontFamily,
  assertSingleSurfaceRing,
} from '../../helpers/design-tokens.helper';

const mockEvent = {
  id: 'visual-baseline-event-1',
  title: 'Celebração Visual Baseline 2026',
  category: 'Festa',
  description: 'Evento de validação de regressão visual do design system.',
  date: new Date(Date.now() + 86400000 * 5).toISOString(),
  location: 'Av. Paulista, 1578 - Bela Vista - São Paulo/SP - CEP: 01310-200',
  status: 'active',
  createdBy: 'superadmin-visual-uid',
  creatorEmail: 'luiz.gmr.dev@gmail.com',
  collaborators: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

async function setupSuperAdminSession(page: Page): Promise<void> {
  await setupMockAuthSession(page, {
    uid: 'superadmin-visual-uid',
    email: 'luiz.gmr.dev@gmail.com',
    displayName: 'Super Admin Visual',
    isSuperAdmin: true,
    events: [mockEvent],
    userProfile: {
      id: 'superadmin-visual-uid',
      email: 'luiz.gmr.dev@gmail.com',
      displayName: 'Super Admin Visual',
      phone: '(11) 98888-7777',
    },
  });
}

test.describe('Design system visual baselines', () => {
  test('Home view should satisfy typography, flat surfaces, and zero-overflow', async ({
    page,
    homePage,
  }) => {
    await homePage.goto('/');
    await homePage.assertLoaded();

    const heading = page.getByRole('heading', { level: 1 }).first();
    await expect(heading).toBeVisible();
    await assertFontFamily(heading, 'Plus Jakarta Sans');

    await assertNoHorizontalOverflow(page);
  });

  test('Login view should satisfy touch targets, animated gradient, and flat cards', async ({
    page,
    loginPage,
  }) => {
    await loginPage.goto('/login');
    await loginPage.assertLoaded();

    await assertMinTouchTarget(loginPage.submitBtn);
    await assertMinTouchTarget(loginPage.googleBtn);

    const loginCard = page
      .locator('.login__card [data-testid="org-surface"], .login__card .org-surface')
      .first();
    await assertCardSurface(loginCard);

    await assertNoHorizontalOverflow(page);
  });

  test('Organizer Dashboard should render filter chips and surface single-ring architecture', async ({
    page,
    dashboardPage,
  }) => {
    await setupSuperAdminSession(page);
    await dashboardPage.goto('/meus-eventos');
    await dashboardPage.assertLoaded();

    const newEventBtn = dashboardPage.createEventBtn.first();
    await expect(newEventBtn).toBeVisible();
    await assertMinTouchTarget(newEventBtn);

    await assertNoHorizontalOverflow(page);
  });

  test('Event Editor Stepper should render multi-step layout with zero horizontal overflow', async ({
    page,
    eventEditorPage,
  }) => {
    await setupSuperAdminSession(page);
    await eventEditorPage.goto('/meus-eventos/evento/novo');
    await eventEditorPage.assertLoaded();

    const stepperCard = page
      .locator('mat-card[orgSurface], .editor__card, .org-surface, [data-testid="org-surface"]')
      .first();
    await assertCardSurface(stepperCard);

    await assertNoHorizontalOverflow(page);
  });

  test('User Profile should verify the personal info card and the family roster surfaces', async ({
    page,
    profilePage,
  }) => {
    await setupSuperAdminSession(page);
    await profilePage.goto('/perfil');
    await profilePage.assertLoaded();

    const profileCard = page
      .locator(
        'app-profile-info-card .org-surface, app-profile-info-card [data-testid="org-surface"], app-profile-info-card [orgSurface]',
      )
      .first();
    await assertCardSurface(profileCard);
    await assertSingleSurfaceRing(profileCard);

    await assertNoHorizontalOverflow(page);
  });

  test('Design System Showcase should satisfy full visual hierarchy across all 14 sections', async ({
    page,
    showcasePage,
  }) => {
    await setupSuperAdminSession(page);
    await showcasePage.goto('/design-system');
    await showcasePage.assertLoaded();

    // Verify Brand title typography
    const showcaseTitle = page.locator('.org-ds-topbar__title');
    await assertFontFamily(showcaseTitle, 'Fredoka');

    // Verify specimen card glassmorphism and single ring
    const firstSpecimen = page
      .locator('.org-ds-hero-card [data-testid="org-surface"], section [data-testid="org-surface"]')
      .first();
    await assertCardSurface(firstSpecimen);
    await assertSingleSurfaceRing(firstSpecimen);

    // Verify interactive button touch targets in canvas
    const primaryButton = page
      .locator('section#buttons .org-button__control, section#buttons org-button button')
      .first();
    await assertMinTouchTarget(primaryButton);

    await assertNoHorizontalOverflow(page);
  });
});
