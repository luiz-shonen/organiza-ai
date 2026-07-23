import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ThemeService, ThemeMode } from '../../../core/services';

@Component({
  selector: 'app-theme-toggle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatIconModule, MatMenuModule, MatTooltipModule],
  templateUrl: './theme-toggle.component.html',
})
export class ThemeToggleComponent {
  protected readonly themeService = inject(ThemeService);

  protected setMode(mode: ThemeMode): void {
    this.themeService.setMode(mode);
  }
}
