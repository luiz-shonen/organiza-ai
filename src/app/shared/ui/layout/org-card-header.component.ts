import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { OrgIconComponent, OrgIconName } from '../actions/org-icon.component';

export type OrgCardHeaderTone = 'primary' | 'primary-soft' | 'tertiary' | 'success';

/** Icon badge + heading + optional subheading at the top of a card. Trailing actions via `[orgCardHeaderAction]`. */
@Component({
  selector: 'org-card-header',
  imports: [OrgIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './org-card-header.component.html',
  styleUrl: './org-card-header.component.scss',
})
export class OrgCardHeaderComponent {
  public readonly icon = input.required<OrgIconName>();
  public readonly heading = input.required<string>();
  public readonly subheading = input<string | null>(null);
  public readonly tone = input<OrgCardHeaderTone>('primary-soft');
}
