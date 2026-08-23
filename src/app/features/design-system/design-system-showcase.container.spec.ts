import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal, type WritableSignal } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MatDialog } from '@angular/material/dialog';
import { DesignSystemShowcaseContainer, SHOWCASE_SECTIONS } from './design-system-showcase.container';
import { ThemeService } from '../../core/services/theme.service';
import { FeedbackService } from '../../shared/ui';

describe('DesignSystemShowcaseContainer', () => {
  let component: DesignSystemShowcaseContainer;
  let fixture: ComponentFixture<DesignSystemShowcaseContainer>;
  let isDark: WritableSignal<boolean>;
  let themeService: { isDark: WritableSignal<boolean>; setMode: ReturnType<typeof vi.fn> };
  let feedbackService: { success: ReturnType<typeof vi.fn>; info: ReturnType<typeof vi.fn> };
  let dialog: { open: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    isDark = signal(false);
    themeService = {
      isDark,
      setMode: vi.fn((mode: 'light' | 'dark') => isDark.set(mode === 'dark')),
    };
    feedbackService = { success: vi.fn(), info: vi.fn() };
    dialog = { open: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [DesignSystemShowcaseContainer],
      providers: [
        provideNoopAnimations(),
        { provide: ThemeService, useValue: themeService },
        { provide: FeedbackService, useValue: feedbackService },
        { provide: MatDialog, useValue: dialog },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DesignSystemShowcaseContainer);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    document.documentElement.classList.remove(
      'theme-junina',
      'theme-natal',
      'theme-pascoa',
      'theme-ano-novo',
    );
  });

  it('renders all required Angular Material component families', () => {
    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelector('button[mat-flat-button]')).toBeTruthy();
    expect(root.querySelector('mat-form-field')).toBeTruthy();
    expect(root.querySelector('mat-chip-listbox')).toBeTruthy();
    expect(root.querySelector('mat-tab-group')).toBeTruthy();
    expect(root.querySelector('mat-progress-spinner')).toBeTruthy();
    expect(root.querySelector('mat-card')).toBeTruthy();
  });

  it('gives every showcase section a stable element id and a matching sidebar anchor', () => {
    const root = fixture.nativeElement as HTMLElement;

    for (const section of SHOWCASE_SECTIONS) {
      expect(root.querySelector(`section#${section.id}`)).toBeTruthy();
      expect(root.querySelector(`.org-ds-sidebar__nav-link[href="#${section.id}"]`)).toBeTruthy();
    }
  });

  it('updates the selected sidebar state when an anchor is activated', () => {
    component.setActiveSection('feedback');
    fixture.detectChanges();

    const activeLink = fixture.nativeElement.querySelector('.org-ds-sidebar__nav-link--active') as HTMLAnchorElement;
    expect(activeLink.getAttribute('href')).toBe('#feedback');
  });

  it('applies a single selected seasonal class to the document root', () => {
    component.setSeasonalTheme('theme-pascoa');
    expect(document.documentElement.classList.contains('theme-pascoa')).toBe(true);
    expect(component.activeSeasonalTheme()).toBe('theme-pascoa');

    component.setSeasonalTheme('theme-natal');
    expect(document.documentElement.classList.contains('theme-pascoa')).toBe(false);
    expect(document.documentElement.classList.contains('theme-natal')).toBe(true);
  });

  it('toggles the existing light and dark service mode without navigation', () => {
    component.toggleThemeMode();
    expect(themeService.setMode).toHaveBeenCalledWith('dark');

    isDark.set(true);
    component.toggleThemeMode();
    expect(themeService.setMode).toHaveBeenCalledWith('light');
  });

  it('uses the feedback and dialog services only for local component demonstrations', () => {
    component.showSuccessExample();
    component.showInfoExample();
    component.openDialogExample();

    expect(feedbackService.success).toHaveBeenCalledWith('Tema aplicado à prévia com sucesso.');
    expect(feedbackService.info).toHaveBeenCalledWith('A prévia usa tokens sazonais compartilhados.');
    expect(dialog.open).toHaveBeenCalledTimes(1);
  });
});
