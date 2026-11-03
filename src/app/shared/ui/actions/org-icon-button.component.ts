import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { OrgIconComponent, OrgIconName } from './org-icon.component';

export type OrgIconButtonVariant = 'default' | 'danger' | 'primary';

const VALID_VARIANTS: ReadonlySet<OrgIconButtonVariant> = new Set(['default', 'danger', 'primary']);

/** A trash can is always a destructive action, so it is always red. */
const TRASH_ICONS: ReadonlySet<OrgIconName> = new Set(['delete', 'delete_outline']);

function normalizeVariant(value: unknown): OrgIconButtonVariant {
  return typeof value === 'string' && VALID_VARIANTS.has(value as OrgIconButtonVariant)
    ? (value as OrgIconButtonVariant)
    : 'default';
}

@Component({
  selector: 'org-icon-button',
  standalone: true,
  imports: [MatButtonModule, MatTooltipModule, OrgIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './org-icon-button.component.html',
  styleUrl: './org-icon-button.component.scss',
})
export class OrgIconButtonComponent {
  public readonly ariaLabel = input.required<string>();
  public readonly icon = input.required<OrgIconName>();
  public readonly variant = input<OrgIconButtonVariant, unknown>('default', {
    transform: normalizeVariant,
  });
  public readonly disabled = input(false);
  public readonly gradient = input(false);
  public readonly testId = input('');
  /**
   * Material tooltip. An icon alone does not say what it does, so it defaults to the
   * ariaLabel; pass '' to turn it off.
   */
  public readonly tooltip = input<string | null>(null);
  protected readonly tooltipText = computed(() => this.tooltip() ?? this.ariaLabel());
  public readonly pressed = output<MouseEvent>();

  protected readonly tone = computed<OrgIconButtonVariant>(() =>
    TRASH_ICONS.has(this.icon()) ? 'danger' : this.variant(),
  );

  protected readonly isDisabled = computed(() => this.disabled());

  protected activate(event: MouseEvent): void {
    if (!this.isDisabled()) {
      this.pressed.emit(event);
    }
  }
}
