import type { DesignSystemNavigationItem } from './design-system-navigation-item.model';

export interface DesignSystemNavigationGroup {
  readonly id: string;
  readonly label: string;
  readonly items: readonly DesignSystemNavigationItem[];
}
