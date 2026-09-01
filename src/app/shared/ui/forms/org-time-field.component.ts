import {
  ChangeDetectionStrategy,
  Component,
  computed,
  forwardRef,
  input,
  model,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';

type TimeParts = Readonly<{ hour: number; minute: number }>;

export interface OrgTimeOption {
  readonly label: string;
  readonly value: string;
}

function parseTime(value: string): TimeParts | null {
  const compact = value.replace(/\D/g, '');
  const match =
    /^([01]\d|2[0-3]):?([0-5]\d)$/.exec(value) ?? /^([01]\d|2[0-3])([0-5]\d)$/.exec(compact);
  return match ? { hour: Number(match[1]), minute: Number(match[2]) } : null;
}

function formatTime({ hour, minute }: TimeParts): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function normalizeMinuteStep(value: unknown): number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0 && value <= 60
    ? value
    : 5;
}

function normalizedTime(value: string): string | null {
  const parsed = parseTime(value);
  return parsed ? formatTime(parsed) : null;
}

@Component({
  selector: 'org-time-field',
  standalone: true,
  imports: [MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule, MatMenuModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => OrgTimeFieldComponent),
      multi: true,
    },
  ],
  templateUrl: './org-time-field.component.html',
  styleUrl: './org-time-field.component.scss',
})
export class OrgTimeFieldComponent implements ControlValueAccessor {
  public readonly label = input('Horário');
  public readonly value = model('');
  public readonly minuteStep = input<number, unknown>(5, { transform: normalizeMinuteStep });
  public readonly quickOptions = input<readonly OrgTimeOption[]>([]);
  public readonly min = input('');
  public readonly max = input('');
  public readonly disabled = input(false);
  public readonly required = input(false);
  public readonly error = input('');
  public readonly testId = input('');
  private readonly disabledFromControl = signal(false);
  protected readonly isDisabled = computed(() => this.disabled() || this.disabledFromControl());
  private onChange: (value: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  public writeValue(value: string | null): void {
    this.value.set(value ?? '');
  }
  public registerOnChange(onChange: (value: string) => void): void {
    this.onChange = onChange;
  }
  public registerOnTouched(onTouched: () => void): void {
    this.onTouched = onTouched;
  }
  public setDisabledState(disabled: boolean): void {
    this.disabledFromControl.set(disabled);
  }

  public updateValue(event: Event): void {
    const parsed = parseTime((event.target as HTMLInputElement).value);
    const nextValue = parsed ? formatTime(parsed) : null;
    if (nextValue && this.isAllowed(nextValue) && !this.isDisabled()) {
      this.setValue(nextValue);
    }
  }

  public increment(): void {
    this.adjust(this.minuteStep());
  }
  public decrement(): void {
    this.adjust(-this.minuteStep());
  }
  public selectQuickOption(option: OrgTimeOption): void {
    const value = normalizedTime(option.value);
    if (value && this.isAllowed(value) && !this.isDisabled()) {
      this.setValue(value);
    }
  }

  protected markTouched(event: FocusEvent): void {
    this.onTouched();
    (event.target as HTMLInputElement).value = this.value();
  }

  private adjust(deltaMinutes: number): void {
    if (this.isDisabled()) {
      return;
    }
    const parsed = parseTime(this.value()) ?? { hour: 0, minute: 0 };
    const total = (parsed.hour * 60 + parsed.minute + deltaMinutes + 1440) % 1440;
    const value = formatTime({ hour: Math.floor(total / 60), minute: total % 60 });
    if (this.isAllowed(value)) {
      this.setValue(value);
    }
  }

  private setValue(value: string): void {
    this.value.set(value);
    this.onChange(value);
  }

  private isAllowed(value: string): boolean {
    const minimum = normalizedTime(this.min());
    const maximum = normalizedTime(this.max());
    return (!minimum || value >= minimum) && (!maximum || value <= maximum);
  }
}
