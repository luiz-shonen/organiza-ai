import { ChangeDetectionStrategy, Component, input, model, output } from '@angular/core';
import {
  SECRET_SANTA_DEFAULT_GIFT_OPTIONS,
  SECRET_SANTA_MAX_GIFT_OPTIONS,
  SECRET_SANTA_RULES_MAX,
} from '../../../../../core/models';
import {
  OrgButtonComponent,
  OrgCardHeaderComponent,
  OrgDateFieldComponent,
  OrgSurfaceComponent,
  OrgToggleComponent,
  OrgQuantityStepperComponent,
  OrgTextareaFieldComponent,
} from '../../../../../shared/ui';

export type { SecretSantaParticipantUpdate } from '../secret-santa-participants/secret-santa-participants.component';

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
    OrgDateFieldComponent,
    OrgSurfaceComponent,
    OrgToggleComponent,
    OrgQuantityStepperComponent,
    OrgTextareaFieldComponent,
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
  /** The day of the draw: until then each guest joins or leaves on their own. Optional. */
  public readonly drawDate = model<Date | null>(null);
  /** "Regras do amigo oculto": the gift value, the rules, when gifts are swapped. */
  public readonly rules = model('');
  protected readonly rulesMax = SECRET_SANTA_RULES_MAX;
  protected readonly today = new Date();
  /** Only the owner turns the amigo oculto on or off. */
  public readonly canConfigure = input(true);
  public readonly back = output<void>();
  public readonly next = output<void>();
}
