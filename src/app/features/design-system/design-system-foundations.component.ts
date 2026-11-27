import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { EVENT_CATEGORIES, getCategoryHue, type SeasonalThemeOption } from '../../core/models';
import * as ui from '../../shared/ui';
import {
  ORG_ICON_MAP,
  OrgBadgeComponent,
  OrgCardHeaderComponent,
  OrgChipComponent,
  OrgDataTableComponent,
  OrgIconComponent,
  OrgMetricCardComponent,
  OrgSectionComponent,
  OrgSurfaceComponent,
  OrgTextFieldComponent,
  OrgThemeToggleComponent,
  type OrgDataColumn,
  type OrgIconName,
} from '../../shared/ui';
import {
  DS_BREAKPOINTS,
  DS_CATEGORY_TOKENS,
  DS_COLOR_GROUPS,
  DS_DONTS,
  DS_DOS,
  DS_FONT_FAMILIES,
  DS_GRADIENT_TOKENS,
  DS_LIVE_COLOR_TOKENS,
  DS_PRINCIPLES,
  DS_RADIUS_SCALE,
  DS_SEASONAL_THEMES,
  DS_SHADOW_SCALE,
  DS_SIZE_TOKENS,
  DS_SPACING_SCALE,
  DS_TYPE_STYLES,
  DS_USABILITY_LAWS,
  type DesignSystemScaleStep,
} from './design-system-catalog';
import { DS_SNIPPETS } from './design-system-snippets';
import { DesignSystemCodeExampleComponent } from './design-system-code-example.component';
import { DesignSystemSpecimenComponent } from './design-system-specimen.component';

const ICON_NAMES = Object.keys(ORG_ICON_MAP).sort() as OrgIconName[];

/** Every standalone `Org*` component exported by `@shared/ui`, counted live. */
const COMPONENT_COUNT = Object.keys(ui).filter(
  (name) => name.startsWith('Org') && name.endsWith('Component'),
).length;

function normalize(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

/**
 * Foundations of the catalog: overview and rules, colours, type, space and shape, icons and
 * themes. Presentational: the page reads the live token values and applies the theme.
 */
@Component({
  selector: 'app-design-system-foundations',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DesignSystemCodeExampleComponent,
    DesignSystemSpecimenComponent,
    OrgBadgeComponent,
    OrgCardHeaderComponent,
    OrgChipComponent,
    OrgDataTableComponent,
    OrgIconComponent,
    OrgMetricCardComponent,
    OrgSectionComponent,
    OrgSurfaceComponent,
    OrgTextFieldComponent,
    OrgThemeToggleComponent,
  ],
  templateUrl: './design-system-foundations.component.html',
  styleUrl: './design-system-foundations.component.scss',
})
export class DesignSystemFoundationsComponent {
  /** Computed value of each colour token, keyed by token name (follows light / dark). */
  public readonly tokenValues = input<Readonly<Record<string, string>>>({});
  public readonly activeSeasonalTheme = input.required<SeasonalThemeOption>();
  public readonly dark = input(false);
  public readonly seasonalThemeChange = output<SeasonalThemeOption>();
  public readonly darkChange = output<boolean>();

  protected readonly snippets = DS_SNIPPETS;
  protected readonly principles = DS_PRINCIPLES;
  protected readonly laws = DS_USABILITY_LAWS;
  protected readonly dos = DS_DOS;
  protected readonly donts = DS_DONTS;
  protected readonly colorGroups = DS_COLOR_GROUPS;
  protected readonly categoryTokens = DS_CATEGORY_TOKENS;
  protected readonly gradients = DS_GRADIENT_TOKENS;
  protected readonly typeStyles = DS_TYPE_STYLES;
  protected readonly fonts = DS_FONT_FAMILIES;
  protected readonly spacing = DS_SPACING_SCALE;
  protected readonly radii = DS_RADIUS_SCALE;
  protected readonly shadows = DS_SHADOW_SCALE;
  protected readonly sizes = DS_SIZE_TOKENS;
  protected readonly breakpoints = DS_BREAKPOINTS;
  protected readonly seasonalThemes = DS_SEASONAL_THEMES;
  protected readonly categories = EVENT_CATEGORIES.slice(0, 8);
  protected readonly categoryHue = getCategoryHue;

  protected readonly componentCount = String(COMPONENT_COUNT);
  protected readonly iconCount = String(ICON_NAMES.length);
  protected readonly colorTokenCount = String(DS_LIVE_COLOR_TOKENS.length);

  protected readonly iconQuery = signal('');
  protected readonly icons = computed(() => {
    const query = normalize(this.iconQuery());
    return query ? ICON_NAMES.filter((name) => normalize(name).includes(query)) : ICON_NAMES;
  });

  protected readonly scaleColumns: readonly OrgDataColumn<DesignSystemScaleStep>[] = [
    { id: 'token', label: 'Token', value: (row) => row.token },
    { id: 'value', label: 'Valor', value: (row) => row.value },
    { id: 'use', label: 'Uso', value: (row) => row.use ?? '' },
  ];

  protected readonly seasonalColumns: readonly OrgDataColumn<
    (typeof DS_SEASONAL_THEMES)[number]
  >[] = [
    { id: 'label', label: 'Tema', value: (row) => row.label },
    { id: 'light', label: 'Fundo claro', value: (row) => row.canvasLight },
    { id: 'dark', label: 'Fundo escuro', value: (row) => row.canvasDark },
  ];

  protected cssVar(token: string): string {
    return `var(${token})`;
  }
}
