import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  viewChild,
} from '@angular/core';
import { MatChipEditedEvent, MatChipRow, MatChipsModule } from '@angular/material/chips';
import { OrgIconComponent } from './org-icon.component';

/**
 * A chip whose text is typed in place (Material editable chip). Empty, it shows
 * `placeholder` ("Personalizar"); a click, Enter or the pencil starts editing, and Enter
 * or leaving the chip commits. Escape, or committing nothing, keeps the previous value,
 * so an edit left half-way never wipes what was there. ✕ clears it.
 */
@Component({
  selector: 'org-editable-chip',
  standalone: true,
  imports: [MatChipsModule, OrgIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './org-editable-chip.component.html',
  styleUrl: './org-editable-chip.component.scss',
})
export class OrgEditableChipComponent {
  /** The committed text; null or '' shows the placeholder. */
  public readonly value = input<string | null>(null);
  public readonly placeholder = input.required<string>();
  /** Highlights the chip like a selected option (e.g. the category in use). */
  public readonly selected = input(false);
  /** Longer text is cut to this length when the edit is committed. */
  public readonly maxLength = input<number | null>(null);
  public readonly testId = input<string | null>(null);
  /** The trimmed text when an edit is committed with something in it. */
  public readonly valueChange = output<string>();
  /** The ✕ was pressed. */
  public readonly cleared = output<void>();

  private readonly chip = viewChild(MatChipRow);
  private cancelled = false;

  protected readonly hasValue = computed(() => !!this.value()?.trim());
  protected readonly label = computed(() => (this.hasValue() ? this.value()! : this.placeholder()));

  /** A first click on the empty chip opens it for typing, like a field would. */
  protected startOnClick(): void {
    if (!this.hasValue()) this.chip()?._edit();
  }

  protected cancel(): void {
    this.cancelled = true;
    // Blurring ends Material's edit; finish() then ignores the typed text.
    (document.activeElement as HTMLElement | null)?.blur();
  }

  protected finish(event: MatChipEditedEvent): void {
    const max = this.maxLength();
    const trimmed = event.value.trim();
    const text = (max ? trimmed.slice(0, max) : trimmed).trim();
    if (this.cancelled || !text || text === this.value()) {
      this.cancelled = false;
      return;
    }
    this.valueChange.emit(text);
  }
}
