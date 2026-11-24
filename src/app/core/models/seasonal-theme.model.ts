/** The themes of the calendar (they also come with an event of that kind). */
export type SeasonalCalendarThemeId = 'junina' | 'natal' | 'pascoa' | 'ano-novo';

/**
 * The themes of an event's kind, one per category of the project: a scene along the bottom of
 * the page and a few things floating in the air. They come only with an event, never by date.
 */
export const CATEGORY_SCENE_THEMES = [
  'aniversario',
  'casamento',
  'churrasco',
  'happy-hour',
  'confraternizacao',
  'formatura',
  'cha-de-bebe',
  'cha-de-panela',
  'batizado',
  'reuniao-familia',
] as const;
export type CategorySceneThemeId = (typeof CATEGORY_SCENE_THEMES)[number];

export type SeasonalThemeId = SeasonalCalendarThemeId | CategorySceneThemeId | 'default';

export interface SeasonalThemeRule {
  id: Exclude<SeasonalThemeId, 'default'>;
  name: string;
  /** The days of the year it is on by itself (1-12 months); none for an event's kind only. */
  startMonth?: number;
  startDay?: number;
  endMonth?: number;
  endDay?: number;
  keywords: string[];
}

export interface SeasonalThemeConfig {
  activeTheme: SeasonalThemeId;
  isOverride: boolean;
  themeName: string;
}
