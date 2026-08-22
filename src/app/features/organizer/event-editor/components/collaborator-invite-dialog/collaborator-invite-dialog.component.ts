import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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

import { OrgFormFieldDirective } from '../../../../../shared/ui';

export interface CollaboratorInviteDialogData {
  collaborators?: string[];
  pendingInvites?: string[];
}

@Component({
  selector: 'app-collaborator-invite-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    OrgFormFieldDirective,
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

  public readonly email = signal('');
  public readonly isEmailValid = computed(() => {
    const raw = this.email().trim().toLowerCase();
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw);
  });

  public onInputChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.email.set(target.value);
  }

  public onInvite(): void {
    const raw = this.email().trim().toLowerCase();
    if (this.isEmailValid()) {
      this.invite.emit(raw);
      this.email.set('');
    }
  }

  public onRemoveCollaborator(collab: string): void {
    this.removeCollaborator.emit(collab);
  }

  public closeDialog(): void {
    this.dialogRef?.close();
  }
}
