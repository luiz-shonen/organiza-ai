import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { OrgIconComponent, OrgIconName } from '../actions/org-icon.component';
import { OrgSurfaceComponent } from '../surface/org-surface.component';

@Component({
  selector: 'org-empty-state',
  standalone: true,
  imports: [OrgIconComponent, OrgSurfaceComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './org-empty-state.component.html',
  styleUrl: './org-empty-state.component.scss',
})
export class OrgEmptyStateComponent {
  /** Icon name to display. Defaults to 'info'. */
  public readonly icon = input<OrgIconName>('info');

  /** Primary empty state heading. */
  public readonly title = input.required<string>();

  /** Optional descriptive explanation. */
  public readonly description = input<string>();
}
