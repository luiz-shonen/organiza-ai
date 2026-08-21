import { Directive, input } from '@angular/core';

export type OrgSurfaceVariant = 'card' | 'panel' | 'hero' | 'drawer' | 'dialog';

const VALID_VARIANTS: ReadonlySet<OrgSurfaceVariant> = new Set([
  'card',
  'panel',
  'hero',
  'drawer',
  'dialog',
]);

function normalizeVariant(value: unknown): OrgSurfaceVariant {
  if (typeof value === 'string' && VALID_VARIANTS.has(value as OrgSurfaceVariant)) {
    return value as OrgSurfaceVariant;
  }
  return 'card';
}

@Directive({
  selector: '[orgSurface]',
  standalone: true,
  host: {
    class: 'org-surface',
    '[class.org-surface--card]': "variant() === 'card'",
    '[class.org-surface--panel]': "variant() === 'panel'",
    '[class.org-surface--hero]': "variant() === 'hero'",
    '[class.org-surface--drawer]': "variant() === 'drawer'",
    '[class.org-surface--dialog]': "variant() === 'dialog'",
  },
})
export class OrgSurfaceDirective {
  /** Visual variant of the surface. Defaults to 'card'. */
  public readonly variant = input<OrgSurfaceVariant, OrgSurfaceVariant | string | undefined | null>('card', {
    alias: 'orgSurface',
    transform: normalizeVariant,
  });
}
