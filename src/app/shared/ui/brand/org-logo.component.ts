import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type OrgLogoSize = 'md' | 'lg';

/** Calendar mark plus the "Organiza AI" wordmark in the brand gradient. */
@Component({
  selector: 'org-logo',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './org-logo.component.html',
  styleUrl: './org-logo.component.scss',
})
export class OrgLogoComponent {
  public readonly size = input<OrgLogoSize>('md');
}
