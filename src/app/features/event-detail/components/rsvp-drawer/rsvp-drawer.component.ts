import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  output,
  signal,
  viewChildren,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { FamilyMember, type RsvpSecretSantaKey } from '../../../../core/models';
import { isPet } from '../../../../core/utils';
import {
  Phone,
  fieldError,
  requiredText,
  valueObjectValidator,
} from '../../../../core/value-objects';
import { GiftOptionsFieldComponent } from '../../../../shared/components/gift-options-field/gift-options-field.component';
import { CompanionSelectorComponent } from '../companion-selector/companion-selector.component';
import {
  FamilySelectorComponent,
  type InlineFamilyMemberPayload,
  type UpdateInlineFamilyMemberPayload,
} from '../family-selector/family-selector.component';
import type { RsvpDrawerRequestData, RsvpDrawerResult } from '../../../../core/models';
import {
  OrgButtonComponent,
  OrgCheckboxComponent,
  OrgIconButtonComponent,
  OrgTextFieldComponent,
  revealFirstInvalidSoon,
} from '../../../../shared/ui';

/** One person the guest can put in the amigo oculto: themself, a relative or a companion. */
export interface RsvpSantaPerson {
  readonly key: RsvpSecretSantaKey;
  readonly name: string;
  readonly label: string;
}

export type RsvpDrawerData = RsvpDrawerRequestData;

@Component({
  selector: 'app-rsvp-drawer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    CompanionSelectorComponent,
    FamilySelectorComponent,
    OrgButtonComponent,
    OrgCheckboxComponent,
    OrgIconButtonComponent,
    OrgTextFieldComponent,
    GiftOptionsFieldComponent,
  ],
  templateUrl: './rsvp-drawer.component.html',
  styleUrl: './rsvp-drawer.component.scss',
})
export class RsvpDrawerComponent {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly fb = inject(FormBuilder);

  readonly drawerData = input<RsvpDrawerData>({ session: null, familyMembers: [], userId: '' });
  readonly submitted = output<RsvpDrawerResult>();
  readonly closed = output<void>();

  readonly familyMembers = signal<FamilyMember[]>([]);
  readonly selectedFamilyMemberIds = signal<string[]>([]);
  readonly isAddingInline = signal<boolean>(false);

  protected readonly fieldError = fieldError;
  protected readonly maskPhone = Phone.mask;
  /** Digits only, at most two: the count goes from 0 to 10. */

  protected readonly form = this.fb.nonNullable.group({
    phone: ['', [requiredText, valueObjectValidator(Phone.validate)]],
  });

  /** Companions from the guest's history, plus any added in this drawer. */
  readonly companionNames = signal<string[]>([]);
  readonly selectedCompanions = signal<string[]>([]);

  /** The presence is already confirmed: the drawer edits it. */
  protected readonly editing = computed(() => !!this.drawerData().existing);
  /** The name comes from the profile; it is changed there, not here. */
  protected readonly guestName = computed(() => this.drawerData().session?.name ?? '');

  /** "Quem vai participar do amigo oculto?": who is checked, and each one's gift options. */
  // Asked when confirming the first time; afterwards the invite's own "Amigo oculto" card is
  // where the guest edits their ideas or leaves, so "Editar presença" leaves it out.
  protected readonly santa = computed(() =>
    this.editing() ? null : (this.drawerData().secretSanta ?? null),
  );
  protected readonly santaChecked = signal<readonly RsvpSecretSantaKey[]>([]);
  protected readonly santaGifts = signal<Readonly<Record<RsvpSecretSantaKey, readonly string[]>>>(
    {},
  );
  /** One list of gift ideas per person in the draw, checked before saving. */
  private readonly giftFields = viewChildren(GiftOptionsFieldComponent);
  /** A relative's or companion's own WhatsApp, for their link; empty, it goes to the guest's. */
  protected readonly santaPhones = signal<Readonly<Record<RsvpSecretSantaKey, string>>>({});
  private readonly santaPhonesError = signal(false);
  /** The guest, then the relatives and companions checked above: only who is going, no pets. */
  protected readonly santaPeople = computed<RsvpSantaPerson[]>(() => {
    const name = this.guestName();
    return [
      { key: 'self', name, label: name ? `Você (${name})` : 'Você' },
      ...this.familyMembers()
        .filter(
          (member) =>
            this.selectedFamilyMemberIds().includes(member.id) && !isPet(member.relationship),
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
      const data = this.drawerData();
      this.familyMembers.set(data.familyMembers ?? []);
      this.form.patchValue({ phone: data.session?.phone ?? '' });
      const known = [...(data.savedCompanions ?? []), ...(data.existing?.companions ?? [])];
      this.companionNames.set([...new Set(known)]);

      const existing = data.existing;
      if (existing) {
        const known = new Set((data.familyMembers ?? []).map((member) => member.id));
        this.selectedFamilyMemberIds.set(existing.familyMemberIds.filter((id) => known.has(id)));
        this.selectedCompanions.set([...existing.companions]);
      }

      const joined = data.secretSanta?.joined ?? {};
      this.santaChecked.set(Object.keys(joined));
      this.santaGifts.set({ ...joined });
      // Typed before, else the relative's phone in the family profile.
      const profilePhones = Object.fromEntries(
        (data.familyMembers ?? [])
          .filter((member) => member.phone)
          .map((member) => [`f:${member.id}`, Phone.mask(member.phone ?? '')]),
      );
      this.santaPhones.set({ ...profilePhones, ...(data.secretSanta?.phones ?? {}) });
    });
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

  /** A number typed but not a phone; empty is fine (the link goes to the guest). */
  protected santaPhoneError(key: RsvpSecretSantaKey): string {
    if (!this.santaPhonesError()) return '';
    const typed = (this.santaPhones()[key] ?? '').trim();
    return typed && !Phone.create(typed) ? 'Telefone inválido: confira o DDD e o número.' : '';
  }

  /** The WhatsApp of the relatives and companions checked, formatted; empty ones left out. */
  private santaPhoneChoice(choice: Readonly<Record<RsvpSecretSantaKey, unknown>>) {
    return Object.fromEntries(
      Object.keys(choice)
        .filter((key) => key !== 'self')
        .map((key) => [key, Phone.create(this.santaPhones()[key] ?? '')?.formatted ?? ''] as const)
        .filter(([, phone]) => phone),
    );
  }

  protected santaGiftLabel(person: RsvpSantaPerson): string {
    const max = this.santa()?.maxGiftOptions ?? 1;
    const self = person.key === 'self';
    if (self) return max === 1 ? 'Sua opção de presente' : 'Suas opções de presente';
    return `${max === 1 ? 'Opção de presente' : 'Opções de presente'} de ${person.name}`;
  }

  /** Who is in the draw, among the people still going; null when the drawer does not ask. */
  private santaChoice(): Record<RsvpSecretSantaKey, string[]> | null {
    const santa = this.santa();
    if (!santa?.open) return null;
    const going = new Set(this.santaPeople().map((person) => person.key));
    return Object.fromEntries(
      this.santaChecked()
        .filter((key) => going.has(key))
        .map((key) => [key, santa.giftOptions ? [...(this.santaGifts()[key] ?? [])] : []]),
    );
  }

  protected onToggleCompanion(name: string): void {
    this.selectedCompanions.update((current) =>
      current.includes(name) ? current.filter((n) => n !== name) : [...current, name],
    );
  }

  /** A new name joins the list and is selected; the page saves it to the history on confirm. */
  protected onAddCompanion(name: string): void {
    this.companionNames.update((names) => [...names, name]);
    this.selectedCompanions.update((current) => [...current, name]);
  }

  protected onToggleFamilyMember(memberId: string): void {
    this.selectedFamilyMemberIds.update((current) =>
      current.includes(memberId) ? current.filter((id) => id !== memberId) : [...current, memberId],
    );
  }

  protected onSelectAllFamily(selectAll: boolean): void {
    this.selectedFamilyMemberIds.set(
      selectAll ? this.familyMembers().map((member) => member.id) : [],
    );
  }

  /** Saved to the profile right away and selected; the drawer stays open until "Confirmar". */
  protected async onAddInlineFamilyMember(payload: InlineFamilyMemberPayload): Promise<void> {
    const save = this.drawerData().addFamilyMember;
    if (!save) return;
    this.isAddingInline.set(true);
    try {
      const member = await save({
        name: payload.name,
        relationship: payload.relationship,
        phone: payload.phone ?? '',
      });
      this.familyMembers.update((members) => [...members, member]);
      this.selectedFamilyMemberIds.update((ids) => [...ids, member.id]);
    } catch {
      // The page tells the user; what was typed in the RSVP itself stays.
    } finally {
      this.isAddingInline.set(false);
    }
  }

  /** Saved to the profile right away; the drawer shows the new name and kinship. */
  protected async onUpdateFamilyMember(payload: UpdateInlineFamilyMemberPayload): Promise<void> {
    const save = this.drawerData().updateFamilyMember;
    if (!save) return;
    this.isAddingInline.set(true);
    try {
      const { id, ...changes } = payload;
      const changed = { ...changes, phone: changes.phone ?? '' };
      await save(id, changed);
      this.familyMembers.update((members) =>
        members.map((member) => (member.id === id ? { ...member, ...changed } : member)),
      );
    } catch {
      // The page tells the user; the relative stays as it was.
    } finally {
      this.isAddingInline.set(false);
    }
  }

  /** Removed from the profile after the page confirms it; no longer ticked here either. */
  protected async onRemoveFamilyMember(memberId: string): Promise<void> {
    const remove = this.drawerData().removeFamilyMember;
    if (!remove) return;
    this.isAddingInline.set(true);
    try {
      if (!(await remove(memberId))) return;
      this.familyMembers.update((members) => members.filter((member) => member.id !== memberId));
      this.selectedFamilyMemberIds.update((ids) => ids.filter((id) => id !== memberId));
    } catch {
      // The page tells the user; the relative stays.
    } finally {
      this.isAddingInline.set(false);
    }
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      revealFirstInvalidSoon(this.host.nativeElement);
      return;
    }
    // With gift options on, everyone in the draw names at least one; an idea still typed joins
    // their list. Every list is checked, so each shows its own error.
    const giftsOk = this.giftFields()
      .map((field) => field.commit(true))
      .every(Boolean);
    if (!giftsOk) {
      revealFirstInvalidSoon(this.host.nativeElement);
      return;
    }
    const santa = this.santaChoice();
    const badPhone = Object.keys(santa ?? {}).some((key) => {
      const typed = (this.santaPhones()[key] ?? '').trim();
      return key !== 'self' && typed && !Phone.create(typed);
    });
    if (badPhone) {
      this.santaPhonesError.set(true);
      revealFirstInvalidSoon(this.host.nativeElement);
      return;
    }

    const raw = this.form.getRawValue();
    const result: RsvpDrawerResult = {
      name: this.drawerData().session?.name ?? '',
      phone: Phone.create(raw.phone)?.formatted ?? raw.phone.trim(),
      companions: this.selectedCompanions().map((name) => ({ name })),
      selectedFamilyMembers: this.familyMembers().filter((member) =>
        this.selectedFamilyMemberIds().includes(member.id),
      ),
      ...(santa ? { secretSanta: santa, secretSantaPhones: this.santaPhoneChoice(santa) } : {}),
    };
    this.submitted.emit(result);
  }

  protected closeDrawer(): void {
    this.closed.emit();
  }
}
