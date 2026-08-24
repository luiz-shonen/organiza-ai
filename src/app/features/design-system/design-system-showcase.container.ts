import { afterNextRender, ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialog } from '@angular/material/dialog';
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
import { MatStepperModule } from '@angular/material/stepper';
import { MatTabsModule } from '@angular/material/tabs';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { FeedbackService } from '../../shared/ui';
import {
  OrgBannerComponent,
  OrgDateFieldComponent,
  OrgEmptyStateComponent,
  OrgPageHeaderComponent,
  OrgSurfaceComponent,
  OrgTimeFieldComponent,
} from '../../shared/ui';
import { DesignSystemCodeExampleComponent } from './design-system-code-example.component';

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
  { id: 'seasonal-themes', label: 'Temas sazonais', icon: 'celebration' },
  { id: 'foundations', label: 'Fundações', icon: 'palette' },
  { id: 'components', label: 'Componentes', icon: 'widgets' },
  { id: 'buttons', label: 'Botões e ações', icon: 'ads_click' },
  { id: 'inputs', label: 'Campos', icon: 'edit_note' },
  { id: 'selection', label: 'Seleção', icon: 'check_circle' },
  { id: 'stepper', label: 'Etapas', icon: 'format_list_numbered' },
  { id: 'navigation', label: 'Navegação', icon: 'tab' },
  { id: 'data-display', label: 'Dados e cards', icon: 'view_agenda' },
  { id: 'feedback', label: 'Feedback', icon: 'notifications' },
];

@Component({
  selector: 'app-design-system-showcase',
  standalone: true,
  imports: [
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatChipsModule,
    MatDatepickerModule,
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
    MatStepperModule,
    MatTabsModule,
    OrgBannerComponent,
    OrgDateFieldComponent,
    OrgEmptyStateComponent,
    OrgPageHeaderComponent,
    OrgSurfaceComponent,
    OrgTimeFieldComponent,
    DesignSystemCodeExampleComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './design-system-showcase.container.html',
  styleUrl: './design-system-showcase.container.scss',
})
export class DesignSystemShowcaseContainer {
  private readonly feedbackService = inject(FeedbackService);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);

  public readonly activeSeasonalTheme = signal<SeasonalThemeOption>('default');
  public readonly eventDate = signal<Date | null>(new Date(2026, 5, 24));
  public readonly attendanceChannel = signal<'email' | 'whatsapp'>('email');
  public readonly notificationsEnabled = signal<boolean>(true);
  public readonly notifications = signal<number>(3);
  public readonly stepperOrientation = signal<'horizontal' | 'vertical'>('horizontal');
  public readonly componentExamples = {
    invitationPreview: `import { OrgSurfaceComponent } from '@shared/ui';

<org-surface variant="hero" [atmosphere]="true">
  <!-- Componha o cabeçalho, metadados e ações do convite -->
</org-surface>`,
    tokens: `:root {
  --org-primary: #ff6b5b;
  --org-secondary: #ffb648;
  --org-gradient-border: linear-gradient(135deg, var(--org-primary), var(--org-secondary));
}`,
    fields: `<mat-form-field appearance="outline">
  <mat-label>Horário de início</mat-label>
  <input matInput type="time" />
</mat-form-field>`,
    selection: `<mat-slide-toggle>Enviar lembrete</mat-slide-toggle>

<!-- Checkbox é reservado para opções múltiplas. -->
<mat-checkbox>Permitir acompanhante</mat-checkbox>`,
    navigation: `<mat-tab-group aria-label="Etapas do evento">
  <mat-tab label="Resumo">...</mat-tab>
  <mat-tab label="Convidados">...</mat-tab>
</mat-tab-group>`,
    stepper: `<mat-stepper [orientation]="stepperOrientation()">
  <mat-step label="Informações">...</mat-step>
  <mat-step label="Convidados">...</mat-step>
</mat-stepper>`,
    pageLayout: `import { OrgPageHeaderComponent, OrgPageLayoutComponent } from '@shared/ui';

<org-page-layout maxWidth="wide">
  <org-page-header title="Meus eventos" icon="event" [gradient]="true" />
</org-page-layout>`,
    surface: `import { OrgSurfaceComponent } from '@shared/ui';

<org-surface variant="card">
  <h3>Lista de convidados</h3>
  <p>Use variantes para superfícies, não CSS local.</p>
</org-surface>`,
    feedback: `import { OrgBannerComponent, FeedbackService } from '@shared/ui';

<org-banner variant="info" message="Convites enviados." />

// Para feedback transitório:
this.feedbackService.success('Evento salvo com sucesso.');`,
    emptyState: `import { OrgEmptyStateComponent } from '@shared/ui';

<org-empty-state
  icon="event"
  title="Nenhum evento por aqui"
  description="Crie o primeiro evento para começar."
/>`,
    metrics: `import { OrgSurfaceComponent } from '@shared/ui';

<org-surface variant="card">
  <span>Confirmações</span>
  <strong>42</strong>
</org-surface>`,
  } as const;

  public constructor() {
    afterNextRender(() => {
      if (!window.matchMedia) {
        return;
      }

      const mobileQuery = window.matchMedia('(max-width: 599px)');
      const updateOrientation = () => this.stepperOrientation.set(mobileQuery.matches ? 'vertical' : 'horizontal');
      updateOrientation();
      mobileQuery.addEventListener('change', updateOrientation);
      this.destroyRef.onDestroy(() => mobileQuery.removeEventListener('change', updateOrientation));
    });
  }

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

  public scrollToSection(sectionId: string): void {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
