import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { noticeBodyNow } from '../../../core/utils';
import type { AppNotification } from '../../../core/models';
import { OrgButtonComponent, OrgIconButtonComponent, OrgIconComponent } from '../../ui';

/**
 * An in-app notification, e.g. "Sorteio do amigo oculto feito! … Ver quem eu tirei": at the
 * top of Início while it is new, and on the event page it belongs to. With `readNote`, once read
 * it says so instead of offering the action again.
 */
@Component({
  selector: 'app-notification-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [OrgButtonComponent, OrgIconButtonComponent, OrgIconComponent],
  templateUrl: './notification-card.component.html',
  styleUrl: './notification-card.component.scss',
})
export class NotificationCardComponent {
  public readonly notification = input.required<AppNotification>();
  /** Shows the dismiss ✕ (Início); the event page keeps the card. */
  public readonly dismissible = input(true);
  /** Text shown instead of the action once the notification was read. */
  public readonly readNote = input('');
  public readonly opened = output<AppNotification>();
  public readonly dismissed = output<AppNotification>();
  /** The notice's text, with older amigo oculto notices read as they should say now. */
  protected readonly body = computed(() => noticeBodyNow(this.notification()));
}
