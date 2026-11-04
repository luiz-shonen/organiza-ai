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
import { FamilyMember } from '../../../../core/models';
import {
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
  OrgIconButtonComponent,
  OrgTextFieldComponent,
} from '../../../../shared/ui';

export type RsvpDrawerData = RsvpDrawerRequestData;

@Component({
  selector: 'app-rsvp-drawer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    CompanionSelectorComponent,
    FamilySelectorComponent,
    OrgButtonComponent,
    OrgIconButtonComponent,
    OrgTextFieldComponent,
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
    });
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

    const raw = this.form.getRawValue();
    const result: RsvpDrawerResult = {
      name: this.drawerData().session?.name ?? '',
      phone: Phone.create(raw.phone)?.formatted ?? raw.phone.trim(),
      companions: this.selectedCompanions().map((name) => ({ name })),
      selectedFamilyMembers: this.familyMembers().filter((member) =>
        this.selectedFamilyMemberIds().includes(member.id),
      ),
    };
    this.submitted.emit(result);
  }

  protected closeDrawer(): void {
    this.closed.emit();
  }
}
