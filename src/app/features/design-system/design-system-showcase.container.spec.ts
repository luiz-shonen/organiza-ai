import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import {
  DesignSystemShowcaseContainer,
  SHOWCASE_SECTIONS,
} from './design-system-showcase.container';
import { FeedbackService, OrgDialogService } from '../../shared/ui';

describe('DesignSystemShowcaseContainer', () => {
  let component: DesignSystemShowcaseContainer;
  let fixture: ComponentFixture<DesignSystemShowcaseContainer>;
  let feedbackService: { success: ReturnType<typeof vi.fn>; info: ReturnType<typeof vi.fn> };
  let dialogService: { confirm: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    feedbackService = { success: vi.fn(), info: vi.fn() };
    dialogService = { confirm: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [DesignSystemShowcaseContainer],
      providers: [
        provideNoopAnimations(),
        { provide: FeedbackService, useValue: feedbackService },
        { provide: OrgDialogService, useValue: dialogService },
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

  it('renders every new catalog family through its closed Org component API', () => {
    const root = fixture.nativeElement as HTMLElement;

    for (const selector of [
      'org-button',
      'org-icon-button',
      'org-chip',
      'org-text-field',
      'org-textarea-field',
      'org-select-field',
      'org-autocomplete-field',
      'org-date-field',
      'org-time-field',
      'org-toggle',
      'org-checkbox',
      'org-radio-group',
      'org-tabs',
      'org-stepper',
      'org-menu',
      'org-navigation-list',
      'org-progress',
      'org-metric-card',
      'org-data-table',
      'org-badge',
    ]) {
      expect(root.querySelector(selector)).toBeTruthy();
    }
  });

  it('uses closed date and time field components instead of local field recipes', () => {
    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelector('org-date-field')).toBeTruthy();
    expect(root.querySelector('org-time-field')).toBeTruthy();
  });

  it('documents the select threshold and demonstrates autocomplete with more than three options', () => {
    const inputs = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>(
      'section#inputs',
    );
    const autocomplete = inputs?.querySelector('org-autocomplete-field');

    expect(inputs?.textContent).toContain(
      'Até três opções, use Select. A partir de quatro, use Autocomplete.',
    );
    expect(autocomplete).toBeTruthy();
    expect(component.eventCategoryOptions).toHaveLength(5);
    expect(inputs?.querySelector('app-design-system-code-example')?.textContent).toContain(
      'org-autocomplete-field',
    );
  });

  it('documents every new public component family with a collapsed recommended usage example', () => {
    const root = fixture.nativeElement as HTMLElement;
    const examples = Array.from(root.querySelectorAll('app-design-system-code-example'));

    expect(examples.length).toBeGreaterThanOrEqual(11);
    expect(examples.every((example) => example.textContent?.includes('Uso recomendado'))).toBe(
      true,
    );
    expect(
      root.querySelector('section#data-display app-design-system-code-example')?.textContent,
    ).toContain('org-data-table');
  });

  it('gives every showcase section a stable element id', () => {
    const root = fixture.nativeElement as HTMLElement;

    for (const section of SHOWCASE_SECTIONS) {
      expect(root.querySelector(`section#${section.id}`)).toBeTruthy();
    }
  });

  it('documents the approved typography roles, scale, and Material icon source', () => {
    const root = fixture.nativeElement as HTMLElement;
    const typography = root.querySelector<HTMLElement>('section#typography');
    const iconography = root.querySelector<HTMLElement>('section#iconography');

    expect(typography).toBeTruthy();
    expect(typography?.textContent).toContain('Plus Jakarta Sans');
    expect(typography?.textContent).toContain('Fraunces');
    expect(typography?.querySelector('app-design-system-code-example')).toBeTruthy();
    expect(iconography?.textContent).toContain('Material Icons');
    expect(iconography?.querySelector('org-icon')).toBeTruthy();
  });

  it('separates brand and foundation documentation into anchored code-backed sections', () => {
    const root = fixture.nativeElement as HTMLElement;

    for (const id of ['colors', 'iconography', 'tokens', 'spacing', 'foundations']) {
      const section = root.querySelector<HTMLElement>(`section#${id}`);
      expect(section).toBeTruthy();
      expect(section?.querySelector('app-design-system-code-example')).toBeTruthy();
    }
  });

  it('renders all 8 spacing scale tokens and border radius preview cards in the spacing section', () => {
    const root = fixture.nativeElement as HTMLElement;
    const spacingSection = root.querySelector<HTMLElement>('section#spacing');
    expect(spacingSection).toBeTruthy();

    const spacingTokens = [
      '--org-space-2xs',
      '--org-space-xs',
      '--org-space-sm',
      '--org-space-md',
      '--org-space-lg',
      '--org-space-xl',
      '--org-space-2xl',
      '--org-space-3xl',
    ];

    for (const token of spacingTokens) {
      expect(spacingSection?.textContent).toContain(token);
    }

    const radiusCards = spacingSection?.querySelectorAll('.org-ds-radius-card');
    expect(radiusCards?.length).toBe(6);
    expect(spacingSection?.textContent).toContain('--org-radius-xs');
    expect(spacingSection?.textContent).toContain('--org-radius-sm');
    expect(spacingSection?.textContent).toContain('--org-radius-md');
    expect(spacingSection?.textContent).toContain('--org-radius-lg');
    expect(spacingSection?.textContent).toContain('--org-radius-xl');
    expect(spacingSection?.textContent).toContain('--org-radius-pill');

    const shadowCards = spacingSection?.querySelectorAll('.org-ds-shadow-card');
    expect(shadowCards?.length).toBe(4);
    expect(spacingSection?.textContent).toContain('--org-shadow-xs');
    expect(spacingSection?.textContent).toContain('--org-shadow-sm');
    expect(spacingSection?.textContent).toContain('--org-shadow-md');
    expect(spacingSection?.textContent).toContain('--org-shadow-lg');
  });

  it('applies a single selected seasonal class to the document root', () => {
    component.setSeasonalTheme('theme-pascoa');
    expect(document.documentElement.classList.contains('theme-pascoa')).toBe(true);
    expect(component.activeSeasonalTheme()).toBe('theme-pascoa');

    component.setSeasonalTheme('theme-natal');
    expect(document.documentElement.classList.contains('theme-pascoa')).toBe(false);
    expect(document.documentElement.classList.contains('theme-natal')).toBe(true);
  });

  it('makes the selected seasonal card explicit to assistive technology and visually', () => {
    const root = fixture.nativeElement as HTMLElement;
    const cards = root.querySelectorAll<HTMLButtonElement>('.org-ds-season-card');

    expect(cards[0].getAttribute('aria-pressed')).toBe('true');
    component.setSeasonalTheme('theme-junina');
    fixture.detectChanges();
    expect(cards[2].classList.contains('org-ds-season-card--active')).toBe(true);
    expect(cards[2].getAttribute('aria-pressed')).toBe('true');
  });

  it('uses the feedback and dialog services only for local component demonstrations', () => {
    component.showSuccessExample();
    component.showInfoExample();
    component.openDialogExample();

    expect(feedbackService.success).toHaveBeenCalledWith('Tema aplicado à prévia com sucesso.');
    expect(feedbackService.info).toHaveBeenCalledWith(
      'A prévia usa tokens sazonais compartilhados.',
    );
    expect(dialogService.confirm).toHaveBeenCalledWith({
      title: 'Publicar tema',
      message: 'Confirme a publicação do tema para a prévia.',
      confirmLabel: 'Publicar',
      cancelLabel: 'Agora não',
    });
  });
});
