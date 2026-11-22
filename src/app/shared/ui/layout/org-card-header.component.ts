import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Heading + optional subheading at the top of a card. Trailing actions via `[orgCardHeaderAction]`. */
@Component({
  selector: 'org-card-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './org-card-header.component.html',
  styleUrl: './org-card-header.component.scss',
})
export class OrgCardHeaderComponent {
  public readonly heading = input.required<string>();
  public readonly subheading = input<string | null>(null);
  /** A count in a pill beside the heading ("Confirmados 4"); none when null. */
  public readonly count = input<number | null>(null);
}
