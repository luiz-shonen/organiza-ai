import { ChangeDetectionStrategy, Component, ViewEncapsulation, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { OrgConfirmDialogData } from '../../../core/models';
import { OrgButtonComponent } from '../actions/org-button.component';
import { OrgIconComponent, type OrgIconName } from '../actions/org-icon.component';

export type { OrgConfirmDialogData };

/**
 * Asks before an action. With `tone: 'danger'` (deleting, removing, cancelling) it shows
 * a red badge and a red confirm button, so the risk reads before the words do.
 */
@Component({
  selector: 'org-confirm-dialog',
  standalone: true,
  imports: [MatDialogModule, OrgButtonComponent, OrgIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  templateUrl: './org-confirm-dialog.component.html',
  styleUrl: './org-confirm-dialog.component.scss',
})
export class OrgConfirmDialogComponent {
  public readonly data = inject<OrgConfirmDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef =
    inject<MatDialogRef<OrgConfirmDialogComponent, boolean>>(MatDialogRef);

  protected readonly isDanger = this.data.tone === 'danger';
  protected readonly icon: OrgIconName =
    this.data.icon ?? (this.isDanger ? 'delete_outline' : 'info');

  protected cancel(): void {
    this.dialogRef.close(false);
  }
  protected confirm(): void {
    this.dialogRef.close(true);
  }
}
