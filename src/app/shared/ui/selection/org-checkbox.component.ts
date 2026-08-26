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
  /** A short accessible label when projected content is not sufficient. */
  public readonly label = input('');
  public readonly ariaLabel = input<string | null>(null);
  public readonly checked = model(false);
  public readonly indeterminate = input(false);
  public readonly disabled = input(false);
  public readonly testId = input<string | null>(null);

  protected updateChecked(checked: boolean): void {
    if (!this.disabled()) {
      this.checked.set(checked);
    }
  }
}
