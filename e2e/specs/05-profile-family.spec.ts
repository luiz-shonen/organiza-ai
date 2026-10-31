import { test, expect } from '../fixtures/test.fixture';
import { setupMockAuthSession } from '../helpers/auth-mock.helper';
import {
  assertFocusedFieldCoherence,
  assertNoHorizontalOverflow,
  assertSingleSurfaceRing,
} from '../helpers/design-tokens.helper';

const mockFamilyEvent = {
  id: 'test-event-placeholder',
  title: 'Evento Familiar',
  category: 'Aniversário',
  description: 'Comemoração em família.',
  date: new Date(Date.now() + 86400000 * 3).toISOString(),
  location: 'Av. Paulista, 1000 - São Paulo/SP',
  status: 'active',
  createdBy: 'test-user-uid',
  creatorEmail: 'carlos.silva@exemplo.com',
  collaborators: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

test.describe('User Profile and Family Roster Management', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockAuthSession(page, {
      uid: 'test-user-uid',
      email: 'carlos.silva@exemplo.com',
      displayName: 'Carlos Alberto',
      events: [mockFamilyEvent],
      familyMembers: [
        { id: 'member-1', name: 'Mariana Silva', relationship: 'spouse', phone: '(11) 98888-1111' },
      ],
    });
  });

  test('should render profile page structure and update user display name', async ({
    profilePage,
    page,
  }) => {
    await profilePage.goto('/perfil');
    await profilePage.assertLoaded();

    // Semantic landmark and header assertions
    await expect(profilePage.pageRoot).toBeVisible();
    const heading = page.getByRole('heading', { level: 1, name: /meu perfil/i });
    await expect(heading).toBeVisible();

    const subtitle = page
      .locator('.profile-container__subtitle, .org-page-header__subtitle')
      .first();
    await expect(subtitle).toBeVisible();
    await expect(subtitle).toContainText(/gerencie suas informações/i);

    // Profile info card component should be rendered
    const profileInfoCard = page.locator('app-profile-info-card');
    await expect(profileInfoCard).toBeVisible();
    await expect(page.locator('#profile-heading, .profile-info-card__title').first()).toContainText(
      'Informações Pessoais',
    );
    await assertSingleSurfaceRing(profileInfoCard.locator('.org-surface'));

    // Family roster and attended events sections
    await expect(page.locator('app-family-roster-manager')).toBeVisible();
    await expect(
      page
        .locator('#attended-events-heading, org-section[title*="Eventos"], .profile-event-card')
        .first(),
    ).toBeVisible();

    // Interact with display name editing
    const editBtn = page.locator('.profile-info-card__edit-btn').first();
    await expect(editBtn).toBeVisible();
    await editBtn.click();

    await expect(profilePage.nameInput).toBeVisible();
    await profilePage.nameInput.fill('Carlos Alberto Silva');
    await expect(profilePage.nameInput).toHaveValue('Carlos Alberto Silva');
    await assertFocusedFieldCoherence(page.locator('mat-form-field .mat-mdc-text-field-wrapper'));

    await expect(profilePage.saveProfileBtn).toBeVisible();
    await expect(profilePage.saveProfileBtn).toBeEnabled();
    await profilePage.saveProfileBtn.click();

    // Assert update feedback or updated name rendered in profile card
    const nameDisplay = page.locator('.profile-info-card__name, app-profile-info-card');
    await expect(nameDisplay.first()).toContainText('Carlos Alberto Silva');
    await assertNoHorizontalOverflow(page);
  });

  test('should interact with family roster form and allow adding and removing family members', async ({
    profilePage,
    familyRoster,
    page,
  }) => {
    await profilePage.goto('/perfil');
    await profilePage.assertLoaded();

    // Verify family roster section
    const familyRosterRoot = page.locator('app-family-roster-manager');
    await expect(familyRosterRoot).toBeVisible();
    await expect(
      page.locator('#family-roster-heading, .family-roster__title').first(),
    ).toContainText('Minha Família');
    await assertSingleSurfaceRing(familyRosterRoot.locator('.org-surface'));

    // Form inputs and add button presence
    await expect(familyRoster.nameInput).toBeVisible();
    await expect(familyRoster.relationshipSelect).toBeVisible();
    await expect(familyRoster.phoneInput).toBeVisible();
    await expect(familyRoster.addMemberBtn).toBeVisible();
    await assertFocusedFieldCoherence(familyRoster.nameInput);

    // Add button disabled when name is empty
    await familyRoster.nameInput.fill('');
    await expect(familyRoster.addMemberBtn).toBeDisabled();

    // 1. Add first family member: Spouse
    await familyRoster.nameInput.fill('Mariana Silva');
    await familyRoster.relationshipSelect.click();
    await page.getByRole('option', { name: 'Cônjuge' }).click();
    await familyRoster.phoneInput.fill('(11) 98888-7777');

    await expect(familyRoster.addMemberBtn).toBeEnabled();
    await familyRoster.addMemberBtn.click();

    // Assert first member is listed
    await expect(
      familyRoster.memberCards.filter({ hasText: 'Mariana Silva' }).first(),
    ).toBeVisible();

    // 2. Add second family member: Child using helper method
    await familyRoster.addMember('Lucas Silva', 'child', '(11) 97777-6666');
    await expect(familyRoster.memberCards.filter({ hasText: 'Lucas Silva' }).first()).toBeVisible();

    const memberCount = await familyRoster.memberCards.count();
    expect(memberCount).toBeGreaterThanOrEqual(2);

    // 3. Remove a family member
    const initialCount = await familyRoster.memberCards.count();
    const deleteBtn = familyRoster.deleteMemberBtns.first();
    await expect(deleteBtn).toBeVisible();
    await deleteBtn.click();

    // Assert member count decreased
    await expect(familyRoster.memberCards).toHaveCount(initialCount - 1);
    await assertNoHorizontalOverflow(page);
  });

  test('should support batch family member selection inside RSVP dialog', async ({
    eventDetailPage,
    rsvpDialog,
    familyRoster,
  }) => {
    await eventDetailPage.goto('/evento/test-event-placeholder');
    await eventDetailPage.assertLoaded();

    await eventDetailPage.openRsvpDialog();
    await rsvpDialog.assertVisible();
    await expect(rsvpDialog.familySelector).toBeVisible();

    // The family selector starts collapsed; expanding it reveals "Selecionar Todos".
    const panelHeader = rsvpDialog.familySelector.locator('mat-expansion-panel-header');
    await expect(panelHeader).toHaveAttribute('aria-expanded', 'false');
    await panelHeader.click();
    await expect(panelHeader).toHaveAttribute('aria-expanded', 'true');

    await familyRoster.selectAllCheckbox.first().click();
    const badge = rsvpDialog.familySelector.locator('.family-selector__badge');
    await expect(badge).toContainText(/1 selecionado/i);

    await rsvpDialog.nameInput.fill('Carlos Alberto Silva');
    await rsvpDialog.phoneInput.fill('11999998888');

    await rsvpDialog.cancel();
    await rsvpDialog.assertHidden();
  });
});
