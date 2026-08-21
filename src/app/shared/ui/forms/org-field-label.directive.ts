import { Directive, input } from '@angular/core';

@Directive({
  selector: 'label[orgFieldLabel]',
  standalone: true,
  host: {
    class: 'org-field-label',
    '[attr.for]': 'fieldId()',
  },
})
export class OrgFieldLabelDirective {
  public readonly fieldId = input.required<string>({ alias: 'orgFieldLabel' });
}
