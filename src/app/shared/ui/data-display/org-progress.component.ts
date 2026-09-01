import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';

export type OrgProgressVariant = 'primary' | 'success' | 'warning';

function clampValue(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.min(100, Math.max(0, value))
    : 0;
}

@Component({
  selector: 'org-progress',
  standalone: true,
  imports: [MatProgressBarModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './org-progress.component.html',
  styleUrl: './org-progress.component.scss',
})
export class OrgProgressComponent {
  public readonly value = input<number, unknown>(0, { transform: clampValue });
  public readonly variant = input<OrgProgressVariant>('primary');
  public readonly gradient = input(true);
  public readonly ariaLabel = input('Progresso');
}
