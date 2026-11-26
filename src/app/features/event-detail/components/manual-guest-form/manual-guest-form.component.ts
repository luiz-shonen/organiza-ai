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
import type { ManualGuestInput } from '../../../../core/models';
import type { KnownPerson } from '../../../../core/utils/known-people.utils';
import { PersonName, Phone } from '../../../../core/value-objects';
import {
  OrgButtonComponent,
  OrgIconButtonComponent,
  OrgTextFieldComponent,
  revealFirstInvalidSoon,
  type OrgTextSuggestion,
} from '../../../../shared/ui';
import { MAX_COMPANIONS } from '../companion-selector/companion-selector.component';

/**
 * "Adicionar alguém à mão" in "Confirmados": the name, an optional WhatsApp and who comes along,
 * for someone the organizers put on the list without them answering the invite. Also edits them.
 * Typing a name offers the people added by hand before (`knownPeople`), with their phone.
 */
@Component({
  selector: 'app-manual-guest-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [OrgButtonComponent, OrgIconButtonComponent, OrgTextFieldComponent],
  templateUrl: './manual-guest-form.component.html',
  styleUrl: './manual-guest-form.component.scss',
})
export class ManualGuestFormComponent {
  /** The person being edited; null to add a new one. */
  readonly guest = input<ManualGuestInput | null>(null);
  readonly submitLabel = input('Adicionar à lista');
  /** Saves and resolves true when it worked; the form keeps what was typed when it fails. */
  readonly save = input.required<(guest: ManualGuestInput) => Promise<boolean>>();
  /** People added by hand before (no account), offered while typing the name. */
  readonly knownPeople = input<readonly KnownPerson[]>([]);
  readonly cancelled = output<void>();

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  protected readonly name = signal('');
  protected readonly phone = signal('');
  protected readonly companions = signal<readonly string[]>([]);
  /** The companion's name being typed, not added yet. */
  protected readonly companionName = signal('');
  protected readonly saving = signal(false);
  protected readonly showErrors = signal(false);
  private readonly companionTried = signal(false);

  protected readonly maskPhone = Phone.mask;
  protected readonly nameMaxLength = PersonName.MAX;
  protected readonly maxCompanions = MAX_COMPANIONS;
  protected readonly full = computed(() => this.companions().length >= MAX_COMPANIONS);

  protected readonly nameError = computed(() => {
    if (!this.showErrors()) return '';
    if (!this.name().trim()) return 'Informe o nome';
    return PersonName.validate(this.name()) ?? '';
  });
  protected readonly phoneError = computed(() =>
    this.showErrors() && this.phone().trim() ? (Phone.validate(this.phone()) ?? '') : '',
  );
  /** Offered under "Nome" (the field filters them by what is typed). */
  protected readonly nameSuggestions = computed<OrgTextSuggestion[]>(() =>
    this.knownPeople().map((person) => ({ label: person.name, detail: person.phone })),
  );
  protected readonly companionError = computed(() => {
    const typed = this.companionName().trim();
    if (!this.companionTried() || !typed) return '';
    if (this.companions().some((name) => name.toLowerCase() === typed.toLowerCase())) {
      return 'Essa pessoa já está na lista';
    }
    return PersonName.validate(typed) ?? '';
  });

  constructor() {
    effect(() => {
      const guest = this.guest();
      this.name.set(guest?.name ?? '');
      this.phone.set(guest?.phone ?? '');
      this.companions.set([...(guest?.companions ?? [])]);
      this.companionName.set('');
      this.showErrors.set(false);
      this.companionTried.set(false);
    });
  }

  /** A person added before was picked: their phone comes along when the field is still empty. */
  protected pickPerson(suggestion: OrgTextSuggestion): void {
    if (suggestion.detail && !this.phone().trim()) this.phone.set(suggestion.detail);
  }

  /** "Adicionar" beside the companion's name; true when nothing is left typed and invalid. */
  protected addCompanion(): boolean {
    const typed = this.companionName().trim();
    if (!typed) return true;
    this.companionTried.set(true);
    const name = PersonName.create(typed)?.value;
    if (!name || this.companionError() || this.full()) return false;
    this.companions.update((list) => [...list, name]);
    this.companionName.set('');
    this.companionTried.set(false);
    return true;
  }

  protected removeCompanion(index: number): void {
    this.companions.update((list) => list.filter((_, i) => i !== index));
  }

  protected async submit(): Promise<void> {
    if (this.saving()) return;
    // A companion typed but not added yet goes along.
    const companionOk = this.addCompanion();
    const name = PersonName.create(this.name());
    const phoneText = this.phone().trim();
    const phone = phoneText ? Phone.create(phoneText) : null;
    if (!name || (phoneText && !phone) || !companionOk) {
      this.showErrors.set(true);
      revealFirstInvalidSoon(this.host.nativeElement);
      return;
    }
    this.saving.set(true);
    try {
      await this.save()({
        name: name.value,
        phone: phone?.formatted ?? '',
        companions: [...this.companions()],
      });
    } finally {
      this.saving.set(false);
    }
  }
}
