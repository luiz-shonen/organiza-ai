import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

@Component({
  selector: 'org-toggle',
  standalone: true,
  imports: [MatSlideToggleModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './org-toggle.component.html',
  styleUrl: './org-toggle.component.scss',
})
export class OrgToggleComponent {
  public readonly label = input.required<string>();
  public readonly checked = model(false);
  public readonly disabled = input(false);

  protected updateChecked(checked: boolean): void {
    if (!this.disabled()) {
      this.checked.set(checked);
    }
  }
}
