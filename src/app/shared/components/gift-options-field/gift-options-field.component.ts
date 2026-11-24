import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  input,
  model,
  signal,
} from '@angular/core';
import { SECRET_SANTA_MAX_GIFT_OPTIONS } from '../../../core/models';
import { GiftOption } from '../../../core/value-objects';
import { OrgIconButtonComponent, OrgTextFieldComponent } from '../../ui';

/**
 * The amigo oculto gift ideas, one at a time: the ideas added so far (each one to edit in place
 * or remove) and one "Nova opção" field whose "+" (or Enter) adds the next, up to `max`. The
 * same list wherever ideas are typed: the organizers' participant form, "Editar presença" and
 * "Não poderei ir" with the amigo oculto.
 *
 * Before saving, the parent calls `commit()`: an idea still typed (or being edited) joins the
 * list, and with `required` an empty list shows its error.
 */
@Component({
  selector: 'app-gift-options-field',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [OrgIconButtonComponent, OrgTextFieldComponent],
  templateUrl: './gift-options-field.component.html',
  styleUrl: './gift-options-field.component.scss',
  host: { '(keydown.enter)': 'onEnter($event)', '(keydown.escape)': 'onEscape($event)' },
})
export class GiftOptionsFieldComponent {
  /** The ideas added, in order. */
  public readonly gifts = model<readonly string[]>([]);
  /** How many ideas fit (1 to 10). */
  public readonly max = input(SECRET_SANTA_MAX_GIFT_OPTIONS);
  /** The title; by default "Opções de presente" ("Opção" when only one fits). */
  public readonly label = input('');
  public readonly hint = input('Ideias para quem tirar essa pessoa.');
  public readonly testIdPrefix = input('santa');

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  /** The idea being edited in place (its index), and its text while typed. */
  protected readonly editingGift = signal<number | null>(null);
  protected readonly editingGiftText = signal('');
  protected readonly editingGiftError = signal('');
  /** The idea being typed in "Nova opção", not added yet (kept in a form's draft). */
  public readonly newGift = model('');
  protected readonly newGiftError = signal('');
  protected readonly giftMaxLength = GiftOption.RULES.max;

  protected readonly title = computed(
    () => this.label() || (this.max() === 1 ? 'Opção de presente' : 'Opções de presente'),
  );
  protected readonly full = computed(() => this.gifts().length >= this.max());
  /** "1 de 3" beside the title, while more than one fits. */
  protected readonly count = computed(() =>
    this.max() > 1 ? `${this.gifts().length} de ${this.max()}` : '',
  );

  /**
   * Adds what is still typed (and keeps an idea being edited); with `required`, an empty list
   * says so. False, with the error on the field, when something is not valid.
   */
  public commit(required: boolean): boolean {
    const ok = this.saveGiftEdit() && this.addGift();
    if (!ok) return false;
    if (required && this.gifts().length === 0) {
      this.newGiftError.set('Informe pelo menos uma opção de presente');
      return false;
    }
    return true;
  }

  /** Clears what is typed and any error (a new person, or the ideas loaded again). */
  public reset(): void {
    this.newGift.set('');
    this.newGiftError.set('');
    this.cancelGiftEdit();
  }

  /** Adds the typed idea to the list; an invalid one stays in the field with its error. */
  protected addGift(): boolean {
    const raw = this.newGift();
    if (!raw.trim() || this.full()) return true;
    const gift = GiftOption.create(raw);
    if (!gift) {
      this.newGiftError.set(GiftOption.validate(raw) ?? 'Opção inválida');
      return false;
    }
    this.gifts.update((list) => [...list, gift.value]);
    this.newGift.set('');
    this.newGiftError.set('');
    setTimeout(() =>
      this.host.nativeElement.querySelector<HTMLInputElement>('.gift-field__new input')?.focus(),
    );
    return true;
  }

  protected setNewGift(value: string): void {
    this.newGift.set(value);
    if (this.newGiftError()) this.newGiftError.set('');
  }

  protected removeGift(index: number): void {
    this.gifts.update((list) => list.filter((_, i) => i !== index));
    if (this.editingGift() === index) this.cancelGiftEdit();
  }

  /** Opens an idea already added for editing, in place, with the cursor in it. */
  protected editGift(index: number): void {
    this.editingGift.set(index);
    this.editingGiftText.set(this.gifts()[index] ?? '');
    this.editingGiftError.set('');
    setTimeout(() =>
      this.host.nativeElement.querySelector<HTMLInputElement>('.gift-field__edit input')?.focus(),
    );
  }

  protected setEditingGift(value: string): void {
    this.editingGiftText.set(value);
    if (this.editingGiftError()) this.editingGiftError.set('');
  }

  /** Keeps the edited idea; emptied, it is taken out. False when it is not valid. */
  protected saveGiftEdit(): boolean {
    const index = this.editingGift();
    if (index === null) return true;
    const raw = this.editingGiftText();
    if (!raw.trim()) {
      this.removeGift(index);
      return true;
    }
    const gift = GiftOption.create(raw);
    if (!gift) {
      this.editingGiftError.set(GiftOption.validate(raw) ?? 'Opção inválida');
      return false;
    }
    this.gifts.update((list) => list.map((current, i) => (i === index ? gift.value : current)));
    this.cancelGiftEdit();
    return true;
  }

  protected cancelGiftEdit(): void {
    this.editingGift.set(null);
    this.editingGiftText.set('');
    this.editingGiftError.set('');
  }

  /** Esc while editing an idea leaves it as it was. */
  protected onEscape(event: Event): void {
    const target = event.target as HTMLElement | null;
    if (!target?.closest('.gift-field__edit')) return;
    event.preventDefault();
    this.cancelGiftEdit();
  }

  /** Enter adds (or keeps the edit of) the idea, never submits the form around it. */
  protected onEnter(event: Event): void {
    const target = event.target as HTMLElement | null;
    if (target?.closest('.gift-field__edit')) {
      event.preventDefault();
      event.stopPropagation();
      this.saveGiftEdit();
      return;
    }
    if (!target?.closest('.gift-field__new')) return;
    event.preventDefault();
    event.stopPropagation();
    this.addGift();
  }
}
