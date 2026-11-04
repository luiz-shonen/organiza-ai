import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type OrgLogoSize = 'md' | 'lg';

/**
 * Calendar mark plus the "Organiza AI" wordmark in the brand gradient. The mark is an
 * inline SVG animated with CSS only (no asset, no script) and still under reduced motion.
 */
@Component({
  selector: 'org-logo',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './org-logo.component.html',
  styleUrl: './org-logo.component.scss',
})
export class OrgLogoComponent {
  public readonly size = input<OrgLogoSize>('md');
  /** The mark bounces, draws its check and throws confetti every few seconds. */
  public readonly animated = input(true);
}
