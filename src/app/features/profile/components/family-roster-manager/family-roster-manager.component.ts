import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FamilyMember, FamilyRelationship } from '../../../../core/models';
import { RELATIONSHIP_OPTIONS, getRelationshipLabel } from '../../../../core/utils';
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
  protected readonly newRelationship = signal<FamilyRelationship>('child');
  protected readonly newPhone = signal<string>('');
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
    this.newRelationship.set(option?.value ?? 'child');
  }

  protected onSubmit(): void {
    const trimmedName = this.newName().trim();
    if (!trimmedName) return;

    const payload: AddFamilyMemberPayload = {
      name: trimmedName,
      relationship: this.newRelationship(),
      phone: this.newPhone().trim() || undefined,
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
    this.newPhone.set(member.phone ?? '');
  }

  protected resetForm(): void {
    this.editingId.set(null);
    this.newName.set('');
    this.newRelationship.set('child');
    this.newPhone.set('');
  }

  protected onRemove(memberId: string): void {
    if (this.editingId() === memberId) this.resetForm();
    this.removeMember.emit(memberId);
  }
}
