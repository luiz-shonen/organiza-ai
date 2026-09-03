import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { OrgIconComponent, OrgIconName } from '../actions/org-icon.component';

export type OrgBadgeVariant =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'aniversario'
  | 'casamento'
  | 'festa'
  | 'churrasco'
  | 'happy'
  | 'formatura'
  | 'outros';

const VALID_VARIANTS: ReadonlySet<OrgBadgeVariant> = new Set([
  'default',
  'primary',
  'secondary',
  'success',
  'warning',
  'danger',
  'aniversario',
  'casamento',
  'festa',
  'churrasco',
  'happy',
  'formatura',
  'outros',
]);

function normalizeVariant(value: unknown): OrgBadgeVariant {
  if (typeof value !== 'string') return 'default';
  const cleaned = value.startsWith('cat-')
    ? (value.slice(4) as OrgBadgeVariant)
    : (value as OrgBadgeVariant);
  return VALID_VARIANTS.has(cleaned) ? cleaned : 'default';
}

@Component({
  selector: 'org-badge',
  standalone: true,
  imports: [OrgIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './org-badge.component.html',
  styleUrl: './org-badge.component.scss',
})
export class OrgBadgeComponent {
  public readonly label = input.required<string>();
  public readonly icon = input<OrgIconName | null>(null);
  public readonly variant = input<OrgBadgeVariant, unknown>('default', {
    transform: normalizeVariant,
  });
  public readonly gradient = input(true);
}
