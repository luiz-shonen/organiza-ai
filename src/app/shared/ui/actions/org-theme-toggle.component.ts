import { ChangeDetectionStrategy, Component, model } from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { OrgIconComponent } from './org-icon.component';

/**
 * Light / dark switch for the header: a sun and a moon, with a thumb that slides to the one
 * in use. The page decides what "dark" means (ThemeService) and listens to `darkChange`.
 */
@Component({
  selector: 'org-theme-toggle',
  standalone: true,
  imports: [MatTooltipModule, OrgIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './org-theme-toggle.component.html',
  styleUrl: './org-theme-toggle.component.scss',
})
export class OrgThemeToggleComponent {
  public readonly dark = model(false);

  protected choose(dark: boolean): void {
    this.dark.set(dark);
  }
}
