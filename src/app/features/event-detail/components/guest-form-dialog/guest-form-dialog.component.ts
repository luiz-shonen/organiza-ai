import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { GuestSession, FamilyMember } from '../../../../core/models';
import {
  FamilySelectorComponent,
  type InlineFamilyMemberPayload,
} from '../family-selector/family-selector.component';

import { OrgButtonComponent, OrgIconComponent, OrgTextFieldComponent } from '../../../../shared/ui';

export interface GuestFormDialogData {
  session: GuestSession | null;
  familyMembers?: FamilyMember[];
  userId?: string;
}

export interface GuestFormDialogResult {
  name: string;
  phone: string;
  companionsCount: number;
  selectedFamilyMembers?: FamilyMember[];
}

@Component({
  selector: 'app-guest-form-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    FamilySelectorComponent,
    OrgButtonComponent,
    OrgIconComponent,
    OrgTextFieldComponent,
  ],
  templateUrl: './guest-form-dialog.component.html',
  styleUrl: './guest-form-dialog.component.scss',
})
export class GuestFormDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<GuestFormDialogComponent>);
  private readonly data: GuestFormDialogData = inject(MAT_DIALOG_DATA, { optional: true }) ?? {
    session: null,
  };
  private readonly fb = inject(FormBuilder);

  readonly familyMembers = signal<FamilyMember[]>(this.data.familyMembers ?? []);
  readonly selectedFamilyMemberIds = signal<string[]>([]);
  readonly isAddingInline = signal<boolean>(false);

  protected readonly form = this.fb.nonNullable.group({
    name: [this.data.session?.name ?? '', [Validators.required]],
    phone: [this.data.session?.phone ?? '', [Validators.required, Validators.minLength(10)]],
    companionsCount: [0, [Validators.min(0)]],
  });

  protected onToggleFamilyMember(memberId: string): void {
    this.selectedFamilyMemberIds.update((current) => {
      if (current.includes(memberId)) {
        return current.filter((id) => id !== memberId);
      }
      return [...current, memberId];
    });
  }

  protected onSelectAllFamily(selectAll: boolean): void {
    if (selectAll) {
      this.selectedFamilyMemberIds.set(this.familyMembers().map((m) => m.id));
    } else {
      this.selectedFamilyMemberIds.set([]);
    }
  }

  protected onAddInlineFamilyMember(payload: InlineFamilyMemberPayload): void {
    const newMember: FamilyMember = {
      id: `temp_${Date.now()}`,
      name: payload.name,
      relationship: payload.relationship,
      phone: payload.phone,
      createdAt: new Date().toISOString(),
    };
    this.familyMembers.update((list) => [...list, newMember]);
    this.selectedFamilyMemberIds.update((ids) => [...ids, newMember.id]);
  }

  protected submit(): void {
    if (this.form.valid) {
      const raw = this.form.getRawValue();
      const selected = this.familyMembers().filter((m) =>
        this.selectedFamilyMemberIds().includes(m.id),
      );
      this.dialogRef.close({
        ...raw,
        selectedFamilyMembers: selected,
      });
    }
  }

  protected cancel(): void {
    this.dialogRef.close();
  }
}
