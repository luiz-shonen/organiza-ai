export type SeasonalThemeId = 'junina' | 'natal' | 'pascoa' | 'ano-novo' | 'default';

export interface SeasonalThemeRule {
  id: SeasonalThemeId;
  name: string;
  startMonth: number; // 1-12 (1 = Jan, 6 = Jun, 12 = Dec)
  startDay: number;
  endMonth: number;
  endDay: number;
  keywords: string[];
}

export interface SeasonalThemeConfig {
  activeTheme: SeasonalThemeId;
  isOverride: boolean;
  themeName: string;
}
