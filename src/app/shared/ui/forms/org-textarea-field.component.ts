import { ChangeDetectionStrategy, Component, computed, forwardRef, input, model, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'org-textarea-field',
  standalone: true,
  imports: [MatFormFieldModule, MatInputModule],
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => OrgTextareaFieldComponent), multi: true }],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './org-textarea-field.component.html',
  styleUrl: './org-textarea-field.component.scss',
})
export class OrgTextareaFieldComponent implements ControlValueAccessor {
  public readonly label = input.required<string>();
  public readonly value = model('');
  public readonly rows = input(3);
  public readonly minLength = input<number | null>(null);
  public readonly maxLength = input<number | null>(null);
  public readonly placeholder = input('');
  public readonly hint = input('');
  public readonly error = input('');
  public readonly disabled = input(false);
  public readonly required = input(false);
  public readonly testId = input('');
  private readonly disabledFromControl = signal(false);
  private onChange: (value: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  public writeValue(value: string | null): void { this.value.set(value ?? ''); }
  public registerOnChange(onChange: (value: string) => void): void { this.onChange = onChange; }
  public registerOnTouched(onTouched: () => void): void { this.onTouched = onTouched; }
  public setDisabledState(disabled: boolean): void { this.disabledFromControl.set(disabled); }

  protected updateValue(event: Event): void {
    if (!this.disabled() && !this.disabledFromControl()) {
      const value = (event.target as HTMLTextAreaElement).value;
      this.value.set(value);
      this.onChange(value);
    }
  }

  protected markTouched(): void { this.onTouched(); }
  protected readonly isDisabled = () => this.disabled() || this.disabledFromControl();
  protected readonly characterCount = computed(() => this.value().length);
  protected readonly counterLabel = computed(() => {
    const maximum = this.maxLength();
    const minimum = this.minLength();
    if (maximum !== null) {
      return `${this.characterCount()} / ${maximum}`;
    }
    return minimum !== null ? `${this.characterCount()} caracteres · mínimo ${minimum}` : '';
  });
}
