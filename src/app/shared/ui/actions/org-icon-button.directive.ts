import { Directive, input } from '@angular/core';

export type OrgIconButtonVariant = 'default' | 'danger' | 'primary';

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
  public readonly variant = input<OrgIconButtonVariant>('default', { alias: 'orgIconButton' });
}
