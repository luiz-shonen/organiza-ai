import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import type { ThemeMode } from '../../../core/models';

@Component({
  selector: 'app-navigation-drawer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatIconModule],
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

  readonly navigate = output<string>();
  readonly themeChange = output<ThemeMode>();
  readonly logout = output<void>();
  readonly close = output<void>();

  protected onNavigate(route: string): void {
    this.navigate.emit(route);
    this.close.emit();
  }

  protected onThemeChange(mode: ThemeMode): void {
    this.themeChange.emit(mode);
  }
}
