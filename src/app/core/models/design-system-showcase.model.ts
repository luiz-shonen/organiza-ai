export type SeasonalThemeOption =
  | 'default'
  | 'theme-junina'
  | 'theme-natal'
  | 'theme-pascoa'
  | 'theme-ano-novo';

export interface SeasonalThemeChoice {
  readonly id: SeasonalThemeOption;
  readonly label: string;
  /** The page background in the light and the dark mode (`--org-canvas`). */
  readonly canvasLight: string;
  readonly canvasDark: string;
}
