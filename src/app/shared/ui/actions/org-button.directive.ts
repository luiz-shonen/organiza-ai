import { computed, Directive, input } from '@angular/core';

export type OrgButtonVariant = 'primary' | 'secondary' | 'danger' | 'text';

@Directive({
  selector: 'button[orgButton], a[orgButton]',
  standalone: true,
  host: {
    class: 'org-button',
    '[class.org-button--primary]': "variant() === 'primary'",
    '[class.org-button--secondary]': "variant() === 'secondary'",
    '[class.org-button--danger]': "variant() === 'danger'",
    '[class.org-button--text]': "variant() === 'text'",
    '[class.org-button--loading]': 'loading()',
    '[attr.aria-busy]': "loading() ? 'true' : null",
    '[attr.aria-disabled]': "isDisabled() ? 'true' : null",
    '[attr.disabled]': "isDisabled() ? '' : null",
    '[style.min-height]': "'48px'",
    '[style.min-width]': "'48px'",
  },
})
export class OrgButtonDirective {
  public readonly variant = input<OrgButtonVariant>('primary', { alias: 'orgButton' });
  public readonly loading = input(false, { alias: 'orgButtonLoading' });
  public readonly disabled = input(false, { alias: 'orgButtonDisabled' });
  protected readonly isDisabled = computed(() => this.loading() || this.disabled());
}
