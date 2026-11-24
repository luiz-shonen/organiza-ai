/** The Org* field components: what is scrolled to and focused, whichever part shows the error. */
const FIELD_HOSTS = [
  'org-text-field',
  'org-textarea-field',
  'org-date-field',
  'org-time-field',
  'org-select-field',
  'org-autocomplete-field',
  'org-quantity-stepper',
].join(', ');

/** A field that shows an error: its message, Material's invalid state, or a touched control. */
const INVALID = [
  '.org-text-field__error',
  '.org-textarea-field__error',
  '.org-date-field__error',
  '.org-time-field__error',
  '.org-select-field__error',
  '.org-autocomplete-field__error',
  '.mat-form-field-invalid',
  '[formcontrolname].ng-invalid.ng-touched',
  '[aria-invalid="true"]',
  '.event-step__error',
].join(', ');

/**
 * After a "Confirmar" / "Salvar" / "Próximo" that did not go through: brings the first field
 * with an error into view, in the page or in a drawer, and puts the cursor in it, so nobody is
 * left wondering what is missing. Call it once the errors have rendered (`revealFirstInvalidSoon`).
 */
export function revealFirstInvalid(host: HTMLElement | null | undefined): void {
  const found = host?.querySelector<HTMLElement>(INVALID);
  if (!found) return;
  const field = found.closest<HTMLElement>(FIELD_HOSTS) ?? found;
  const reduce = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  field.scrollIntoView?.({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
  const focusable = field.matches('input, textarea, select')
    ? field
    : field.querySelector<HTMLElement>('input, textarea, select, [role="combobox"], button');
  focusable?.focus({ preventScroll: true });
}

/** The same, on the next turn, once the errors just switched on are on screen. */
export function revealFirstInvalidSoon(host: HTMLElement | null | undefined): void {
  setTimeout(() => revealFirstInvalid(host));
}
