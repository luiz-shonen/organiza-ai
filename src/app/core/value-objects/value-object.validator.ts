import type { AbstractControl, ValidatorFn } from '@angular/forms';

/** A value object's check: the problem with `raw`, or null when it is valid. */
export type ValueCheck = (raw: string) => string | null;

/**
 * Turns a value object's check into a reactive-forms validator. Empty values pass,
 * so pair it with `Validators.required` when the field is mandatory.
 */
export function valueObjectValidator(check: ValueCheck): ValidatorFn {
  return (control) => {
    const value: unknown = control.value;
    if (typeof value !== 'string' || value.trim().length === 0) return null;
    const message = check(value);
    return message ? { valueObject: message } : null;
  };
}

/** Text required: whitespace alone does not count as filled in. */
export const requiredText: ValidatorFn = (control) =>
  typeof control.value === 'string' && control.value.trim().length > 0 ? null : { required: true };

/**
 * The message to show under a field once it was touched: `requiredMessage` when it is
 * empty, the value object's message when the value breaks its rules, otherwise ''.
 */
export function fieldError(control: AbstractControl, requiredMessage: string): string {
  if (!control.touched || !control.errors) return '';
  if (control.hasError('required')) return requiredMessage;
  const message: unknown = control.getError('valueObject');
  return typeof message === 'string' ? message : '';
}
