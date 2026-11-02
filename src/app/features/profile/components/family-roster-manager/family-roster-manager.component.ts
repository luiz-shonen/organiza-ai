import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { FamilyMember, FamilyRelationship } from '../../../../core/models';
import { getRelationshipLabel } from '../../../../core/utils';
import { Phone } from '../../../../core/value-objects';
import {
  OrgAvatarComponent,
  OrgBottomSheetComponent,
  OrgCardHeaderComponent,
  OrgIconButtonComponent,
  OrgSurfaceComponent,
} from '../../../../shared/ui';
import {
  FamilyMemberFormComponent,
  type AddFamilyMemberPayload,
} from '../family-member-form/family-member-form.component';

export type { AddFamilyMemberPayload };

export interface UpdateFamilyMemberPayload extends AddFamilyMemberPayload {
  id: string;
}

/**
 * "Minha família": the add form is always open, and ✏️ edits a person in a sheet, so
 * whatever was being typed for a new member stays in the add form.
 */
@Component({
  selector: 'app-family-roster-manager',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FamilyMemberFormComponent,
    OrgAvatarComponent,
    OrgBottomSheetComponent,
    OrgCardHeaderComponent,
    OrgIconButtonComponent,
    OrgSurfaceComponent,
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

  protected readonly displayPhone = Phone.display;
  /** Id of the member open in the edit sheet; null while it is closed. */
  protected readonly editingId = signal<string | null>(null);
  protected readonly editingMember = computed(
    () => this.members().find((member) => member.id === this.editingId()) ?? null,
  );

  protected getRelationshipLabel(value: FamilyRelationship): string {
    return getRelationshipLabel(value);
  }

  protected saveEdit(payload: AddFamilyMemberPayload): void {
    const id = this.editingId();
    if (!id) return;
    this.updateMember.emit({ id, ...payload });
    this.editingId.set(null);
  }

  protected onRemove(memberId: string): void {
    if (this.editingId() === memberId) this.editingId.set(null);
    this.removeMember.emit(memberId);
  }
}
