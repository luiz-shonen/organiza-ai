import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export interface OrgFilterOption<T extends string = string> {
  readonly id: T;
  readonly label: string;
  /** Optional counter; shown only when greater than zero. */
  readonly count?: number;
  /** Paints the counter in the attention colour (e.g. invitations waiting for an answer). */
  readonly attention?: boolean;
  readonly testId?: string;
}

/** Pill filters above a list. One option is always selected. */
@Component({
  selector: 'org-filter-bar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './org-filter-bar.component.html',
  styleUrl: './org-filter-bar.component.scss',
})
export class OrgFilterBarComponent {
  public readonly options = input<readonly OrgFilterOption[]>([]);
  public readonly value = input.required<string>();
  public readonly ariaLabel = input.required<string>();
  public readonly valueChange = output<string>();

  protected select(id: string): void {
    if (id !== this.value()) {
      this.valueChange.emit(id);
    }
  }
}
