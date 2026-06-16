import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { GuestSession } from '../../../../core/models';

export interface GuestFormDialogData {
  session: GuestSession | null;
}

export interface GuestFormDialogResult {
  name: string;
  phone: string;
  companionsCount: number;
}

@Component({
  selector: 'app-guest-form-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './guest-form-dialog.component.html',
  styleUrl: './guest-form-dialog.component.scss',
})
export class GuestFormDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<GuestFormDialogComponent>);
  private readonly data: GuestFormDialogData = inject(MAT_DIALOG_DATA);
  private readonly fb = inject(FormBuilder);

  protected readonly form = this.fb.nonNullable.group({
    name: [this.data.session?.name ?? '', [Validators.required]],
    phone: [this.data.session?.phone ?? '', [Validators.required, Validators.minLength(10)]],
    companionsCount: [0, [Validators.min(0)]],
  });

  protected submit(): void {
    if (this.form.valid) {
      this.dialogRef.close(this.form.getRawValue());
    }
  }
}
