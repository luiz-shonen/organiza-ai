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
} from '../../../../../shared/ui';
import { GiftOptionsListComponent } from '../../../../../shared/components/gift-options-field/gift-options-list.component';
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
    GiftOptionsListComponent,
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
  /**
   * The organizer looking at the list: offered "Participar também" while not in the draw, and
   * their own entry stays theirs to edit, with the name of their profile.
   */
  public readonly self = input<{ uid: string; name: string; phone: string } | null>(null);
  /**
   * `extras`: only "Quem não vai entrar pelo convite" and "Você também participa?", for their own
   * card beside the page on a computer; `list`: only the participants. `all` (default): both.
   */
  public readonly show = input<'all' | 'list' | 'extras'>('all');
  /** Those two blocks show on a phone only: on a computer they sit in their own card. */
  public readonly extrasPhoneOnly = input(false);
  public readonly add = output<SecretSantaParticipantInput>();
  public readonly update = output<SecretSantaParticipantUpdate>();
  public readonly remove = output<number>();
  /** One gift idea of a participant changed or taken out, right in the list; the page confirms. */
  public readonly editGift = output<{ participant: number; gift: number; text: string }>();
  public readonly removeGift = output<{ participant: number; gift: number }>();

  protected readonly minParticipants = SECRET_SANTA_MIN_PARTICIPANTS;
  protected readonly editingIndex = signal<number | null>(null);
  /** "Adicionar alguém à mão" opens the form in a drawer (a bottom sheet on a phone). */
  protected readonly manualOpen = signal(false);
  /** "Participar também": the same drawer, filled with the organizer's profile. */
  protected readonly joiningSelf = signal(false);
  /** The organizer's own entry in the list, if they are in the draw. */
  protected readonly selfIndex = computed(() => {
    const uid = this.self()?.uid;
    return uid ? this.participants().findIndex((p) => p.guestId === uid || p.joinedBy === uid) : -1;
  });
  protected readonly selfDraft = computed<SecretSantaParticipantInput | null>(() => {
    const self = this.self();
    return self ? { name: self.name, phone: self.phone, giftOptions: [], guestId: self.uid } : null;
  });
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

  protected isSelf(index: number): boolean {
    return index === this.selfIndex();
  }

  /** Saves the person typed by hand; the drawer closes once it worked. */
  protected readonly saveNewAndClose = async (
    participant: SecretSantaParticipantInput,
  ): Promise<boolean> => {
    const save = this.saveNew();
    const saved = save ? await save(participant) : (this.add.emit(participant), true);
    if (saved) {
      this.manualOpen.set(false);
      this.joiningSelf.set(false);
    }
    return saved;
  };

  protected closeManual(): void {
    this.manualOpen.set(false);
    this.joiningSelf.set(false);
  }

  protected saveEdit(participant: SecretSantaParticipantInput): void {
    const index = this.editingIndex();
    if (index === null) return;
    this.update.emit({ index, participant });
    this.editingIndex.set(null);
  }
}
