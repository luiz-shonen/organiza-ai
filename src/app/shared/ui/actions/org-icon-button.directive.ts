import { Directive, input } from '@angular/core';

export type OrgIconButtonVariant = 'default' | 'danger' | 'primary';

const VALID_ICON_BUTTON_VARIANTS: ReadonlySet<OrgIconButtonVariant> = new Set([
  'default',
  'danger',
  'primary',
]);

function normalizeIconButtonVariant(value: unknown): OrgIconButtonVariant {
  if (typeof value === 'string' && VALID_ICON_BUTTON_VARIANTS.has(value as OrgIconButtonVariant)) {
    return value as OrgIconButtonVariant;
  }
  return 'default';
}

@Directive({
  selector: 'button[orgIconButton]',
  standalone: true,
  host: {
    class: 'org-icon-button',
    '[class.org-icon-button--default]': "variant() === 'default'",
    '[class.org-icon-button--danger]': "variant() === 'danger'",
    '[class.org-icon-button--primary]': "variant() === 'primary'",
    '[style.min-height]': "'48px'",
    '[style.min-width]': "'48px'",
  },
})
export class OrgIconButtonDirective {
  public readonly variant = input<OrgIconButtonVariant, OrgIconButtonVariant | string | undefined | null>('default', {
    alias: 'orgIconButton',
    transform: normalizeIconButtonVariant,
  });
}
