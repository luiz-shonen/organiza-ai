import { Directive } from '@angular/core';

@Directive({
  selector: 'mat-form-field[orgFormField]',
  standalone: true,
  host: {
    class: 'org-form-field',
    '[style.--mdc-outlined-text-field-container-color]': "'var(--org-field-fill)'",
    '[style.--mdc-outlined-text-field-input-text-color]': "'var(--org-field-text)'",
    '[style.--mdc-outlined-text-field-label-text-color]': "'var(--org-field-label)'",
    '[style.--mdc-outlined-text-field-hover-label-text-color]': "'var(--org-primary)'",
    '[style.--mdc-outlined-text-field-focus-label-text-color]': "'var(--org-primary)'",
    '[style.--mdc-outlined-text-field-outline-color]': "'var(--org-field-outline)'",
    '[style.--mdc-outlined-text-field-hover-outline-color]': "'var(--org-primary)'",
    '[style.--mdc-outlined-text-field-focus-outline-color]': "'var(--org-primary)'",
    '[style.--mdc-outlined-text-field-error-outline-color]': "'var(--org-error)'",
    '[style.--mdc-outlined-text-field-disabled-outline-color]': "'var(--org-field-disabled-outline)'",
    '[style.--mdc-outlined-text-field-error-label-text-color]': "'var(--org-error)'",
    '[style.--mdc-outlined-text-field-caret-color]': "'var(--org-primary)'",
  },
})
export class OrgFormFieldDirective {}
