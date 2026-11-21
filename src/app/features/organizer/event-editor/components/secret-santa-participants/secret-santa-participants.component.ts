import type { KnownPerson } from '../../../../../core/utils/known-people.utils';
import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import {
  SECRET_SANTA_DEFAULT_GIFT_OPTIONS,
  SECRET_SANTA_MIN_PARTICIPANTS,
  type SecretSantaParticipantInput,
} from '../../../../../core/models';
import {
  OrgBannerComponent,
  OrgBottomSheetComponent,
  OrgButtonComponent,
  OrgCardHeaderComponent,
  OrgIconButtonComponent,
} from '../../../../../shared/ui';
import { SecretSantaParticipantFormComponent } from '../secret-santa-participant-form/secret-santa-participant-form.component';

/** A confirmed guest who can be added to the amigo oculto with one tap. */
export interface SecretSantaSuggestion {
  readonly guestId: string;
  readonly name: string;
  readonly phone: string;
}

export interface SecretSantaParticipantUpdate {
  readonly index: number;
  readonly participant: SecretSantaParticipantInput;
}

/**
 * Who is in the amigo oculto, on the event page: confirmed guests to add with one tap, "Adicionar
 * alguém à mão" for whoever will not come in through the invite, and the list, each one to edit
 * or remove. The guests themselves join from the invite; this is the organizer's side.
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
  public readonly participants = input<readonly SecretSantaParticipantInput[]>([]);
  public readonly suggestions = input<readonly SecretSantaSuggestion[]>([]);
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
  public readonly addMany = output<readonly SecretSantaParticipantInput[]>();
  public readonly update = output<SecretSantaParticipantUpdate>();
  public readonly remove = output<number>();

  protected readonly minParticipants = SECRET_SANTA_MIN_PARTICIPANTS;
  protected readonly editingIndex = signal<number | null>(null);
  /** "Adicionar alguém à mão" opens the form; it stays open to add several in a row. */
  protected readonly manualOpen = signal(false);
  protected readonly editingParticipant = computed(() => {
    const index = this.editingIndex();
    return index === null ? null : (this.participants()[index] ?? null);
  });
  protected readonly missing = computed(() =>
    Math.max(0, SECRET_SANTA_MIN_PARTICIPANTS - this.participants().length),
  );

  protected summary(participant: SecretSantaParticipantInput): string {
    const parts: string[] = [];
    if (participant.phone) parts.push(participant.phone);
    if (this.giftOptions()) {
      const count = participant.giftOptions.length;
      parts.push(
        count === 0 ? 'Sem opções de presente' : count === 1 ? '1 opção' : `${count} opções`,
      );
    }
    return parts.join(' · ');
  }

  protected addSuggestion(suggestion: SecretSantaSuggestion): void {
    this.add.emit(this.fromSuggestion(suggestion));
  }

  protected addAllSuggestions(): void {
    this.addMany.emit(this.suggestions().map((s) => this.fromSuggestion(s)));
  }

  protected saveEdit(participant: SecretSantaParticipantInput): void {
    const index = this.editingIndex();
    if (index === null) return;
    this.update.emit({ index, participant });
    this.editingIndex.set(null);
  }

  private fromSuggestion(suggestion: SecretSantaSuggestion): SecretSantaParticipantInput {
    return {
      name: suggestion.name,
      phone: suggestion.phone,
      giftOptions: [],
      guestId: suggestion.guestId,
    };
  }
}
