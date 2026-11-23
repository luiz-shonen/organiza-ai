import { revealFirstInvalidSoon } from '../../../../../shared/ui';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import {
  SECRET_SANTA_MAX_GIFT_OPTIONS,
  type SecretSantaParticipantInput,
} from '../../../../../core/models';
import { type KnownPerson } from '../../../../../core/utils/known-people.utils';
import { PersonName, Phone } from '../../../../../core/value-objects';
import {
  OrgButtonComponent,
  OrgTextFieldComponent,
  type OrgTextSuggestion,
} from '../../../../../shared/ui';
import { GiftOptionsFieldComponent } from '../../../../../shared/components/gift-options-field/gift-options-field.component';

/**
 * Name, phone and (when the event asks for them) gift options of one amigo oculto participant.
 * The organizers add and edit people with it, and a guest edits their own entries.
 *
 * Typing a name offers the people the organizer already knows (`knownPeople`); picking one
 * brings their phone. Gift options are the shared one-at-a-time list (`app-gift-options-field`).
 */
@Component({
  selector: 'app-secret-santa-participant-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [OrgButtonComponent, OrgTextFieldComponent, GiftOptionsFieldComponent],
  templateUrl: './secret-santa-participant-form.component.html',
  styleUrls: ['../event-step.scss', './secret-santa-participant-form.component.scss'],
})
export class SecretSantaParticipantFormComponent {
  /** The participant being edited; null to add a new one. */
  public readonly participant = input<SecretSantaParticipantInput | null>(null);
  public readonly showGiftOptions = input(false);
  /** How many options the organizer allows per person (1 to 10). */
  public readonly maxGiftOptions = input(SECRET_SANTA_MAX_GIFT_OPTIONS);
  /** People to offer while typing the name; picking one fills in the phone. */
  public readonly knownPeople = input<readonly KnownPerson[]>([]);
  public readonly submitLabel = input('Adicionar participante');
  public readonly cancelLabel = input<string | null>(null);
  public readonly testIdPrefix = input('santa');
  /**
   * Saves the person and resolves true when it worked. Given, the form waits for it and keeps
   * what was typed when it fails; otherwise `submitted` is emitted and the form clears at once.
   */
  public readonly save = input<
    ((participant: SecretSantaParticipantInput) => Promise<boolean>) | null
  >(null);
  public readonly submitted = output<SecretSantaParticipantInput>();
  public readonly cancelled = output<void>();
  /** A save is running: the button waits. */
  protected readonly saving = signal(false);

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly giftsField = viewChild(GiftOptionsFieldComponent);

  protected readonly name = signal('');
  protected readonly phone = signal('');
  /** The ideas already added, in order. */
  protected readonly gifts = signal<readonly string[]>([]);
  private readonly guestId = signal<string | undefined>(undefined);

  protected readonly showErrors = signal(false);
  protected readonly maskPhone = Phone.mask;
  protected readonly nameMaxLength = PersonName.MAX;

  protected readonly nameError = computed(() => {
    if (!this.showErrors()) return '';
    if (!this.name().trim()) return 'Informe o nome';
    return PersonName.validate(this.name()) ?? '';
  });
  protected readonly phoneError = computed(() =>
    this.showErrors() ? (Phone.validate(this.phone()) ?? '') : '',
  );
  /** Known people offered under "Nome" (the field filters them by what is typed). */
  protected readonly nameSuggestions = computed<OrgTextSuggestion[]>(() =>
    this.knownPeople().map((person) => ({ label: person.name, detail: person.phone })),
  );

  constructor() {
    effect(() => this.load(this.participant()));
  }

  /** A known person was picked: their phone comes along when the field is still empty. */
  protected pickPerson(suggestion: OrgTextSuggestion): void {
    if (suggestion.detail && !this.phone().trim()) this.phone.set(suggestion.detail);
  }

  protected async submit(): Promise<void> {
    if (this.saving()) return;
    // An idea typed but not added yet, or being edited, goes with the participant.
    const giftsOk = this.showGiftOptions() ? (this.giftsField()?.commit(true) ?? true) : true;
    const name = PersonName.create(this.name());
    const phoneText = this.phone().trim();
    const phone = phoneText ? Phone.create(phoneText) : null;
    if (!name || (phoneText && !phone) || !giftsOk) {
      this.showErrors.set(true);
      revealFirstInvalidSoon(this.host.nativeElement);
      return;
    }
    const participant: SecretSantaParticipantInput = {
      name: name.value,
      phone: phone?.formatted ?? '',
      giftOptions: this.showGiftOptions() ? [...this.gifts()] : [],
      ...(this.guestId() ? { guestId: this.guestId() } : {}),
    };
    const save = this.save();
    if (save) {
      this.saving.set(true);
      const saved = await save(participant).finally(() => this.saving.set(false));
      if (saved && !this.participant()) this.load(null);
      return;
    }
    this.submitted.emit(participant);
    if (!this.participant()) this.load(null);
  }

  private load(participant: SecretSantaParticipantInput | null): void {
    this.name.set(participant?.name ?? '');
    this.phone.set(participant?.phone ?? '');
    this.gifts.set([...(participant?.giftOptions ?? [])]);
    this.giftsField()?.reset();
    this.guestId.set(participant?.guestId);
    this.showErrors.set(false);
  }
}
