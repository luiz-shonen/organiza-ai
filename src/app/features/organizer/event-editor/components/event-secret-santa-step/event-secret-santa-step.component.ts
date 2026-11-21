import { ChangeDetectionStrategy, Component, input, model, output } from '@angular/core';
import {
  SECRET_SANTA_DEFAULT_GIFT_OPTIONS,
  SECRET_SANTA_MAX_GIFT_OPTIONS,
} from '../../../../../core/models';
import {
  OrgButtonComponent,
  OrgCardHeaderComponent,
  OrgSurfaceComponent,
  OrgToggleComponent,
  OrgQuantityStepperComponent,
} from '../../../../../shared/ui';

export type {
  SecretSantaParticipantUpdate,
  SecretSantaSuggestion,
} from '../secret-santa-participants/secret-santa-participants.component';

/**
 * "Amigo oculto" step: whether the event has one and whether participants list gift options.
 * Who takes part is handled on the event page (`app-secret-santa-participants`): the guests join
 * from the invite, and the organizer adds anyone else by hand there.
 */
@Component({
  selector: 'app-event-secret-santa-step',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    OrgButtonComponent,
    OrgCardHeaderComponent,
    OrgSurfaceComponent,
    OrgToggleComponent,
    OrgQuantityStepperComponent,
  ],
  templateUrl: './event-secret-santa-step.component.html',
  styleUrls: ['../event-step.scss', './event-secret-santa-step.component.scss'],
})
export class EventSecretSantaStepComponent {
  public readonly enabled = model(false);
  public readonly giftOptions = model(false);
  /** How many gift options each participant may list. */
  public readonly maxGiftOptions = model(SECRET_SANTA_DEFAULT_GIFT_OPTIONS);
  protected readonly giftLimit = SECRET_SANTA_MAX_GIFT_OPTIONS;
  /** Only the owner turns the amigo oculto on or off. */
  public readonly canConfigure = input(true);
  public readonly back = output<void>();
  public readonly next = output<void>();
}
