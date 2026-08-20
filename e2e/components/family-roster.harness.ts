import { Locator, Page } from '@playwright/test';

export class FamilyRosterHarness {
  readonly rosterRoot: Locator;
  readonly memberCards: Locator;
  readonly nameInput: Locator;
  readonly relationshipSelect: Locator;
  readonly phoneInput: Locator;
  readonly addMemberBtn: Locator;
  readonly deleteMemberBtns: Locator;
  readonly selectAllCheckbox: Locator;

  constructor(
    private readonly page: Page,
    rootLocator?: Locator
  ) {
    this.rosterRoot = (rootLocator ?? page.locator(':root'))
      .getByTestId('family-roster')
      .or(page.getByTestId('family-roster-manager'))
      .or(page.getByTestId('family-selector'))
      .or(page.locator('app-family-roster-manager, .family-roster, app-family-selector, .family-selector'));

    const searchScope = rootLocator ?? this.rosterRoot;

    this.memberCards = searchScope
      .getByTestId('family-member-card')
      .or(searchScope.locator('.family-roster__item, .family-selector__item, li[role="listitem"]'));

    this.nameInput = searchScope
      .getByTestId('family-member-name-input')
      .or(searchScope.getByTestId('family-name-input'))
      .or(searchScope.getByLabel(/nome/i))
      .or(
        searchScope.locator(
          'input[name="familyName"], input[name="inlineMemberName"], input[placeholder*="Lucas"], input[placeholder*="Pedro"], input[formcontrolname="name"]'
        )
      );

    this.relationshipSelect = searchScope
      .getByTestId('family-member-relationship-select')
      .or(searchScope.getByTestId('family-relationship-select'))
      .or(searchScope.getByLabel(/parentesco/i))
      .or(
        searchScope.locator(
          'mat-select[name="familyRelationship"], mat-select[name="inlineMemberRelationship"], mat-select'
        )
      );

    this.phoneInput = searchScope
      .getByTestId('family-member-phone-input')
      .or(searchScope.getByTestId('family-phone-input'))
      .or(searchScope.getByLabel(/telefone|whatsapp/i))
      .or(searchScope.locator('input[name="familyPhone"], input[type="tel"]'));

    this.addMemberBtn = searchScope
      .getByTestId('add-family-member-btn')
      .or(
        searchScope.locator(
          '.family-roster__add-btn, .family-selector__inline-actions button[type="submit"], button:has-text("Adicionar"), button:has-text("Adicionar Familiar"), button:has-text("Adicionar e Selecionar"), [aria-label*="Adicionar familiar"], [aria-label*="Salvar e selecionar"]'
        )
      );

    this.deleteMemberBtns = searchScope
      .getByTestId('delete-family-member-btn')
      .or(
        searchScope.locator(
          '.family-roster__remove-btn, button[aria-label*="Remover"], button:has(mat-icon:has-text("delete")), button:has(mat-icon:has-text("delete_outline"))'
        )
      );

    this.selectAllCheckbox = searchScope
      .getByTestId('select-all-family-checkbox')
      .or(searchScope.getByLabel(/selecionar todos/i))
      .or(searchScope.locator('.family-selector__select-all, mat-checkbox:has-text("Selecionar Todos")'));
  }

  async addMember(name: string, relationship?: string, phone?: string): Promise<void> {
    const inlineToggleBtn = this.page.locator(
      '.family-selector__inline-toggle-btn, button:has-text("+ Novo Membro")'
    );
    if (await inlineToggleBtn.isVisible()) {
      await inlineToggleBtn.click();
    }

    await this.nameInput.fill(name);

    if (relationship) {
      const relationshipLabelMap: Record<string, string> = {
        spouse: 'Cônjuge',
        child: 'Filho(a)',
        parent: 'Pai/Mãe',
        sibling: 'Irmão(ã)',
        relative: 'Parente',
        other: 'Outro',
      };
      const label = relationshipLabelMap[relationship.toLowerCase()] ?? relationship;

      await this.relationshipSelect.click();
      const optionLocator = this.page
        .locator('mat-option')
        .filter({ hasText: label })
        .first()
        .or(this.page.locator(`mat-option[value="${relationship}"]`));

      await optionLocator.click();
    }

    if (phone && (await this.phoneInput.isVisible())) {
      await this.phoneInput.fill(phone);
    }

    await this.addMemberBtn.click();
  }

  async deleteMember(index: number): Promise<void> {
    await this.deleteMemberBtns.nth(index).click();
  }

  async toggleSelectAll(): Promise<void> {
    await this.selectAllCheckbox.click();
  }
}
