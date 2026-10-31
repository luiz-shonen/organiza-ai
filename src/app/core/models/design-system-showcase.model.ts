export type SeasonalThemeOption =
  | 'default'
  | 'theme-junina'
  | 'theme-natal'
  | 'theme-pascoa'
  | 'theme-ano-novo';

export interface SeasonalThemeChoice {
  readonly id: SeasonalThemeOption;
  readonly label: string;
  readonly description: string;
}

/** Code snippets rendered by the foundations part of the Design System showcase. */
export interface DesignSystemFoundationExamples {
  readonly colors: string;
  readonly typography: string;
  readonly iconography: string;
  readonly tokens: string;
  readonly spacing: string;
}
