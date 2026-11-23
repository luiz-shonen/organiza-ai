import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import {
  SECRET_SANTA_DEFAULT_GIFT_OPTIONS,
  type SecretSantaParticipant,
  type SecretSantaParticipantInput,
  type SecretSantaRosterEntry,
} from '../../../../core/models';
import {
  OrgBottomSheetComponent,
  OrgButtonComponent,
  OrgCardHeaderComponent,
  OrgIconButtonComponent,
  OrgIconComponent,
  OrgSurfaceComponent,
} from '../../../../shared/ui';
import { SecretSantaParticipantFormComponent } from '../../../organizer/event-editor/components/secret-santa-participant-form/secret-santa-participant-form.component';

/**
 * The amigo oculto as a guest sees it: who takes part and, when the event asks for them, each
 * one's gift ideas, no phones. The guest's own entries (`editableIds`) get a pencil that opens
 * the same form the organizers use, to change their name, phone and gift ideas right here.
 */
@Component({
  selector: 'app-secret-santa-roster-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    OrgBottomSheetComponent,
    OrgButtonComponent,
    OrgCardHeaderComponent,
    OrgIconButtonComponent,
    OrgIconComponent,
    OrgSurfaceComponent,
    SecretSantaParticipantFormComponent,
  ],
  templateUrl: './secret-santa-roster-card.component.html',
  styleUrl: './secret-santa-roster-card.component.scss',
})
export class SecretSantaRosterCardComponent {
  public readonly entries = input.required<readonly SecretSantaRosterEntry[]>();
  /** The event asks each participant for gift ideas, and how many. */
  public readonly giftOptions = input(false);
  public readonly maxGiftOptions = input(SECRET_SANTA_DEFAULT_GIFT_OPTIONS);
  /** The entries this guest put in the draw, editable while the sign-ups are open. */
  public readonly editableIds = input<readonly string[]>([]);
  /** A word for this guest under the title, e.g. while their presence waits for approval. */
  public readonly notice = input('');
  /** The guest may join and is not in yet: "Participar do amigo oculto" opens the form. */
  public readonly canJoin = input(false);
  public readonly join = output<void>();
  /** The entry being edited, loaded by the page; null keeps the sheet closed. */
  public readonly editing = input<SecretSantaParticipant | null>(null);
  /** Saves the edited entry; resolves true when it worked. */
  public readonly save = input<
    ((participant: SecretSantaParticipantInput) => Promise<boolean>) | null
  >(null);
  public readonly edit = output<string>();
  /** "Sair do amigo oculto" in the sheet, for an entry already in the draw. */
  public readonly leave = output<string>();
  public readonly cancelEdit = output<void>();

  protected readonly subheading = computed(() => {
    const count = this.entries().length;
    return count === 1 ? '1 pessoa no sorteio' : `${count} pessoas no sorteio`;
  });

  protected isEditable(id: string): boolean {
    return this.editableIds().includes(id);
  }
}
