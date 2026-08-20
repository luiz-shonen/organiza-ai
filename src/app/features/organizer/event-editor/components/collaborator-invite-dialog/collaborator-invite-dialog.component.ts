import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';

export interface CollaboratorInviteDialogData {
  collaborators?: string[];
  pendingInvites?: string[];
}

@Component({
  selector: 'app-collaborator-invite-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
  ],
  templateUrl: './collaborator-invite-dialog.component.html',
  styleUrl: './collaborator-invite-dialog.component.scss',
})
export class CollaboratorInviteDialogComponent {
  private readonly dialogRef = inject(
    MatDialogRef<CollaboratorInviteDialogComponent>,
    { optional: true },
  );
  private readonly dialogData: CollaboratorInviteDialogData | null = inject(
    MAT_DIALOG_DATA,
    { optional: true },
  );

  public readonly collaborators = input<string[]>(
    this.dialogData?.collaborators ?? [],
  );
  public readonly pendingInvites = input<string[]>(
    this.dialogData?.pendingInvites ?? [],
  );

  public readonly invite = output<string>();
  public readonly removeCollaborator = output<string>();

  public readonly emailControl = new FormControl<string>('', {
    nonNullable: true,
    validators: [Validators.required, Validators.email],
  });

  public onInvite(): void {
    const raw = this.emailControl.value.trim().toLowerCase();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (raw && (this.emailControl.valid || emailPattern.test(raw))) {
      this.invite.emit(raw);
      this.emailControl.reset();
    }
  }

  public onRemoveCollaborator(collab: string): void {
    this.removeCollaborator.emit(collab);
  }

  public closeDialog(): void {
    this.dialogRef?.close();
  }
}
