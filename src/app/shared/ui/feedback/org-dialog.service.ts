import { inject, Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable, map } from 'rxjs';
import type { OrgDialogChoice } from '../../../core/models';
import { OrgConfirmDialogComponent, OrgConfirmDialogData } from './org-confirm-dialog.component';

@Injectable({ providedIn: 'root' })
export class OrgDialogService {
  private readonly dialog = inject(MatDialog);

  public confirm(data: OrgConfirmDialogData): Observable<boolean> {
    return this.open(data).pipe(map((result) => result === true));
  }

  /** Like `confirm`, with a second way forward (`extraLabel`): which button was pressed. */
  public choose(data: OrgConfirmDialogData): Observable<OrgDialogChoice> {
    return this.open(data).pipe(
      map((result) => (result === true ? 'confirm' : result === 'extra' ? 'extra' : 'cancel')),
    );
  }

  /** Tells something and waits for "Entendi" (or the label given): no choice to make. */
  public alert(
    data: Omit<OrgConfirmDialogData, 'alert' | 'extraLabel' | 'cancelLabel'>,
  ): Observable<void> {
    return this.open({ confirmLabel: 'Entendi', ...data, alert: true }).pipe(map(() => undefined));
  }

  private open(data: OrgConfirmDialogData): Observable<unknown> {
    return this.dialog
      .open(OrgConfirmDialogComponent, {
        data,
        panelClass: 'org-confirm-dialog-panel',
        width: '480px',
        maxWidth: 'calc(100vw - 32px)',
        autoFocus: 'dialog',
      })
      .afterClosed();
  }
}
