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
import { GiftOption, PersonName, Phone } from '../../../../../core/value-objects';
import {
  OrgButtonComponent,
  OrgIconButtonComponent,
  OrgTextFieldComponent,
} from '../../../../../shared/ui';

/**
 * Name, phone and (when the event asks for them) gift options of one amigo oculto participant.
 * The "Amigo oculto" step uses it to add, and the edit sheet to change one.
 *
 * Gift options are a list of fields, one per option ("Opção 1", "Opção 2"…), so it is plain that
 * a person can suggest more than one; "Adicionar outra opção" (or Enter) opens the next field.
 */
@Component({
  selector: 'app-secret-santa-participant-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [OrgButtonComponent, OrgIconButtonComponent, OrgTextFieldComponent],
  templateUrl: './secret-santa-participant-form.component.html',
  styleUrls: ['../event-step.scss', './secret-santa-participant-form.component.scss'],
  host: { '(keydown.enter)': 'onEnter($event)' },
})
export class SecretSantaParticipantFormComponent {
  /** The participant being edited; null to add a new one. */
  public readonly participant = input<SecretSantaParticipantInput | null>(null);
  public readonly showGiftOptions = input(false);
  /** How many options the organizer allows per person (1 to 10). */
  public readonly maxGiftOptions = input(SECRET_SANTA_MAX_GIFT_OPTIONS);
  public readonly submitLabel = input('Adicionar participante');
  public readonly cancelLabel = input<string | null>(null);
  public readonly testIdPrefix = input('santa');
  public readonly submitted = output<SecretSantaParticipantInput>();
  public readonly cancelled = output<void>();

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  protected readonly name = signal('');
  protected readonly phone = signal('');
  /** One entry per gift field, empty ones included; always at least one field. */
  protected readonly gifts = signal<readonly string[]>(['']);
  private readonly guestId = signal<string | undefined>(undefined);

  protected readonly showErrors = signal(false);
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

  constructor() {
    effect(() => this.load(this.participant()));
  }

  /** The error of one gift field; an empty field is simply left out. */
  protected giftError(index: number): string {
    if (!this.showErrors()) return '';
    const raw = this.gifts()[index] ?? '';
    return raw.trim() ? (GiftOption.validate(raw) ?? '') : '';
  }

  protected setGift(index: number, value: string): void {
    this.gifts.update((list) => list.map((gift, i) => (i === index ? value : gift)));
  }

  /** Opens one more gift field and puts the cursor in it. */
  protected addGiftField(): void {
    if (this.giftsFull()) return;
    this.gifts.update((list) => [...list, '']);
    setTimeout(() => {
      const fields = this.host.nativeElement.querySelectorAll<HTMLInputElement>(
        '.santa-form__gift-field input',
      );
      fields[fields.length - 1]?.focus();
    });
  }

  protected removeGift(index: number): void {
    this.gifts.update((list) => {
      const next = list.filter((_, i) => i !== index);
      return next.length ? next : [''];
    });
  }

  /** Enter in a gift field opens the next one instead of submitting the participant. */
  protected onEnter(event: Event): void {
    const target = event.target as HTMLElement | null;
    if (!target?.closest('.santa-form__gift-field')) return;
    event.preventDefault();
    if (this.gifts().every((gift) => gift.trim())) this.addGiftField();
  }

  protected submit(): void {
    const name = PersonName.create(this.name());
    const phoneText = this.phone().trim();
    const phone = phoneText ? Phone.create(phoneText) : null;
    const typed = this.showGiftOptions() ? this.gifts().filter((gift) => gift.trim()) : [];
    const options = typed.map((gift) => GiftOption.create(gift));
    if (!name || (phoneText && !phone) || options.some((option) => !option)) {
      this.showErrors.set(true);
      return;
    }
    this.submitted.emit({
      name: name.value,
      phone: phone?.formatted ?? '',
      giftOptions: options.flatMap((option) => (option ? [option.value] : [])),
      ...(this.guestId() ? { guestId: this.guestId() } : {}),
    });
    if (!this.participant()) this.load(null);
  }

  private load(participant: SecretSantaParticipantInput | null): void {
    this.name.set(participant?.name ?? '');
    this.phone.set(participant?.phone ?? '');
    const gifts = participant?.giftOptions ?? [];
    this.gifts.set(gifts.length ? [...gifts] : ['']);
    this.guestId.set(participant?.guestId);
    this.showErrors.set(false);
  }
}
