import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { OrgIconComponent, OrgIconName } from '../actions/org-icon.component';
import { OrgIconButtonComponent } from '../actions/org-icon-button.component';
import { OrgButtonComponent } from '../actions/org-button.component';
import type { FeedbackVariant } from './feedback-snackbar.component';

@Component({
  selector: 'org-banner',
  imports: [OrgButtonComponent, OrgIconButtonComponent, OrgIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './org-banner.component.html',
  styleUrl: './org-banner.component.scss',
})
export class OrgBannerComponent {
  public readonly message = input.required<string>();
  public readonly variant = input<FeedbackVariant>('info');
  public readonly icon = input<OrgIconName | null>(null);
  /**
   * An action at the end ("Desfazer"): its icon and label from a tablet up, the icon alone on a
   * phone, so the message keeps the room. None when null.
   */
  public readonly actionLabel = input<string | null>(null);
  public readonly actionIcon = input<OrgIconName | null>(null);
  public readonly action = output<void>();
  /** A discreet ✕ that only hides the banner, named by this label; none when null. */
  public readonly dismissLabel = input<string | null>(null);
  public readonly dismissed = output<void>();
}
