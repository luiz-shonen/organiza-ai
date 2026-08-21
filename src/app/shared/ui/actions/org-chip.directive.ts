import { Directive, input } from '@angular/core';

export type OrgChipVariant = 'default' | 'primary' | 'success' | 'warning' | 'accent';

@Directive({
  selector: 'mat-chip-option[orgChip], mat-chip-row[orgChip], button[orgChip]',
  standalone: true,
  host: {
    class: 'org-chip org-chip--primitive',
    '[class.org-chip--default]': "variant() === 'default'",
    '[class.org-chip--primary]': "variant() === 'primary'",
    '[class.org-chip--success]': "variant() === 'success'",
    '[class.org-chip--warning]': "variant() === 'warning'",
    '[class.org-chip--accent]': "variant() === 'accent'",
    '[style.min-height]': "'48px'",
    '[style.min-width]': "'48px'",
  },
})
export class OrgChipDirective {
  public readonly variant = input<OrgChipVariant>('default', { alias: 'orgChip' });
}
