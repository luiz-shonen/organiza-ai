import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatRippleModule } from '@angular/material/core';
import { RouterLink } from '@angular/router';
import { OrgIconComponent, OrgIconName } from '../actions/org-icon.component';

export interface OrgNavBarItem {
  readonly route: string;
  readonly label: string;
  readonly icon: OrgIconName;
  readonly testId: string;
  /** Matches only the exact route (used by "/" so it is not active everywhere). */
  readonly exact?: boolean;
}

export type OrgNavBarLayout = 'bottom' | 'header';

/**
 * Primary app navigation (Jakob's law): a fixed bottom bar on phones and a
 * segmented pill group in the centre of the desktop header. Same items, same order.
 */
@Component({
  selector: 'org-nav-bar',
  standalone: true,
  imports: [MatRippleModule, RouterLink, OrgIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './org-nav-bar.component.html',
  styleUrl: './org-nav-bar.component.scss',
})
export class OrgNavBarComponent {
  public readonly items = input<readonly OrgNavBarItem[]>([]);
  public readonly activeRoute = input('/');
  public readonly layout = input<OrgNavBarLayout>('bottom');
  public readonly ariaLabel = input('Navegação principal');

  protected isActive(item: OrgNavBarItem): boolean {
    const path = this.activeRoute().split(/[?#]/)[0];
    return item.exact ? path === item.route : path.startsWith(item.route);
  }
}
