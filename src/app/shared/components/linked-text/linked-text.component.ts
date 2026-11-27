import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { LinkPreviewService } from '../../../core/services';
import { splitLinks } from '../../../core/utils';

/**
 * Free text someone typed (a gift idea), with its links clickable. A link never opens at once:
 * the app's "Abrir link externo?" sheet first shows what it leads to (picture, title, price, the
 * real site) and whether Google lists it as dangerous, since anyone in the event may have typed it.
 */
@Component({
  selector: 'app-linked-text',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `@for (part of parts(); track $index) {
    @if (part.url) {
      <a
        class="linked-text__link"
        data-testid="linked-text-link"
        target="_blank"
        rel="noopener noreferrer nofollow"
        [href]="part.url"
        (click)="open($event, part.url)"
        >{{ part.text }}</a
      >
    } @else {
      {{ part.text }}
    }
  }`,
  styleUrl: './linked-text.component.scss',
})
export class LinkedTextComponent {
  private readonly links = inject(LinkPreviewService);

  public readonly text = input('');
  protected readonly parts = computed(() => splitLinks(this.text()));

  protected open(event: MouseEvent, url: string): void {
    event.preventDefault();
    void this.links.open(url);
  }
}
