import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

/** Centered spinner with a visible, announced message for a loading region. */
@Component({
  selector: 'org-loading-state',
  imports: [MatProgressSpinnerModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './org-loading-state.component.html',
  styleUrl: './org-loading-state.component.scss',
})
export class OrgLoadingStateComponent {
  public readonly label = input.required<string>();
}
