import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { FamilyMember, type RsvpSecretSantaKey } from '../../../../core/models';
import { parseGiftLines } from '../../../../core/utils';
import {
  GiftOption,
  Phone,
  fieldError,
  requiredText,
  valueObjectValidator,
} from '../../../../core/value-objects';
import { CompanionSelectorComponent } from '../companion-selector/companion-selector.component';
import {
  FamilySelectorComponent,
  type InlineFamilyMemberPayload,
} from '../family-selector/family-selector.component';
import type { RsvpDrawerRequestData, RsvpDrawerResult } from '../../../../core/models';
import {
  OrgButtonComponent,
  OrgCheckboxComponent,
  OrgIconButtonComponent,
  OrgTextFieldComponent,
  OrgTextareaFieldComponent,
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
    OrgTextareaFieldComponent,
  ],
  templateUrl: './rsvp-drawer.component.html',
  styleUrl: './rsvp-drawer.component.scss',
})
export class RsvpDrawerComponent {
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
  protected readonly santa = computed(() => this.drawerData().secretSanta ?? null);
  protected readonly santaChecked = signal<readonly RsvpSecretSantaKey[]>([]);
  protected readonly santaGifts = signal<Readonly<Record<RsvpSecretSantaKey, string>>>({});
  private readonly santaGiftsError = signal(false);
  protected readonly giftLineMax = GiftOption.RULES.max;
  /** The guest, then the relatives and companions checked above: only who is going. */
  protected readonly santaPeople = computed<RsvpSantaPerson[]>(() => {
    const name = this.guestName();
    return [
      { key: 'self', name, label: name ? `Você (${name})` : 'Você' },
      ...this.familyMembers()
        .filter((member) => this.selectedFamilyMemberIds().includes(member.id))
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
      this.santaGifts.set(
        Object.fromEntries(Object.entries(joined).map(([key, gifts]) => [key, gifts.join('\n')])),
      );
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

  protected setSantaGifts(key: RsvpSecretSantaKey, text: string): void {
    this.santaGifts.update((all) => ({ ...all, [key]: text }));
  }

  /** The error of one person's gift options: the first line too short or too long. */
  protected santaGiftError(key: RsvpSecretSantaKey): string {
    if (!this.santaGiftsError()) return '';
    const max = this.santa()?.maxGiftOptions ?? 1;
    const lines = parseGiftLines(this.santaGifts()[key] ?? '', max);
    const bad = lines.find((line) => GiftOption.validate(line));
    return bad ? `"${bad}": ${GiftOption.validate(bad)}` : '';
  }

  protected santaGiftLabel(person: RsvpSantaPerson): string {
    const max = this.santa()?.maxGiftOptions ?? 1;
    const self = person.key === 'self';
    if (max === 1) return `Opção de presente ${self ? 'sua' : `de ${person.name}`} (opcional)`;
    return `Opções de presente ${self ? 'suas' : `de ${person.name}`}, uma por linha, até ${max} (opcional)`;
  }

  /** Who is in the draw, among the people still going; null when the drawer does not ask. */
  private santaChoice(): Record<RsvpSecretSantaKey, string[]> | null {
    const santa = this.santa();
    if (!santa?.open) return null;
    const going = new Set(this.santaPeople().map((person) => person.key));
    return Object.fromEntries(
      this.santaChecked()
        .filter((key) => going.has(key))
        .map((key) => [
          key,
          santa.giftOptions
            ? parseGiftLines(this.santaGifts()[key] ?? '', santa.maxGiftOptions)
            : [],
        ]),
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

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const santa = this.santaChoice();
    const badGift = Object.values(santa ?? {}).some((gifts) =>
      gifts.some((gift) => GiftOption.validate(gift)),
    );
    if (badGift) {
      this.santaGiftsError.set(true);
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
      ...(santa ? { secretSanta: santa } : {}),
    };
    this.submitted.emit(result);
  }

  protected closeDrawer(): void {
    this.closed.emit();
  }
}
