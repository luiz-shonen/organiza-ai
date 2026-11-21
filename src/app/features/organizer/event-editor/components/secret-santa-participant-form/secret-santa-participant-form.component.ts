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
} from '@angular/core';
import {
  SECRET_SANTA_MAX_GIFT_OPTIONS,
  type SecretSantaParticipantInput,
} from '../../../../../core/models';
import { type KnownPerson } from '../../../../../core/utils/known-people.utils';
import { GiftOption, PersonName, Phone } from '../../../../../core/value-objects';
import {
  OrgButtonComponent,
  OrgIconButtonComponent,
  OrgTextFieldComponent,
  type OrgTextSuggestion,
} from '../../../../../shared/ui';

/**
 * Name, phone and (when the event asks for them) gift options of one amigo oculto participant.
 * The "Amigo oculto" step uses it to add, and the edit sheet to change one.
 *
 * Typing a name offers the people the organizer already knows (`knownPeople`); picking one
 * brings their phone. Gift options are a short list: one field with "+" (or Enter) adds each
 * idea under it, where it can be removed, as wish lists in gift-exchange apps do.
 */
@Component({
  selector: 'app-secret-santa-participant-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [OrgButtonComponent, OrgIconButtonComponent, OrgTextFieldComponent],
  templateUrl: './secret-santa-participant-form.component.html',
  styleUrls: ['../event-step.scss', './secret-santa-participant-form.component.scss'],
  host: { '(keydown.enter)': 'onEnter($event)', '(keydown.escape)': 'onEscape($event)' },
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

  protected readonly name = signal('');
  protected readonly phone = signal('');
  /** The ideas already added, in order. */
  protected readonly gifts = signal<readonly string[]>([]);
  /** The idea being edited in place (its index), and its text while typed. */
  protected readonly editingGift = signal<number | null>(null);
  protected readonly editingGiftText = signal('');
  protected readonly editingGiftError = signal('');
  /** The idea being typed in "Nova opção", not added yet. */
  protected readonly newGift = signal('');
  private readonly guestId = signal<string | undefined>(undefined);

  protected readonly showErrors = signal(false);
  protected readonly newGiftError = signal('');
  protected readonly maskPhone = Phone.mask;
  protected readonly nameMaxLength = PersonName.MAX;
  protected readonly giftMaxLength = GiftOption.RULES.max;

  protected readonly nameError = computed(() => {
    if (!this.showErrors()) return '';
    if (!this.name().trim()) return 'Informe o nome';
    return PersonName.validate(this.name()) ?? '';
  });
  protected readonly phoneError = computed(() =>
    this.showErrors() ? (Phone.validate(this.phone()) ?? '') : '',
  );
  protected readonly giftsFull = computed(() => this.gifts().length >= this.maxGiftOptions());
  /** "1 de 3" beside the title, while more than one is allowed. */
  protected readonly giftCount = computed(() =>
    this.maxGiftOptions() > 1 ? `${this.gifts().length} de ${this.maxGiftOptions()}` : '',
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

  /** Adds the typed idea to the list; an invalid one stays in the field with its error. */
  protected addGift(): boolean {
    const raw = this.newGift();
    if (!raw.trim() || this.giftsFull()) return true;
    const gift = GiftOption.create(raw);
    if (!gift) {
      this.newGiftError.set(GiftOption.validate(raw) ?? 'Opção inválida');
      return false;
    }
    this.gifts.update((list) => [...list, gift.value]);
    this.newGift.set('');
    this.newGiftError.set('');
    setTimeout(() =>
      this.host.nativeElement
        .querySelector<HTMLInputElement>('.santa-form__new-gift input')
        ?.focus(),
    );
    return true;
  }

  protected setNewGift(value: string): void {
    this.newGift.set(value);
    if (this.newGiftError()) this.newGiftError.set('');
  }

  protected removeGift(index: number): void {
    this.gifts.update((list) => list.filter((_, i) => i !== index));
    if (this.editingGift() === index) this.cancelGiftEdit();
  }

  /** Opens an idea already added for editing, in place, with the cursor in it. */
  protected editGift(index: number): void {
    this.editingGift.set(index);
    this.editingGiftText.set(this.gifts()[index] ?? '');
    this.editingGiftError.set('');
    setTimeout(() =>
      this.host.nativeElement
        .querySelector<HTMLInputElement>('.santa-form__gift-edit input')
        ?.focus(),
    );
  }

  protected setEditingGift(value: string): void {
    this.editingGiftText.set(value);
    if (this.editingGiftError()) this.editingGiftError.set('');
  }

  /** Keeps the edited idea; emptied, it is taken out. False when it is not valid. */
  protected saveGiftEdit(): boolean {
    const index = this.editingGift();
    if (index === null) return true;
    const raw = this.editingGiftText();
    if (!raw.trim()) {
      this.removeGift(index);
      return true;
    }
    const gift = GiftOption.create(raw);
    if (!gift) {
      this.editingGiftError.set(GiftOption.validate(raw) ?? 'Opção inválida');
      return false;
    }
    this.gifts.update((list) => list.map((current, i) => (i === index ? gift.value : current)));
    this.cancelGiftEdit();
    return true;
  }

  protected cancelGiftEdit(): void {
    this.editingGift.set(null);
    this.editingGiftText.set('');
    this.editingGiftError.set('');
  }

  /** Esc while editing an idea leaves it as it was. */
  protected onEscape(event: Event): void {
    const target = event.target as HTMLElement | null;
    if (!target?.closest('.santa-form__gift-edit')) return;
    event.preventDefault();
    this.cancelGiftEdit();
  }

  /** Enter in a gift field adds (or keeps the edit of) the idea, never the participant. */
  protected onEnter(event: Event): void {
    const target = event.target as HTMLElement | null;
    if (target?.closest('.santa-form__gift-edit')) {
      event.preventDefault();
      this.saveGiftEdit();
      return;
    }
    if (!target?.closest('.santa-form__new-gift')) return;
    event.preventDefault();
    this.addGift();
  }

  protected async submit(): Promise<void> {
    if (this.saving()) return;
    // An idea typed but not added yet, or being edited, goes with the participant.
    const pendingAdded = this.showGiftOptions() ? this.saveGiftEdit() && this.addGift() : true;
    const name = PersonName.create(this.name());
    const phoneText = this.phone().trim();
    const phone = phoneText ? Phone.create(phoneText) : null;
    if (!name || (phoneText && !phone) || !pendingAdded) {
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
    this.newGift.set('');
    this.newGiftError.set('');
    this.cancelGiftEdit();
    this.guestId.set(participant?.guestId);
    this.showErrors.set(false);
  }
}
