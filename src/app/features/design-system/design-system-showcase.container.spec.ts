import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MatDialog } from '@angular/material/dialog';
import { DesignSystemShowcaseContainer, SHOWCASE_SECTIONS } from './design-system-showcase.container';
import { FeedbackService } from '../../shared/ui';

describe('DesignSystemShowcaseContainer', () => {
  let component: DesignSystemShowcaseContainer;
  let fixture: ComponentFixture<DesignSystemShowcaseContainer>;
  let feedbackService: { success: ReturnType<typeof vi.fn>; info: ReturnType<typeof vi.fn> };
  let dialog: { open: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    feedbackService = { success: vi.fn(), info: vi.fn() };
    dialog = { open: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [DesignSystemShowcaseContainer],
      providers: [
        provideNoopAnimations(),
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

  it('renders every Angular Material component family required by the catalog contract', () => {
    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelector('button[mat-flat-button]')).toBeTruthy();
    expect(root.querySelector('mat-form-field')).toBeTruthy();
    expect(root.querySelector('mat-select')).toBeTruthy();
    expect(root.querySelector('mat-datepicker')).toBeTruthy();
    expect(root.querySelector('mat-checkbox')).toBeTruthy();
    expect(root.querySelector('mat-radio-group')).toBeTruthy();
    expect(root.querySelector('mat-slide-toggle')).toBeTruthy();
    expect(root.querySelector('mat-chip-listbox')).toBeTruthy();
    expect(root.querySelector('mat-tab-group')).toBeTruthy();
    expect(root.querySelector('button[mat-list-item]')).toBeTruthy();
    expect(Array.from(root.querySelectorAll('button')).some((button) => button.textContent?.includes('Mais ações'))).toBe(true);
    expect(root.querySelector('mat-progress-bar')).toBeTruthy();
    expect(root.querySelector('mat-progress-spinner')).toBeTruthy();
    expect(root.querySelector('mat-card')).toBeTruthy();
  });

  it('uses closed date and time field components instead of local field recipes', () => {
    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelector('org-date-field')).toBeTruthy();
    expect(root.querySelector('org-time-field')).toBeTruthy();
  });

  it('gives every showcase section a stable element id', () => {
    const root = fixture.nativeElement as HTMLElement;

    for (const section of SHOWCASE_SECTIONS) {
      expect(root.querySelector(`section#${section.id}`)).toBeTruthy();
    }
  });

  it('applies a single selected seasonal class to the document root', () => {
    component.setSeasonalTheme('theme-pascoa');
    expect(document.documentElement.classList.contains('theme-pascoa')).toBe(true);
    expect(component.activeSeasonalTheme()).toBe('theme-pascoa');

    component.setSeasonalTheme('theme-natal');
    expect(document.documentElement.classList.contains('theme-pascoa')).toBe(false);
    expect(document.documentElement.classList.contains('theme-natal')).toBe(true);
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
