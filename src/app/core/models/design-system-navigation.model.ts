export interface DesignSystemNavigationItem {
  readonly id: string;
  readonly label: string;
  readonly icon: string;
}

export interface DesignSystemNavigationGroup {
  readonly id: string;
  readonly label: string;
  readonly items: readonly DesignSystemNavigationItem[];
}

export const DESIGN_SYSTEM_NAVIGATION_GROUPS: readonly DesignSystemNavigationGroup[] = [
  {
    id: 'brand',
    label: 'Marca',
    items: [
      { id: 'overview', label: 'Visão geral', icon: 'auto_awesome' },
      { id: 'colors', label: 'Cores', icon: 'palette' },
      { id: 'typography', label: 'Tipografia', icon: 'text_fields' },
      { id: 'iconography', label: 'Iconografia', icon: 'category' },
      { id: 'seasonal-themes', label: 'Temas sazonais', icon: 'celebration' },
    ],
  },
  {
    id: 'foundations',
    label: 'Fundações',
    items: [
      { id: 'tokens', label: 'Tokens', icon: 'tune' },
      { id: 'spacing', label: 'Espaçamento e dimensões', icon: 'straighten' },
      { id: 'foundations', label: 'Fundamentos', icon: 'layers' },
    ],
  },
  {
    id: 'product',
    label: 'Produto',
    items: [
      { id: 'components', label: 'Componentes', icon: 'widgets' },
      { id: 'buttons', label: 'Botões e ações', icon: 'ads_click' },
      { id: 'inputs', label: 'Campos', icon: 'edit_note' },
      { id: 'selection', label: 'Seleção', icon: 'check_circle' },
      { id: 'navigation', label: 'Navegação', icon: 'tab' },
      { id: 'stepper', label: 'Etapas', icon: 'format_list_numbered' },
      { id: 'data-display', label: 'Dados e cards', icon: 'view_agenda' },
      { id: 'feedback', label: 'Feedback', icon: 'notifications' },
    ],
  },
] as const;

export const DESIGN_SYSTEM_SECTIONS: readonly DesignSystemNavigationItem[] =
  DESIGN_SYSTEM_NAVIGATION_GROUPS.flatMap((group) => group.items);
