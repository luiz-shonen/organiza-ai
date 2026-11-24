import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { OrgButtonComponent } from '../../ui';

/**
 * Gift ideas to read, as the same cards the form shows while editing them, without the pencil
 * and the ✕: changing them happens in the form, from the pencil beside the person's name.
 * `collapsible`: folded behind "Ver 3 ideias de presente", so a long list of people stays short.
 */
@Component({
  selector: 'app-gift-options-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [OrgButtonComponent],
  template: `
    @if (collapsible()) {
      <org-button
        class="gift-list__toggle"
        variant="text"
        icon="redeem"
        testId="gift-options-list-toggle"
        [compact]="true"
        [gradient]="false"
        [ariaExpanded]="open()"
        [label]="toggleLabel()"
        (pressed)="open.set(!open())"
      />
    }
    @if (!collapsible() || open()) {
      <ol class="gift-list" [attr.aria-label]="label() || null">
        @for (gift of gifts(); track $index) {
          <li class="gift-list__item" data-testid="gift-options-list-item">
            <span class="gift-list__text">{{ gift }}</span>
          </li>
        }
      </ol>
    }
  `,
  styleUrl: './gift-options-list.component.scss',
})
export class GiftOptionsListComponent {
  public readonly gifts = input<readonly string[]>([]);
  public readonly label = input('');
  public readonly collapsible = input(false);
  protected readonly open = signal(false);
  protected readonly toggleLabel = computed(() => {
    const count = this.gifts().length;
    const ideas = count === 1 ? '1 ideia de presente' : `${count} ideias de presente`;
    return `${this.open() ? 'Esconder' : 'Ver'} ${ideas}`;
  });
}
