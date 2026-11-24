import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Gift ideas to read, as the same cards the form shows while editing them, without the pencil
 * and the ✕: changing them happens in the form, from the pencil beside the person's name.
 */
@Component({
  selector: 'app-gift-options-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ol class="gift-list" [attr.aria-label]="label() || null">
      @for (gift of gifts(); track $index) {
        <li class="gift-list__item" data-testid="gift-options-list-item">
          <span class="gift-list__text">{{ gift }}</span>
        </li>
      }
    </ol>
  `,
  styleUrl: './gift-options-list.component.scss',
})
export class GiftOptionsListComponent {
  public readonly gifts = input<readonly string[]>([]);
  public readonly label = input('');
}
