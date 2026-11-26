import type { DesignSystemNavigationItem } from './design-system-navigation-item.model';
import type { DesignSystemNavigationGroup } from './design-system-navigation-group.model';

export * from './design-system-navigation-item.model';
export * from './design-system-navigation-group.model';

/** The /design-system index, shown in the navigation drawer; each id is a section anchor. */
export const DESIGN_SYSTEM_NAVIGATION_GROUPS: readonly DesignSystemNavigationGroup[] = [
  {
    id: 'foundations',
    label: 'Fundamentos',
    items: [
      { id: 'overview', label: 'Visão geral', icon: 'auto_awesome' },
      { id: 'colors', label: 'Cores', icon: 'palette' },
      { id: 'typography', label: 'Tipografia', icon: 'text_fields' },
      { id: 'spacing', label: 'Espaço e forma', icon: 'straighten' },
      { id: 'iconography', label: 'Ícones', icon: 'category' },
      { id: 'seasonal-themes', label: 'Temas', icon: 'dark_mode' },
    ],
  },
  {
    id: 'components',
    label: 'Componentes',
    items: [
      { id: 'layout', label: 'Página e cards', icon: 'view_agenda' },
      { id: 'buttons', label: 'Ações', icon: 'ads_click' },
      { id: 'inputs', label: 'Campos', icon: 'edit_note' },
      { id: 'selection', label: 'Seleção', icon: 'check_circle' },
      { id: 'navigation', label: 'Navegação', icon: 'tab' },
      { id: 'data-display', label: 'Dados', icon: 'insights' },
      { id: 'feedback', label: 'Feedback', icon: 'notifications' },
      { id: 'brand', label: 'Marca', icon: 'celebration' },
    ],
  },
] as const;

export const DESIGN_SYSTEM_SECTIONS: readonly DesignSystemNavigationItem[] =
  DESIGN_SYSTEM_NAVIGATION_GROUPS.flatMap((group) => group.items);
