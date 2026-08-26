import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';

export type OrgChipVariant = 'default' | 'primary' | 'success' | 'warning' | 'accent';

const VALID_VARIANTS: ReadonlySet<OrgChipVariant> = new Set(['default', 'primary', 'success', 'warning', 'accent']);

function normalizeVariant(value: unknown): OrgChipVariant {
  return typeof value === 'string' && VALID_VARIANTS.has(value as OrgChipVariant)
    ? (value as OrgChipVariant)
    : 'default';
}

@Component({
  selector: 'org-chip',
  standalone: true,
  imports: [MatChipsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './org-chip.component.html',
  styleUrl: './org-chip.component.scss',
})
export class OrgChipComponent {
  public readonly label = input.required<string>();
  public readonly variant = input<OrgChipVariant, unknown>('default', { transform: normalizeVariant });
  public readonly selectable = input(false);
  public readonly selected = input(false);
  public readonly disabled = input(false);
  public readonly gradient = input(true);
  public readonly testId = input<string | null>(null);
  public readonly selectionChange = output<boolean>();

  protected select(): void {
    if (this.selectable() && !this.disabled()) {
      this.selectionChange.emit(!this.selected());
    }
  }
}
