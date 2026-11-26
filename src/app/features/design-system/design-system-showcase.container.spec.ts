import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { ThemeService } from '../../core/services/theme.service';
import { FeedbackService, OrgDialogService } from '../../shared/ui';
import {
  DesignSystemShowcaseContainer,
  SHOWCASE_SECTIONS,
} from './design-system-showcase.container';

describe('DesignSystemShowcaseContainer', () => {
  let component: DesignSystemShowcaseContainer;
  let fixture: ComponentFixture<DesignSystemShowcaseContainer>;
  let root: HTMLElement;
  let feedbackService: Record<'success' | 'info' | 'error', ReturnType<typeof vi.fn>>;
  let dialogService: { confirm: ReturnType<typeof vi.fn>; choose: ReturnType<typeof vi.fn> };
  let themeService: {
    isDark: ReturnType<typeof signal<boolean>>;
    setMode: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    feedbackService = { success: vi.fn(), info: vi.fn(), error: vi.fn() };
    dialogService = { confirm: vi.fn(() => of(false)), choose: vi.fn(() => of('extra')) };
    themeService = { isDark: signal(false), setMode: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [DesignSystemShowcaseContainer],
      providers: [
        provideNoopAnimations(),
        provideRouter([]),
        { provide: FeedbackService, useValue: feedbackService },
        { provide: OrgDialogService, useValue: dialogService },
        { provide: ThemeService, useValue: themeService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DesignSystemShowcaseContainer);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    root = fixture.nativeElement as HTMLElement;
  });

  afterEach(() => {
    document.documentElement.classList.remove(
      'theme-junina',
      'theme-natal',
      'theme-pascoa',
      'theme-ano-novo',
    );
  });

  it('gives every entry of the navigation drawer an anchored section', () => {
    for (const section of SHOWCASE_SECTIONS) {
      expect(root.querySelector(`section#${section.id}`)).toBeTruthy();
    }
  });

  it('shows a live demo of every public Org component', () => {
    for (const selector of [
      'org-page-header',
      'org-section',
      'org-surface',
      'org-card-header',
      'org-expansion-panel',
      'org-button',
      'org-icon-button',
      'org-copy-button',
      'org-chip',
      'org-editable-chip',
      'org-theme-toggle',
      'org-icon',
      'org-text-field',
      'org-textarea-field',
      'org-select-field',
      'org-autocomplete-field',
      'org-date-field',
      'org-time-field',
      'org-quantity-stepper',
      'org-toggle',
      'org-checkbox',
      'org-radio-group',
      'org-segmented-control',
      'org-nav-bar',
      'org-tabs',
      'org-filter-bar',
      'org-menu',
      'org-notification-menu',
      'org-navigation-list',
      'org-stepper',
      'org-badge',
      'org-avatar',
      'org-date-badge',
      'org-progress',
      'org-split-progress',
      'org-metric-card',
      'org-data-table',
      'org-banner',
      'org-insight-card',
      'org-empty-state',
      'org-loading-state',
      'org-skeleton',
      'org-tooltip',
      'org-logo',
      'org-party-drift',
    ]) {
      expect(root.querySelector(selector), selector).toBeTruthy();
    }
  });

  it('puts a copyable usage snippet under each demo, naming the tag it documents', () => {
    const examples = Array.from(root.querySelectorAll('app-design-system-code-example'));

    expect(examples.length).toBeGreaterThanOrEqual(35);
    for (const [id, tag] of [
      ['buttons', '<org-button'],
      ['inputs', '<org-autocomplete-field'],
      ['navigation', '<org-filter-bar'],
      ['data-display', '<org-data-table'],
      ['feedback', 'OrgDialogService'],
    ]) {
      expect(root.querySelector(`section#${id}`)?.textContent, id).toContain(tag);
    }
  });

  it('documents the select threshold next to an autocomplete with four or more options', () => {
    const inputs = root.querySelector<HTMLElement>('section#inputs');

    expect(inputs?.textContent).toContain(
      'Até três opções, use Select. A partir de quatro, use Autocomplete.',
    );
    expect(inputs?.querySelector('org-autocomplete-field')).toBeTruthy();
  });

  it('lists the type families and the whole spacing scale', () => {
    const typography = root.querySelector<HTMLElement>('section#typography')?.textContent ?? '';
    const spacing = root.querySelector<HTMLElement>('section#spacing')?.textContent ?? '';

    for (const family of ['Fredoka', 'Plus Jakarta Sans', 'JetBrains Mono']) {
      expect(typography).toContain(family);
    }
    for (const step of ['2xs', 'xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl']) {
      expect(spacing).toContain(`--org-space-${step}`);
    }
    expect(spacing).toContain('--org-radius-card');
    expect(spacing).toContain('--org-shadow-lg');
  });

  it('filters the typed icons by name', () => {
    const icons = () => root.querySelectorAll('section#iconography .ds-icons__item').length;
    const total = icons();
    const search = root.querySelector<HTMLInputElement>('section#iconography input');

    search!.value = 'delete';
    search!.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(total).toBeGreaterThan(40);
    expect(icons()).toBe(2);
  });

  it('previews one seasonal theme at a time', () => {
    component.setSeasonalTheme('theme-pascoa');
    component.setSeasonalTheme('theme-natal');
    fixture.detectChanges();

    expect(document.documentElement.classList.contains('theme-pascoa')).toBe(false);
    expect(document.documentElement.classList.contains('theme-natal')).toBe(true);
    expect(component.activeSeasonalTheme()).toBe('theme-natal');
    expect(root.querySelector('[data-testid="ds-season-theme-natal"]')).toBeTruthy();
  });

  it('puts the app theme back when leaving the page', () => {
    component.setSeasonalTheme('theme-junina');
    fixture.destroy();

    expect(document.documentElement.classList.contains('theme-junina')).toBe(false);
  });

  it('switches dark mode through the shared ThemeService', () => {
    const toggle = root.querySelector<HTMLButtonElement>(
      'section#seasonal-themes [data-testid="theme-dark-btn"]',
    );

    toggle?.click();

    expect(themeService.setMode).toHaveBeenCalledWith('dark');
  });

  it('opens toasts and dialogs through the services and shows the answer', () => {
    component.showToast('success');
    component.openDialog('danger');
    expect(feedbackService.success).toHaveBeenCalledWith('Presença confirmada!');
    expect(dialogService.confirm).toHaveBeenCalledWith(
      expect.objectContaining({ tone: 'danger', cancelLabel: 'Manter evento' }),
    );

    component.openDialog('choice');
    fixture.detectChanges();
    expect(dialogService.choose).toHaveBeenCalledWith(
      expect.objectContaining({ extraLabel: 'Manter os dois' }),
    );
    expect(root.querySelector('section#feedback')?.textContent).toContain(
      'Resposta: manter os dois',
    );
  });
});
