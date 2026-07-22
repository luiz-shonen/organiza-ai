import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { SeasonalThemeService } from '../../../core/services';

@Component({
  selector: 'app-seasonal-overlay',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  templateUrl: './seasonal-overlay.component.html',
  styleUrl: './seasonal-overlay.component.scss'
})
export class SeasonalOverlayComponent {
  private readonly seasonalService = inject(SeasonalThemeService);
  protected readonly config = this.seasonalService.config;
}
