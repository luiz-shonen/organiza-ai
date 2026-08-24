import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import type { ThemeMode } from '../../../core/models';
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
  readonly close = output<void>();

  protected readonly designSystemSections = [
    { id: 'overview', label: 'Visão geral', icon: 'auto_awesome' },
    { id: 'seasonal-themes', label: 'Temas sazonais', icon: 'celebration' },
    { id: 'foundations', label: 'Fundações', icon: 'palette' },
    { id: 'components', label: 'Componentes', icon: 'widgets' },
    { id: 'buttons', label: 'Botões e ações', icon: 'ads_click' },
    { id: 'inputs', label: 'Campos', icon: 'edit_note' },
    { id: 'selection', label: 'Seleção', icon: 'check_circle' },
    { id: 'navigation', label: 'Navegação', icon: 'tab' },
    { id: 'data-display', label: 'Dados e cards', icon: 'view_agenda' },
    { id: 'feedback', label: 'Feedback', icon: 'notifications' },
  ] as const;

  protected onThemeChange(mode: ThemeMode): void {
    this.themeChange.emit(mode);
  }
}
