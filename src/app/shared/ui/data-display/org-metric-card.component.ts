import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { OrgSurfaceComponent } from '../surface/org-surface.component';

@Component({
  selector: 'org-metric-card',
  standalone: true,
  imports: [OrgSurfaceComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './org-metric-card.component.html',
  styleUrl: './org-metric-card.component.scss',
})
export class OrgMetricCardComponent {
  public readonly label = input.required<string>();
  public readonly value = input.required<string>();
  public readonly description = input('');
  public readonly trend = input('');
  public readonly atmosphere = input(false);
  public readonly gradient = input(true);
}
