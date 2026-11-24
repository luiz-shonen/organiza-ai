import { Injectable, signal, computed } from '@angular/core';
import { SeasonalThemeConfig, SeasonalThemeId, SeasonalThemeRule } from '../models';

const DEFAULT_SEASONAL_RULES: SeasonalThemeRule[] = [
  {
    id: 'junina',
    name: 'Festa Junina & Julina',
    startMonth: 6,
    startDay: 1,
    endMonth: 7,
    endDay: 31,
    keywords: [
      'junina',
      'julina',
      'são joão',
      'sao joao',
      'arraial',
      'arraiá',
      'quermesse',
      'milho',
      'caipira',
    ],
  },
  {
    id: 'natal',
    name: 'Natal de Jesus',
    startMonth: 12,
    startDay: 1,
    endMonth: 12,
    endDay: 31,
    keywords: [
      'natal',
      'christmas',
      'jesus',
      'presépio',
      'presepio',
      'estrela de belém',
      'estrela de belem',
      'noite feliz',
    ],
  },
  {
    id: 'pascoa',
    name: 'Páscoa da Ressurreição',
    startMonth: 3,
    startDay: 20,
    endMonth: 4,
    endDay: 30,
    keywords: [
      'páscoa',
      'pascoa',
      'ressurreição',
      'ressurreicao',
      'santa ceia',
      'sexta-feira santa',
    ],
  },
  {
    id: 'ano-novo',
    name: 'Ano Novo & Réveillon',
    startMonth: 12,
    startDay: 31,
    endMonth: 1,
    endDay: 2,
    keywords: ['ano novo', 'reveillon', 'réveillon', 'virada', '2025', '2026', '2027'],
  },
  // One theme per kind of event (its category, or its title): never on by date.
  {
    id: 'aniversario',
    name: 'Aniversário',
    keywords: ['aniversário', 'aniversario', 'niver', 'parabéns', 'parabens'],
  },
  { id: 'casamento', name: 'Casamento', keywords: ['casamento', 'noivado', 'bodas', 'casório'] },
  { id: 'churrasco', name: 'Churrasco', keywords: ['churrasco', 'churras', 'costelada'] },
  { id: 'happy-hour', name: 'Happy Hour', keywords: ['happy hour', 'happy-hour', 'barzinho'] },
  {
    id: 'confraternizacao',
    name: 'Confraternização',
    keywords: ['confraternização', 'confraternizacao', 'confra'],
  },
  { id: 'formatura', name: 'Formatura', keywords: ['formatura', 'colação', 'colacao', 'formando'] },
  {
    id: 'cha-de-bebe',
    name: 'Chá de bebê',
    keywords: [
      'chá de bebê',
      'cha de bebe',
      'chá de fralda',
      'cha de fralda',
      'chá revelação',
      'cha revelacao',
    ],
  },
  {
    id: 'cha-de-panela',
    name: 'Chá de panela',
    keywords: ['chá de panela', 'cha de panela', 'chá de cozinha', 'cha de cozinha', 'chá bar'],
  },
  { id: 'batizado', name: 'Batizado', keywords: ['batizado', 'batismo'] },
  {
    id: 'reuniao-familia',
    name: 'Reunião de família',
    keywords: [
      'reunião de família',
      'reuniao de familia',
      'encontro de família',
      'encontro da família',
    ],
  },
];

/** A rule with days of the year: on by itself in that season. */
function isInSeason(rule: SeasonalThemeRule, month: number, day: number): boolean {
  const { startMonth, startDay, endMonth, endDay } = rule;
  if (startMonth == null || startDay == null || endMonth == null || endDay == null) return false;
  if (startMonth <= endMonth) {
    return (
      (month > startMonth || (month === startMonth && day >= startDay)) &&
      (month < endMonth || (month === endMonth && day <= endDay))
    );
  }
  // Crosses the year (Dec 31 to Jan 2).
  return (month === startMonth && day >= startDay) || (month === endMonth && day <= endDay);
}

@Injectable({
  providedIn: 'root',
})
export class SeasonalThemeService {
  private readonly rules = signal<SeasonalThemeRule[]>(DEFAULT_SEASONAL_RULES);
  private readonly activeThemeId = signal<SeasonalThemeId>('default');
  private readonly isOverride = signal<boolean>(false);
  private readonly activeThemeName = signal<string>('Padrão');

  public readonly config = computed<SeasonalThemeConfig>(() => ({
    activeTheme: this.activeThemeId(),
    isOverride: this.isOverride(),
    themeName: this.activeThemeName(),
  }));

  constructor() {
    this.detectSeasonalTheme();
  }

  /**
   * Automatically detects the seasonal theme based on current system date.
   */
  public detectSeasonalTheme(referenceDate: Date = new Date()): void {
    const month = referenceDate.getMonth() + 1; // 1-12
    const day = referenceDate.getDate();

    const matchedRule = this.rules().find((rule) => isInSeason(rule, month, day));

    if (matchedRule) {
      this.activeThemeId.set(matchedRule.id);
      this.activeThemeName.set(matchedRule.name);
    } else {
      this.activeThemeId.set('default');
      this.activeThemeName.set('Padrão');
    }
    this.isOverride.set(false);
  }

  /**
   * Evaluates event date, title, or category to override the active theme when inspecting a specific event.
   */
  public evaluateEventTheme(
    eventDate?: Date | string | null,
    eventTitle?: string | null,
    eventCategory?: string | null,
  ): void {
    if (!eventDate && !eventTitle && !eventCategory) {
      this.detectSeasonalTheme();
      return;
    }

    // 1. Check category first (explicit event category, e.g. "Festa Junina")
    if (eventCategory) {
      const categoryLower = eventCategory.toLowerCase().trim();
      const matchedCategoryRule = this.rules().find(
        (rule) =>
          rule.keywords.some((kw) => categoryLower.includes(kw)) ||
          rule.id === categoryLower ||
          rule.name.toLowerCase().includes(categoryLower),
      );
      if (matchedCategoryRule) {
        this.activeThemeId.set(matchedCategoryRule.id);
        this.activeThemeName.set(`${matchedCategoryRule.name} (Evento)`);
        this.isOverride.set(true);
        return;
      }
    }

    // 2. Check title keywords
    if (eventTitle) {
      const titleLower = eventTitle.toLowerCase().trim();
      const matchedKeywordRule = this.rules().find((rule) =>
        rule.keywords.some((kw) => titleLower.includes(kw)),
      );
      if (matchedKeywordRule) {
        this.activeThemeId.set(matchedKeywordRule.id);
        this.activeThemeName.set(`${matchedKeywordRule.name} (Evento)`);
        this.isOverride.set(true);
        return;
      }
    }

    // 2. Check event date if provided
    if (eventDate) {
      const parsedDate = typeof eventDate === 'string' ? new Date(eventDate) : eventDate;
      if (!isNaN(parsedDate.getTime())) {
        const month = parsedDate.getMonth() + 1;
        const day = parsedDate.getDate();

        const matchedDateRule = this.rules().find((rule) => isInSeason(rule, month, day));

        if (matchedDateRule) {
          this.activeThemeId.set(matchedDateRule.id);
          this.activeThemeName.set(`${matchedDateRule.name} (Evento)`);
          this.isOverride.set(true);
          return;
        }
      }
    }

    // Fallback to current system date theme
    this.detectSeasonalTheme();
  }

  /**
   * Resets theme override back to auto seasonal detection.
   */
  public resetToAuto(): void {
    this.detectSeasonalTheme();
  }
}
