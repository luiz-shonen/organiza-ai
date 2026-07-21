import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SeasonalOverlayComponent } from './seasonal-overlay.component';
import { SeasonalThemeService } from '../../../core/services';

describe('SeasonalOverlayComponent', () => {
  let component: SeasonalOverlayComponent;
  let fixture: ComponentFixture<SeasonalOverlayComponent>;
  let themeService: SeasonalThemeService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SeasonalOverlayComponent],
      providers: [SeasonalThemeService]
    }).compileComponents();

    fixture = TestBed.createComponent(SeasonalOverlayComponent);
    component = fixture.componentInstance;
    themeService = TestBed.inject(SeasonalThemeService);
  });

  it('should create component', () => {
    expect(component).toBeTruthy();
  });

  it('should render junina bandeirolas when junina theme is active', () => {
    themeService.evaluateEventTheme(null, 'Festa Junina da Família');
    fixture.detectChanges();
    const bandeirolas = fixture.nativeElement.querySelector('.seasonal-overlay__bandeirolas');
    expect(bandeirolas).toBeTruthy();
  });

  it('should render Estrela de Belém star when natal theme is active', () => {
    themeService.evaluateEventTheme(null, 'Natal de Jesus 2026');
    fixture.detectChanges();
    const starSvg = fixture.nativeElement.querySelector('.seasonal-overlay__star-svg');
    expect(starSvg).toBeTruthy();
  });
});
