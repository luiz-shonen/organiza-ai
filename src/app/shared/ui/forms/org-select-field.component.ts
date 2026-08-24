import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';

export interface OrgSelectOption {
  readonly label: string;
  readonly value: string;
  readonly disabled?: boolean;
}

@Component({
  selector: 'org-select-field',
  standalone: true,
  imports: [MatFormFieldModule, MatSelectModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './org-select-field.component.html',
  styleUrl: './org-select-field.component.scss',
})
export class OrgSelectFieldComponent {
  public readonly label = input.required<string>();
  public readonly options = input<readonly OrgSelectOption[]>([]);
  public readonly value = model<string | null>(null);
  public readonly hint = input('');
  public readonly error = input('');
  public readonly disabled = input(false);
  public readonly required = input(false);

  protected updateValue(value: string): void {
    if (!this.disabled()) {
      this.value.set(value);
    }
  }
}
