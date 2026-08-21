import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { OrgIconComponent, OrgIconName } from '../actions/org-icon.component';

@Component({
  selector: 'org-page-header',
  standalone: true,
  imports: [OrgIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './org-page-header.component.html',
  styleUrl: './org-page-header.component.scss',
})
export class OrgPageHeaderComponent {
  /** Primary page title rendered inside <h1>. */
  public readonly title = input.required<string>();

  /** Optional descriptive subtitle. */
  public readonly subtitle = input<string>();

  /** Optional leading icon name. */
  public readonly icon = input<OrgIconName>();

  /** Whether the title applies the signature brand gradient styling. Defaults to false. */
  public readonly gradient = input<boolean>(false);
}
