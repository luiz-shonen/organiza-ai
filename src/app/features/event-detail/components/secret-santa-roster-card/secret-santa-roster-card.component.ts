import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { SecretSantaRosterEntry } from '../../../../core/models';
import {
  OrgCardHeaderComponent,
  OrgIconComponent,
  OrgSurfaceComponent,
} from '../../../../shared/ui';

/**
 * The amigo oculto as a guest sees it: who takes part and, when the event asks for them, each
 * one's gift ideas. Read only, no phones: managing it is the organizers' side of the page.
 */
@Component({
  selector: 'app-secret-santa-roster-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [OrgCardHeaderComponent, OrgIconComponent, OrgSurfaceComponent],
  templateUrl: './secret-santa-roster-card.component.html',
  styleUrl: './secret-santa-roster-card.component.scss',
})
export class SecretSantaRosterCardComponent {
  public readonly entries = input.required<readonly SecretSantaRosterEntry[]>();
  /** The event asks each participant for gift ideas. */
  public readonly giftOptions = input(false);

  protected readonly subheading = computed(() => {
    const count = this.entries().length;
    return count === 1 ? '1 pessoa no sorteio' : `${count} pessoas no sorteio`;
  });
}
