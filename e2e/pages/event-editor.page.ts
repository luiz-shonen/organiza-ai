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
    this.pageRoot = page.getByTestId('event-editor-page').or(page.locator('section.editor'));
    this.titleInput = page.getByTestId('event-title-input').or(page.getByLabel('Título do Evento')).or(page.locator('input[formcontrolname="title"]'));
    this.dateInput = page.getByTestId('event-date-input').or(page.getByLabel('Data do Evento')).or(page.locator('input[formcontrolname="date"]'));
    this.timeInput = page.getByTestId('event-time-input').or(page.getByLabel('Hora')).or(page.locator('input[formcontrolname="time"]'));
    this.descriptionInput = page.getByTestId('event-description-input').or(page.getByLabel('Descrição')).or(page.locator('textarea[formcontrolname="description"]'));
    this.cepInput = page.getByTestId('event-cep-input').or(page.getByLabel('CEP')).or(page.locator('input[formcontrolname="cep"]'));
    this.streetInput = page.getByTestId('event-street-input').or(page.getByLabel('Endereço')).or(page.locator('input[formcontrolname="address"]'));
    this.numberInput = page.getByTestId('event-number-input').or(page.getByLabel('Número')).or(page.locator('input[formcontrolname="number"]'));
    this.saveBtn = page.getByTestId('event-save-btn').or(page.locator('.editor__save-btn, button[aria-label="Salvar evento"]'));
    this.cancelEventBtn = page.getByTestId('event-cancel-btn').or(page.locator('.editor__cancel-btn, button[aria-label="Cancelar evento"]'));
    this.nextStepBtns = page.locator('button[matsteppernext]');
    this.itemNameInput = page.getByTestId('item-name-input').or(page.getByLabel('Nome do item')).or(page.locator('.editor__item-name-field input'));
    this.itemQtyInput = page.getByTestId('item-qty-input').or(page.getByLabel('Quantidade')).or(page.locator('.editor__item-qty-field input'));
    this.addItemBtn = page.getByTestId('add-item-btn').or(page.locator('.editor__add-btn, button[aria-label="Adicionar item"]'));
  }

  async assertLoaded(): Promise<void> {
    await expect(this.pageRoot).toBeVisible();
  }

  async fillBasicInfo(title: string, date: string, description: string, time: string = '19:00'): Promise<void> {
    await this.titleInput.fill(title);
    const categoryChip = this.page.locator('mat-chip-option').first();
    if (await categoryChip.isVisible()) {
      await categoryChip.click();
    }
    await this.descriptionInput.fill(description);
    await this.dateInput.fill(date);
    await this.timeInput.fill(time);
    if (await this.nextStepBtns.first().isVisible()) {
      await this.nextStepBtns.first().click();
    }
  }

  async fillCep(cep: string, number: string = '100'): Promise<void> {
    await this.cepInput.fill(cep);
    await this.numberInput.fill(number);
    if (await this.nextStepBtns.nth(1).isVisible()) {
      await this.nextStepBtns.nth(1).click();
    }
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
