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
];

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

    const matchedRule = this.rules().find((rule) => {
      if (rule.startMonth <= rule.endMonth) {
        return (
          (month > rule.startMonth || (month === rule.startMonth && day >= rule.startDay)) &&
          (month < rule.endMonth || (month === rule.endMonth && day <= rule.endDay))
        );
      } else {
        // Crosses year boundary (e.g. Dec 31 -> Jan 2)
        return (
          (month === rule.startMonth && day >= rule.startDay) ||
          (month === rule.endMonth && day <= rule.endDay)
        );
      }
    });

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
   * Evaluates event date or title to override the active theme when inspecting a specific event.
   */
  public evaluateEventTheme(eventDate?: Date | string | null, eventTitle?: string | null): void {
    if (!eventDate && !eventTitle) {
      this.detectSeasonalTheme();
      return;
    }

    // 1. Check title keywords first
    if (eventTitle) {
      const titleLower = eventTitle.toLowerCase();
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

        const matchedDateRule = this.rules().find((rule) => {
          if (rule.startMonth <= rule.endMonth) {
            return (
              (month > rule.startMonth || (month === rule.startMonth && day >= rule.startDay)) &&
              (month < rule.endMonth || (month === rule.endMonth && day <= rule.endDay))
            );
          } else {
            return (
              (month === rule.startMonth && day >= rule.startDay) ||
              (month === rule.endMonth && day <= rule.endDay)
            );
          }
        });

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
