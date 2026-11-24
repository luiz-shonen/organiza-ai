import { TestBed } from '@angular/core/testing';
import { SeasonalThemeService } from './seasonal-theme.service';

describe('SeasonalThemeService', () => {
  let service: SeasonalThemeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SeasonalThemeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should detect junina theme in June', () => {
    const juneDate = new Date(2026, 5, 15); // June 15
    service.detectSeasonalTheme(juneDate);
    expect(service.config().activeTheme).toBe('junina');
  });

  it('should detect natal theme in December', () => {
    const decDate = new Date(2026, 11, 25); // Dec 25
    service.detectSeasonalTheme(decDate);
    expect(service.config().activeTheme).toBe('natal');
  });

  it('should override theme when event title contains Natal keyword', () => {
    service.evaluateEventTheme(null, 'Festa de Natal 2026');
    expect(service.config().activeTheme).toBe('natal');
    expect(service.config().isOverride).toBe(true);
  });

  it('should override theme when event date is in June', () => {
    service.evaluateEventTheme('2026-06-20', 'Encontro da turma');
    expect(service.config().activeTheme).toBe('junina');
    expect(service.config().isOverride).toBe(true);
  });

  it("puts the event's kind, named in its title, over its date", () => {
    service.evaluateEventTheme('2026-06-20', 'Aniversário da vó');
    expect(service.config().activeTheme).toBe('aniversario');
  });

  it('should override theme when event category is Festa Junina', () => {
    service.evaluateEventTheme(null, null, 'Festa Junina');
    expect(service.config().activeTheme).toBe('junina');
    expect(service.config().isOverride).toBe(true);
  });

  it('should override theme when event category is Natal', () => {
    service.evaluateEventTheme(null, null, 'Natal');
    expect(service.config().activeTheme).toBe('natal');
    expect(service.config().isOverride).toBe(true);
  });

  it('should reset to auto seasonal theme', () => {
    service.evaluateEventTheme(null, 'Natal 2026');
    expect(service.config().isOverride).toBe(true);
    service.resetToAuto();
    expect(service.config().isOverride).toBe(false);
  });

  it('gives every category of the project its own theme, over the date', () => {
    const december = '2026-12-20T20:00:00-03:00';
    const expected: Record<string, string> = {
      Aniversário: 'aniversario',
      Casamento: 'casamento',
      Natal: 'natal',
      'Ano Novo': 'ano-novo',
      Páscoa: 'pascoa',
      'Festa Junina': 'junina',
      Churrasco: 'churrasco',
      'Happy Hour': 'happy-hour',
      Confraternização: 'confraternizacao',
      Formatura: 'formatura',
      'Chá de bebê': 'cha-de-bebe',
      'Chá de panela': 'cha-de-panela',
      Batizado: 'batizado',
      'Reunião de família': 'reuniao-familia',
    };
    for (const [category, theme] of Object.entries(expected)) {
      service.evaluateEventTheme(december, 'Teste', category);
      expect(service.config().activeTheme, category).toBe(theme);
    }
  });

  it('never turns a category theme on by the date alone', () => {
    for (let month = 0; month < 12; month++) {
      service.detectSeasonalTheme(new Date(2026, month, 10));
      expect(['junina', 'natal', 'pascoa', 'ano-novo', 'default']).toContain(
        service.config().activeTheme,
      );
    }
  });
});
