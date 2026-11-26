/**
 * The "Uso recomendado" snippets of /design-system: the exact markup each demo above it uses,
 * so a feature can copy it as is. Keep them short and in sync with the demo.
 */
export const DS_SNIPPETS = {
  importing: `import { OrgButtonComponent, OrgSurfaceComponent } from '@shared/ui';

@Component({
  imports: [OrgButtonComponent, OrgSurfaceComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './meu.component.html',
  styleUrl: './meu.component.scss',
})`,

  colors: `.resumo {
  background: var(--org-surface);
  border: 1px solid var(--org-outline-variant);
  color: var(--org-on-surface);
}

.resumo__data {
  color: var(--org-on-secondary-container); /* datas: azul */
}`,

  categoryBadge: `<!-- A cor vem da categoria; nunca do verde, âmbar ou vermelho de status. -->
<org-badge [label]="event.category" [hue]="getCategoryHue(event.category)" [gradient]="false" />`,

  typography: `.cartao__titulo { font: var(--org-text-title); }
.cartao__meta   { font: var(--org-text-body-sm); color: var(--org-on-surface-variant); }

/* Ou tokens avulsos: */
.contador {
  font-size: var(--org-font-size-sm);
  font-weight: var(--org-font-weight-semibold);
}`,

  spacing: `.lista {
  display: flex;
  flex-direction: column;
  gap: var(--org-space-md);
  padding: var(--org-space-lg);
  border-radius: var(--org-radius-card);
  transition: box-shadow var(--org-motion-fast) var(--org-motion-ease);

  @include semantic.tablet {
    flex-direction: row;
  }
}`,

  icons: `<org-icon name="event" size="sm" />
<org-icon name="check_circle" color="var(--org-success)" />

<!-- Ação só com ícone: o rótulo vira tooltip. -->
<org-icon-button icon="share" ariaLabel="Compartilhar" (pressed)="share()" />`,

  themes: `<org-theme-toggle
  [dark]="theme.isDark()"
  (darkChange)="theme.setMode($event ? 'dark' : 'light')"
/>

// Temas sazonais: SeasonalThemeService põe uma classe no <html>
// (theme-junina, theme-natal…) que só troca --org-canvas.`,

  pageLayout: `<org-page-layout maxWidth="narrow">
  <org-page-header title="Olá, " highlight="Jéssica" subtitle="2 convites esperam sua resposta.">
    <org-button orgPageHeaderActions label="Novo evento" icon="add" />
  </org-page-header>

  <org-section title="Próximos eventos" [count]="3">…</org-section>
</org-page-layout>`,

  surface: `<org-surface variant="card">
  <org-card-header heading="Rachadinha via Pix" subheading="Contribua com o evento!">
    <org-icon-button orgCardHeaderAction icon="edit" ariaLabel="Editar" />
  </org-card-header>
  …
</org-surface>

<!-- Linhas de ponta a ponta com divisórias: -->
<org-surface variant="card" [flush]="true">…</org-surface>`,

  expansion: `<org-expansion-panel heading="Família leva 2 itens" icon="assignment" [(expanded)]="open">
  <span orgExpansionSummary>1/2 comprados</span>
  …
</org-expansion-panel>`,

  button: `<org-button label="Confirmar presença" icon="how_to_reg" (pressed)="confirm()" />
<org-button label="Ver convidados" variant="secondary" />
<org-button label="Responder convite" variant="tonal" />
<org-button label="Eu levo" variant="attention" [compact]="true" />
<org-button label="Cancelar evento" variant="danger" />
<org-button label="Sair da conta" variant="danger-text" icon="logout" />
<org-button label="Salvando" [loading]="saving()" />`,

  iconButton: `<org-icon-button icon="add" ariaLabel="Novo evento" variant="primary" />
<org-icon-button icon="edit" ariaLabel="Editar item" />
<org-icon-button icon="delete_outline" ariaLabel="Remover item" /> <!-- sempre vermelho -->
<org-icon-button icon="close" ariaLabel="Fechar" variant="chip" />`,

  copyButton: `<org-copy-button
  label="Copiar link"
  copiedMessage="Link copiado!"
  variant="secondary"
  [value]="eventUrl()"
/>`,

  chip: `<org-chip
  label="Aniversário"
  [selectable]="true"
  [selected]="category() === 'Aniversário'"
  (selectionChange)="pick('Aniversário')"
/>

<org-editable-chip
  placeholder="Personalizar"
  [value]="custom()"
  [selected]="!!custom()"
  (valueChange)="custom.set($event)"
  (cleared)="custom.set(null)"
/>`,

  textField: `<org-text-field label="Nome do evento" [(value)]="title" [required]="true" />
<org-text-field
  label="WhatsApp"
  type="tel"
  inputMode="numeric"
  prefixIcon="phone"
  [mask]="maskPhone"
  [(value)]="phone"
/>
<org-textarea-field label="Recado para os convidados" [rows]="3" [maxLength]="160" [(value)]="note" />`,

  choiceFields: `<!-- Até três opções: select. -->
<org-select-field label="Formato" [options]="formatOptions" [(value)]="format" />

<!-- Quatro ou mais: autocomplete, que filtra sem acento nem caixa. -->
<org-autocomplete-field label="Categoria" [options]="categoryOptions" [(value)]="category" />`,

  dateTime: `<org-date-field label="Data" [min]="today" [(value)]="date" />
<org-time-field
  label="Horário"
  [(value)]="time"
  [minuteStep]="5"
  [quickOptions]="[{ label: 'Almoço, 12h', value: '12:00' }]"
/>`,

  quantity: `<org-quantity-stepper [(value)]="quantity" [max]="remaining()" unit="un." />`,

  toggleCheckbox: `<!-- Liga e desliga na hora: toggle. -->
<org-toggle label="Lembrete na véspera" [(checked)]="reminder" />

<!-- Escolhas independentes: checkbox. -->
<org-checkbox label="Permitir acompanhante" [(checked)]="companion" />`,

  radioSegmented: `<!-- Exatamente uma opção, em lista: -->
<org-radio-group label="Como avisar" [options]="channels" [(value)]="channel" />

<!-- Duas ou três opções lado a lado: -->
<org-segmented-control
  ariaLabel="Tema"
  [options]="[{ value: 'light', label: 'Claro', icon: 'light_mode' }, …]"
  [value]="mode()"
  (valueChange)="setMode($event)"
/>`,

  filterBar: `<org-filter-bar
  ariaLabel="Filtrar eventos"
  [options]="[
    { id: 'all', label: 'Todos' },
    { id: 'pending', label: 'Pendentes', count: 2, attention: true },
    { id: 'confirmed', label: 'Confirmados' },
  ]"
  [values]="filters()"
  (valuesChange)="filters.set($event)"
/>`,

  tabs: `<org-tabs [items]="tabs" [(selectedId)]="tab" />

tabs: OrgTabItem[] = [
  { id: 'items', label: 'Itens' },
  { id: 'guests', label: 'Convidados' },
];`,

  menu: `<org-menu
  triggerLabel="Mais ações"
  [actions]="[{ id: 'duplicate', label: 'Duplicar evento' }, { id: 'print', label: 'Imprimir lista' }]"
  (actionSelected)="act($event)"
/>`,

  navigationList: `<org-navigation-list [items]="sections" [activeId]="active()" (selected)="go($event)" />`,

  navBar: `<!-- Só no app shell: barra inferior no celular, pílulas no topo do desktop. -->
<org-nav-bar layout="bottom" [items]="navItems" [activeRoute]="currentUrl()" />

navItems: OrgNavBarItem[] = [
  { route: '/', label: 'Início', icon: 'home', testId: 'nav-home', exact: true },
  { route: '/meus-eventos', label: 'Meus eventos', icon: 'event', testId: 'nav-events' },
];`,

  notificationMenu: `<org-notification-menu
  [items]="notifications()"
  (opened)="markSeen()"
  (selected)="open($event)"
/>`,

  stepper: `<!-- compact no celular: "Etapa 2 de 3" e uma barra por etapa. -->
<org-stepper ariaLabel="Criar evento" [compact]="isPhone()" [(selectedIndex)]="step">
  <org-step label="O evento">…</org-step>
  <org-step label="Convidados">…</org-step>
  <org-step label="Revisão">…</org-step>
</org-stepper>`,

  peopleDates: `<org-avatar [name]="profile.name" [photoUrl]="profile.photo" />
<org-avatar name="Luiz" size="lg" [highlighted]="true" />

<org-date-badge [date]="event.date" />
<org-date-badge [date]="event.date" [endDate]="event.endDate" />`,

  badge: `<org-badge label="Confirmado" variant="success" [gradient]="false" />
<org-badge label="Pendente" variant="warning" [gradient]="false" />
<org-badge label="Recusado" variant="danger" [gradient]="false" />
<org-badge label="Faltam 6 un." [pill]="true" [gradient]="false" />`,

  progress: `<org-progress [value]="67" variant="success" ariaLabel="8 de 12 confirmados" />

<org-split-progress
  [total]="10"
  [segments]="[{ label: 'Ana', value: 4 }, { label: 'Marta', value: 2 }]"
  ariaLabel="Bolo de milho: 6 de 10"
/>`,

  metricCard: `<org-metric-card label="Confirmados" value="42" description="de 50 convidados" [gradient]="false" />`,

  dataTable: `<org-data-table
  ariaLabel="Itens do evento"
  [rows]="items()"
  [columns]="[
    { id: 'name', label: 'Item', value: (row) => row.name },
    { id: 'who', label: 'Quem leva', value: (row) => row.who },
  ]"
  [actionTemplate]="actions"
  (rowActivated)="open($event)"
/>

<ng-template #actions let-row>
  <org-icon-button icon="edit" ariaLabel="Editar" (pressed)="edit(row)" />
</ng-template>`,

  banner: `<org-banner variant="info" message="Você está sem internet. Mostramos a última versão salva." icon="cloud_off" />
<org-banner
  variant="success"
  message="Item removido."
  actionLabel="Desfazer"
  actionIcon="undo"
  (action)="undo()"
/>`,

  insight: `<org-insight-card tone="warning">
  Faltam 3 dias! <strong>2 itens</strong> estão sem responsável.
  <org-button orgInsightAction label="Ver itens" variant="secondary" [compact]="true" />
</org-insight-card>`,

  emptyLoading: `<org-empty-state icon="event" title="Nenhum evento por aqui" description="Crie o primeiro para começar." />
<org-loading-state label="Carregando eventos..." />
<org-skeleton class="lista__linha" /> <!-- a feature só define largura e altura -->`,

  snackbar: `private readonly feedback = inject(FeedbackService);

this.feedback.success('Presença confirmada!');
this.feedback.info('O convite foi reenviado.');
this.feedback.error('Não foi possível salvar. Tente de novo.');`,

  dialog: `private readonly dialogs = inject(OrgDialogService);

this.dialogs
  .confirm({
    title: 'Cancelar o evento?',
    message: 'Os convidados serão avisados.',
    confirmLabel: 'Cancelar evento',
    cancelLabel: 'Manter evento',
    tone: 'danger',
    icon: 'cancel',
  })
  .subscribe((ok) => ok && this.cancel());`,

  bottomSheet: `<org-bottom-sheet ariaLabel="Eu levo" [open]="open()" (closed)="open.set(false)">
  …
</org-bottom-sheet>

<!-- Para editar: gaveta à direita a partir do tablet. -->
<org-bottom-sheet ariaLabel="Editar item" placement="side" [open]="editing()" (closed)="editing.set(false)">
  …
</org-bottom-sheet>`,

  tooltip: `<org-tooltip [text]="event().location">
  <p class="local">{{ event().location }}</p>
</org-tooltip>

<!-- Botões já têm tooltip: -->
<org-button label="Salvar" tooltip="Salva sem publicar" />`,

  logo: `<org-logo />                        <!-- topo -->
<org-logo size="lg" />              <!-- login -->
<org-logo [animated]="false" />     <!-- parado -->`,

  partyDrift: `<!-- Dentro de uma camada posicionada e do tamanho da área; decorativo. -->
<div class="fundo-festivo">
  <org-party-drift />
</div>`,
} as const;

export type DesignSystemSnippetKey = keyof typeof DS_SNIPPETS;
