import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import type { ThemeMode } from '../../../core/models';
import { DESIGN_SYSTEM_NAVIGATION_GROUPS } from '../../../core/models/design-system-navigation.model';
import { NavigationDrawerLinkComponent } from './navigation-drawer-link.component';

@Component({
  selector: 'app-navigation-drawer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatIconModule, NavigationDrawerLinkComponent],
  templateUrl: './navigation-drawer.component.html',
  styleUrl: './navigation-drawer.component.scss',
})
export class NavigationDrawerComponent {
  readonly isAuthenticated = input(false);
  readonly isSuperAdmin = input(false);
  readonly displayName = input('');
  readonly email = input('');
  readonly photoUrl = input<string | null>(null);
  readonly activeRoute = input('/');
  readonly themeMode = input<ThemeMode>('system');
  readonly isDesignSystemNavigation = input(false);

  readonly themeChange = output<ThemeMode>();
  readonly logout = output<void>();
  readonly closed = output<void>();

  protected readonly designSystemNavigationGroups = DESIGN_SYSTEM_NAVIGATION_GROUPS;

  protected onThemeChange(mode: ThemeMode): void {
    this.themeChange.emit(mode);
  }
}
