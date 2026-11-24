import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  forwardRef,
  input,
  linkedSignal,
  model,
  signal,
  viewChildren,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatAutocompleteModule, MatOption } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import type { OrgSelectOption } from './org-select-field.component';

function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR');
}

@Component({
  selector: 'org-autocomplete-field',
  standalone: true,
  imports: [MatAutocompleteModule, MatFormFieldModule, MatInputModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => OrgAutocompleteFieldComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  // The Material option panel belongs to the CDK overlay. Its stable panel class
  // keeps the overlay rules owned by this closed component.
  templateUrl: './org-autocomplete-field.component.html',
  styleUrl: './org-autocomplete-field.component.scss',
})
export class OrgAutocompleteFieldComponent implements ControlValueAccessor {
  public readonly label = input.required<string>();
  public readonly options = input<readonly OrgSelectOption[]>([]);
  public readonly value = model<string | null>(null);
  public readonly hint = input('');
  public readonly error = input('');
  public readonly placeholder = input('');
  public readonly disabled = input(false);
  public readonly required = input(false);
  public readonly testId = input<string | null>(null);
  /**
   * The typed text. A value set from outside (a form reset to its default) brings its label
   * back; typing that clears the value keeps what was typed.
   */
  private readonly query = linkedSignal<string | null, string>({
    source: this.value,
    computation: (value, previous) =>
      this.options().find((option) => option.value === value)?.label ??
      (value === null ? (previous?.value ?? '') : ''),
  });
  private readonly matOptions = viewChildren(MatOption);
  private readonly disabledFromControl = signal(false);
  private onChange: (value: string | null) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  protected readonly isDisabled = computed(() => this.disabled() || this.disabledFromControl());
  protected readonly selectedOption = computed(
    () => this.options().find((option) => option.value === this.value()) ?? null,
  );
  protected readonly inputValue = computed(() => this.selectedOption()?.label ?? this.query());
  /**
   * Typing filters the list. With an option already chosen (the text is its label) the
   * whole list shows again, so the person can switch to another one without erasing.
   */
  protected readonly filteredOptions = computed(() => {
    const selected = this.selectedOption();
    if (selected && this.query() === selected.label) return this.options();
    const query = normalizeSearchText(this.query());
    return this.options().filter((option) => normalizeSearchText(option.label).includes(query));
  });

  constructor() {
    // Material keeps the last picked option ticked on its own; follow the value instead, so a
    // reset does not leave the previous choice marked in the list.
    effect(() => {
      const value = this.value();
      for (const option of this.matOptions()) {
        if (option.value === value && !option.selected) option.select(false);
        else if (option.value !== value && option.selected) option.deselect(false);
      }
    });
  }

  public writeValue(value: string | null): void {
    this.value.set(value);
    this.query.set(this.options().find((option) => option.value === value)?.label ?? '');
  }

  public registerOnChange(onChange: (value: string | null) => void): void {
    this.onChange = onChange;
  }
  public registerOnTouched(onTouched: () => void): void {
    this.onTouched = onTouched;
  }
  public setDisabledState(disabled: boolean): void {
    this.disabledFromControl.set(disabled);
  }

  protected updateQuery(event: Event): void {
    if (this.isDisabled()) {
      return;
    }

    const query = (event.target as HTMLInputElement).value;
    this.query.set(query);
    if (this.selectedOption()?.label !== query && this.value() !== null) {
      this.value.set(null);
      this.onChange(null);
    }
  }

  protected selectOption(value: string): void {
    const option = this.options().find((candidate) => candidate.value === value);
    if (!option || option.disabled || this.isDisabled()) {
      return;
    }

    this.query.set(option.label);
    this.value.set(option.value);
    this.onChange(option.value);
  }

  protected markTouched(): void {
    this.onTouched();
  }
}
