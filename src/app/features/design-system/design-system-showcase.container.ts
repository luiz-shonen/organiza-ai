import { afterNextRender, ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import {
  OrgBannerComponent,
  OrgBadgeComponent,
  OrgAutocompleteFieldComponent,
  OrgButtonComponent,
  OrgCheckboxComponent,
  OrgChipComponent,
  OrgDateFieldComponent,
  OrgDialogService,
  OrgEmptyStateComponent,
  OrgIconComponent,
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
  type OrgTimeOption,
  type OrgTabItem,
  FeedbackService,
} from '../../shared/ui';
import {
  DESIGN_SYSTEM_SECTIONS,
  type DesignSystemNavigationItem,
} from '../../core/models/design-system-navigation.model';
import { DesignSystemCodeExampleComponent } from './design-system-code-example.component';

export type SeasonalThemeOption =
  | 'default'
  | 'theme-junina'
  | 'theme-natal'
  | 'theme-pascoa'
  | 'theme-ano-novo';

export type ShowcaseSection = DesignSystemNavigationItem;

export const SHOWCASE_SECTIONS: readonly ShowcaseSection[] = DESIGN_SYSTEM_SECTIONS;

@Component({
  selector: 'app-design-system-showcase',
  standalone: true,
  imports: [
    OrgBannerComponent,
    OrgBadgeComponent,
    OrgAutocompleteFieldComponent,
    OrgButtonComponent,
    OrgCheckboxComponent,
    OrgChipComponent,
    OrgDateFieldComponent,
    OrgEmptyStateComponent,
    OrgIconComponent,
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
  public readonly eventCategory = signal<string | null>('celebrativo');
  public readonly welcomeMessage = signal('Celebre com quem torna a vida mais bonita.');
  public readonly eventTime = signal('19:30');
  public readonly timeOptions: readonly OrgTimeOption[] = [
    { label: 'Abertura, 19h', value: '19:00' },
    { label: 'Início, 19h30', value: '19:30' },
    { label: 'Encerramento, 22h', value: '22:00' },
  ];
  public readonly attendanceChannel = signal<'email' | 'whatsapp'>('email');
  public readonly notificationsEnabled = signal<boolean>(true);
  public readonly reminderEnabled = signal<boolean>(true);
  public readonly emailResponsesEnabled = signal<boolean>(true);
  public readonly companionAllowed = signal<boolean>(false);
  public readonly notifications = signal<number>(3);
  public readonly selectedTab = signal<string | null>('summary');
  public readonly activeNavigationItem = signal<string | null>('guests');
  public readonly stepperOrientation = signal<'horizontal' | 'vertical'>('horizontal');
  public readonly formatOptions: readonly OrgSelectOption[] = [
    { value: 'presencial', label: 'Presencial' },
    { value: 'hibrido', label: 'Híbrido' },
    { value: 'online', label: 'Online' },
  ];
  public readonly eventCategoryOptions: readonly OrgSelectOption[] = [
    { value: 'celebrativo', label: 'Celebrativo' },
    { value: 'familia', label: 'Família' },
    { value: 'comunidade', label: 'Comunidade' },
    { value: 'corporativo', label: 'Corporativo' },
    { value: 'beneficente', label: 'Beneficente' },
  ];
  public readonly channelOptions: readonly OrgRadioOption[] = [
    { value: 'email', label: 'E-mail' },
    { value: 'whatsapp', label: 'WhatsApp' },
  ];
  public readonly tabItems: readonly OrgTabItem[] = [
    { id: 'summary', label: 'Resumo', content: 'Uma visão geral do convite e da confirmação.' },
    { id: 'guests', label: 'Convidados', content: '42 convidados confirmados para esta celebração.' },
    { id: 'details', label: 'Detalhes', content: 'Detalhes de data, local e canais de presença.' },
  ];
  public readonly navigationItems: readonly OrgNavigationItem[] = [
    { id: 'guests', label: 'Convidados confirmados · 42' },
    { id: 'messages', label: 'Mensagens pendentes · 3' },
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
    colors: `:root {
  --org-primary: #ff4d94;
  --org-secondary: #ff8c42;
  --org-tertiary: #ffc837;
  --org-success: #10b981;
  --org-error: #ef4444;
}`,
    iconography: `import { OrgIconComponent } from '@shared/ui';

<org-icon name="event" size="md" />
<org-icon name="schedule" size="sm" />

<!-- Use apenas nomes do mapa tipado do OrgIcon. -->`,
    foundations: `:root {
  --org-space-sm: 0.5rem;
  --org-space-md: 1rem;
  --org-space-lg: 1.5rem;
  --org-radius-md: 1rem;
  --org-glass-blur: 24px;
  --org-glass-shadow: 0 16px 48px rgb(36 28 49 / 0.16);
}`,
    typography: `:root {
  --org-font-body: 'Plus Jakarta Sans', sans-serif;
  --org-font-display: 'Fraunces', Georgia, serif;
  --org-font-mono: 'JetBrains Mono', monospace;
  --org-type-display-size: clamp(2.25rem, 5vw, 4.5rem);
  --org-type-body-size: 1rem;
  --org-type-body-line-height: 1.6;
}

/* Títulos editoriais no catálogo e em chamadas de produto. */
.org-page-header__title {
  font-family: var(--org-font-display);
  font-size: var(--org-type-display-size);
  line-height: var(--org-type-display-line-height);
}

/* Texto de interface, campos e ações. */
.org-button, .org-form-field {
  font-family: var(--org-font-body);
}

/* Código e tokens. */
code { font-family: var(--org-font-mono); }`,
    actions: `import { OrgButtonComponent, OrgIconButtonComponent, OrgChipComponent } from '@shared/ui';

<org-button label="Salvar" icon="check" variant="primary" [gradient]="true" />
<org-icon-button ariaLabel="Adicionar evento" icon="add" />
<org-chip label="Celebrativo" variant="accent" [selected]="true" />`,
    fields: `import { OrgAutocompleteFieldComponent, OrgDateFieldComponent, OrgSelectFieldComponent, OrgTextFieldComponent, OrgTimeFieldComponent } from '@shared/ui';

<org-text-field label="Título" [(value)]="title" />
<!-- Use select para até três opções. -->
<org-select-field label="Formato" [options]="formatOptions" [(value)]="format" />
<!-- Use autocomplete a partir de quatro opções. -->
<org-autocomplete-field label="Categoria" [options]="categoryOptions" [(value)]="category" />
<org-date-field label="Data" [(value)]="date" />
<org-time-field label="Horário" [(value)]="time" [minuteStep]="5" [quickOptions]="timeOptions" min="08:00" max="22:00" />`,
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

  public selectNavigationExample(itemId: string): void {
    this.activeNavigationItem.set(itemId);
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
