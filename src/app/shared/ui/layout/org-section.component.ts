import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { OrgIconComponent, OrgIconName } from '../actions/org-icon.component';

@Component({
  selector: 'org-section',
  standalone: true,
  imports: [OrgIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './org-section.component.html',
  styleUrl: './org-section.component.scss',
})
export class OrgSectionComponent {
  /** Section heading rendered inside <h2>. */
  public readonly title = input.required<string>();

  /** Optional leading icon name. */
  public readonly icon = input<OrgIconName>();

  /** Optional numerical badge count (e.g. number of guests, items, or events). */
  public readonly count = input<number>();
}
