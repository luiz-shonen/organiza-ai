import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './base.page';

export class EventEditorPage extends BasePage {
  readonly pageRoot: Locator;
  readonly categoryChips: Locator;
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
    this.pageRoot = page
      .getByTestId('event-editor-page')
      .or(page.locator('section.editor'))
      .first();
    this.categoryChips = page.getByTestId('category-options').locator('org-chip');
    this.titleInput = page
      .getByTestId('event-title-input')
      .or(page.locator('input[formcontrolname="title"]'))
      .first();
    this.dateInput = page
      .getByTestId('event-date-input')
      .or(page.locator('input[formcontrolname="date"]'))
      .first();
    this.timeInput = page
      .getByTestId('event-time-input')
      .or(page.locator('input[formcontrolname="time"]'))
      .first();
    this.descriptionInput = page
      .getByTestId('event-description-input')
      .or(page.locator('textarea[formcontrolname="description"]'))
      .first();
    this.cepInput = page
      .getByTestId('event-cep-input')
      .or(page.locator('input[formcontrolname="cep"]'))
      .first();
    this.streetInput = page
      .getByTestId('event-street-input')
      .or(page.locator('input[formcontrolname="address"]'))
      .first();
    this.numberInput = page
      .getByTestId('event-number-input')
      .or(page.locator('input[formcontrolname="number"]'))
      .first();
    this.saveBtn = page
      .getByTestId('event-save-btn')
      .locator('button')
      .or(
        page.locator(
          '.editor__save-btn button, button[data-testid="event-save-btn"], button[aria-label="Salvar evento"], button:has-text("Salvar"), button:has-text("Criar Evento")',
        ),
      )
      .first();
    this.cancelEventBtn = page.locator('button[data-testid="cancel-event-btn"]').first();
    this.nextStepBtns = page.locator(
      'org-button[label="Próximo"] button, [data-testid="stepper-next-btn"] button, button:has-text("Próximo")',
    );
    this.itemNameInput = page.getByTestId('item-name-input').first();
    this.itemQtyInput = page.getByTestId('item-qty-input').first();
    this.addItemBtn = page
      .getByTestId('add-item-btn')
      .or(page.locator('button[aria-label="Adicionar item"]'))
      .first();
  }

  async assertLoaded(): Promise<void> {
    await expect(this.pageRoot).toBeVisible();
  }

  async fillBasicInfo(
    title: string,
    date: string,
    description: string,
    time: string = '19:00',
  ): Promise<void> {
    await this.titleInput.fill(title);
    const categoryChip = this.page
      .locator('[data-testid="category-options"] org-chip, org-chip, mat-chip-option')
      .first();
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

  /** The message "Próximo" shows when the step still has something missing. */
  get missingFieldsBanner(): Locator {
    return this.page.getByTestId('step-missing-fields').filter({ visible: true });
  }

  async advanceStep(): Promise<void> {
    const nextBtn = this.nextStepBtns.filter({ visible: true }).first();
    await expect(nextBtn).toBeEnabled();
    await nextBtn.click();
  }

  async fillAddress(address: {
    cep: string;
    street?: string;
    number?: string;
    neighborhood?: string;
    city?: string;
  }): Promise<void> {
    if (address.cep) {
      await this.cepInput.fill(address.cep);
      // "Próximo" is always pressable now: wait for the CEP lookup to fill the street first.
      await expect(this.streetInput).not.toHaveValue('');
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
    await expect(this.streetInput).not.toHaveValue('');
    await this.numberInput.fill(number);
    const nextBtn = this.nextStepBtns.filter({ visible: true }).first();
    await expect(nextBtn).toBeEnabled();
    await nextBtn.click();
  }

  /** Opens a step by its stepper label (editing allows jumping; creating goes in order). */
  async openStep(
    label: 'Informações' | 'Endereço' | 'Itens' | 'Amigo oculto' | 'Pix',
  ): Promise<void> {
    // On a phone the steps are bars under "Etapa N de 5"; wider, the numbered headers.
    const phone = this.page.getByTestId('stepper-phone');
    if (await phone.isVisible()) {
      await phone.getByRole('button', { name: new RegExp(`: ${label}$`) }).click();
      await expect(phone.locator('.org-stepper__name')).toHaveText(label);
      return;
    }
    await this.page.locator('.mat-step-header').filter({ hasText: label }).click();
    await expect(this.page.locator('.mat-step-header[aria-selected="true"]')).toContainText(label);
  }

  async saveEvent(): Promise<void> {
    if (!(await this.saveBtn.isVisible())) {
      await this.openStep('Pix');
    }
    const saveButton = this.saveBtn.filter({ visible: true }).first();
    await expect(saveButton).toBeEnabled();
    await saveButton.click();
  }

  /** Answers "Os convidados vão levar alguma coisa?" with yes, so the item form shows. */
  async turnOnItems(): Promise<void> {
    const toggle = this.page
      .getByTestId('items-toggle')
      .filter({ visible: true })
      .getByRole('switch');
    if ((await toggle.getAttribute('aria-checked')) !== 'true') await toggle.click();
    await expect(this.itemNameInput).toBeVisible();
  }

  async addWishlistItem(name: string, _category = 'Geral', quantity = 1): Promise<void> {
    if (!(await this.itemNameInput.isVisible())) {
      await this.openStep('Itens');
    }
    await this.turnOnItems();
    await this.itemNameInput.fill(name);
    await this.itemQtyInput.fill(quantity.toString());
    await this.addItemBtn.click();
  }
}
