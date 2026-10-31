import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { OrgIconComponent, OrgIconName } from '../actions/org-icon.component';

/**
 * Collapsible section with a heading row. Project a summary with
 * `[orgExpansionSummary]` and the body as default content.
 */
@Component({
  selector: 'org-expansion-panel',
  imports: [MatExpansionModule, OrgIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './org-expansion-panel.component.html',
  styleUrl: './org-expansion-panel.component.scss',
})
export class OrgExpansionPanelComponent {
  public readonly heading = input.required<string>();
  public readonly icon = input<OrgIconName | null>(null);
  public readonly ariaLabel = input<string | null>(null);
  public readonly expanded = model(false);
}
