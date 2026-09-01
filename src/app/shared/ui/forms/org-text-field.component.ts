import {
  ChangeDetectionStrategy,
  Component,
  forwardRef,
  input,
  model,
  output,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

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
  imports: [MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule],
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
  public readonly prefixIcon = input<string | null>(null);
  public readonly suffixIcon = input<string | null>(null);
  public readonly passwordVisible = input(false);
  public readonly testId = input('');
  public readonly togglePasswordVisibility = output<void>();
  private onChange: (value: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  protected updateValue(event: Event): void {
    if (!this.disabled()) {
      const value = (event.target as HTMLInputElement).value;
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

  protected markTouched(): void {
    this.onTouched();
  }
  protected requestPasswordVisibilityToggle(): void {
    this.togglePasswordVisibility.emit();
  }
  protected disabledState = false;
}
