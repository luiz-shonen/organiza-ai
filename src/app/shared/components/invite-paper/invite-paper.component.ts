import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';

/**
 * A sheet of invitation paper: a double frame drawn with scrolled corners and a medallion on the
 * top and bottom rules, in the colours of an invite theme (`.org-invite--natal`…, see
 * `_invite-themes.scss`), light or dark with the app. Each time it appears it unfolds and its
 * frame draws itself in. Used by the invitation on the event page and by the amigo oculto reveal.
 *
 * What goes on it is projected, and takes the paper's lettering through these classes (styled
 * here, unscoped, so the projected content of any page can use them):
 * `invite-paper__eyebrow` (small capitals), `invite-paper__greeting` (handwritten, written in),
 * `invite-paper__lead`, `invite-paper__title` (engraved serif), `invite-paper__text`,
 * `invite-paper__signature` (handwritten) and `invite-paper__rise` (any line that rises in).
 * Each comes in at its own moment; a page moves one with `--invite-delay`.
 */
@Component({
  selector: 'app-invite-paper',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [NgTemplateOutlet],
  host: { '[class]': 'hostClass()' },
  templateUrl: './invite-paper.component.html',
  styleUrl: './invite-paper.component.scss',
})
export class InvitePaperComponent {
  /** The theme class, e.g. `org-invite--natal`. */
  public readonly themeClass = input.required<string>();

  protected readonly hostClass = computed(() => `invite-paper ${this.themeClass()}`);
  /** The four corners of the frame, each with the same flourish turned to face its corner. */
  protected readonly corners = ['top-start', 'top-end', 'bottom-start', 'bottom-end'] as const;
  protected readonly rules = ['top', 'bottom'] as const;
}

/** Two swashes drawn in, with a motif between them (✦, ★, ❦, ✿): a pause between lines. */
@Component({
  selector: 'app-invite-divider',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'invite-paper__divider', 'aria-hidden': 'true' },
  template: `
    <svg class="invite-paper__swash" viewBox="0 0 96 12" fill="none">
      <path
        class="invite-paper__draw invite-paper__draw--late"
        pathLength="1"
        d="M2 6C30 6 50 2 76 6C84 7 90 9 86 11"
      />
    </svg>
    <span class="invite-paper__motif">{{ motif() }}</span>
    <svg class="invite-paper__swash invite-paper__swash--end" viewBox="0 0 96 12" fill="none">
      <path
        class="invite-paper__draw invite-paper__draw--late"
        pathLength="1"
        d="M2 6C30 6 50 2 76 6C84 7 90 9 86 11"
      />
    </svg>
  `,
})
export class InviteDividerComponent {
  public readonly motif = input('✦');
}
