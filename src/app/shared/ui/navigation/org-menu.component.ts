import { ChangeDetectionStrategy, Component, ViewEncapsulation, input, output } from '@angular/core';
import { MatMenuModule } from '@angular/material/menu';

export interface OrgMenuAction {
  readonly id: string;
  readonly label: string;
  readonly disabled?: boolean;
}

@Component({
  selector: 'org-menu',
  standalone: true,
  imports: [MatMenuModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  templateUrl: './org-menu.component.html',
  styleUrl: './org-menu.component.scss',
})
export class OrgMenuComponent {
  public readonly triggerLabel = input.required<string>();
  public readonly actions = input<readonly OrgMenuAction[]>([]);
  public readonly actionSelected = output<string>();

  public select(action: OrgMenuAction): void {
    if (!action.disabled) {
      this.actionSelected.emit(action.id);
    }
  }
}
