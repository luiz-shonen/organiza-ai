import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type OrgPageLayoutMaxWidth = 'narrow' | 'default' | 'wide' | 'full';

const VALID_MAX_WIDTHS: ReadonlySet<OrgPageLayoutMaxWidth> = new Set([
  'narrow',
  'default',
  'wide',
  'full',
]);

function normalizeMaxWidth(value: unknown): OrgPageLayoutMaxWidth {
  if (typeof value === 'string' && VALID_MAX_WIDTHS.has(value as OrgPageLayoutMaxWidth)) {
    return value as OrgPageLayoutMaxWidth;
  }
  return 'default';
}

@Component({
  selector: 'org-page-layout',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './org-page-layout.component.html',
  styleUrl: './org-page-layout.component.scss',
  host: {
    role: 'main',
    class: 'org-page-layout',
    '[class.org-page-layout--narrow]': "maxWidth() === 'narrow'",
    '[class.org-page-layout--default]': "maxWidth() === 'default'",
    '[class.org-page-layout--wide]': "maxWidth() === 'wide'",
    '[class.org-page-layout--full]': "maxWidth() === 'full'",
  },
})
export class OrgPageLayoutComponent {
  /** Maximum content width boundary: narrow (600px), default (960px), wide (1200px), full (100%). */
  public readonly maxWidth = input<OrgPageLayoutMaxWidth, OrgPageLayoutMaxWidth | string | undefined | null>('default', {
    transform: normalizeMaxWidth,
  });
}
