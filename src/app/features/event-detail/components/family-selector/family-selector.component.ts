import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { FamilyMember, FamilyRelationship } from '../../../../core/models';
import { getRelationshipLabel } from '../../../../core/utils';
import {
  FamilyMemberFormComponent,
  type AddFamilyMemberPayload,
} from '../../../../shared/components/family-member-form/family-member-form.component';
import {
  OrgButtonComponent,
  OrgCheckboxComponent,
  OrgExpansionPanelComponent,
  OrgIconButtonComponent,
} from '../../../../shared/ui';

export type InlineFamilyMemberPayload = AddFamilyMemberPayload;

/** A relative edited from the RSVP drawer: their id and what was typed. */
export interface UpdateInlineFamilyMemberPayload extends AddFamilyMemberPayload {
  id: string;
}

/**
 * "Levar familiares?": the family of the profile, to tick who goes. Relatives are added,
 * edited and removed right here (saved to the profile), with the same form as the profile.
 */
@Component({
  selector: 'app-family-selector',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FamilyMemberFormComponent,
    OrgButtonComponent,
    OrgCheckboxComponent,
    OrgExpansionPanelComponent,
    OrgIconButtonComponent,
  ],
  templateUrl: './family-selector.component.html',
  styleUrl: './family-selector.component.scss',
})
export class FamilySelectorComponent {
  readonly members = input<FamilyMember[]>([]);
  readonly selectedIds = input<string[]>([]);
  /** A relative is being saved: the forms wait. */
  readonly isAddingInline = input<boolean>(false);

  readonly toggleMember = output<string>();
  readonly selectAll = output<boolean>();
  readonly addInlineMember = output<InlineFamilyMemberPayload>();
  readonly updateMember = output<UpdateInlineFamilyMemberPayload>();
  readonly removeMember = output<string>();

  protected readonly isExpanded = signal<boolean>(false);
  protected readonly showInlineForm = signal<boolean>(false);
  /** The relative whose row shows the form to edit them. */
  protected readonly editingId = signal<string | null>(null);

  protected readonly allSelected = computed(() => {
    const list = this.members();
    const sel = this.selectedIds();
    return list.length > 0 && list.every((m) => sel.includes(m.id));
  });

  protected readonly indeterminate = computed(() => {
    const list = this.members();
    const sel = this.selectedIds();
    const count = list.filter((m) => sel.includes(m.id)).length;
    return count > 0 && count < list.length;
  });

  protected readonly selectedCount = computed(() => {
    const sel = this.selectedIds();
    return this.members().filter((m) => sel.includes(m.id)).length;
  });

  protected getRelationshipLabel(value: FamilyRelationship): string {
    return getRelationshipLabel(value);
  }

  protected isMemberSelected(memberId: string): boolean {
    return this.selectedIds().includes(memberId);
  }

  protected onToggleMember(memberId: string): void {
    this.toggleMember.emit(memberId);
  }

  protected onSelectAllChange(checked: boolean): void {
    this.selectAll.emit(checked);
  }

  protected onToggleInlineForm(): void {
    this.editingId.set(null);
    this.showInlineForm.update((v) => !v);
  }

  protected onCancelInlineForm(): void {
    this.showInlineForm.set(false);
  }

  protected onSubmitInline(payload: AddFamilyMemberPayload): void {
    this.addInlineMember.emit(payload);
    this.showInlineForm.set(false);
  }

  protected onEdit(memberId: string): void {
    this.showInlineForm.set(false);
    this.editingId.set(memberId);
  }

  protected onSaveEdit(memberId: string, payload: AddFamilyMemberPayload): void {
    this.updateMember.emit({ id: memberId, ...payload });
    this.editingId.set(null);
  }

  protected onRemove(memberId: string): void {
    if (this.editingId() === memberId) this.editingId.set(null);
    this.removeMember.emit(memberId);
  }
}
