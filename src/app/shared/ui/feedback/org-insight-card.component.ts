import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { OrgIconComponent } from '../actions/org-icon.component';

export type OrgInsightTone = 'info' | 'warning';

/** "Dica do Organiza AI": a short suggestion with optional actions below it. */
@Component({
  selector: 'org-insight-card',
  standalone: true,
  imports: [OrgIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './org-insight-card.component.html',
  styleUrl: './org-insight-card.component.scss',
})
export class OrgInsightCardComponent {
  public readonly label = input('Dica do Organiza AI');
  /** `warning` when the event is close and something is still missing. */
  public readonly tone = input<OrgInsightTone>('info');
}
