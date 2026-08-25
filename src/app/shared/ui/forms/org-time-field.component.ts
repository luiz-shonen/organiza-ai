import { ChangeDetectionStrategy, Component, computed, forwardRef, input, model, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

type TimeParts = Readonly<{ hour: number; minute: number }>;

function parseTime(value: string): TimeParts | null {
  const compact = value.replace(/\D/g, '');
  const match = /^([01]\d|2[0-3]):?([0-5]\d)$/.exec(value) ?? /^([01]\d|2[0-3])([0-5]\d)$/.exec(compact);
  return match ? { hour: Number(match[1]), minute: Number(match[2]) } : null;
}

function formatTime({ hour, minute }: TimeParts): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function normalizeMinuteStep(value: unknown): number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0 && value <= 60 ? value : 5;
}

@Component({
  selector: 'org-time-field',
  standalone: true,
  imports: [MatButtonModule, MatFormFieldModule, MatInputModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => OrgTimeFieldComponent), multi: true }],
  templateUrl: './org-time-field.component.html',
  styleUrl: './org-time-field.component.scss',
})
export class OrgTimeFieldComponent implements ControlValueAccessor {
  public readonly label = input('Horário');
  public readonly value = model('');
  public readonly minuteStep = input<number, unknown>(5, { transform: normalizeMinuteStep });
  public readonly disabled = input(false);
  private readonly disabledFromControl = signal(false);
  protected readonly isDisabled = computed(() => this.disabled() || this.disabledFromControl());
  private onChange: (value: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  public writeValue(value: string | null): void { this.value.set(value ?? ''); }
  public registerOnChange(onChange: (value: string) => void): void { this.onChange = onChange; }
  public registerOnTouched(onTouched: () => void): void { this.onTouched = onTouched; }
  public setDisabledState(disabled: boolean): void { this.disabledFromControl.set(disabled); }

  public updateValue(event: Event): void {
    const parsed = parseTime((event.target as HTMLInputElement).value);
    if (parsed && !this.isDisabled()) { this.setValue(formatTime(parsed)); }
  }

  public increment(): void { this.adjust(this.minuteStep()); }
  public decrement(): void { this.adjust(-this.minuteStep()); }
  protected markTouched(): void { this.onTouched(); }

  private adjust(deltaMinutes: number): void {
    if (this.isDisabled()) { return; }
    const parsed = parseTime(this.value()) ?? { hour: 0, minute: 0 };
    const total = (parsed.hour * 60 + parsed.minute + deltaMinutes + 1440) % 1440;
    this.setValue(formatTime({ hour: Math.floor(total / 60), minute: total % 60 }));
  }

  private setValue(value: string): void { this.value.set(value); this.onChange(value); }
}
