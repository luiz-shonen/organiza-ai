import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type OrgSurfaceVariant = 'card' | 'panel' | 'drawer' | 'dialog' | 'hero';

@Component({
  selector: 'org-surface',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './org-surface.component.html',
  styleUrl: './org-surface.component.scss',
})
export class OrgSurfaceComponent {
  public readonly variant = input<OrgSurfaceVariant>('card');
}
