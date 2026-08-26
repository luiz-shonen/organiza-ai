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
  /** Enables optional token-driven floating orbs for hero or promotional surfaces. */
  public readonly atmosphere = input(false);
  /** Overrides the leading atmosphere orb without coupling a feature to a seasonal palette. */
  public readonly atmospherePrimary = input<string>();
  /** Overrides the trailing atmosphere orb without coupling a feature to a seasonal palette. */
  public readonly atmosphereSecondary = input<string>();
  /** Applies the shared card hover/focus motion to one whole semantic surface. */
  public readonly interactive = input(false);
}
