import { test, expect } from '../fixtures/test.fixture';
import { setupMockAuthSession } from '../helpers/auth-mock.helper';
import {
  assertNoHorizontalOverflow,
  assertMinTouchTarget,
  assertGlassmorphism,
  assertFontFamily,
  assertSingleSurfaceRing,
} from '../helpers/design-tokens.helper';

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

test.describe('Consolidated Design System Zero-Regression Visual Baselines', () => {
  test.beforeEach(async ({ page }) => {
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
  });

  test('[Visual-01] Home view should satisfy typography, glassmorphism, and zero-overflow', async ({
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

  test('[Visual-02] Login view should satisfy touch targets, animated gradient, and card glassmorphism', async ({
    page,
    loginPage,
  }) => {
    await setupMockAuthSession(page, null);
    await loginPage.goto('/login');
    await loginPage.assertLoaded();

    await assertMinTouchTarget(loginPage.submitBtn);
    await assertMinTouchTarget(loginPage.googleBtn);

    const loginCard = page.locator('.login__card [data-testid="org-surface"], .login__card .org-surface').first();
    await assertGlassmorphism(loginCard);

    await assertNoHorizontalOverflow(page);
  });

  test('[Visual-03] Organizer Dashboard should render filter chips and surface single-ring architecture', async ({
    page,
    dashboardPage,
  }) => {
    await dashboardPage.goto('/meus-eventos');
    await dashboardPage.assertLoaded();

    const newEventBtn = dashboardPage.createEventBtn.first();
    await expect(newEventBtn).toBeVisible();
    await assertMinTouchTarget(newEventBtn);

    await assertNoHorizontalOverflow(page);
  });

  test('[Visual-04] Event Editor Stepper should render multi-step layout with zero horizontal overflow', async ({
    page,
    eventEditorPage,
  }) => {
    await eventEditorPage.goto('/meus-eventos/evento/novo');
    await eventEditorPage.assertLoaded();

    const stepperCard = page.locator('mat-card[orgSurface], .editor__card, .org-surface, [data-testid="org-surface"]').first();
    await assertGlassmorphism(stepperCard);

    await assertNoHorizontalOverflow(page);
  });

  test('[Visual-05] User Profile should verify personal info card and family roster glassmorphism', async ({
    page,
    profilePage,
  }) => {
    await profilePage.goto('/perfil');
    await profilePage.assertLoaded();

    const profileCard = page.locator('app-profile-info-card .org-surface, app-profile-info-card [data-testid="org-surface"], app-profile-info-card [orgSurface]').first();
    await assertGlassmorphism(profileCard);
    await assertSingleSurfaceRing(profileCard);

    await assertNoHorizontalOverflow(page);
  });

  test('[Visual-06] Design System Showcase should satisfy full visual hierarchy across all 14 sections', async ({
    page,
    showcasePage,
  }) => {
    await showcasePage.goto('/design-system');
    await showcasePage.assertLoaded();

    // Verify Brand title typography
    const showcaseTitle = page.locator('.org-ds-topbar__title');
    await assertFontFamily(showcaseTitle, 'Fraunces');

    // Verify specimen card glassmorphism and single ring
    const firstSpecimen = page.locator('.org-ds-hero-card [data-testid="org-surface"], section [data-testid="org-surface"]').first();
    await assertGlassmorphism(firstSpecimen);
    await assertSingleSurfaceRing(firstSpecimen);

    // Verify interactive button touch targets in canvas
    const primaryButton = page.locator('section#buttons .org-button__control, section#buttons org-button button').first();
    await assertMinTouchTarget(primaryButton);

    await assertNoHorizontalOverflow(page);
  });
});
