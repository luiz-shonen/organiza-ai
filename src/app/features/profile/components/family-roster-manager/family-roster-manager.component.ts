import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FamilyMember, FamilyRelationship } from '../../../../core/models';

export interface AddFamilyMemberPayload {
  name: string;
  relationship: FamilyRelationship;
  phone?: string;
}

export interface RelationshipOption {
  value: FamilyRelationship;
  label: string;
}

@Component({
  selector: 'app-family-roster-manager',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './family-roster-manager.component.html',
  styleUrl: './family-roster-manager.component.scss',
})
export class FamilyRosterManagerComponent {
  readonly members = input.required<FamilyMember[]>();
  readonly isAdding = input<boolean>(false);

  readonly addMember = output<AddFamilyMemberPayload>();
  readonly removeMember = output<string>();

  protected readonly newName = signal<string>('');
  protected readonly newRelationship = signal<FamilyRelationship>('child');
  protected readonly newPhone = signal<string>('');

  protected readonly relationshipOptions: RelationshipOption[] = [
    { value: 'spouse', label: 'Cônjuge' },
    { value: 'child', label: 'Filho(a)' },
    { value: 'parent', label: 'Pai/Mãe' },
    { value: 'sibling', label: 'Irmão(ã)' },
    { value: 'relative', label: 'Parente' },
    { value: 'other', label: 'Outro' },
  ];

  protected getRelationshipLabel(value: FamilyRelationship): string {
    const option = this.relationshipOptions.find((opt) => opt.value === value);
    return option ? option.label : value;
  }

  protected onAddSubmit(): void {
    const trimmedName = this.newName().trim();
    if (!trimmedName) return;

    this.addMember.emit({
      name: trimmedName,
      relationship: this.newRelationship(),
      phone: this.newPhone().trim() || undefined,
    });

    this.newName.set('');
    this.newRelationship.set('child');
    this.newPhone.set('');
  }

  protected onRemove(memberId: string): void {
    this.removeMember.emit(memberId);
  }
}
