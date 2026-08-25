import { ChangeDetectionStrategy, Component, forwardRef, input, model, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'org-date-field',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatDatepickerModule, MatFormFieldModule, MatInputModule, MatNativeDateModule],
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => OrgDateFieldComponent), multi: true }],
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
  private onChange: (value: Date | null) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  public writeValue(value: Date | null): void { this.value.set(value); }
  public registerOnChange(onChange: (value: Date | null) => void): void { this.onChange = onChange; }
  public registerOnTouched(onTouched: () => void): void { this.onTouched = onTouched; }
  public setDisabledState(disabled: boolean): void { this.disabledFromControl.set(disabled); }

  protected updateValue(value: Date | null): void {
    if (!this.disabled() && !this.disabledFromControl()) {
      this.value.set(value);
      this.onChange(value);
    }
  }

  protected markTouched(): void { this.onTouched(); }
  protected readonly isDisabled = () => this.disabled() || this.disabledFromControl();
}
