import { ChangeDetectionStrategy, Component, ViewEncapsulation, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { OrgButtonComponent } from '../actions/org-button.component';

export interface OrgConfirmDialogData {
  readonly title: string;
  readonly message: string;
  readonly confirmLabel?: string;
  readonly cancelLabel?: string;
}

@Component({
  selector: 'org-confirm-dialog',
  standalone: true,
  imports: [MatDialogModule, OrgButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  templateUrl: './org-confirm-dialog.component.html',
  styleUrl: './org-confirm-dialog.component.scss',
})
export class OrgConfirmDialogComponent {
  public readonly data = inject<OrgConfirmDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject<MatDialogRef<OrgConfirmDialogComponent, boolean>>(MatDialogRef);

  protected cancel(): void { this.dialogRef.close(false); }
  protected confirm(): void { this.dialogRef.close(true); }
}
