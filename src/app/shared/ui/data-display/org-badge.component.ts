import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { OrgIconComponent, OrgIconName } from '../actions/org-icon.component';

export type OrgBadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger';
const VALID_VARIANTS: ReadonlySet<OrgBadgeVariant> = new Set(['default', 'primary', 'success', 'warning', 'danger']);

function normalizeVariant(value: unknown): OrgBadgeVariant {
  return typeof value === 'string' && VALID_VARIANTS.has(value as OrgBadgeVariant) ? (value as OrgBadgeVariant) : 'default';
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
  public readonly variant = input<OrgBadgeVariant, unknown>('default', { transform: normalizeVariant });
  public readonly gradient = input(true);
}
