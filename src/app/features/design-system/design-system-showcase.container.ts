import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTabsModule } from '@angular/material/tabs';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { ThemeService } from '../../core/services/theme.service';
import { FeedbackService } from '../../shared/ui';

export type SeasonalThemeOption =
  | 'default'
  | 'theme-junina'
  | 'theme-natal'
  | 'theme-pascoa'
  | 'theme-ano-novo';

export interface ShowcaseSection {
  readonly id: string;
  readonly label: string;
  readonly icon: string;
}

export const SHOWCASE_SECTIONS: readonly ShowcaseSection[] = [
  { id: 'overview', label: 'Visão geral', icon: 'auto_awesome' },
  { id: 'foundations', label: 'Fundações', icon: 'palette' },
  { id: 'buttons', label: 'Botões e ações', icon: 'ads_click' },
  { id: 'inputs', label: 'Campos', icon: 'edit_note' },
  { id: 'selection', label: 'Seleção', icon: 'check_circle' },
  { id: 'navigation', label: 'Navegação', icon: 'tab' },
  { id: 'data-display', label: 'Dados e cards', icon: 'view_agenda' },
  { id: 'feedback', label: 'Feedback', icon: 'notifications' },
  { id: 'seasonal-themes', label: 'Temas sazonais', icon: 'celebration' },
];

@Component({
  selector: 'app-design-system-showcase',
  standalone: true,
  imports: [
    FormsModule,
    MatBadgeModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatCardModule,
    MatCheckboxModule,
    MatChipsModule,
    MatDatepickerModule,
    MatDividerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatListModule,
    MatMenuModule,
    MatNativeDateModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatRadioModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatTabsModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './design-system-showcase.container.html',
  styleUrl: './design-system-showcase.container.scss',
})
export class DesignSystemShowcaseContainer {
  protected readonly themeService = inject(ThemeService);
  private readonly feedbackService = inject(FeedbackService);
  private readonly dialog = inject(MatDialog);

  public readonly sections = SHOWCASE_SECTIONS;
  public readonly activeSection = signal<string>('overview');
  public readonly activeSeasonalTheme = signal<SeasonalThemeOption>('default');
  public readonly selectedDensity = signal<'comfortable' | 'compact'>('comfortable');
  public readonly eventDate = signal<Date | null>(new Date(2026, 5, 24));
  public readonly attendanceChannel = signal<'email' | 'whatsapp'>('email');
  public readonly notificationsEnabled = signal<boolean>(true);
  public readonly notifications = signal<number>(3);

  public readonly seasonalOptions: ReadonlyArray<{
    readonly id: SeasonalThemeOption;
    readonly label: string;
    readonly description: string;
  }> = [
    { id: 'default', label: 'Organiza', description: 'Rosa, coral e amarelo.' },
    { id: 'theme-pascoa', label: 'Páscoa da Ressurreição', description: 'Violeta, aurora e oliveira.' },
    { id: 'theme-junina', label: 'Festa Junina', description: 'Brasa, milho e céu de arraial.' },
    { id: 'theme-natal', label: 'Natal de Jesus', description: 'Rubi, pinheiro e dourado.' },
    { id: 'theme-ano-novo', label: 'Ano Novo', description: 'Ouro, prata e céu à meia-noite.' },
  ];

  public setSeasonalTheme(theme: SeasonalThemeOption): void {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      root.classList.remove('theme-junina', 'theme-natal', 'theme-pascoa', 'theme-ano-novo');
      if (theme !== 'default') {
        root.classList.add(theme);
      }
    }
    this.activeSeasonalTheme.set(theme);
  }

  public toggleThemeMode(): void {
    this.themeService.setMode(this.themeService.isDark() ? 'light' : 'dark');
  }

  public setActiveSection(sectionId: string): void {
    this.activeSection.set(sectionId);
  }

  public openDialogExample(): void {
    this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Publicar tema',
        message: 'Este é um exemplo de confirmação com Angular Material Dialog.',
        confirmLabel: 'Publicar',
        cancelLabel: 'Agora não',
      },
    });
  }

  public showSuccessExample(): void {
    this.feedbackService.success('Tema aplicado à prévia com sucesso.');
  }

  public showInfoExample(): void {
    this.feedbackService.info('A prévia usa tokens sazonais compartilhados.');
  }
}
