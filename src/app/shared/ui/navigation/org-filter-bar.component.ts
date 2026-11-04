import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MatChipsModule, type MatChipListboxChange } from '@angular/material/chips';

export interface OrgFilterOption<T extends string = string> {
  readonly id: T;
  readonly label: string;
  /** Optional counter; shown only when greater than zero. */
  readonly count?: number;
  /** Paints the counter in the attention colour (e.g. invitations waiting for an answer). */
  readonly attention?: boolean;
  readonly testId?: string;
}

/** The option that means "no filter"; the first one in the bar. */
export const ORG_FILTER_ALL = 'all';

/**
 * Filter chips above a list, on Material's chip listbox: the selected chips show a check, and
 * several can be on at once. "Todos" (`ORG_FILTER_ALL`) is on by default and on its own; picking
 * another chip turns it off, and turning the last one off (or picking "Todos") brings it back.
 */
@Component({
  selector: 'org-filter-bar',
  standalone: true,
  imports: [MatChipsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './org-filter-bar.component.html',
  styleUrl: './org-filter-bar.component.scss',
})
export class OrgFilterBarComponent {
  public readonly options = input<readonly OrgFilterOption[]>([]);
  /** The selected option ids; `['all']` when nothing is filtered. */
  public readonly values = input.required<readonly string[]>();
  public readonly ariaLabel = input.required<string>();
  public readonly valuesChange = output<string[]>();

  protected readonly selected = computed(() =>
    this.values().length ? [...this.values()] : [ORG_FILTER_ALL],
  );

  protected onChange(event: MatChipListboxChange): void {
    const picked = (event.value as string[] | null) ?? [];
    const before = this.selected();
    const allJustPicked = picked.includes(ORG_FILTER_ALL) && !before.includes(ORG_FILTER_ALL);
    const rest = picked.filter((id) => id !== ORG_FILTER_ALL);
    const next = allJustPicked || rest.length === 0 ? [ORG_FILTER_ALL] : rest;
    // Material already moved the chips; set them back to the rule above when it differs.
    if (next.join() !== picked.join()) event.source.value = next;
    if (next.join() !== before.join()) this.valuesChange.emit(next);
  }
}
