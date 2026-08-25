import { afterNextRender, ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import {
  OrgBannerComponent,
  OrgBadgeComponent,
  OrgButtonComponent,
  OrgCheckboxComponent,
  OrgChipComponent,
  OrgDateFieldComponent,
  OrgDialogService,
  OrgEmptyStateComponent,
  OrgIconButtonComponent,
  OrgMenuComponent,
  OrgMetricCardComponent,
  OrgNavigationListComponent,
  OrgPageHeaderComponent,
  OrgProgressComponent,
  OrgRadioGroupComponent,
  OrgSelectFieldComponent,
  OrgStepComponent,
  OrgStepperComponent,
  OrgSurfaceComponent,
  OrgTabsComponent,
  OrgTextFieldComponent,
  OrgTimeFieldComponent,
  OrgTextareaFieldComponent,
  OrgToggleComponent,
  type OrgMenuAction,
  type OrgNavigationItem,
  type OrgRadioOption,
  type OrgSelectOption,
  type OrgTabItem,
  FeedbackService,
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
    OrgBannerComponent,
    OrgBadgeComponent,
    OrgButtonComponent,
    OrgCheckboxComponent,
    OrgChipComponent,
    OrgDateFieldComponent,
    OrgEmptyStateComponent,
    OrgIconButtonComponent,
    OrgMenuComponent,
    OrgMetricCardComponent,
    OrgNavigationListComponent,
    OrgPageHeaderComponent,
    OrgProgressComponent,
    OrgRadioGroupComponent,
    OrgSelectFieldComponent,
    OrgStepComponent,
    OrgStepperComponent,
    OrgSurfaceComponent,
    OrgTabsComponent,
    OrgTextFieldComponent,
    OrgTimeFieldComponent,
    OrgTextareaFieldComponent,
    OrgToggleComponent,
    DesignSystemCodeExampleComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './design-system-showcase.container.html',
  styleUrl: './design-system-showcase.container.scss',
})
export class DesignSystemShowcaseContainer {
  private readonly feedbackService = inject(FeedbackService);
  private readonly dialogService = inject(OrgDialogService);
  private readonly destroyRef = inject(DestroyRef);

  public readonly activeSeasonalTheme = signal<SeasonalThemeOption>('default');
  public readonly eventDate = signal<Date | null>(new Date(2026, 5, 24));
  public readonly eventTitle = signal('Ceia de Natal');
  public readonly eventFormat = signal<string | null>('presencial');
  public readonly welcomeMessage = signal('Celebre com quem torna a vida mais bonita.');
  public readonly eventTime = signal('19:30');
  public readonly attendanceChannel = signal<'email' | 'whatsapp'>('email');
  public readonly notificationsEnabled = signal<boolean>(true);
  public readonly reminderEnabled = signal<boolean>(true);
  public readonly emailResponsesEnabled = signal<boolean>(true);
  public readonly companionAllowed = signal<boolean>(false);
  public readonly notifications = signal<number>(3);
  public readonly selectedTab = signal<string | null>('summary');
  public readonly stepperOrientation = signal<'horizontal' | 'vertical'>('horizontal');
  public readonly formatOptions: readonly OrgSelectOption[] = [
    { value: 'presencial', label: 'Presencial' },
    { value: 'hibrido', label: 'Híbrido' },
    { value: 'online', label: 'Online' },
  ];
  public readonly channelOptions: readonly OrgRadioOption[] = [
    { value: 'email', label: 'E-mail' },
    { value: 'whatsapp', label: 'WhatsApp' },
  ];
  public readonly tabItems: readonly OrgTabItem[] = [
    { id: 'summary', label: 'Resumo' },
    { id: 'guests', label: 'Convidados' },
    { id: 'details', label: 'Detalhes' },
  ];
  public readonly navigationItems: readonly OrgNavigationItem[] = [
    { id: 'guests', label: 'Convidados confirmados · 42', href: '#data-display' },
    { id: 'messages', label: 'Mensagens pendentes · 3', href: '#feedback' },
  ];
  public readonly menuActions: readonly OrgMenuAction[] = [
    { id: 'duplicate', label: 'Duplicar evento' },
    { id: 'archive', label: 'Arquivar rascunho' },
  ];
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
    actions: `import { OrgButtonComponent, OrgIconButtonComponent, OrgChipComponent } from '@shared/ui';

<org-button label="Salvar" icon="check" variant="primary" [gradient]="true" />
<org-icon-button ariaLabel="Adicionar evento" icon="add" />
<org-chip label="Celebrativo" variant="accent" [selected]="true" />`,
    fields: `import { OrgTextFieldComponent, OrgDateFieldComponent, OrgTimeFieldComponent } from '@shared/ui';

<org-text-field label="Título" [(value)]="title" />
<org-date-field label="Data" [(value)]="date" />
<org-time-field label="Horário" [(value)]="time" [minuteStep]="5" />`,
    selection: `import { OrgToggleComponent, OrgCheckboxComponent, OrgRadioGroupComponent } from '@shared/ui';

<org-toggle label="Enviar lembrete" [(checked)]="reminder" />
<!-- Checkbox é reservado para escolhas independentes e múltiplas. -->
<org-checkbox label="Permitir acompanhante" [(checked)]="companion" />
<org-radio-group label="Canal" [options]="channels" [(value)]="channel" />`,
    navigation: `import { OrgTabsComponent, OrgNavigationListComponent, OrgMenuComponent } from '@shared/ui';

<org-tabs [items]="tabs" [(selectedId)]="activeTab" [gradient]="true" />
<org-navigation-list [items]="items" (selected)="navigate($event)" />
<org-menu triggerLabel="Mais ações" [actions]="actions" (actionSelected)="act($event)" />`,
    stepper: `import { OrgStepComponent, OrgStepperComponent } from '@shared/ui';

<org-stepper [orientation]="orientation()">
  <org-step label="Informações">...</org-step>
  <org-step label="Convidados">...</org-step>
</org-stepper>`,
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
    metrics: `import { OrgMetricCardComponent, OrgProgressComponent, OrgBadgeComponent } from '@shared/ui';

<org-metric-card label="Confirmações" value="42" trend="18% nesta semana" [atmosphere]="true" />
<org-progress [value]="67" ariaLabel="67% dos itens concluídos" [gradient]="true" />
<org-badge label="Novo" variant="success" />`,
    overlays: `import { OrgDialogService, FeedbackService } from '@shared/ui';

this.feedbackService.success('Evento salvo com sucesso.');
this.dialogService.confirm({
  title: 'Publicar tema',
  message: 'Confirme a publicação do tema.',
});`,
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
    this.dialogService.confirm({
      title: 'Publicar tema',
      message: 'Confirme a publicação do tema para a prévia.',
      confirmLabel: 'Publicar',
      cancelLabel: 'Agora não',
    });
  }

  public showSuccessExample(): void {
    this.feedbackService.success('Tema aplicado à prévia com sucesso.');
  }

  public showInfoExample(): void {
    this.feedbackService.info('A prévia usa tokens sazonais compartilhados.');
  }
}
