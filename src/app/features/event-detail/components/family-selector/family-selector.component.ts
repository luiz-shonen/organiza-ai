import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FamilyMember, FamilyRelationship } from '../../../../core/models';
import { RELATIONSHIP_OPTIONS, getRelationshipLabel } from '../../../../core/utils';
import { PersonName } from '../../../../core/value-objects';
import {
  OrgButtonComponent,
  OrgCheckboxComponent,
  OrgExpansionPanelComponent,
  OrgAutocompleteFieldComponent,
  OrgTextFieldComponent,
  type OrgSelectOption,
} from '../../../../shared/ui';

export interface InlineFamilyMemberPayload {
  name: string;
  relationship: FamilyRelationship;
  phone?: string;
}

@Component({
  selector: 'app-family-selector',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    OrgButtonComponent,
    OrgCheckboxComponent,
    OrgExpansionPanelComponent,
    OrgAutocompleteFieldComponent,
    OrgTextFieldComponent,
  ],
  templateUrl: './family-selector.component.html',
  styleUrl: './family-selector.component.scss',
})
export class FamilySelectorComponent {
  readonly members = input<FamilyMember[]>([]);
  readonly selectedIds = input<string[]>([]);
  readonly isAddingInline = input<boolean>(false);

  readonly toggleMember = output<string>();
  readonly selectAll = output<boolean>();
  readonly addInlineMember = output<InlineFamilyMemberPayload>();

  protected readonly isExpanded = signal<boolean>(false);
  protected readonly showInlineForm = signal<boolean>(false);

  protected readonly inlineName = signal<string>('');
  /** Null while what is typed in Parentesco matches no option. */
  protected readonly inlineRelationship = signal<FamilyRelationship | null>('child');
  /** Set on a submit with invalid fields; the errors then follow what is typed. */
  protected readonly showInlineErrors = signal(false);
  protected readonly inlineNameError = computed(() =>
    this.showInlineErrors() ? (PersonName.validate(this.inlineName()) ?? '') : '',
  );
  protected readonly inlineRelationshipError = computed(() =>
    this.showInlineErrors() && !this.inlineRelationship() ? 'Escolha um parentesco da lista' : '',
  );
  protected readonly nameMaxLength = PersonName.MAX;

  protected readonly relationshipOptions = RELATIONSHIP_OPTIONS;
  protected readonly relationshipAutocompleteOptions: readonly OrgSelectOption[] =
    this.relationshipOptions;

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
    this.showInlineForm.update((v) => !v);
    if (!this.showInlineForm()) {
      this.resetInlineForm();
    }
  }

  protected onCancelInlineForm(): void {
    this.showInlineForm.set(false);
    this.resetInlineForm();
  }

  protected onSubmitInline(): void {
    if (!this.inlineName().trim()) return;
    const name = PersonName.create(this.inlineName());
    const relationship = this.inlineRelationship();
    if (!name || !relationship) {
      this.showInlineErrors.set(true);
      return;
    }

    this.addInlineMember.emit({ name: name.value, relationship });

    this.showInlineForm.set(false);
    this.resetInlineForm();
  }

  /** Enter in the name adds the member instead of submitting the RSVP around it. */
  protected onInlineEnter(event: Event): void {
    event.preventDefault();
    this.onSubmitInline();
  }

  protected setInlineRelationship(value: string | null): void {
    const option = this.relationshipOptions.find((relationship) => relationship.value === value);
    this.inlineRelationship.set(option?.value ?? null);
  }

  private resetInlineForm(): void {
    this.inlineName.set('');
    this.inlineRelationship.set('child');
    this.showInlineErrors.set(false);
  }
}
