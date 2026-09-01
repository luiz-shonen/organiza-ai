import { ChangeDetectionStrategy, Component, computed, input, model, output } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';

export interface OrgTabItem {
  readonly id: string;
  readonly label: string;
  readonly content?: string;
  readonly disabled?: boolean;
}

@Component({
  selector: 'org-tabs',
  standalone: true,
  imports: [MatTabsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './org-tabs.component.html',
  styleUrl: './org-tabs.component.scss',
})
export class OrgTabsComponent {
  public readonly items = input<readonly OrgTabItem[]>([]);
  public readonly selectedId = model<string | null>(null);
  public readonly gradient = input(true);
  public readonly selectionChange = output<string>();
  protected readonly selectedIndex = computed(() =>
    Math.max(
      0,
      this.items().findIndex((item) => item.id === this.selectedId()),
    ),
  );

  public selectIndex(index: number): void {
    const item = this.items()[index];
    if (item && !item.disabled) {
      this.selectedId.set(item.id);
      this.selectionChange.emit(item.id);
    }
  }
}
