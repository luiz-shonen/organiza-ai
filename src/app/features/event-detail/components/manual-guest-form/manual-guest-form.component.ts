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
  viewChildren,
} from '@angular/core';
import type {
  FamilyMember,
  ManualGuestInput,
  ManualGuestSantaEntry,
  RsvpSecretSantaKey,
} from '../../../../core/models';
import { isPet } from '../../../../core/utils';
import { PersonName, Phone } from '../../../../core/value-objects';
import { GiftOptionsFieldComponent } from '../../../../shared/components/gift-options-field/gift-options-field.component';
import {
  OrgButtonComponent,
  OrgCheckboxComponent,
  OrgTextFieldComponent,
  revealFirstInvalidSoon,
} from '../../../../shared/ui';
import { CompanionSelectorComponent } from '../companion-selector/companion-selector.component';
import {
  FamilySelectorComponent,
  type InlineFamilyMemberPayload,
  type UpdateInlineFamilyMemberPayload,
} from '../family-selector/family-selector.component';

/** The event's amigo oculto, when the organizer may still put people in it. */
export interface ManualGuestSantaSettings {
  readonly giftOptions: boolean;
  readonly maxGiftOptions: number;
  /** What the organizer wrote about it; null if nothing. */
  readonly rules: string | null;
}

/** One person who can go into the amigo oculto: the person added, a relative or a companion. */
interface SantaPerson {
  readonly key: RsvpSecretSantaKey;
  readonly name: string;
  readonly label: string;
}

/** Relatives typed here get a local id until saved; saved ones keep their guest entry's id. */
const NEW_RELATIVE = 'new-';

/**
 * "Adicionar alguém à mão" in "Confirmados", laid out like "Editar presença": the name, an
 * optional WhatsApp, "Levar familiares?" and "Levar acompanhantes?", and (when adding, with an
 * amigo oculto still open) who goes into the draw. The relatives live only on this event: the
 * person has no account, so no family profile. Also edits them.
 */
@Component({
  selector: 'app-manual-guest-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CompanionSelectorComponent,
    FamilySelectorComponent,
    GiftOptionsFieldComponent,
    OrgButtonComponent,
    OrgCheckboxComponent,
    OrgTextFieldComponent,
  ],
  templateUrl: './manual-guest-form.component.html',
  styleUrl: './manual-guest-form.component.scss',
})
export class ManualGuestFormComponent {
  /** The person being edited; null to add a new one. */
  readonly guest = input<ManualGuestInput | null>(null);
  readonly submitLabel = input('Adicionar à lista');
  /** The amigo oculto to offer when adding; null when the event has none or it is closed. */
  readonly secretSanta = input<ManualGuestSantaSettings | null>(null);
  /** Saves and resolves true when it worked; the form keeps what was typed when it fails. */
  readonly save = input.required<(guest: ManualGuestInput) => Promise<boolean>>();
  readonly cancelled = output<void>();

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  protected readonly name = signal('');
  protected readonly phone = signal('');
  protected readonly saving = signal(false);
  protected readonly showErrors = signal(false);

  /** "Levar familiares?": everyone typed here, and who of them is going. */
  protected readonly relatives = signal<FamilyMember[]>([]);
  protected readonly selectedRelativeIds = signal<string[]>([]);
  private nextRelative = 0;

  /** "Levar acompanhantes?": the names typed here, and who of them is going. */
  protected readonly companionNames = signal<string[]>([]);
  protected readonly selectedCompanions = signal<string[]>([]);

  protected readonly maskPhone = Phone.mask;
  protected readonly nameMaxLength = PersonName.MAX;

  protected readonly nameError = computed(() => {
    if (!this.showErrors()) return '';
    if (!this.name().trim()) return 'Informe o nome';
    return PersonName.validate(this.name()) ?? '';
  });
  protected readonly phoneError = computed(() =>
    this.showErrors() && this.phone().trim() ? (Phone.validate(this.phone()) ?? '') : '',
  );

  /** Asked only when adding, as at the first confirmation; editing leaves the draw alone. */
  protected readonly santa = computed(() => (this.guest() ? null : this.secretSanta()));
  protected readonly santaChecked = signal<readonly RsvpSecretSantaKey[]>([]);
  protected readonly santaGifts = signal<Readonly<Record<RsvpSecretSantaKey, readonly string[]>>>(
    {},
  );
  protected readonly santaPhones = signal<Readonly<Record<RsvpSecretSantaKey, string>>>({});
  private readonly santaPhonesError = signal(false);
  private readonly giftFields = viewChildren(GiftOptionsFieldComponent);

  /** The person added, then the relatives and companions going: only people, no pets. */
  protected readonly santaPeople = computed<SantaPerson[]>(() => {
    const name = this.name().trim();
    return [
      { key: 'self', name, label: name || 'Quem você está adicionando' },
      ...this.relatives()
        .filter(
          (member) => this.selectedRelativeIds().includes(member.id) && !isPet(member.relationship),
        )
        .map((member) => ({ key: `f:${member.id}`, name: member.name, label: member.name })),
      ...this.selectedCompanions().map((companion) => ({
        key: `c:${companion}`,
        name: companion,
        label: `${companion} (acompanhante)`,
      })),
    ];
  });

  constructor() {
    effect(() => {
      const guest = this.guest();
      this.name.set(guest?.name ?? '');
      this.phone.set(guest?.phone ?? '');
      const relatives = (guest?.relatives ?? []).map<FamilyMember>((relative) => ({
        id: relative.id ?? this.newRelativeId(),
        name: relative.name,
        relationship: relative.relationship,
        phone: relative.phone,
        createdAt: '',
      }));
      this.relatives.set(relatives);
      this.selectedRelativeIds.set(relatives.map((relative) => relative.id));
      this.companionNames.set([...(guest?.companions ?? [])]);
      this.selectedCompanions.set([...(guest?.companions ?? [])]);
      this.santaChecked.set([]);
      this.santaGifts.set({});
      this.santaPhones.set({});
      this.showErrors.set(false);
      this.santaPhonesError.set(false);
    });
  }

  private newRelativeId(): string {
    return `${NEW_RELATIVE}${this.nextRelative++}`;
  }

  protected onToggleRelative(id: string): void {
    this.selectedRelativeIds.update((ids) =>
      ids.includes(id) ? ids.filter((known) => known !== id) : [...ids, id],
    );
  }

  protected onSelectAllRelatives(all: boolean): void {
    this.selectedRelativeIds.set(all ? this.relatives().map((relative) => relative.id) : []);
  }

  /** A relative typed here joins the list, going; nothing is saved until the form is. */
  protected onAddRelative(payload: InlineFamilyMemberPayload): void {
    const relative: FamilyMember = {
      id: this.newRelativeId(),
      name: payload.name,
      relationship: payload.relationship,
      phone: Phone.create(payload.phone ?? '')?.formatted ?? '',
      createdAt: '',
    };
    this.relatives.update((list) => [...list, relative]);
    this.selectedRelativeIds.update((ids) => [...ids, relative.id]);
    if (relative.phone) this.setSantaPhone(`f:${relative.id}`, relative.phone);
  }

  protected onUpdateRelative({ id, ...changes }: UpdateInlineFamilyMemberPayload): void {
    const phone = Phone.create(changes.phone ?? '')?.formatted ?? '';
    this.relatives.update((list) =>
      list.map((relative) =>
        relative.id === id
          ? { ...relative, name: changes.name, relationship: changes.relationship, phone }
          : relative,
      ),
    );
  }

  protected onRemoveRelative(id: string): void {
    this.relatives.update((list) => list.filter((relative) => relative.id !== id));
    this.selectedRelativeIds.update((ids) => ids.filter((known) => known !== id));
  }

  protected onToggleCompanion(name: string): void {
    this.selectedCompanions.update((current) =>
      current.includes(name) ? current.filter((n) => n !== name) : [...current, name],
    );
  }

  protected onAddCompanion(name: string): void {
    this.companionNames.update((names) => [...names, name]);
    this.selectedCompanions.update((current) => [...current, name]);
  }

  protected isSantaChecked(key: RsvpSecretSantaKey): boolean {
    return this.santaChecked().includes(key);
  }

  protected setSantaChecked(key: RsvpSecretSantaKey, checked: boolean): void {
    this.santaChecked.update((keys) =>
      checked ? [...keys.filter((k) => k !== key), key] : keys.filter((k) => k !== key),
    );
  }

  protected setSantaGifts(key: RsvpSecretSantaKey, gifts: readonly string[]): void {
    this.santaGifts.update((all) => ({ ...all, [key]: gifts }));
  }

  protected setSantaPhone(key: RsvpSecretSantaKey, phone: string): void {
    this.santaPhones.update((all) => ({ ...all, [key]: phone }));
  }

  protected santaPhoneError(key: RsvpSecretSantaKey): string {
    if (!this.santaPhonesError()) return '';
    const typed = (this.santaPhones()[key] ?? '').trim();
    return typed && !Phone.create(typed) ? 'Telefone inválido: confira o DDD e o número.' : '';
  }

  /** Without a number of their own, the link goes to the WhatsApp of the person added. */
  protected santaPhoneHint(): string {
    const name = this.name().trim();
    return this.phone().trim() && name
      ? `Opcional: sem número, o link vai para o WhatsApp de ${name}.`
      : 'Opcional.';
  }

  protected santaGiftLabel(person: SantaPerson): string {
    const max = this.santa()?.maxGiftOptions ?? 1;
    const what = max === 1 ? 'Opção de presente' : 'Opções de presente';
    return person.name ? `${what} de ${person.name}` : what;
  }

  /** Who goes into the draw, among the people still going, with their link's WhatsApp. */
  private santaEntries(ownPhone: string): ManualGuestSantaEntry[] | undefined {
    const santa = this.santa();
    if (!santa) return undefined;
    const checked = new Set(this.santaChecked());
    return this.santaPeople()
      .filter((person) => checked.has(person.key))
      .map((person) => {
        const own =
          person.key === 'self'
            ? ownPhone
            : (Phone.create(this.santaPhones()[person.key] ?? '')?.formatted ?? '');
        return {
          name: person.key === 'self' ? '' : person.name,
          phone: own || ownPhone,
          giftOptions: santa.giftOptions ? [...(this.santaGifts()[person.key] ?? [])] : [],
        };
      });
  }

  protected async submit(): Promise<void> {
    if (this.saving()) return;
    const name = PersonName.create(this.name());
    const phoneText = this.phone().trim();
    const phone = phoneText ? Phone.create(phoneText) : null;
    if (!name || (phoneText && !phone)) {
      this.showErrors.set(true);
      revealFirstInvalidSoon(this.host.nativeElement);
      return;
    }
    // With gift options on, everyone in the draw names at least one; an idea still typed joins.
    const giftsOk = this.giftFields()
      .map((field) => field.commit(true))
      .every(Boolean);
    const going = new Set(this.santaPeople().map((person) => person.key));
    const badPhone = this.santaChecked().some((key) => {
      const typed = (this.santaPhones()[key] ?? '').trim();
      return key !== 'self' && going.has(key) && typed && !Phone.create(typed);
    });
    if (!giftsOk || badPhone) {
      this.santaPhonesError.set(badPhone);
      revealFirstInvalidSoon(this.host.nativeElement);
      return;
    }

    const ownPhone = phone?.formatted ?? '';
    const selected = new Set(this.selectedRelativeIds());
    const santa = this.santaEntries(ownPhone)?.map((entry) =>
      entry.name ? entry : { ...entry, name: name.value },
    );
    this.saving.set(true);
    try {
      await this.save()({
        name: name.value,
        phone: ownPhone,
        companions: [...this.selectedCompanions()],
        relatives: this.relatives()
          .filter((relative) => selected.has(relative.id))
          .map((relative) => ({
            ...(relative.id.startsWith(NEW_RELATIVE) ? {} : { id: relative.id }),
            name: relative.name,
            relationship: relative.relationship,
            phone: relative.phone ?? '',
          })),
        ...(santa ? { secretSanta: santa } : {}),
      });
    } finally {
      this.saving.set(false);
    }
  }
}
