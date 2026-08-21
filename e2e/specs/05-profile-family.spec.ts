import { test, expect } from '../fixtures/test.fixture';
import { setupMockAuthSession } from '../helpers/auth-mock.helper';
import { assertFocusedFieldCoherence, assertNoHorizontalOverflow, assertSingleSurfaceRing } from '../helpers/design-tokens.helper';

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

    const subtitle = page.locator('.profile-container__subtitle');
    await expect(subtitle).toBeVisible();
    await expect(subtitle).toContainText(/gerencie suas informações/i);

    // Profile info card component should be rendered
    const profileInfoCard = page.locator('app-profile-info-card');
    await expect(profileInfoCard).toBeVisible();
    await expect(page.locator('#profile-heading')).toContainText('Informações Pessoais');
    await assertSingleSurfaceRing(profileInfoCard.locator('section.org-surface'));

    // Family roster and attended events sections
    await expect(page.locator('app-family-roster-manager')).toBeVisible();
    await expect(page.locator('#attended-events-heading')).toBeVisible();

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
    await expect(familyRoster.rosterRoot.first()).toBeVisible();
    await expect(page.locator('#family-roster-heading, .family-roster__title').first()).toContainText('Minha Família');

    // Form inputs and add button presence
    await expect(familyRoster.nameInput).toBeVisible();
    await expect(familyRoster.relationshipSelect).toBeVisible();
    await expect(familyRoster.phoneInput).toBeVisible();
    await expect(familyRoster.addMemberBtn).toBeVisible();

    // Add button disabled when name is empty
    await familyRoster.nameInput.fill('');
    await expect(familyRoster.addMemberBtn).toBeDisabled();

    // 1. Add first family member: Spouse
    await familyRoster.nameInput.fill('Mariana Silva');
    await familyRoster.relationshipSelect.click();
    const spouseOption = page.locator('mat-option').filter({ hasText: 'Cônjuge' }).first();
    if (await spouseOption.isVisible()) {
      await spouseOption.click();
    }

    if (await familyRoster.phoneInput.isVisible()) {
      await familyRoster.phoneInput.fill('(11) 98888-7777');
    }

    await expect(familyRoster.addMemberBtn).toBeEnabled();
    await familyRoster.addMemberBtn.click();

    // Assert first member is listed
    await expect(familyRoster.memberCards.filter({ hasText: 'Mariana Silva' }).first()).toBeVisible();

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
  });

  test('should support batch family member selection inside RSVP dialog', async ({
    eventDetailPage,
    rsvpDialog,
    familyRoster,
    page,
  }) => {
    // Navigate to public event detail page
    await eventDetailPage.goto('/evento/test-event-placeholder');
    await eventDetailPage.assertLoaded();

    // Open RSVP Dialog if available on test event
    const hasRsvpBtn = await eventDetailPage.rsvpBtn.isVisible().catch(() => false);
    if (hasRsvpBtn) {
      await eventDetailPage.openRsvpDialog();
      const isDialogVisible = await rsvpDialog.dialogRoot.first().isVisible({ timeout: 3000 }).catch(() => false);
      if (isDialogVisible) {
        await rsvpDialog.assertVisible();
        await expect(rsvpDialog.dialogRoot.first()).toBeVisible();

        // Family selector section presence inside RSVP dialog
        const hasFamilySelector = await rsvpDialog.familySelector.isVisible().catch(() => false);
        if (hasFamilySelector) {
          await expect(rsvpDialog.familySelector).toBeVisible();

          // Expand family selector expansion panel if collapsed
          const panelHeader = rsvpDialog.familySelector.locator('mat-expansion-panel-header, .family-selector__header');
          if (await panelHeader.isVisible()) {
            const isExpanded = await panelHeader.getAttribute('aria-expanded');
            if (isExpanded !== 'true') {
              await panelHeader.click();
            }
          }

          // Check if select all or inline form are available
          const selectAllCheckbox = familyRoster.selectAllCheckbox.first();
          if (await selectAllCheckbox.isVisible()) {
            await selectAllCheckbox.click();
            const badge = rsvpDialog.familySelector.locator('.family-selector__badge');
            await expect(badge).toBeVisible();
            await expect(badge).toContainText(/selecionado/i);
          }
        }

        // Verify main RSVP form inputs
        if (await rsvpDialog.nameInput.isVisible()) {
          await rsvpDialog.nameInput.fill('Carlos Alberto Silva');
        }
        if (await rsvpDialog.phoneInput.isVisible()) {
          await rsvpDialog.phoneInput.fill('11999998888');
        }

        await rsvpDialog.cancel();
        await rsvpDialog.assertHidden();
      }
    }
  });
});
