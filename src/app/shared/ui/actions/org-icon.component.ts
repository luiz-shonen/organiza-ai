import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

export type OrgIconName =
  | 'check_circle'
  | 'error'
  | 'info'
  | 'close'
  | 'cancel'
  | 'menu'
  | 'account_circle'
  | 'group_add'
  | 'how_to_reg'
  | 'share'
  | 'content_copy'
  | 'event'
  | 'place'
  | 'schedule'
  | 'delete'
  | 'edit'
  | 'add'
  | 'search'
  | 'mail'
  | 'phone'
  | 'palette'
  | 'dark_mode'
  | 'light_mode'
  | 'logout'
  | 'link'
  | 'block'
  | 'send'
  | 'arrow_back'
  | 'arrow_forward'
  | 'save'
  | 'download'
  | 'print'
  | 'add_circle'
  | 'delete_outline';

export type OrgIconSize = 'sm' | 'md' | 'lg';

export const ORG_ICON_MAP: Readonly<Record<OrgIconName, string>> = {
  check_circle: 'check_circle',
  error: 'error',
  info: 'info',
  close: 'close',
  cancel: 'cancel',
  menu: 'menu',
  account_circle: 'account_circle',
  group_add: 'group_add',
  how_to_reg: 'how_to_reg',
  share: 'share',
  content_copy: 'content_copy',
  event: 'event',
  place: 'place',
  schedule: 'schedule',
  delete: 'delete',
  edit: 'edit',
  add: 'add',
  search: 'search',
  mail: 'mail',
  phone: 'phone',
  palette: 'palette',
  dark_mode: 'dark_mode',
  light_mode: 'light_mode',
  logout: 'logout',
  link: 'link',
  block: 'block',
  send: 'send',
  arrow_back: 'arrow_back',
  arrow_forward: 'arrow_forward',
  save: 'save',
  download: 'download',
  print: 'print',
  add_circle: 'add_circle',
  delete_outline: 'delete_outline',
};

@Component({
  selector: 'org-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  templateUrl: './org-icon.component.html',
  styleUrl: './org-icon.component.scss',
})
export class OrgIconComponent {
  public readonly name = input.required<OrgIconName>();
  public readonly size = input<OrgIconSize>('md');
  public readonly color = input('var(--org-on-surface-variant)');
  protected readonly materialIcon = computed(() => ORG_ICON_MAP[this.name()]);
  protected readonly sizeToken = computed(() => ({ sm: '1rem', md: '1.25rem', lg: '1.5rem' })[this.size()]);
}
