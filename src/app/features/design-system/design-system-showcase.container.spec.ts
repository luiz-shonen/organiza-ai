import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { DesignSystemShowcaseContainer, SHOWCASE_NAV_CATEGORIES } from './design-system-showcase.container';
import { ThemeService } from '../../core/services/theme.service';
import { FeedbackService } from '../../shared/ui';
import { MatDialog } from '@angular/material/dialog';

describe('DesignSystemShowcaseContainer', () => {
  let component: DesignSystemShowcaseContainer;
  let fixture: ComponentFixture<DesignSystemShowcaseContainer>;
  let mockThemeService: {
    mode: { set: ReturnType<typeof vi.fn> };
    isDark: ReturnType<typeof vi.fn>;
    setMode: ReturnType<typeof vi.fn>;
  };
  let mockFeedbackService: {
    success: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
    info: ReturnType<typeof vi.fn>;
  };
  let mockDialog: {
    open: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    mockThemeService = {
      mode: { set: vi.fn() },
      isDark: vi.fn().mockReturnValue(false),
      setMode: vi.fn(),
    };

    mockFeedbackService = {
      success: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
    };

    mockDialog = {
      open: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [DesignSystemShowcaseContainer],
      providers: [
        provideNoopAnimations(),
        { provide: ThemeService, useValue: mockThemeService },
        { provide: FeedbackService, useValue: mockFeedbackService },
        { provide: MatDialog, useValue: mockDialog },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DesignSystemShowcaseContainer);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the showcase container', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with all 4 categorized navigation groups', () => {
    const categories = component.categories();
    expect(categories.length).toBe(4);
    expect(categories.map((c) => c.id)).toEqual(['brand', 'foundations', 'components', 'guidelines']);
  });

  it('should contain all 14 visual showcase sections across categories', () => {
    const totalSections = component.categories().flatMap((c) => c.sections);
    expect(totalSections.length).toBe(14);
    expect(totalSections.map((s) => s.id)).toContain('brand-overview');
    expect(totalSections.map((s) => s.id)).toContain('brand-colors');
    expect(totalSections.map((s) => s.id)).toContain('brand-typography');
    expect(totalSections.map((s) => s.id)).toContain('brand-icons');
    expect(totalSections.map((s) => s.id)).toContain('foundations-tokens');
    expect(totalSections.map((s) => s.id)).toContain('foundations-fundamentals');
    expect(totalSections.map((s) => s.id)).toContain('components-surfaces');
    expect(totalSections.map((s) => s.id)).toContain('components-buttons');
    expect(totalSections.map((s) => s.id)).toContain('components-forms');
    expect(totalSections.map((s) => s.id)).toContain('components-chips');
    expect(totalSections.map((s) => s.id)).toContain('components-layout');
    expect(totalSections.map((s) => s.id)).toContain('components-feedback');
    expect(totalSections.map((s) => s.id)).toContain('components-navigation');
    expect(totalSections.map((s) => s.id)).toContain('guidelines-dos-donts');
  });

  it('should filter sections based on search query', () => {
    component.searchQuery.set('chip');
    fixture.detectChanges();

    const filtered = component.filteredCategories();
    expect(filtered.length).toBe(1);
    expect(filtered[0].id).toBe('components');
    expect(filtered[0].sections.map((s) => s.id)).toEqual(['components-chips']);
  });

  it('should filter sections based on keyword match', () => {
    component.searchQuery.set('pink');
    fixture.detectChanges();

    const filtered = component.filteredCategories();
    expect(filtered.length).toBe(1);
    expect(filtered[0].id).toBe('brand');
    expect(filtered[0].sections.map((s) => s.id)).toEqual(['brand-colors']);
  });

  it('should return all categories when search query is cleared', () => {
    component.searchQuery.set('buttons');
    expect(component.filteredCategories().length).toBe(1);

    component.searchQuery.set('');
    expect(component.filteredCategories().length).toBe(4);
  });

  it('should toggle theme mode between light and dark', () => {
    mockThemeService.isDark.mockReturnValue(false);
    component.toggleThemeMode();
    expect(mockThemeService.setMode).toHaveBeenCalledWith('dark');

    mockThemeService.isDark.mockReturnValue(true);
    component.toggleThemeMode();
    expect(mockThemeService.setMode).toHaveBeenCalledWith('light');
  });

  it('should apply and switch seasonal theme classes on document element', () => {
    component.setSeasonalTheme('theme-junina');
    expect(component.activeSeasonalTheme()).toBe('theme-junina');
    expect(document.documentElement.classList.contains('theme-junina')).toBe(true);

    component.setSeasonalTheme('theme-natal');
    expect(component.activeSeasonalTheme()).toBe('theme-natal');
    expect(document.documentElement.classList.contains('theme-junina')).toBe(false);
    expect(document.documentElement.classList.contains('theme-natal')).toBe(true);

    component.setSeasonalTheme('default');
    expect(component.activeSeasonalTheme()).toBe('default');
    expect(document.documentElement.classList.contains('theme-natal')).toBe(false);
  });

  it('should toggle code box expansion for a specimen ID', () => {
    const specimenId = 'surface-specimen';
    expect(component.isCodeExpanded(specimenId)).toBe(false);

    component.toggleCode(specimenId);
    expect(component.isCodeExpanded(specimenId)).toBe(true);

    component.toggleCode(specimenId);
    expect(component.isCodeExpanded(specimenId)).toBe(false);
  });

  it('should copy code snippet to clipboard and show feedback snackbar', async () => {
    const writeTextSpy = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextSpy,
      },
    });

    await component.copyCode('<button orgButton="primary">Test</button>', 'btn-sample');

    expect(writeTextSpy).toHaveBeenCalledWith('<button orgButton="primary">Test</button>');
    expect(component.copiedSnippetId()).toBe('btn-sample');
    expect(mockFeedbackService.success).toHaveBeenCalledWith('Código copiado para a área de transferência!');
  });

  it('should update activeSection on scrollToSection', () => {
    const scrollMock = vi.fn();
    const mockElem = document.createElement('div');
    mockElem.id = 'components-buttons';
    mockElem.scrollIntoView = scrollMock;
    document.body.appendChild(mockElem);

    component.scrollToSection('components-buttons');

    expect(component.activeSection()).toBe('components-buttons');
    expect(scrollMock).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });

    document.body.removeChild(mockElem);
  });

  it('should toggle buttonLoadingState', () => {
    expect(component.buttonLoadingState()).toBe(false);
    component.toggleButtonLoading();
    expect(component.buttonLoadingState()).toBe(true);
    component.toggleButtonLoading();
    expect(component.buttonLoadingState()).toBe(false);
  });

  it('should filter icons based on iconSearchQuery', () => {
    component.iconSearchQuery.set('event');
    const filtered = component.filteredIcons();
    expect(filtered).toContain('event');
    expect(filtered.length).toBeLessThan(component.allIconNames.length);
  });
});
