import {
  ChangeDetectionStrategy,
  Component,
  forwardRef,
  input,
  model,
  ViewEncapsulation,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';

export interface OrgSelectOption {
  readonly label: string;
  readonly value: string;
  readonly disabled?: boolean;
}

@Component({
  selector: 'org-select-field',
  standalone: true,
  imports: [MatFormFieldModule, MatSelectModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => OrgSelectFieldComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  // The option panel is rendered in Angular Material's overlay container. Scope this
  // component's stable panel class globally, instead of leaking a generic Material override.
  encapsulation: ViewEncapsulation.None,
  templateUrl: './org-select-field.component.html',
  styleUrl: './org-select-field.component.scss',
})
export class OrgSelectFieldComponent implements ControlValueAccessor {
  public readonly label = input.required<string>();
  public readonly options = input<readonly OrgSelectOption[]>([]);
  public readonly value = model<string | null>(null);
  public readonly hint = input('');
  public readonly error = input('');
  public readonly disabled = input(false);
  public readonly required = input(false);
  public readonly testId = input<string | null>(null);
  private onChange: (value: string | null) => void = () => undefined;
  private onTouched: () => void = () => undefined;
  protected disabledState = false;

  protected updateValue(value: string): void {
    if (!this.disabled()) {
      this.value.set(value);
      this.onChange(value);
    }
  }

  public writeValue(value: string | null): void {
    this.value.set(value);
  }
  public registerOnChange(fn: (value: string | null) => void): void {
    this.onChange = fn;
  }
  public registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  public setDisabledState(disabled: boolean): void {
    this.disabledState = disabled;
  }
  protected markTouched(): void {
    this.onTouched();
  }
}
