import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatTooltip } from '@angular/material/tooltip';

/**
 * Shows a Material tooltip over the content it wraps, e.g. the full text of a line cut
 * with an ellipsis. Buttons take `tooltip` directly (`org-button`, `org-icon-button`).
 */
@Component({
  selector: 'org-tooltip',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [
    {
      directive: MatTooltip,
      inputs: ['matTooltip: text', 'matTooltipPosition: position', 'matTooltipDisabled: disabled'],
    },
  ],
  template: '<ng-content />',
  styles: ':host { display: block; min-inline-size: 0; }',
})
export class OrgTooltipComponent {}
