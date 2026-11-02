import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type OrgAvatarSize = 'md' | 'lg';

/** Round avatar: the user's photo, or the first letter of their name on a neutral disc. */
@Component({
  selector: 'org-avatar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './org-avatar.component.html',
  styleUrl: './org-avatar.component.scss',
})
export class OrgAvatarComponent {
  public readonly name = input('');
  public readonly photoUrl = input<string | null>(null);
  public readonly size = input<OrgAvatarSize>('md');
  public readonly highlighted = input(false);

  protected readonly initial = computed(() => this.name().trim().charAt(0).toUpperCase() || '?');
}
