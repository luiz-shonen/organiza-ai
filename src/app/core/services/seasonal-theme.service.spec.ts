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
    service.evaluateEventTheme('2026-06-20', 'Aniversário');
    expect(service.config().activeTheme).toBe('junina');
    expect(service.config().isOverride).toBe(true);
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
});
