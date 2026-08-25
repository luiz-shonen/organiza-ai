import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { OrgIconComponent, OrgIconName } from './org-icon.component';

export type OrgButtonVariant = 'primary' | 'secondary' | 'danger' | 'text';
export type OrgButtonType = 'button' | 'submit' | 'reset';

const VALID_BUTTON_VARIANTS: ReadonlySet<OrgButtonVariant> = new Set([
  'primary',
  'secondary',
  'danger',
  'text',
]);

function normalizeVariant(value: unknown): OrgButtonVariant {
  return typeof value === 'string' && VALID_BUTTON_VARIANTS.has(value as OrgButtonVariant)
    ? (value as OrgButtonVariant)
    : 'primary';
}

@Component({
  selector: 'org-button',
  standalone: true,
  imports: [MatButtonModule, MatProgressSpinnerModule, OrgIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './org-button.component.html',
  styleUrl: './org-button.component.scss',
})
export class OrgButtonComponent {
  public readonly label = input.required<string>();
  public readonly icon = input<OrgIconName | null>(null);
  public readonly variant = input<OrgButtonVariant, unknown>('primary', { transform: normalizeVariant });
  public readonly type = input<OrgButtonType>('button');
  public readonly disabled = input(false);
  public readonly loading = input(false);
  public readonly gradient = input(true);
  public readonly fullWidth = input(false);
  public readonly imageSrc = input<string | null>(null);
  public readonly imageAlt = input('');
  public readonly testId = input('');
  public readonly pressed = output<void>();

  protected readonly isDisabled = computed(() => this.disabled() || this.loading());

  protected activate(): void {
    if (!this.isDisabled()) {
      this.pressed.emit();
    }
  }
}
