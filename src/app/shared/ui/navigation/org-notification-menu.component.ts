import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  ViewEncapsulation,
} from '@angular/core';
import { MatMenuModule } from '@angular/material/menu';
import { OrgIconButtonComponent } from '../actions/org-icon-button.component';
import { OrgIconComponent, type OrgIconName } from '../actions/org-icon.component';
import { OrgAvatarComponent } from '../data-display/org-avatar.component';

/** One line in the notifications menu. */
export interface OrgNotificationItem {
  readonly key: string;
  readonly icon: OrgIconName;
  /** Someone's face for the line (who invites); the icon otherwise. */
  readonly person?: { readonly name: string; readonly photo: string | null } | null;
  readonly title: string;
  readonly body: string;
  /** Not seen yet: counted on the bell and marked in the list. Missing means new. */
  readonly unread?: boolean;
  /** Waiting for an answer: kept on top, under "Aguardando resposta", seen or not. */
  readonly pinned?: boolean;
}

/**
 * A bell button with the count of new notifications on its corner, opening a menu that lists
 * them. Presentational: the page says what is in it and what opening one does.
 */
@Component({
  selector: 'org-notification-menu',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatMenuModule, OrgAvatarComponent, OrgIconButtonComponent, OrgIconComponent],
  templateUrl: './org-notification-menu.component.html',
  styleUrl: './org-notification-menu.component.scss',
  // The menu opens in an overlay, outside this component; its rules are scoped by class names.
  encapsulation: ViewEncapsulation.None,
})
export class OrgNotificationMenuComponent {
  public readonly items = input<readonly OrgNotificationItem[]>([]);
  /** The menu was opened: a chance to refresh what it lists. */
  public readonly opened = output<void>();
  public readonly selected = output<OrgNotificationItem>();

  protected readonly count = computed(
    () => this.items().filter((item) => item.unread !== false).length,
  );
  protected readonly label = computed(() => {
    const count = this.count();
    if (!count) return 'Notificações';
    return count === 1 ? 'Notificações: 1 nova' : `Notificações: ${count} novas`;
  });
}
