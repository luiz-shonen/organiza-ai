import type { AbstractControl, ValidatorFn } from '@angular/forms';

/** When an event happens: a real date plus an "HH:mm" time, not in the past. */
export class EventDateTime {
  static readonly INVALID_DATE_MESSAGE = 'Data inválida, use dd/mm/aaaa';
  static readonly PAST_MESSAGE = 'A data e a hora não podem ser no passado';

  private constructor(readonly value: Date) {}

  /** The date with the time applied, or null when either is missing or not real. */
  static combine(date: Date | null, time: string): Date | null {
    if (!(date instanceof Date) || isNaN(date.getTime())) return null;
    const match = /^(\d{1,2}):(\d{2})$/.exec(time ?? '');
    if (!match) return null;
    const result = new Date(date);
    result.setHours(Number(match[1]), Number(match[2]), 0, 0);
    return result;
  }

  static create(date: Date | null, time: string, now = new Date()): EventDateTime | null {
    const combined = EventDateTime.combine(date, time);
    return combined && combined >= now ? new EventDateTime(combined) : null;
  }
}

/** A date control holding an invalid Date (typed text that is not a date) fails with `invalidDate`. */
export const validDate: ValidatorFn = (control) => {
  const value: unknown = control.value;
  return value instanceof Date && isNaN(value.getTime()) ? { invalidDate: true } : null;
};

/**
 * Group validator for `date` + `time` controls: `pastDateTime` when both are filled and
 * together fall before now, so the step can say so and block Próximo straight away.
 */
export function notInPast(now: () => Date = () => new Date()): ValidatorFn {
  return (group: AbstractControl) => {
    const date = group.get('date')?.value as Date | null;
    const time = group.get('time')?.value as string;
    const combined = EventDateTime.combine(date, time);
    return combined && combined < now() ? { pastDateTime: true } : null;
  };
}
