import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { OrgIconComponent, OrgIconName } from '../actions/org-icon.component';
import { OrgIconButtonComponent } from '../actions/org-icon-button.component';
import type { FeedbackVariant } from './feedback-snackbar.component';

@Component({
  selector: 'org-banner',
  imports: [OrgIconButtonComponent, OrgIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './org-banner.component.html',
  styleUrl: './org-banner.component.scss',
})
export class OrgBannerComponent {
  public readonly message = input.required<string>();
  public readonly variant = input<FeedbackVariant>('info');
  public readonly icon = input<OrgIconName | null>(null);
  /** Shows a discreet ✕ at the end, named by this label ("Descartar"); none when null. */
  public readonly dismissLabel = input<string | null>(null);
  public readonly dismissed = output<void>();
}
