import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { FeedbackVariant } from './feedback-snackbar.component';

@Component({
  selector: 'org-banner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './org-banner.component.html',
  styleUrl: './org-banner.component.scss',
})
export class OrgBannerComponent {
  public readonly message = input.required<string>();
  public readonly variant = input<FeedbackVariant>('info');
}
