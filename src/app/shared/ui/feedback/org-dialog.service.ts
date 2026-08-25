import { inject, Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable, map } from 'rxjs';
import { OrgConfirmDialogComponent, OrgConfirmDialogData } from './org-confirm-dialog.component';

@Injectable({ providedIn: 'root' })
export class OrgDialogService {
  private readonly dialog = inject(MatDialog);

  public confirm(data: OrgConfirmDialogData): Observable<boolean> {
    return this.dialog.open(OrgConfirmDialogComponent, { data, panelClass: 'org-confirm-dialog-panel' }).afterClosed().pipe(map((result) => result === true));
  }
}
