import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewEncapsulation,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';

/** The opening ends by 2 s; closing plays the same steps backwards from there. */
const OPENING_MS = 2000;
/** Not replayed on a tap: the envelope coming in, and the room it first opens into. */
const SKIPPED_ON_TAP = ['invite-letter-arrive', 'invite-letter-room'];

/**
 * An invitation that arrives in its envelope: the sealed envelope comes in, the seal breaks, the
 * flap opens and the letter (the projected `app-invite-paper`) rises out of it; then the paper
 * draws its frame and writes its words (`--invite-start` holds them back until it is out). The
 * opened envelope stays under the letter. With reduced motion it is shown already open.
 *
 * A tap (or Enter / Space) closes it: the letter goes back in, the flap closes, the seal returns,
 * the same steps played backwards. Another tap opens it again, words written in anew.
 *
 * Unscoped like `app-invite-paper`, so it can hold the paper's own entrance.
 */
@Component({
  selector: 'app-invite-letter',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    '[class]': 'hostClass()',
    role: 'button',
    tabindex: '0',
    '[attr.aria-expanded]': 'open()',
    '[attr.aria-label]': "open() ? 'Fechar o convite' : 'Abrir o convite'",
    '(click)': 'toggle()',
    '(keydown.enter)': 'toggle()',
    '(keydown.space)': '$event.preventDefault(); toggle()',
  },
  template: `
    <div class="invite-letter__paper">
      <div class="invite-letter__paper-inner"><ng-content /></div>
    </div>
    <div class="invite-letter__envelope" aria-hidden="true">
      <span class="invite-letter__back"></span>
      <span class="invite-letter__flap"></span>
      <span class="invite-letter__pocket"></span>
      <span class="invite-letter__seal">{{ initial() }}</span>
    </div>
  `,
  styleUrl: './invite-letter.component.scss',
})
export class InviteLetterComponent {
  /** The theme class, e.g. `org-invite--natal`: the envelope's colours. */
  public readonly themeClass = input.required<string>();
  /** The letter on the wax seal (the organizer's initial). */
  public readonly initial = input('✦');

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  protected readonly open = signal(true);
  protected readonly hostClass = computed(() => `invite-letter ${this.themeClass()}`);

  protected toggle(): void {
    const animations = this.host.nativeElement.getAnimations({ subtree: true });
    if (!animations.length) return; // reduced motion: nothing moves, it stays open
    // The room above the envelope is only for its first opening: once tapped, no blank space
    // above it, open or closed.
    animations
      .filter((animation) => (animation as CSSAnimation).animationName === 'invite-letter-room')
      .forEach((animation) => animation.cancel());
    // The envelope's own steps; it does not come in again.
    const letter = animations.filter((animation) => {
      const name = (animation as CSSAnimation).animationName ?? '';
      return name.startsWith('invite-letter-') && !SKIPPED_ON_TAP.includes(name);
    });
    if (this.open()) {
      // Backwards from the end of the opening: the last step (the letter rising) goes first.
      for (const animation of letter) {
        animation.currentTime = OPENING_MS;
        animation.playbackRate = -1;
        animation.play();
      }
    } else {
      // Forwards from the start, the paper's frame and words with it.
      for (const animation of animations) {
        if (SKIPPED_ON_TAP.includes((animation as CSSAnimation).animationName ?? '')) continue;
        animation.playbackRate = 1;
        animation.currentTime = 0;
        animation.play();
      }
    }
    this.open.update((open) => !open);
  }
}
