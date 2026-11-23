import type { KnownPerson } from '../../../../../core/utils/known-people.utils';
import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import {
  SECRET_SANTA_DEFAULT_GIFT_OPTIONS,
  SECRET_SANTA_MIN_PARTICIPANTS,
  type SecretSantaParticipant,
  type SecretSantaParticipantInput,
} from '../../../../../core/models';
import {
  OrgBannerComponent,
  OrgBottomSheetComponent,
  OrgButtonComponent,
  OrgCardHeaderComponent,
  OrgIconButtonComponent,
  OrgIconComponent,
} from '../../../../../shared/ui';
import { SecretSantaParticipantFormComponent } from '../secret-santa-participant-form/secret-santa-participant-form.component';

/** One person in the list; `joinedBy` (or a confirmed guest's `guestId`) marks the invite. */
export type SecretSantaListedParticipant = SecretSantaParticipantInput &
  Pick<SecretSantaParticipant, 'joinedBy'>;

export interface SecretSantaParticipantUpdate {
  readonly index: number;
  readonly participant: SecretSantaParticipantInput;
}

/**
 * Who is in the amigo oculto, on the event page: the list, each one to edit or remove, and
 * "Adicionar alguém à mão" for whoever will not come in through the invite. Confirmed guests are
 * never added from here: they join from the invite, so their entry (and gift ideas) is theirs.
 */
@Component({
  selector: 'app-secret-santa-participants',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    OrgBannerComponent,
    OrgBottomSheetComponent,
    OrgButtonComponent,
    OrgCardHeaderComponent,
    OrgIconButtonComponent,
    OrgIconComponent,
    SecretSantaParticipantFormComponent,
  ],
  templateUrl: './secret-santa-participants.component.html',
  styleUrls: [
    '../event-step.scss',
    '../event-secret-santa-step/event-secret-santa-step.component.scss',
    './secret-santa-participants.component.scss',
  ],
})
export class SecretSantaParticipantsComponent {
  public readonly participants = input<readonly SecretSantaListedParticipant[]>([]);
  /** People from the organizer's other events and family, offered while typing a name. */
  public readonly knownPeople = input<readonly KnownPerson[]>([]);
  /** The event asks each participant for gift options, and how many. */
  public readonly giftOptions = input(false);
  public readonly maxGiftOptions = input(SECRET_SANTA_DEFAULT_GIFT_OPTIONS);
  /** The draw already happened: changing the list asks for a new one. */
  public readonly drawn = input(false);
  /**
   * Saves a person typed by hand; resolves true when added. With it, the form is cleared only on
   * success, so a failed save keeps what was typed. Without it, `add` is emitted.
   */
  public readonly saveNew = input<
    ((participant: SecretSantaParticipantInput) => Promise<boolean>) | null
  >(null);
  public readonly add = output<SecretSantaParticipantInput>();
  public readonly update = output<SecretSantaParticipantUpdate>();
  public readonly remove = output<number>();

  protected readonly minParticipants = SECRET_SANTA_MIN_PARTICIPANTS;
  protected readonly editingIndex = signal<number | null>(null);
  /** Rows whose gift ideas are unfolded. */
  private readonly expanded = signal<ReadonlySet<number>>(new Set());
  /** "Adicionar alguém à mão" opens the form in a drawer (a bottom sheet on a phone). */
  protected readonly manualOpen = signal(false);
  protected readonly editingParticipant = computed(() => {
    const index = this.editingIndex();
    return index === null ? null : (this.participants()[index] ?? null);
  });
  protected readonly missing = computed(() =>
    Math.max(0, SECRET_SANTA_MIN_PARTICIPANTS - this.participants().length),
  );

  /**
   * Entries tied to a guest (who joined from the invite, or was a confirmed guest) are that
   * person's: the organizers do not edit them, only take them out of the draw.
   */
  protected isFromInvite(participant: SecretSantaListedParticipant): boolean {
    return !!participant.joinedBy || !!participant.guestId;
  }

  /** Saves the person typed by hand; the drawer closes once it worked. */
  protected readonly saveNewAndClose = async (
    participant: SecretSantaParticipantInput,
  ): Promise<boolean> => {
    const save = this.saveNew();
    const saved = save ? await save(participant) : (this.add.emit(participant), true);
    if (saved) this.manualOpen.set(false);
    return saved;
  };

  protected isExpanded(index: number): boolean {
    return this.expanded().has(index);
  }

  protected toggleGifts(index: number): void {
    this.expanded.update((open) => {
      const next = new Set(open);
      if (!next.delete(index)) next.add(index);
      return next;
    });
  }

  protected saveEdit(participant: SecretSantaParticipantInput): void {
    const index = this.editingIndex();
    if (index === null) return;
    this.update.emit({ index, participant });
    this.editingIndex.set(null);
  }
}
