import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import { MatRadioModule } from '@angular/material/radio';

export interface OrgRadioOption {
  readonly label: string;
  readonly value: string;
  readonly disabled?: boolean;
}

@Component({
  selector: 'org-radio-group',
  standalone: true,
  imports: [MatRadioModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './org-radio-group.component.html',
  styleUrl: './org-radio-group.component.scss',
})
export class OrgRadioGroupComponent {
  public readonly label = input.required<string>();
  public readonly options = input<readonly OrgRadioOption[]>([]);
  public readonly value = model<string | null>(null);
  public readonly disabled = input(false);

  protected updateValue(value: string): void {
    if (!this.disabled()) {
      this.value.set(value);
    }
  }
}
