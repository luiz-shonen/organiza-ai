import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import { MatCheckboxModule } from '@angular/material/checkbox';

@Component({
  selector: 'org-checkbox',
  standalone: true,
  imports: [MatCheckboxModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './org-checkbox.component.html',
  styleUrl: './org-checkbox.component.scss',
})
export class OrgCheckboxComponent {
  public readonly label = input.required<string>();
  public readonly checked = model(false);
  public readonly indeterminate = input(false);
  public readonly disabled = input(false);

  protected updateChecked(checked: boolean): void {
    if (!this.disabled()) {
      this.checked.set(checked);
    }
  }
}
