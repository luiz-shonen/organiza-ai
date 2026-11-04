import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { OrgIconComponent, OrgIconName } from '../actions/org-icon.component';

export interface OrgSegmentedOption<T extends string = string> {
  readonly value: T;
  readonly label: string;
  readonly icon?: OrgIconName;
  readonly testId?: string;
}

/** A few mutually exclusive choices shown side by side (Hick: three options at most is ideal). */
@Component({
  selector: 'org-segmented-control',
  standalone: true,
  imports: [MatButtonToggleModule, OrgIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './org-segmented-control.component.html',
  styleUrl: './org-segmented-control.component.scss',
})
export class OrgSegmentedControlComponent {
  public readonly options = input<readonly OrgSegmentedOption[]>([]);
  public readonly value = input<string | null>(null);
  public readonly ariaLabel = input.required<string>();
  public readonly valueChange = output<string>();

  protected select(value: string): void {
    if (value !== this.value()) {
      this.valueChange.emit(value);
    }
  }
}
