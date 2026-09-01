import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import {
  FormArray,
  FormBuilder,
  ReactiveFormsModule,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { FamilyMember } from '../../../../core/models';
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

const trimmedRequired: ValidatorFn = (control) =>
  typeof control.value === 'string' && control.value.trim().length > 0 ? null : { required: true };

@Component({
  selector: 'app-rsvp-drawer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    FamilySelectorComponent,
    OrgButtonComponent,
    OrgIconButtonComponent,
    OrgTextFieldComponent,
  ],
  templateUrl: './rsvp-drawer.component.html',
  styleUrl: './rsvp-drawer.component.scss',
})
export class RsvpDrawerComponent {
  private readonly dialogRef = inject(MatDialogRef<RsvpDrawerComponent>, { optional: true });
  private readonly legacyData: RsvpDrawerData | null = inject(MAT_DIALOG_DATA, { optional: true });
  private readonly fb = inject(FormBuilder);

  readonly drawerData = input<RsvpDrawerData>(
    this.legacyData ?? { session: null, familyMembers: [], userId: '' },
  );
  readonly submitted = output<RsvpDrawerResult>();
  readonly closed = output<void>();

  readonly familyMembers = signal<FamilyMember[]>(this.legacyData?.familyMembers ?? []);
  readonly selectedFamilyMemberIds = signal<string[]>([]);
  readonly isAddingInline = signal<boolean>(false);

  protected readonly form = this.fb.nonNullable.group({
    name: [this.legacyData?.session?.name ?? '', [Validators.required]],
    phone: [this.legacyData?.session?.phone ?? '', [Validators.required, Validators.minLength(10)]],
    companionsCount: [0, [Validators.min(0), Validators.max(10)]],
    companions: this.fb.nonNullable.array<string>([]),
  });

  protected get companions(): FormArray {
    return this.form.controls.companions;
  }

  constructor() {
    effect(() => {
      const data = this.drawerData();
      this.familyMembers.set(data.familyMembers ?? []);
      this.form.patchValue({ name: data.session?.name ?? '', phone: data.session?.phone ?? '' });
    });
  }

  protected onCompanionsCountInput(event: Event): void {
    const count = Number((event.target as HTMLInputElement).value);
    this.updateCompanionCount(count);
  }

  protected onCompanionsCountChange(value: string): void {
    this.updateCompanionCount(Number(value));
  }

  private updateCompanionCount(count: number): void {
    if (!Number.isInteger(count) || count < 0 || count > 10) {
      this.companions.clear();
      return;
    }

    while (this.companions.length < count) {
      this.companions.push(this.fb.nonNullable.control('', [trimmedRequired]));
    }
    while (this.companions.length > count) {
      this.companions.removeAt(this.companions.length - 1);
    }
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

  protected onAddInlineFamilyMember(payload: InlineFamilyMemberPayload): void {
    const member: FamilyMember = {
      id: `temp_${Date.now()}`,
      name: payload.name,
      relationship: payload.relationship,
      phone: payload.phone,
      createdAt: new Date().toISOString(),
    };
    this.familyMembers.update((members) => [...members, member]);
    this.selectedFamilyMemberIds.update((ids) => [...ids, member.id]);
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const result: RsvpDrawerResult = {
      name: raw.name,
      phone: raw.phone,
      companions: raw.companions.map((name) => ({ name: name.trim() })),
      selectedFamilyMembers: this.familyMembers().filter((member) =>
        this.selectedFamilyMemberIds().includes(member.id),
      ),
    };
    if (this.dialogRef) {
      this.dialogRef.close(result);
    } else {
      this.submitted.emit(result);
    }
  }

  protected closeDrawer(): void {
    if (this.dialogRef) {
      this.dialogRef.close();
    } else {
      this.closed.emit();
    }
  }
}
