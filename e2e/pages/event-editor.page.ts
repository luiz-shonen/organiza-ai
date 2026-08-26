import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './base.page';

export class EventEditorPage extends BasePage {
  readonly pageRoot: Locator;
  readonly titleInput: Locator;
  readonly dateInput: Locator;
  readonly timeInput: Locator;
  readonly descriptionInput: Locator;
  readonly cepInput: Locator;
  readonly streetInput: Locator;
  readonly numberInput: Locator;
  readonly saveBtn: Locator;
  readonly cancelEventBtn: Locator;
  readonly nextStepBtns: Locator;
  readonly itemNameInput: Locator;
  readonly itemQtyInput: Locator;
  readonly addItemBtn: Locator;

  constructor(page: Page) {
    super(page);
    this.pageRoot = page.getByTestId('event-editor-page').or(page.locator('section.editor')).first();
    this.titleInput = page.getByTestId('event-title-input').or(page.locator('input[formcontrolname="title"]')).first();
    this.dateInput = page.getByTestId('event-date-input').or(page.locator('input[formcontrolname="date"]')).first();
    this.timeInput = page.getByTestId('event-time-input').or(page.locator('input[formcontrolname="time"]')).first();
    this.descriptionInput = page.getByTestId('event-description-input').or(page.locator('textarea[formcontrolname="description"]')).first();
    this.cepInput = page.getByTestId('event-cep-input').or(page.locator('input[formcontrolname="cep"]')).first();
    this.streetInput = page.getByTestId('event-street-input').or(page.locator('input[formcontrolname="address"]')).first();
    this.numberInput = page.getByTestId('event-number-input').or(page.locator('input[formcontrolname="number"]')).first();
    this.saveBtn = page.getByTestId('event-save-btn').or(page.locator('.editor__save-btn, button[aria-label="Salvar evento"]')).first();
    this.cancelEventBtn = page.getByTestId('event-cancel-btn').or(page.locator('.editor__cancel-btn, button[aria-label="Cancelar evento"]')).first();
    this.nextStepBtns = page.locator('org-button[label="Próximo"] button, [data-testid="stepper-next-btn"] button, button:has-text("Próximo")');
    this.itemNameInput = page.getByTestId('item-name-input').or(page.locator('.editor__item-name-field input')).first();
    this.itemQtyInput = page.getByTestId('item-qty-input').or(page.locator('.editor__item-qty-field input')).first();
    this.addItemBtn = page.getByTestId('add-item-btn').or(page.locator('.editor__add-btn, button[aria-label="Adicionar item"]')).first();
  }

  async assertLoaded(): Promise<void> {
    await expect(this.pageRoot).toBeVisible();
  }

  async fillBasicInfo(title: string, date: string, description: string, time: string = '19:00'): Promise<void> {
    await this.titleInput.fill(title);
    const categoryChip = this.page.locator('.editor__category-options org-chip, org-chip, mat-chip-option').first();
    if (await categoryChip.isVisible()) {
      await categoryChip.click();
    }
    await this.descriptionInput.fill(description);
    await this.dateInput.fill(date);
    await this.timeInput.fill(time);
    const nextBtn = this.nextStepBtns.filter({ visible: true }).first();
    await expect(nextBtn).toBeEnabled();
    await nextBtn.click();
  }

  async advanceStep(): Promise<void> {
    const nextBtn = this.nextStepBtns.filter({ visible: true }).first();
    await expect(nextBtn).toBeEnabled();
    await nextBtn.click();
  }

  async fillAddress(address: { cep: string; street?: string; number?: string; neighborhood?: string; city?: string }): Promise<void> {
    if (address.cep) {
      await this.cepInput.fill(address.cep);
    }
    if (address.number) {
      await this.numberInput.fill(address.number);
    }
    if (address.street && (await this.streetInput.isVisible())) {
      await this.streetInput.fill(address.street);
    }
  }

  async fillCep(cep: string, number: string = '100'): Promise<void> {
    await this.cepInput.fill(cep);
    await this.numberInput.fill(number);
    await expect(this.nextStepBtns).toBeEnabled();
    await this.nextStepBtns.click();
  }

  async saveEvent(): Promise<void> {
    await this.saveBtn.click();
  }

  async addWishlistItem(name: string, _category: string = 'Geral', quantity: number = 1): Promise<void> {
    await this.itemNameInput.fill(name);
    await this.itemQtyInput.fill(quantity.toString());
    await this.addItemBtn.click();
  }
}
