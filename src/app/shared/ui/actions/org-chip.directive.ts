import { Directive, input } from '@angular/core';

export type OrgChipVariant = 'default' | 'primary' | 'success' | 'warning' | 'accent';

const VALID_CHIP_VARIANTS: ReadonlySet<OrgChipVariant> = new Set([
  'default',
  'primary',
  'success',
  'warning',
  'accent',
]);

function normalizeChipVariant(value: unknown): OrgChipVariant {
  if (typeof value === 'string' && VALID_CHIP_VARIANTS.has(value as OrgChipVariant)) {
    return value as OrgChipVariant;
  }
  return 'default';
}

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
  public readonly variant = input<OrgChipVariant, OrgChipVariant | string | undefined | null>('default', {
    alias: 'orgChip',
    transform: normalizeChipVariant,
  });
}
