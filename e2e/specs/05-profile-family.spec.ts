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
    // Perfil uses the narrow page width (the layout modifiers live on the host element).
    await expect(page.locator('.org-page-layout__container').first()).toHaveCSS(
      'max-width',
      '600px',
    );
    await expect(page.locator('#profile-heading').first()).toContainText('Carlos');
    await assertSingleSurfaceRing(profileInfoCard.locator('.org-surface'));

    // Family roster and the Aparência card; confirmed events now live in Início → Confirmados.
    await expect(page.locator('app-family-roster-manager')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Aparência' })).toBeVisible();
    await expect(page.locator('.profile-event-card')).toHaveCount(0);

    // Interact with display name editing
    const editBtn = page.locator('.profile-info-card__edit-btn').first();
    await expect(editBtn).toBeVisible();
    await editBtn.click();

    await expect(profilePage.nameInput).toBeVisible();
    await profilePage.nameInput.fill('Carlos Alberto Silva');
    await expect(profilePage.nameInput).toHaveValue('Carlos Alberto Silva');
    await assertFocusedFieldCoherence(page.locator('mat-form-field .mat-mdc-text-field-wrapper'));

    // The same form edits the phone.
    const profilePhoneInput = page.getByTestId('profile-phone-input');
    await expect(profilePhoneInput).toBeVisible();
    // The mask keeps digits only, at most 11, and an incomplete number is refused.
    await profilePhoneInput.fill('11a9777');
    await expect(profilePhoneInput).toHaveValue('(11) 9777');
    await profilePage.saveProfileBtn.click();
    await expect(page.locator('app-profile-info-card')).toContainText('Telefone inválido');
    await profilePhoneInput.fill('119777722229999');
    await expect(profilePhoneInput).toHaveValue('(11) 97777-2222');

    await expect(profilePage.saveProfileBtn).toBeVisible();
    await expect(profilePage.saveProfileBtn).toBeEnabled();
    await profilePage.saveProfileBtn.click();

    // Assert update feedback or updated name rendered in profile card
    const nameDisplay = page.locator('.profile-info-card__name, app-profile-info-card');
    await expect(nameDisplay.first()).toContainText('Carlos Alberto Silva');
    await expect(page.locator('.profile-info-card__details')).toContainText('(11) 97777-2222');
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
    await expect(page.locator('#family-roster-heading').first()).toContainText('Minha família');
    await assertSingleSurfaceRing(familyRosterRoot.locator('.org-surface'));

    // The add form is always open; there is no toggle to show or hide it.
    await expect(page.locator('[data-testid="toggle-family-form-btn"]')).toHaveCount(0);

    // Form inputs and add button presence
    await expect(familyRoster.nameInput).toBeVisible();
    await expect(familyRoster.relationshipSelect).toBeVisible();
    await expect(familyRoster.phoneInput).toBeVisible();
    await expect(familyRoster.addMemberBtn).toBeVisible();
    await assertFocusedFieldCoherence(familyRoster.nameInput);

    // With the name empty, adding says what is missing instead of a silent disabled button
    await familyRoster.nameInput.fill('');
    await expect(familyRoster.addMemberBtn).toBeEnabled();
    await familyRoster.addMemberBtn.click();
    await expect(page.locator('app-family-roster-manager')).toContainText(
      'Informe o nome do familiar',
    );

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

    // 3. Edit a family member in a sheet; a half-typed new member stays in the add form
    await familyRoster.nameInput.fill('Pedro');
    await familyRoster.memberCards
      .filter({ hasText: 'Lucas Silva' })
      .locator('button[aria-label="Editar Lucas Silva"]')
      .click();
    const editSheet = page.getByTestId('edit-family-member-sheet');
    await expect(editSheet).toBeVisible();
    const editName = page.getByTestId('edit-family-member-name-input');
    await expect(editName).toHaveValue('Lucas Silva');
    await editName.fill('Lucas Souza');
    await page.getByTestId('edit-family-member-save-btn').click();
    await expect(editSheet).toBeHidden();
    await expect(familyRoster.memberCards.filter({ hasText: 'Lucas Souza' })).toHaveCount(1);
    await expect(familyRoster.memberCards.filter({ hasText: 'Lucas Silva' })).toHaveCount(0);
    await expect(familyRoster.nameInput).toHaveValue('Pedro');
    await familyRoster.nameInput.fill('');

    // 4. Remove a family member
    const initialCount = await familyRoster.memberCards.count();
    const deleteBtn = familyRoster.deleteMemberBtns.first();
    await expect(deleteBtn).toBeVisible();
    await deleteBtn.click();
    // Removing asks first, in a danger dialog
    const confirmDialog = page.getByTestId('org-confirm-dialog');
    await expect(confirmDialog).toHaveClass(/org-confirm-dialog--danger/);
    await expect(confirmDialog).toContainText('Remover familiar');
    await confirmDialog.getByTestId('org-confirm-submit').click();

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
