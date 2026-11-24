import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  linkedSignal,
  output,
  signal,
} from '@angular/core';
import { SECRET_SANTA_MAX_GIFT_OPTIONS } from '../../../core/models';
import { GiftOption } from '../../../core/value-objects';
import { OrgButtonComponent, OrgIconButtonComponent, OrgTextFieldComponent } from '../../ui';

/** A gift idea changed in the list: which one, and its new text. */
export interface GiftOptionEdit {
  readonly index: number;
  readonly text: string;
}

/**
 * Gift ideas as the same cards the form shows. To read by default; `editable` adds a pencil
 * (the idea opens in place, ✓ keeps it) and a trash can to each one. The list only says what
 * was asked (`edit`, `remove`): the page confirms and saves.
 * `collapsible`: folded behind "Ver 3 ideias de presente", so a long list of people stays short.
 */
@Component({
  selector: 'app-gift-options-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [OrgButtonComponent, OrgIconButtonComponent, OrgTextFieldComponent],
  template: `
    @if (note()) {
      <!-- The person's own word on what they like, above their ideas, always in view. -->
      <p class="gift-list__note" data-testid="gift-options-list-note" [textContent]="note()"></p>
    }
    @if (collapsible() && gifts().length) {
      <org-button
        class="gift-list__toggle"
        variant="text"
        icon="redeem"
        testId="gift-options-list-toggle"
        [compact]="true"
        [gradient]="false"
        [ariaExpanded]="open()"
        [label]="toggleLabel()"
        (pressed)="open.set(!open())"
      />
    }
    @if (!gifts().length) {
      <div class="gift-list__empty">
        <p class="gift-list__none">Sem ideias de presente ainda</p>
        @if (editable() && !adding()) {
          <org-icon-button
            icon="add"
            variant="primary"
            testId="gift-options-list-add-btn"
            ariaLabel="Adicionar ideia de presente"
            tooltip="Adicionar uma ideia de presente"
            [gradient]="false"
            (pressed)="startAdd()"
          />
        }
      </div>
    }
    @if (!collapsible() || open() || adding()) {
      <ol class="gift-list" [attr.aria-label]="label() || null">
        @for (gift of gifts(); track $index; let i = $index) {
          @if (editingIndex() === i) {
            <li class="gift-list__editing">
              <org-text-field
                class="gift-list__edit"
                [label]="'Opção ' + (i + 1)"
                testId="gift-options-list-edit-input"
                [maxLength]="giftMaxLength"
                [error]="editError()"
                [suffixAction]="true"
                [value]="editText()"
                (valueChange)="setEditText($event)"
                (keydown.enter)="$event.preventDefault(); save()"
                (keydown.escape)="cancel()"
              >
                <span orgFieldSuffix class="gift-list__edit-actions">
                  <org-icon-button
                    icon="close"
                    ariaLabel="Cancelar edição"
                    tooltip="Desistir da alteração"
                    [gradient]="false"
                    testId="gift-options-list-cancel-btn"
                    (pressed)="cancel()"
                  />
                  <org-icon-button
                    icon="check"
                    variant="primary"
                    ariaLabel="Salvar opção"
                    tooltip="Salvar a alteração"
                    [gradient]="false"
                    testId="gift-options-list-save-btn"
                    (pressed)="save()"
                  />
                </span>
              </org-text-field>
            </li>
          } @else {
            <li
              class="gift-list__item"
              [class.gift-list__item--editable]="editable()"
              data-testid="gift-options-list-item"
            >
              <span class="gift-list__text">{{ gift }}</span>
              @if (editable()) {
                @if (!full() && !adding()) {
                  <org-icon-button
                    icon="add"
                    testId="gift-options-list-add-btn"
                    [gradient]="false"
                    ariaLabel="Adicionar outra ideia de presente"
                    tooltip="Adicionar outra ideia de presente"
                    (pressed)="startAdd()"
                  />
                }
                <org-icon-button
                  icon="edit"
                  testId="gift-options-list-edit-btn"
                  [gradient]="false"
                  [ariaLabel]="'Editar ' + gift"
                  tooltip="Editar esta ideia"
                  (pressed)="startEdit(i)"
                />
                <org-icon-button
                  icon="delete_outline"
                  variant="danger"
                  testId="gift-options-list-remove-btn"
                  [gradient]="false"
                  [ariaLabel]="'Apagar ' + gift"
                  tooltip="Apagar esta ideia"
                  (pressed)="remove.emit(i)"
                />
              }
            </li>
          }
        }
        @if (adding()) {
          <!-- The next idea, typed in place: ✓ (or Enter) adds it, ✕ (or Esc) gives up. -->
          <li class="gift-list__editing">
            <org-text-field
              class="gift-list__edit"
              label="Nova ideia de presente"
              placeholder="Ex: Chinelo, cor verde, tamanho 36"
              testId="gift-options-list-add-input"
              [maxLength]="giftMaxLength"
              [error]="addError()"
              [suffixAction]="true"
              [value]="addText()"
              (valueChange)="setAddText($event)"
              (keydown.enter)="$event.preventDefault(); saveAdd()"
              (keydown.escape)="adding.set(false)"
            >
              <span orgFieldSuffix class="gift-list__edit-actions">
                <org-icon-button
                  icon="close"
                  ariaLabel="Cancelar"
                  tooltip="Desistir desta ideia"
                  [gradient]="false"
                  testId="gift-options-list-add-cancel-btn"
                  (pressed)="adding.set(false)"
                />
                <org-icon-button
                  icon="check"
                  variant="primary"
                  ariaLabel="Adicionar"
                  tooltip="Adicionar esta ideia"
                  [gradient]="false"
                  testId="gift-options-list-add-save-btn"
                  (pressed)="saveAdd()"
                />
              </span>
            </org-text-field>
          </li>
        }
      </ol>
    }
  `,
  styleUrl: './gift-options-list.component.scss',
})
export class GiftOptionsListComponent {
  public readonly gifts = input<readonly string[]>([]);
  public readonly label = input('');
  /** The person's short comment, shown above the ideas ("Adoro cozinhar e tomar café"). */
  public readonly note = input<string | null | undefined>(null);
  public readonly collapsible = input(false);
  /** "Expandir tudo" / "Recolher tudo" of the card: every list follows it, then each its own way. */
  public readonly openAll = input(false);
  /** The person may change these ideas: a pencil and a trash can on each. */
  public readonly editable = input(false);
  public readonly edit = output<GiftOptionEdit>();
  public readonly remove = output<number>();
  /** How many ideas fit: no + once the list is full. */
  public readonly max = input(SECRET_SANTA_MAX_GIFT_OPTIONS);
  /** A new idea typed in place; the page saves it. */
  public readonly add = output<string>();

  protected readonly open = linkedSignal(() => this.openAll());
  protected readonly editingIndex = signal<number | null>(null);
  protected readonly editText = signal('');
  protected readonly editError = signal('');
  protected readonly giftMaxLength = GiftOption.RULES.max;
  protected readonly adding = signal(false);
  protected readonly addText = signal('');
  protected readonly addError = signal('');
  protected readonly full = computed(() => this.gifts().length >= this.max());
  protected readonly toggleLabel = computed(() => {
    const count = this.gifts().length;
    const ideas = count === 1 ? '1 ideia de presente' : `${count} ideias de presente`;
    return `${this.open() ? 'Esconder' : 'Ver'} ${ideas}`;
  });

  protected startAdd(): void {
    this.editingIndex.set(null);
    this.addText.set('');
    this.addError.set('');
    this.adding.set(true);
  }

  protected setAddText(value: string): void {
    this.addText.set(value);
    if (this.addError()) this.addError.set('');
  }

  protected saveAdd(): void {
    const gift = GiftOption.create(this.addText());
    if (!gift) {
      this.addError.set(GiftOption.validate(this.addText()) ?? 'Escreva a ideia de presente');
      return;
    }
    this.adding.set(false);
    this.open.set(true);
    this.add.emit(gift.value);
  }

  protected startEdit(index: number): void {
    this.adding.set(false);
    this.editingIndex.set(index);
    this.editText.set(this.gifts()[index] ?? '');
    this.editError.set('');
  }

  protected setEditText(value: string): void {
    this.editText.set(value);
    if (this.editError()) this.editError.set('');
  }

  protected cancel(): void {
    this.editingIndex.set(null);
    this.editError.set('');
  }

  /** A valid, changed text goes to the page to confirm; the field closes either way. */
  protected save(): void {
    const index = this.editingIndex();
    if (index === null) return;
    const gift = GiftOption.create(this.editText());
    if (!gift) {
      this.editError.set(GiftOption.validate(this.editText()) ?? 'Opção inválida');
      return;
    }
    this.editingIndex.set(null);
    if (gift.value !== this.gifts()[index]) this.edit.emit({ index, text: gift.value });
  }
}
