import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FamilyMember, FamilyRelationship } from '../../../../core/models';
import { RELATIONSHIP_OPTIONS, getRelationshipLabel } from '../../../../core/utils';
import { PersonName, Phone } from '../../../../core/value-objects';
import {
  OrgAutocompleteFieldComponent,
  OrgAvatarComponent,
  OrgButtonComponent,
  OrgCardHeaderComponent,
  OrgIconButtonComponent,
  OrgSurfaceComponent,
  OrgTextFieldComponent,
} from '../../../../shared/ui';

export interface AddFamilyMemberPayload {
  name: string;
  relationship: FamilyRelationship;
  phone?: string;
}

export interface UpdateFamilyMemberPayload extends AddFamilyMemberPayload {
  id: string;
}

@Component({
  selector: 'app-family-roster-manager',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    OrgButtonComponent,
    OrgAutocompleteFieldComponent,
    OrgAvatarComponent,
    OrgCardHeaderComponent,
    OrgIconButtonComponent,
    OrgSurfaceComponent,
    OrgTextFieldComponent,
  ],
  templateUrl: './family-roster-manager.component.html',
  styleUrl: './family-roster-manager.component.scss',
})
export class FamilyRosterManagerComponent {
  readonly members = input.required<FamilyMember[]>();
  /** True while the page saves an add or an edit. */
  readonly saving = input<boolean>(false);

  readonly addMember = output<AddFamilyMemberPayload>();
  readonly updateMember = output<UpdateFamilyMemberPayload>();
  readonly removeMember = output<string>();

  protected readonly newName = signal<string>('');
  /** Null while what is typed in Parentesco matches no option. */
  protected readonly newRelationship = signal<FamilyRelationship | null>('child');
  protected readonly newPhone = signal<string>('');
  /** Set on a submit with invalid fields; the errors then follow what is typed. */
  protected readonly showErrors = signal(false);
  protected readonly nameError = computed(() =>
    this.showErrors() ? (PersonName.validate(this.newName()) ?? '') : '',
  );
  protected readonly relationshipError = computed(() =>
    this.showErrors() && !this.newRelationship() ? 'Escolha um parentesco da lista' : '',
  );
  protected readonly phoneError = computed(() =>
    this.showErrors() ? (Phone.validate(this.newPhone()) ?? '') : '',
  );
  protected readonly nameMaxLength = PersonName.MAX;
  protected readonly maskPhone = Phone.mask;
  protected readonly displayPhone = Phone.display;
  /** Id of the member loaded into the form for editing; null while adding. */
  protected readonly editingId = signal<string | null>(null);
  protected readonly editingName = computed(
    () => this.members().find((member) => member.id === this.editingId())?.name ?? '',
  );

  protected readonly relationshipOptions = RELATIONSHIP_OPTIONS;

  protected getRelationshipLabel(value: FamilyRelationship): string {
    return getRelationshipLabel(value);
  }

  protected setRelationship(value: string | null): void {
    const option = this.relationshipOptions.find((candidate) => candidate.value === value);
    this.newRelationship.set(option?.value ?? null);
  }

  protected onSubmit(): void {
    if (!this.newName().trim()) return;
    const name = PersonName.create(this.newName());
    const relationship = this.newRelationship();
    if (!name || !relationship || Phone.validate(this.newPhone())) {
      this.showErrors.set(true);
      return;
    }

    const payload: AddFamilyMemberPayload = {
      name: name.value,
      relationship,
      phone: Phone.create(this.newPhone())?.formatted,
    };
    const id = this.editingId();
    if (id) {
      this.updateMember.emit({ id, ...payload });
    } else {
      this.addMember.emit(payload);
    }
    this.resetForm();
  }

  protected startEdit(member: FamilyMember): void {
    this.editingId.set(member.id);
    this.newName.set(member.name);
    this.newRelationship.set(member.relationship);
    this.newPhone.set(Phone.mask(member.phone ?? ''));
    this.showErrors.set(false);
  }

  protected resetForm(): void {
    this.editingId.set(null);
    this.newName.set('');
    this.newRelationship.set('child');
    this.newPhone.set('');
    this.showErrors.set(false);
  }

  protected onRemove(memberId: string): void {
    if (this.editingId() === memberId) this.resetForm();
    this.removeMember.emit(memberId);
  }
}
