import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export interface OrgNavigationItem {
  readonly id: string;
  readonly label: string;
  readonly href: string;
  readonly disabled?: boolean;
}

@Component({
  selector: 'org-navigation-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './org-navigation-list.component.html',
  styleUrl: './org-navigation-list.component.scss',
})
export class OrgNavigationListComponent {
  public readonly items = input<readonly OrgNavigationItem[]>([]);
  public readonly activeId = input<string | null>(null);
  public readonly selected = output<string>();

  public select(id: string): void {
    this.selected.emit(id);
  }
}
