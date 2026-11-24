import { MatTooltipModule } from '@angular/material/tooltip';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  forwardRef,
  input,
  model,
  output,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

/** A ready answer offered while typing ("Jéssica Melo", detail "(11) 98888-1111"). */
export interface OrgTextSuggestion {
  readonly label: string;
  readonly detail?: string;
}

function searchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .trim();
}

export type OrgTextFieldType = 'email' | 'number' | 'password' | 'search' | 'tel' | 'text' | 'url';

const VALID_TYPES: ReadonlySet<OrgTextFieldType> = new Set([
  'email',
  'number',
  'password',
  'search',
  'tel',
  'text',
  'url',
]);

function normalizeType(value: unknown): OrgTextFieldType {
  return typeof value === 'string' && VALID_TYPES.has(value as OrgTextFieldType)
    ? (value as OrgTextFieldType)
    : 'text';
}

@Component({
  selector: 'org-text-field',
  standalone: true,
  imports: [
    MatAutocompleteModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatTooltipModule,
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => OrgTextFieldComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './org-text-field.component.html',
  styleUrl: './org-text-field.component.scss',
})
export class OrgTextFieldComponent implements ControlValueAccessor {
  public readonly label = input.required<string>();
  public readonly value = model('');
  public readonly type = input<OrgTextFieldType, unknown>('text', { transform: normalizeType });
  public readonly placeholder = input('');
  public readonly hint = input('');
  public readonly error = input('');
  public readonly disabled = input(false);
  public readonly required = input(false);
  public readonly readOnly = input(false);
  public readonly min = input<string | number | null>(null);
  public readonly max = input<string | number | null>(null);
  /** Keyboard to show on phones, e.g. 'numeric' for a quantity typed as text. */
  public readonly inputMode = input<'numeric' | 'decimal' | 'text' | null>(null);
  /** Caps how many characters can be typed. */
  public readonly maxLength = input<number | null>(null);
  public readonly prefixIcon = input<string | null>(null);
  public readonly suffixIcon = input<string | null>(null);
  /** Renders projected `[orgFieldSuffix]` content (e.g. a small toggle) at the end of the field. */
  public readonly suffixAction = input(false);
  public readonly passwordVisible = input(false);
  public readonly testId = input('');
  /** Reformats what is typed, e.g. a phone mask; the field shows and emits the result. */
  public readonly mask = input<((value: string) => string) | null>(null);
  public readonly togglePasswordVisibility = output<void>();
  /**
   * Answers to offer under the field: those whose label has what was typed (accents and case
   * aside), at most six. Picking one fills the field with its label and emits it.
   */
  public readonly suggestions = input<readonly OrgTextSuggestion[]>([]);
  protected readonly matchingSuggestions = computed(() => {
    const query = searchText(this.value());
    if (!query) return [];
    return this.suggestions()
      .filter((suggestion) => searchText(suggestion.label).includes(query))
      .slice(0, 6);
  });
  public readonly suggestionPicked = output<OrgTextSuggestion>();
  private onChange: (value: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  protected updateValue(event: Event): void {
    if (!this.disabled()) {
      const target = event.target as HTMLInputElement;
      const mask = this.mask();
      const value = mask ? mask(target.value) : target.value;
      // Write back here: when the masked text equals the last value, no binding would reset it.
      if (value !== target.value) target.value = value;
      this.value.set(value);
      this.onChange(value);
    }
  }

  public writeValue(value: string | null): void {
    this.value.set(value ?? '');
  }
  public registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }
  public registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  public setDisabledState(disabled: boolean): void {
    this.disabledState = disabled;
  }

  protected pickSuggestion(suggestion: OrgTextSuggestion): void {
    this.value.set(suggestion.label);
    this.onChange(suggestion.label);
    this.suggestionPicked.emit(suggestion);
  }

  /** The input shows the label of a picked suggestion, not the object. */
  protected readonly suggestionLabel = (suggestion: OrgTextSuggestion | string | null): string =>
    typeof suggestion === 'string' ? suggestion : (suggestion?.label ?? '');

  protected markTouched(): void {
    this.onTouched();
  }
  protected requestPasswordVisibilityToggle(): void {
    this.togglePasswordVisibility.emit();
  }
  protected disabledState = false;
}
