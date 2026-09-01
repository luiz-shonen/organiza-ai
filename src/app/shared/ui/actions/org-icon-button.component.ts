import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { OrgIconComponent, OrgIconName } from './org-icon.component';

export type OrgIconButtonVariant = 'default' | 'danger' | 'primary';

const VALID_VARIANTS: ReadonlySet<OrgIconButtonVariant> = new Set(['default', 'danger', 'primary']);

function normalizeVariant(value: unknown): OrgIconButtonVariant {
  return typeof value === 'string' && VALID_VARIANTS.has(value as OrgIconButtonVariant)
    ? (value as OrgIconButtonVariant)
    : 'default';
}

@Component({
  selector: 'org-icon-button',
  standalone: true,
  imports: [MatButtonModule, OrgIconComponent],
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
  public readonly pressed = output<MouseEvent>();

  protected readonly isDisabled = computed(() => this.disabled());

  protected activate(event: MouseEvent): void {
    if (!this.isDisabled()) {
      this.pressed.emit(event);
    }
  }
}
