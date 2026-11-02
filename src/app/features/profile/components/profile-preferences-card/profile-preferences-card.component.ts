import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { ThemeMode } from '../../../../core/models';
import {
  OrgButtonComponent,
  OrgSegmentedControlComponent,
  OrgSurfaceComponent,
  type OrgSegmentedOption,
} from '../../../../shared/ui';

const THEME_MODES: ReadonlySet<string> = new Set<ThemeMode>(['light', 'dark', 'system']);

/** Account preferences that used to live in the side menu: theme, admin shortcuts and sign out. */
@Component({
  selector: 'app-profile-preferences-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [OrgButtonComponent, OrgSegmentedControlComponent, OrgSurfaceComponent],
  templateUrl: './profile-preferences-card.component.html',
  styleUrl: './profile-preferences-card.component.scss',
})
export class ProfilePreferencesCardComponent {
  readonly themeMode = input<ThemeMode>('system');
  readonly isSuperAdmin = input(false);

  readonly themeChange = output<ThemeMode>();
  readonly openAdmin = output<void>();
  readonly openDesignSystem = output<void>();
  readonly logout = output<void>();

  protected readonly themeOptions: readonly OrgSegmentedOption<ThemeMode>[] = [
    { value: 'light', label: 'Claro', icon: 'light_mode', testId: 'profile-theme-light' },
    { value: 'dark', label: 'Escuro', icon: 'dark_mode', testId: 'profile-theme-dark' },
    { value: 'system', label: 'Sistema', icon: 'brightness_auto', testId: 'profile-theme-system' },
  ];

  protected selectTheme(value: string): void {
    if (THEME_MODES.has(value)) {
      this.themeChange.emit(value as ThemeMode);
    }
  }
}
