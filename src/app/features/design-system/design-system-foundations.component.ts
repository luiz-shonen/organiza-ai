import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type {
  DesignSystemFoundationExamples,
  SeasonalThemeChoice,
  SeasonalThemeOption,
} from '../../core/models';
import { OrgIconComponent, OrgSurfaceComponent } from '../../shared/ui';
import { DesignSystemCodeExampleComponent } from './design-system-code-example.component';

/** Foundations part of the showcase: colours, typography, icons, seasonal themes, tokens and spacing. */
@Component({
  selector: 'app-design-system-foundations',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DesignSystemCodeExampleComponent, OrgIconComponent, OrgSurfaceComponent],
  templateUrl: './design-system-foundations.component.html',
  styleUrl: './design-system-foundations.component.scss',
})
export class DesignSystemFoundationsComponent {
  readonly examples = input.required<DesignSystemFoundationExamples>();
  readonly seasonalOptions = input.required<readonly SeasonalThemeChoice[]>();
  readonly activeSeasonalTheme = input.required<SeasonalThemeOption>();
  readonly seasonalThemeChange = output<SeasonalThemeOption>();
}
