import {
  ChangeDetectionStrategy,
  Component,
  forwardRef,
  inject,
  input,
  model,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { DateAdapter, MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { OrgDateAdapter, maskDate } from './org-date-adapter';

@Component({
  selector: 'org-date-field',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatDatepickerModule, MatFormFieldModule, MatInputModule, MatNativeDateModule],
  providers: [
    { provide: DateAdapter, useClass: OrgDateAdapter },
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => OrgDateFieldComponent),
      multi: true,
    },
  ],
  templateUrl: './org-date-field.component.html',
  styleUrl: './org-date-field.component.scss',
})
export class OrgDateFieldComponent implements ControlValueAccessor {
  public readonly label = input('Data');
  public readonly value = model<Date | null>(null);
  public readonly min = input<Date | null>(null);
  public readonly disabled = input(false);
  public readonly required = input(false);
  public readonly hint = input('');
  public readonly error = input('');
  public readonly testId = input('');
  private readonly disabledFromControl = signal(false);
  private readonly adapter = inject<DateAdapter<Date>>(DateAdapter);
  /**
   * What the picker shows. Typing does not write back to it, so half a date stays in the
   * input instead of being cleared; the form still gets the parsed (or invalid) date.
   */
  protected readonly pickerValue = signal<Date | null>(null);
  private onChange: (value: Date | null) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  public writeValue(value: Date | null): void {
    this.value.set(value);
    this.pickerValue.set(value);
  }
  public registerOnChange(onChange: (value: Date | null) => void): void {
    this.onChange = onChange;
  }
  public registerOnTouched(onTouched: () => void): void {
    this.onTouched = onTouched;
  }
  public setDisabledState(disabled: boolean): void {
    this.disabledFromControl.set(disabled);
  }

  /**
   * A date picked in the calendar. Material also fires this on blur with null for text it
   * cannot read; that is ignored so the typed text and its "Data inválida" message stay.
   */
  protected pick(value: Date | null): void {
    if (!value) return;
    this.pickerValue.set(value);
    this.updateValue(value);
  }

  /**
   * Typed text: masked to dd/mm/aaaa and parsed. An incomplete or impossible date reaches
   * the form as an invalid Date, so its validators can say so.
   */
  protected onInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const masked = maskDate(input.value);
    if (masked !== input.value) input.value = masked;
    this.updateValue(masked ? this.adapter.parse(masked, null) : null);
  }

  private updateValue(value: Date | null): void {
    if (!this.disabled() && !this.disabledFromControl()) {
      if (!value || !isNaN(value.getTime())) this.value.set(value);
      this.onChange(value);
    }
  }

  protected markTouched(): void {
    this.onTouched();
  }
  protected readonly isDisabled = () => this.disabled() || this.disabledFromControl();
}
