import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import {
  OrgFilterBarComponent,
  OrgMenuComponent,
  OrgNavBarComponent,
  OrgNavigationListComponent,
  OrgNotificationMenuComponent,
  OrgSectionComponent,
  OrgStepComponent,
  OrgStepperComponent,
  OrgTabsComponent,
  type OrgFilterOption,
  type OrgMenuAction,
  type OrgNavBarItem,
  type OrgNavigationItem,
  type OrgNotificationItem,
  type OrgTabItem,
} from '../../shared/ui';
import { DS_SNIPPETS } from './design-system-snippets';
import { DesignSystemSpecimenComponent } from './design-system-specimen.component';

/** "Navegação" of the catalog. Demo state only; no data. */
@Component({
  selector: 'app-design-system-navigation',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DesignSystemSpecimenComponent,
    OrgFilterBarComponent,
    OrgMenuComponent,
    OrgNavBarComponent,
    OrgNavigationListComponent,
    OrgNotificationMenuComponent,
    OrgSectionComponent,
    OrgStepComponent,
    OrgStepperComponent,
    OrgTabsComponent,
  ],
  templateUrl: './design-system-navigation.component.html',
  styleUrl: './design-system-navigation.component.scss',
})
export class DesignSystemNavigationComponent {
  /** The page's breakpoint: phones get the compact stepper. */
  public readonly phone = input(false);

  protected readonly snippets = DS_SNIPPETS;

  protected readonly tabs: readonly OrgTabItem[] = [
    { id: 'items', label: 'Itens', content: '12 itens na lista, 3 sem responsável.' },
    { id: 'guests', label: 'Convidados', content: '42 confirmados de 50 convidados.' },
    { id: 'santa', label: 'Amigo oculto', content: 'Sorteio marcado para 20 de dezembro.' },
  ];
  protected readonly tab = signal<string | null>('items');

  protected readonly filters: readonly OrgFilterOption[] = [
    { id: 'all', label: 'Todos' },
    { id: 'pending', label: 'Pendentes', count: 2, attention: true },
    { id: 'confirmed', label: 'Confirmados', count: 5 },
    { id: 'past', label: 'Realizados' },
  ];
  protected readonly activeFilters = signal<readonly string[]>(['all']);
  protected readonly filterSummary = computed(() =>
    this.activeFilters()
      .map((id) => this.filters.find((filter) => filter.id === id)?.label ?? id)
      .join(', '),
  );

  protected readonly menuActions: readonly OrgMenuAction[] = [
    { id: 'duplicate', label: 'Duplicar evento' },
    { id: 'print', label: 'Imprimir lista' },
    { id: 'archive', label: 'Arquivar', disabled: true },
  ];
  protected readonly lastAction = signal<string | null>(null);

  protected readonly sections: readonly OrgNavigationItem[] = [
    { id: 'details', label: 'Detalhes do evento' },
    { id: 'items', label: 'Lista de itens' },
    { id: 'guests', label: 'Convidados' },
    { id: 'collaborators', label: 'Quem organiza junto', disabled: true },
  ];
  protected readonly activeSection = signal<string | null>('items');

  protected readonly navItems: readonly OrgNavBarItem[] = [
    { route: '/', label: 'Início', icon: 'home', testId: 'ds-nav-home', exact: true },
    { route: '/meus-eventos', label: 'Meus eventos', icon: 'event', testId: 'ds-nav-events' },
    { route: '/perfil', label: 'Perfil', icon: 'person', testId: 'ds-nav-profile' },
  ];

  protected readonly headerNavItems = this.navItems.slice(0, 2);

  protected readonly notifications: readonly OrgNotificationItem[] = [
    {
      key: 'invite',
      icon: 'mail',
      person: { name: 'Jéssica', photo: null },
      title: 'Jéssica convidou você',
      body: 'Arraiá no jardim · sáb., 24 de junho',
      pinned: true,
    },
    {
      key: 'item',
      icon: 'checklist',
      title: 'Ana vai levar o bolo de milho',
      body: 'Faltam 2 itens na lista.',
    },
    {
      key: 'santa',
      icon: 'redeem',
      title: 'O amigo oculto foi sorteado',
      body: 'Toque para ver quem você tirou.',
      unread: false,
    },
  ];
  protected readonly openedNotification = signal<string | null>(null);

  protected readonly stepIndex = signal(0);
}
