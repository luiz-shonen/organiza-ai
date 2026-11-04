import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { A11yModule } from '@angular/cdk/a11y';

/**
 * Sheet that slides up from the bottom on phones and, on larger screens, opens as a
 * centred card or a side drawer (`placement`). The page owns the content and decides
 * when it is open.
 */
@Component({
  selector: 'org-bottom-sheet',
  standalone: true,
  imports: [A11yModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './org-bottom-sheet.component.html',
  styleUrl: './org-bottom-sheet.component.scss',
  host: { '(document:keydown.escape)': 'onEscape()' },
})
export class OrgBottomSheetComponent {
  public readonly open = input(false);
  public readonly ariaLabel = input.required<string>();
  public readonly testId = input<string | null>(null);
  /**
   * From tablet up: `center` opens a card in the middle (a quick choice, like "Eu levo");
   * `side` slides in a full-height drawer from the right, for editing. Phones always get
   * the bottom sheet.
   */
  public readonly placement = input<'center' | 'side'>('center');
  public readonly closed = output<void>();

  protected onEscape(): void {
    if (this.open()) {
      this.closed.emit();
    }
  }
}
